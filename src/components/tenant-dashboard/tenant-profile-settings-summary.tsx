import type { TenantProfileCopy } from "@/components/tenant-dashboard/tenant-profile-settings-copy";

type TenantProfileSummaryProps = {
  copy: TenantProfileCopy;
  name: string;
  email: string;
  avatarUrl: string;
  initials: string;
  companyName: string;
  isVerified: boolean;
  isProfileDirty: boolean;
  isEmailDirty: boolean;
  isUploadingAvatar: boolean;
};

export function TenantProfileSummary({
  copy,
  name,
  email,
  avatarUrl,
  initials,
  companyName,
  isVerified,
  isProfileDirty,
  isEmailDirty,
  isUploadingAvatar,
}: TenantProfileSummaryProps) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
            {copy.profileTag}
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">{copy.profileTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{copy.profileSubtitle}</p>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
            isProfileDirty || isEmailDirty
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {isProfileDirty || isEmailDirty ? copy.changesNotSaved : copy.changesSaved}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Tenant Avatar" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{name.trim() || "-"}</p>
              <p className="truncate text-xs text-slate-500">{email.trim() || "-"}</p>
              <p className="mt-1 text-xs text-slate-500">{companyName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{copy.emailStatus}</span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                isVerified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {isVerified ? copy.verified : copy.unverified}
            </span>
            {isUploadingAvatar ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {copy.uploadingPhoto}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {!isVerified ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {copy.emailNotVerified}
        </div>
      ) : null}
    </>
  );
}
