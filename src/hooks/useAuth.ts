import { useState, useEffect } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export type Currency = "GBP" | "USD" | "CAD" | "AUD" | "EUR" | "BRL";

export const CURRENCY_META: Record<
  Currency,
  { symbol: string; label: string; flag: string }
> = {
  GBP: { symbol: "£", label: "British Pound",    flag: "🇬🇧" },
  USD: { symbol: "$", label: "US Dollar",         flag: "🇺🇸" },
  CAD: { symbol: "CA$", label: "Canadian Dollar", flag: "🇨🇦" },
  AUD: { symbol: "A$",  label: "Australian Dollar",flag: "🇦🇺" },
  EUR: { symbol: "€",   label: "Euro",            flag: "🇪🇺" },
  BRL: { symbol: "R$",  label: "Brazilian Real",  flag: "🇧🇷" },
};

export const DEFAULT_CURRENCY: Currency = "USD";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Whether a TOTP / MFA challenge is pending after password sign-in */
  mfaPending: boolean;
  currency: Currency;
}

interface AuthActions {
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ mfaRequired: boolean }>;
  signInWithGoogle: () => Promise<void>;
  /** Submit the 6-digit TOTP code after signIn returns mfaRequired=true */
  verifyTotp: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Enroll authenticator app — returns the QR URI for display */
  enrollTotp: () => Promise<{ qrUri: string; secret: string }>;
  /** Confirm enrollment with first code from authenticator app */
  confirmTotpEnrollment: (factorId: string, code: string) => Promise<void>;
  /** Unenroll (disable) TOTP 2FA */
  unenrollTotp: () => Promise<void>;
  /** True when the signed-in user has an active TOTP factor */
  hasMfa: boolean;
  setCurrency: (c: Currency) => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthState & AuthActions {
  const [user, setUser]         = useState<User | null>(null);
  const [session, setSession]   = useState<Session | null>(null);
  const [loading, setLoading]   = useState(true);
  const [mfaPending, setMfaPending] = useState(false);
  const [hasMfa, setHasMfa]     = useState(false);
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem("trackr_currency") as Currency) ?? DEFAULT_CURRENCY;
  });

  // ── Refresh MFA factor list whenever the user changes ──────────────────
  const refreshMfaStatus = async (currentUser: User | null) => {
    if (!currentUser) { setHasMfa(false); return; }
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.some((f) => f.status === "verified") ?? false;
      setHasMfa(verified);
    } catch {
      setHasMfa(false);
    }
  };

  // ── Session hydration ───────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      refreshMfaStatus(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        refreshMfaStatus(session?.user ?? null);
        setLoading(false);
        // If the event is a completed Google OAuth redirect, clear mfaPending
        if (_event === "SIGNED_IN") setMfaPending(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Currency persistence ────────────────────────────────────────────────
  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("trackr_currency", c);
  };

  // ── Auth actions ────────────────────────────────────────────────────────

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  /**
   * Returns { mfaRequired: true } when the account has TOTP enrolled.
   * The caller should then prompt for the code and call verifyTotp().
   */
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ mfaRequired: boolean }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Check if any MFA challenge is required
    const { data: factorData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp = factorData?.totp?.some((f) => f.status === "verified") ?? false;

    if (hasVerifiedTotp && data.session) {
      // Session exists but AAL1 only — require AAL2 step-up
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2") {
        setMfaPending(true);
        return { mfaRequired: true };
      }
    }

    setMfaPending(false);
    return { mfaRequired: false };
  };

  /**
   * Complete the MFA step after signIn returns mfaRequired=true.
   */
  const verifyTotp = async (code: string) => {
    // 1. Get the active challenge for the first verified TOTP factor
    const { data: factorData, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) throw listErr;

    const factor = factorData?.totp?.find((f) => f.status === "verified");
    if (!factor) throw new Error("No verified TOTP factor found.");

    const { data: challengeData, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeErr) throw challengeErr;

    // 2. Verify the code
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challengeData.id,
      code,
    });
    if (verifyErr) throw verifyErr;

    setMfaPending(false);
    setHasMfa(true);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Request email + profile scopes — no extra Google Cloud setup needed
        scopes: "email profile",
        queryParams: {
          // Force the account chooser even if already signed into Google
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
  };

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  setMfaPending(false);
  setHasMfa(false);
  window.location.replace("/auth");
};

  // ── MFA enrollment helpers ──────────────────────────────────────────────

  /**
   * Begin TOTP enrollment. Display the returned QR URI in an <img> tag or
   * pass it to a QR library. The user scans it with their authenticator app,
   * then calls confirmTotpEnrollment() with the first code.
   */
  const enrollTotp = async (): Promise<{ qrUri: string; secret: string }> => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "TrackR",           // shown in the authenticator app
      friendlyName: "Authenticator App",
    });
    if (error) throw error;
    return {
      qrUri: data.totp.qr_code,   // data URI — pass directly to <img src>
      secret: data.totp.secret,   // show as fallback manual-entry key
    };
  };

  /**
   * Confirm the enrollment by verifying the first TOTP code.
   * factorId comes from the enrollTotp() response (data.id).
   */
  const confirmTotpEnrollment = async (factorId: string, code: string) => {
    const { data: challengeData, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) throw challengeErr;

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (verifyErr) throw verifyErr;

    setHasMfa(true);
  };

  const unenrollTotp = async () => {
    const { data: factorData, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) throw listErr;

    const factor = factorData?.totp?.find((f) => f.status === "verified");
    if (!factor) return; // nothing to unenroll

    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) throw error;

    setHasMfa(false);
  };

  return {
    user,
    session,
    loading,
    mfaPending,
    hasMfa,
    currency,
    setCurrency,
    signUp,
    signIn,
    signInWithGoogle,
    verifyTotp,
    signOut,
    enrollTotp,
    confirmTotpEnrollment,
    unenrollTotp,
  };
}