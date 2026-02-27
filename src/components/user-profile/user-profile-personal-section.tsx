import type { RefObject } from "react";
import type { UserProfileCopy } from "@/components/user-profile/user-profile-copy";

type UserProfilePersonalSectionProps = {
  copy: UserProfileCopy;
  name: string;
  setName: (value: string) => void;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  isUploadingAvatar: boolean;
  isSavingProfile: boolean;
  onAvatarUpload: (file: File | null) => Promise<void>;
  onSaveProfile: () => Promise<void>;
};

export function UserProfilePersonalSection({
  copy,
  name,
  setName,
  avatarInputRef,
  isUploadingAvatar,
  isSavingProfile,
  onAvatarUpload,
  onSaveProfile,
}: UserProfilePersonalSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
        {copy.personalData}
      </h2>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{copy.fullName}</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          />
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
          <p className="text-sm font-medium text-slate-700">{copy.profilePhoto}</p>
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
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copy.choosePhoto}
            </button>
            <p className="text-xs text-slate-500">
              {isUploadingAvatar ? copy.uploadingPhoto : copy.avatarHint}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => void onSaveProfile()}
          disabled={isSavingProfile || isUploadingAvatar}
          className="w-full rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
        >
          {isSavingProfile ? copy.saving : copy.saveProfile}
        </button>
      </div>
    </section>
  );
}
