import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { Currency } from "../../hooks/useAuth";
import { CURRENCY_META, useAuth } from "../../hooks/useAuth";
import type { TrashedApp } from "../../hooks/useTrash";
// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  user: User;
  skipConfirm: boolean;
  onSkipConfirmChange: (v: boolean) => void;
  onClose: () => void;
  onProfileUpdate: (name: string) => void;
  trash: TrashedApp[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  // ── New props ──
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  hasMfa: boolean;
  onEnrollTotp: () => Promise<{ qrUri: string; secret: string }>;
  onUnenrollTotp: () => Promise<void>;
}

type Section = "profile" | "security" | "preferences" | "trash";

// ── Component ──────────────────────────────────────────────────────────────

export function SettingsModal({
  user,
  skipConfirm,
  onSkipConfirmChange,
  onClose,
  onProfileUpdate,
  trash,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  currency,
  onCurrencyChange,
  hasMfa,
  onUnenrollTotp,
}: Props) {
  const [section, setSection] = useState<Section>("profile");

  // Profile
  const [displayName, setDisplayName] = useState(
    (user.user_metadata?.full_name as string) ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // MFA
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [enrollStep, setEnrollStep] = useState<"idle" | "scan" | "confirm">(
    "idle",
  );
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const { confirmTotpEnrollment } = useAuth();

  // ── Profile save ────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      });
      if (error) throw error;
      onProfileUpdate(displayName);
      setProfileMsg("Saved!");
    } catch (err: unknown) {
      setProfileMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── MFA enrollment flow ─────────────────────────────────────────────────
  const startEnroll = async () => {
    setMfaBusy(true);
    setMfaError(null);
    try {
      // We need the raw factorId from the enroll call — call supabase directly
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "TrackR",
        friendlyName: "Authenticator App",
      });
      if (error) throw error;
      setQrUri(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setEnrollStep("scan");
    } catch (err: unknown) {
      setMfaError(
        err instanceof Error ? err.message : "Failed to start enrollment.",
      );
    } finally {
      setMfaBusy(false);
    }
  };

  const confirmEnroll = async () => {
    if (!factorId) return;
    setMfaBusy(true);
    setMfaError(null);
    try {
      await confirmTotpEnrollment(factorId, totpCode.replace(/\s/g, ""));
      setEnrollStep("idle");
      setTotpCode("");
      setQrUri(null);
      setSecret(null);
      setFactorId(null);
    } catch (err: unknown) {
      setMfaError(
        err instanceof Error ? err.message : "Invalid code — try again.",
      );
    } finally {
      setMfaBusy(false);
    }
  };

  const handleUnenroll = async () => {
    if (
      !window.confirm(
        "Disable two-factor authentication? Your account will be less secure.",
      )
    )
      return;
    setMfaBusy(true);
    setMfaError(null);
    try {
      await onUnenrollTotp();
    } catch (err: unknown) {
      setMfaError(
        err instanceof Error ? err.message : "Failed to disable 2FA.",
      );
    } finally {
      setMfaBusy(false);
    }
  };

  // ── Nav tabs ────────────────────────────────────────────────────────────
  const tabs: { id: Section; label: string; icon: string }[] = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    {
      id: "trash",
      label: `Trash${trash.length ? ` (${trash.length})` : ""}`,
      icon: "🗑️",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 flex overflow-hidden max-h-[90vh]">
        {/* ── Sidebar nav ── */}
        <div className="w-44 flex-shrink-0 border-r border-zinc-800 p-3 flex flex-col gap-0.5">
          <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider px-2 py-1 mb-1">
            Settings
          </p>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={`text-left text-xs px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                section === t.id
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
          >
            ✕ Close
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Profile ── */}
          {section === "profile" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-white">Profile</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">
                    Display name
                  </label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-medium">
                    Email
                  </label>
                  <input
                    value={user.email ?? ""}
                    disabled
                    className="w-full bg-zinc-800/50 border border-zinc-800 text-sm text-zinc-500 rounded-xl px-3 py-2.5 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-zinc-600">
                    Email cannot be changed here.
                  </p>
                </div>
                {profileMsg && (
                  <p
                    className={`text-xs ${profileMsg === "Saved!" ? "text-green-400" : "text-red-400"}`}
                  >
                    {profileMsg}
                  </p>
                )}
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-white text-zinc-950 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          )}

          {/* ── Security (2FA) ── */}
          {section === "security" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-white">Security</h2>

              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Authenticator App (TOTP)
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {hasMfa
                        ? "Two-factor authentication is enabled. Your account is protected."
                        : "Add an extra layer of security using an app like Google Authenticator or 1Password."}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      hasMfa
                        ? "text-green-400 border-green-800 bg-green-950/40"
                        : "text-zinc-500 border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    {hasMfa ? "ON" : "OFF"}
                  </span>
                </div>

                {mfaError && (
                  <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
                    {mfaError}
                  </p>
                )}

                {/* Already enrolled */}
                {hasMfa && (
                  <button
                    onClick={handleUnenroll}
                    disabled={mfaBusy}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-800/60 bg-red-950/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {mfaBusy ? "Disabling…" : "Disable 2FA"}
                  </button>
                )}

                {/* Not enrolled — idle state */}
                {!hasMfa && enrollStep === "idle" && (
                  <button
                    onClick={startEnroll}
                    disabled={mfaBusy}
                    className="text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {mfaBusy ? "Loading…" : "Enable 2FA"}
                  </button>
                )}

                {/* Step 1: Scan QR */}
                {!hasMfa && enrollStep === "scan" && qrUri && (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400">
                      Scan this QR code with your authenticator app (Google
                      Authenticator, Authy, 1Password, etc.):
                    </p>
                    <div className="flex justify-center">
                      {/* Supabase returns a data URI — drop it straight into <img> */}
                      <img
                        src={qrUri}
                        alt="TOTP QR code"
                        className="w-40 h-40 rounded-lg border-4 border-white"
                      />
                    </div>
                    {secret && (
                      <div className="bg-zinc-800 rounded-lg px-3 py-2 text-center">
                        <p className="text-[11px] text-zinc-500 mb-1">
                          Manual entry key:
                        </p>
                        <code className="text-xs text-zinc-300 tracking-wider break-all">
                          {secret}
                        </code>
                      </div>
                    )}
                    <button
                      onClick={() => setEnrollStep("confirm")}
                      className="w-full text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 py-2 rounded-lg transition-colors"
                    >
                      I've scanned it →
                    </button>
                    <button
                      onClick={() => {
                        setEnrollStep("idle");
                        setQrUri(null);
                        setSecret(null);
                        setFactorId(null);
                      }}
                      className="w-full text-xs text-zinc-600 hover:text-zinc-400 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Step 2: Confirm with first code */}
                {!hasMfa && enrollStep === "confirm" && (
                  <div className="space-y-3">
                    <p className="text-xs text-zinc-400">
                      Enter the 6-digit code shown in your authenticator app to
                      verify setup:
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={7}
                      placeholder="123 456"
                      value={totpCode}
                      autoFocus
                      onChange={(e) => {
                        const raw = e.target.value
                          .replace(/[^\d]/g, "")
                          .slice(0, 6);
                        setTotpCode(
                          raw.length > 3
                            ? `${raw.slice(0, 3)} ${raw.slice(3)}`
                            : raw,
                        );
                      }}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white text-center tracking-[0.4em] text-lg font-mono rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                    <button
                      onClick={confirmEnroll}
                      disabled={
                        mfaBusy || totpCode.replace(/\s/g, "").length < 6
                      }
                      className="w-full text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 py-2 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {mfaBusy ? "Verifying…" : "Confirm & enable 2FA"}
                    </button>
                    <button
                      onClick={() => setEnrollStep("scan")}
                      className="w-full text-xs text-zinc-600 hover:text-zinc-400 py-1.5 transition-colors"
                    >
                      ← Back to QR
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Preferences (currency + delete confirm) ── */}
          {section === "preferences" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-white">Preferences</h2>

              {/* Currency picker */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium block">
                  Salary currency
                </label>
                <p className="text-[11px] text-zinc-600">
                  All salary figures will display using this currency symbol.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    Object.entries(CURRENCY_META) as [
                      Currency,
                      (typeof CURRENCY_META)[Currency],
                    ][]
                  ).map(([code, { symbol, flag }]) => (
                    <button
                      key={code}
                      onClick={() => onCurrencyChange(code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-colors ${
                        currency === code
                          ? "border-zinc-500 bg-zinc-800 text-white"
                          : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-base">{flag}</span>
                      <div>
                        <p className="text-xs font-semibold">{code}</p>
                        <p className="text-[10px] text-zinc-500">{symbol}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete confirm toggle */}
              <div className="flex items-center justify-between border border-zinc-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-white">
                    Skip delete confirmation
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Delete applications without a confirmation prompt.
                  </p>
                </div>
                <button
                  onClick={() => onSkipConfirmChange(!skipConfirm)}
                  className={`w-10 h-6 rounded-full border transition-colors relative ${
                    skipConfirm
                      ? "bg-white border-white"
                      : "bg-zinc-800 border-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-zinc-900 transition-transform ${
                      skipConfirm ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── Trash ── */}
          {section === "trash" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  Trash
                  {trash.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      {trash.length} item{trash.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </h2>
                {trash.length > 0 && (
                  <button
                    onClick={onEmptyTrash}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Empty trash
                  </button>
                )}
              </div>

              {trash.length === 0 ? (
                <div className="text-center py-12 text-zinc-700 space-y-1">
                  <p className="text-2xl">🗑️</p>
                  <p className="text-sm">Trash is empty</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trash.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between gap-3 bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {app.company}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {app.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => onRestore(app.id)}
                          className="text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => onPermanentDelete(app.id)}
                          className="text-xs text-red-500 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
