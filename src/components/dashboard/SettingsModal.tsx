import { useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { TrashedApp } from "../../hooks/useTrash";

interface SettingsModalProps {
  user: User;
  skipConfirm: boolean;
  onSkipConfirmChange: (val: boolean) => void;
  onClose: () => void;
  onProfileUpdate: (fullName: string) => void;
  trash: TrashedApp[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

type Tab = "profile" | "security" | "preferences" | "trash";

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
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("profile");

  // ── Profile state ──
  const [fullName, setFullName] = useState(
    (user.user_metadata?.full_name as string) ?? "",
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // ── Security state ──
  const [step, setStep] = useState<"verify" | "change">("verify");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Trash confirm state ──
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);

  // ── Backdrop click ──
  const backdropRef = useRef<HTMLDivElement>(null);
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  // ── Save profile ──
  const handleSaveProfile = async () => {
    if (!fullName.trim()) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (error) throw error;
      onProfileUpdate(fullName.trim());
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setProfileMsg({
        type: "err",
        text: message ?? "Something went wrong.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Verify current password then unlock change form ──
  const handleVerify = async () => {
    if (!currentPassword) return;
    setSecuritySaving(true);
    setSecurityMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      if (error) throw error;
      setStep("change");
      setSecurityMsg(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(message);
    } finally {
      setSecuritySaving(false);
    }
  };

  // ── Save new password ──
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: "err", text: "Passwords don't match." });
      return;
    }
    if (newPassword.length < 8) {
      setSecurityMsg({
        type: "err",
        text: "Password must be at least 8 characters.",
      });
      return;
    }
    setSecuritySaving(true);
    setSecurityMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setSecurityMsg({ type: "ok", text: "Password changed successfully." });
      setStep("verify");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      setSecurityMsg({
        type: "err",
        text: message ?? "Something went wrong.",
      });
    } finally {
      setSecuritySaving(false);
    }
  };

  // ── Toggle delete confirmation preference ──
  const handleToggleConfirm = async (val: boolean) => {
    onSkipConfirmChange(val);
    await supabase.auth.updateUser({ data: { skip_confirm: val } });
  };

  // ── Trash helpers ──
  const daysLeft = (deletedAt: number) => {
    const ms = 7 * 24 * 60 * 60 * 1000 - (Date.now() - deletedAt);
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  };

  const formatDate = (deletedAt: number) =>
    new Date(deletedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  const TABS: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "security", label: "Security" },
    { key: "preferences", label: "Preferences" },
    {
      key: "trash",
      label: `Trash${trash.length > 0 ? ` (${trash.length})` : ""}`,
    },
  ];

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800/60">
          <h2 className="text-base font-bold text-white tracking-tight">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-wrap">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                tab === key
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-[280px]">
          {/* ── Profile Tab ── */}
          {tab === "profile" && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setProfileMsg(null);
                  }}
                  className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="text"
                  value={user.email ?? ""}
                  disabled
                  className="bg-zinc-900/50 border border-zinc-800/50 text-sm text-zinc-600 rounded-lg px-4 py-2.5 cursor-not-allowed select-none"
                />
                <p className="text-[11px] text-zinc-700">
                  Email changes aren't supported yet.
                </p>
              </div>

              {profileMsg && (
                <p
                  className={`text-xs font-medium ${profileMsg.type === "ok" ? "text-emerald-500" : "text-red-400"}`}
                >
                  {profileMsg.type === "ok" ? "✓ " : "✕ "}
                  {profileMsg.text}
                </p>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={
                  profileSaving ||
                  !fullName.trim() ||
                  fullName.trim() === (user.user_metadata?.full_name ?? "")
                }
                className="self-end text-xs font-semibold px-5 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {profileSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}

          {/* ── Security Tab ── */}
          {tab === "security" && (
            <div className="flex flex-col gap-5 animate-fade-in">
              {step === "verify" ? (
                <>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    To change your password, first confirm your current one.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setSecurityMsg(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                        placeholder="••••••••"
                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:border-zinc-600 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        <EyeIcon open={showCurrent} />
                      </button>
                    </div>
                  </div>

                  {securityMsg && (
                    <p
                      className={`text-xs font-medium ${securityMsg.type === "ok" ? "text-emerald-500" : "text-red-400"}`}
                    >
                      {securityMsg.type === "ok" ? "✓ " : "✕ "}
                      {securityMsg.text}
                    </p>
                  )}

                  <button
                    onClick={handleVerify}
                    disabled={securitySaving || !currentPassword}
                    className="self-end text-xs font-semibold px-5 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {securitySaving ? "Verifying…" : "Continue"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-emerald-500 font-medium">
                    ✓ Identity confirmed. Set your new password.
                  </p>

                  {(
                    [
                      {
                        label: "New Password",
                        value: newPassword,
                        setter: setNewPassword,
                        show: showNew,
                        toggle: () => setShowNew((v) => !v),
                      },
                      {
                        label: "Confirm New Password",
                        value: confirmPassword,
                        setter: setConfirmPassword,
                        show: showConfirm,
                        toggle: () => setShowConfirm((v) => !v),
                      },
                    ] as const
                  ).map(({ label, value, setter, show, toggle }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          type={show ? "text" : "password"}
                          value={value}
                          onChange={(e) => {
                            setter(e.target.value);
                            setSecurityMsg(null);
                          }}
                          placeholder="••••••••"
                          className="w-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:border-zinc-600 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={toggle}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          <EyeIcon open={show} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {securityMsg && (
                    <p
                      className={`text-xs font-medium ${securityMsg.type === "ok" ? "text-emerald-500" : "text-red-400"}`}
                    >
                      {securityMsg.type === "ok" ? "✓ " : "✕ "}
                      {securityMsg.text}
                    </p>
                  )}

                  <div className="flex items-center gap-3 self-end">
                    <button
                      onClick={() => {
                        setStep("verify");
                        setSecurityMsg(null);
                      }}
                      className="text-xs font-semibold px-4 py-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        securitySaving || !newPassword || !confirmPassword
                      }
                      className="text-xs font-semibold px-5 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {securitySaving ? "Saving…" : "Change password"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Preferences Tab ── */}
          {tab === "preferences" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex items-start justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-zinc-200">
                    Skip delete confirmation
                  </span>
                  <span className="text-xs text-zinc-600 leading-relaxed max-w-xs">
                    When enabled, deleting an application won't ask for
                    confirmation. Turn this off to re-enable the safety prompt.
                  </span>
                </div>
                <button
                  onClick={() => handleToggleConfirm(!skipConfirm)}
                  className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${skipConfirm ? "bg-white" : "bg-zinc-700"}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-200 ${skipConfirm ? "translate-x-4 bg-zinc-950" : "translate-x-0 bg-zinc-400"}`}
                  />
                </button>
              </div>

              <div className="h-px bg-zinc-800/60" />
              <p className="text-[11px] text-zinc-700 leading-relaxed">
                More preferences coming soon.
              </p>
            </div>
          )}

          {/* ── Trash Tab ── */}
          {tab === "trash" && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Deleted applications are kept for{" "}
                  <span className="text-zinc-300 font-semibold">7 days</span>{" "}
                  before being permanently removed.
                </p>
                {trash.length > 0 && (
                  <div className="flex-shrink-0 ml-4">
                    {confirmEmptyTrash ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-500">Sure?</span>
                        <button
                          onClick={() => {
                            onEmptyTrash();
                            setConfirmEmptyTrash(false);
                          }}
                          className="text-[11px] font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors"
                        >
                          Yes, empty
                        </button>
                        <button
                          onClick={() => setConfirmEmptyTrash(false)}
                          className="text-[11px] text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmEmptyTrash(true)}
                        className="text-[11px] font-semibold text-zinc-600 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        Empty trash
                      </button>
                    )}
                  </div>
                )}
              </div>

              {trash.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-700">
                  <svg
                    className="w-8 h-8 mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="text-xs">Trash is empty</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                  {trash.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800/60 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">
                          {app.company}
                        </p>
                        <p className="text-[11px] text-zinc-600 truncate">
                          {app.role}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-[10px] text-zinc-700">
                          deleted {formatDate(app.deletedAt)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${daysLeft(app.deletedAt) <= 1 ? "text-red-500" : "text-zinc-600"}`}
                        >
                          {daysLeft(app.deletedAt)}d left
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onRestore(app.id)}
                          title="Restore"
                          className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => onPermanentDelete(app.id)}
                          title="Delete permanently"
                          className="text-[11px] text-zinc-700 hover:text-red-400 px-2 py-1 rounded-md hover:bg-zinc-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-zinc-700 mt-1">
                Restoring an application moves it back to your main list with
                its original status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  ) : (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}
