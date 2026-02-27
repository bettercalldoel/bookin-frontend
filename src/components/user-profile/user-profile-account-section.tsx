import type { UserProfileCopy } from "@/components/user-profile/user-profile-copy";

type UserProfileAccountSectionProps = {
  copy: UserProfileCopy;
  email: string;
  isVerified: boolean;
  hasPassword: boolean;
  isSavingEmail: boolean;
  isResending: boolean;
  isSendingReset: boolean;
  onEmailChange: (value: string) => void;
  onSaveEmail: () => Promise<void>;
  onResend: () => Promise<void>;
  onSendResetPassword: () => Promise<void>;
};

export function UserProfileAccountSection({
  copy,
  email,
  isVerified,
  hasPassword,
  isSavingEmail,
  isResending,
  isSendingReset,
  onEmailChange,
  onSaveEmail,
  onResend,
  onSendResetPassword,
}: UserProfileAccountSectionProps) {
  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          {copy.updateEmail}
        </h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm"
          />
          <button
            type="button"
            onClick={() => void onSaveEmail()}
            disabled={isSavingEmail}
            className="w-full rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 lg:w-auto"
          >
            {isSavingEmail ? copy.saving : copy.updateEmail}
          </button>
          {!isVerified ? (
            <button
              type="button"
              onClick={() => void onResend()}
              disabled={isResending}
              className="w-full rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-xs font-semibold text-amber-700 lg:w-auto"
            >
              {isResending ? copy.sending : copy.resendVerification}
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          {copy.updatePassword}
        </h2>
        {!hasPassword ? (
          <p className="mt-3 text-xs text-slate-500">{copy.googleAccountHint}</p>
        ) : null}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => void onSendResetPassword()}
            disabled={isSendingReset || !hasPassword}
            className="w-full rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 sm:w-auto"
          >
            {isSendingReset ? copy.sending : copy.sendResetLink}
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <a
          href="/"
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
        >
          {copy.backHome}
        </a>
      </div>
    </>
  );
}
