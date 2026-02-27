import type { TenantProfileCopy } from "@/components/tenant-dashboard/tenant-profile-settings-copy";

type TenantProfileAccountSectionProps = {
  copy: TenantProfileCopy;
  email: string;
  isVerified: boolean;
  hasPassword: boolean;
  canSaveEmail: boolean;
  isSavingEmail: boolean;
  isResending: boolean;
  isSendingReset: boolean;
  onEmailChange: (value: string) => void;
  onSaveEmail: () => Promise<void>;
  onResendVerification: () => Promise<void>;
  onSendResetPassword: () => Promise<void>;
};

export function TenantProfileAccountSection({
  copy,
  email,
  isVerified,
  hasPassword,
  canSaveEmail,
  isSavingEmail,
  isResending,
  isSendingReset,
  onEmailChange,
  onSaveEmail,
  onResendVerification,
  onSendResetPassword,
}: TenantProfileAccountSectionProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {copy.updateEmail}
        </p>
        <p className="mt-2 text-xs text-slate-500">{copy.updateEmailHint}</p>
        <div className="mt-3 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void onSaveEmail()}
              disabled={isSavingEmail || !canSaveEmail}
              className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isSavingEmail ? copy.saving : copy.updateEmail}
            </button>
            {!isVerified ? (
              <button
                type="button"
                onClick={() => void onResendVerification()}
                disabled={isResending}
                className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-xs font-semibold text-amber-700 disabled:opacity-60"
              >
                {isResending ? copy.sending : copy.resendVerification}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {copy.updatePassword}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {hasPassword ? copy.securityHint : copy.googleAccountHint}
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void onSendResetPassword()}
            disabled={isSendingReset || !hasPassword}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            {isSendingReset ? copy.sending : copy.sendResetLink}
          </button>
        </div>
      </section>
    </div>
  );
}
