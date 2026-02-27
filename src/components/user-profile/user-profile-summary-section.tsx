import type { UserProfileCopy } from "@/components/user-profile/user-profile-copy";

type UserProfileSummarySectionProps = {
  copy: UserProfileCopy;
  name: string;
  email: string;
  avatarUrl: string;
  initials: string;
  isVerified: boolean;
};

export function UserProfileSummarySection({
  copy,
  name,
  email,
  avatarUrl,
  initials,
  isVerified,
}: UserProfileSummarySectionProps) {
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
            {copy.profileHeader}
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            {copy.profileTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{email}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-14 w-14 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {name.trim() || "-"}
              </p>
              <p className="truncate text-xs text-slate-500">{email}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-slate-500">{copy.emailStatus}</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isVerified ? copy.verified : copy.unverified}
            </span>
          </div>
        </div>
      </div>

      {!isVerified ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {copy.emailNotVerified}
        </div>
      ) : null}
    </>
  );
}
