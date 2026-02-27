import type { RefObject } from "react";
import type { TenantProfileCopy } from "@/components/tenant-dashboard/tenant-profile-settings-copy";

type TenantProfilePersonalSectionProps = {
  copy: TenantProfileCopy;
  name: string;
  companyName: string;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  isUploadingAvatar: boolean;
  isSavingProfile: boolean;
  onNameChange: (value: string) => void;
  onNameBlur: () => Promise<void>;
  onAvatarUpload: (file: File | null) => Promise<void>;
};

export function TenantProfilePersonalSection({
  copy,
  name,
  companyName,
  avatarInputRef,
  isUploadingAvatar,
  isSavingProfile,
  onNameChange,
  onNameBlur,
  onAvatarUpload,
}: TenantProfilePersonalSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {copy.personalData}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{copy.tenantName}</label>
            <input
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              onBlur={() => void onNameBlur()}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
            />
            <p className="text-xs text-slate-500">{copy.autoSaveNameHint}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{copy.companyName}</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {companyName}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{copy.profilePhoto}</label>
            <input
              ref={avatarInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void onAvatarUpload(file);
                event.currentTarget.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar || isSavingProfile}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              {isUploadingAvatar ? copy.uploadingPhoto : copy.uploadPhoto}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
