"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { isValidEmail, isValidUrl } from "@/lib/validation";
import { getAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";

type UserProfileMe = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  emailVerifiedAt: string | null;
  isVerified?: boolean;
  hasPassword?: boolean;
};

type SignatureResponse = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder?: string;
};

const MAX_AVATAR_SIZE = 1024 * 1024;
const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif"];

async function fetchProfileSignature() {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized.");

  return apiFetch<SignatureResponse>("/media/profile-signature", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function uploadAvatar(file: File, signature: SignatureResponse) {
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", signature.timestamp.toString());
  formData.append("signature", signature.signature);
  if (signature.folder) {
    formData.append("folder", signature.folder);
  }

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });
  const data = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Upload avatar gagal.");
  }
  return data.secure_url;
}

export default function UserProfileClient({ me }: { me: UserProfileMe }) {
  const locale = useAppLocaleValue();
  const copy = {
    unauthorized: locale === "en" ? "Unauthorized." : "Unauthorized.",
    uploadFailed: locale === "en" ? "Avatar upload failed." : "Upload avatar gagal.",
    invalidAvatarFormat:
      locale === "en"
        ? "Photo format must be .jpg, .jpeg, .png, or .gif."
        : "Format foto harus .jpg, .jpeg, .png, atau .gif.",
    invalidAvatarSize:
      locale === "en" ? "Maximum photo size is 1MB." : "Ukuran foto maksimal 1MB.",
    avatarUploaded:
      locale === "en" ? "Profile photo uploaded successfully." : "Foto profil berhasil diunggah.",
    updateFailed:
      locale === "en" ? "Failed to update profile." : "Gagal memperbarui.",
    invalidAvatarUrl:
      locale === "en" ? "Invalid profile photo URL." : "URL foto profil tidak valid.",
    invalidEmail: locale === "en" ? "Invalid email format." : "Format email tidak valid.",
    resetFailed:
      locale === "en"
        ? "Failed to send password reset."
        : "Gagal mengirim atur ulang password.",
    resendFailed: locale === "en" ? "Failed to send." : "Gagal mengirim.",
    profileHeader: locale === "en" ? "User Profile" : "Profil Pengguna",
    profileTitle:
      locale === "en"
        ? "Manage profile and account security"
        : "Kelola profil dan keamanan akun",
    backHome: locale === "en" ? "Back to Home" : "Kembali ke Beranda",
    emailStatus: locale === "en" ? "Email Status" : "Status Email",
    verified: locale === "en" ? "Verified" : "Terverifikasi",
    unverified: locale === "en" ? "Unverified" : "Belum terverifikasi",
    emailNotVerified:
      locale === "en"
        ? "Email is not verified. Please verify again."
        : "Email belum terverifikasi. Silakan verifikasi ulang.",
    personalData: locale === "en" ? "Personal Data" : "Data Personal",
    fullName: locale === "en" ? "Full Name" : "Nama Lengkap",
    profilePhoto: locale === "en" ? "Profile Photo" : "Foto Profil",
    avatarHint:
      locale === "en"
        ? "Format: jpg, jpeg, png, gif. Max 1MB."
        : "Format: jpg, jpeg, png, gif. Maksimal 1MB.",
    avatarUrlPlaceholder:
      locale === "en" ? "Or paste profile photo URL" : "Atau tempel URL foto profil",
    saving: locale === "en" ? "Saving..." : "Menyimpan...",
    saveProfile: locale === "en" ? "Save Profile" : "Simpan Profil",
    updateEmail: locale === "en" ? "Update Email" : "Perbarui Email",
    resendVerification:
      locale === "en" ? "Resend verification" : "Verifikasi ulang",
    sending: locale === "en" ? "Sending..." : "Mengirim...",
    updatePassword: locale === "en" ? "Update Password" : "Perbarui Password",
    googleAccountHint:
      locale === "en"
        ? "This account signs in with Google. Password reset is only available for email/password accounts."
        : "Akun ini masuk melalui Google. Atur ulang password hanya tersedia untuk akun yang dibuat dengan email dan password.",
    sendResetLink:
      locale === "en"
        ? "Send Password Reset Link to Email"
        : "Kirim Link Atur Ulang ke Email",
  };
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [emailVerifiedAt, setEmailVerifiedAt] = useState(me.emailVerifiedAt);

  const isVerified = Boolean(emailVerifiedAt);
  const hasPassword = Boolean(me.hasPassword);

  const initials = useMemo(() => {
    const parts = name.trim().split(" ");
    if (!parts.length) return "U";
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  }, [name]);

  const validateAvatar = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      return copy.invalidAvatarFormat;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return copy.invalidAvatarSize;
    }
    return null;
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    const validation = validateAvatar(file);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setInfo("");
    setIsUploadingAvatar(true);
    try {
      const signature = await fetchProfileSignature();
      const url = await uploadAvatar(file, signature);
      setAvatarUrl(url);
      setInfo(copy.avatarUploaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.uploadFailed;
      setError(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setError("");
    setInfo("");
    const token = getAuthToken();
    if (!token) {
      setError(copy.unauthorized);
      return;
    }

    const payload: { name?: string; avatarUrl?: string } = {};
    const trimmedName = name.trim();
    if (trimmedName) {
      payload.name = trimmedName;
    }
    const trimmedAvatar = avatarUrl.trim();
    if (trimmedAvatar) {
      if (!isValidUrl(trimmedAvatar)) {
        setError(copy.invalidAvatarUrl);
        return;
      }
      payload.avatarUrl = trimmedAvatar;
    }

    setIsSavingProfile(true);
    try {
      const result = await apiFetch<{ message: string }>("/auth/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setInfo(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.updateFailed;
      setError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendResetPassword = async () => {
    setError("");
    setInfo("");
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError(copy.invalidEmail);
      return;
    }
    setIsSendingReset(true);
    try {
      const result = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });
      setInfo(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.resetFailed;
      setError(message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSaveEmail = async () => {
    setError("");
    setInfo("");
    const token = getAuthToken();
    if (!token) {
      setError(copy.unauthorized);
      return;
    }
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError(copy.invalidEmail);
      return;
    }
    setIsSavingEmail(true);
    try {
      const result = await apiFetch<{ message: string; email: string }>(
        "/auth/email",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email: trimmedEmail }),
        },
      );
      setInfo(result.message);
      setEmail(result.email);
      setEmailVerifiedAt(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.updateFailed;
      setError(message);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    const token = getAuthToken();
    if (!token) {
      setError(copy.unauthorized);
      return;
    }
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError(copy.invalidEmail);
      return;
    }
    setIsResending(true);
    try {
      const result = await apiFetch<{ message: string }>(
        "/auth/resend-verification",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email: trimmedEmail }),
        },
      );
      setInfo(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.resendFailed;
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 py-16 text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                {copy.profileHeader}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                {copy.profileTitle}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{email}</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                {copy.backHome}
              </a>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-16 w-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {copy.emailStatus}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {isVerified ? copy.verified : copy.unverified}
                </p>
              </div>
            </div>
          </div>

          {!isVerified ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {copy.emailNotVerified}
            </div>
          ) : null}

          <div className="mt-8 grid gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                {copy.personalData}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.fullName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {copy.profilePhoto}
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif"
                    onChange={(event) =>
                      handleAvatarUpload(event.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                  />
                  <p className="text-xs text-slate-400">
                    {copy.avatarHint}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <input
                  type="url"
                  placeholder={copy.avatarUrlPlaceholder}
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || isUploadingAvatar}
                  className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  {isSavingProfile ? copy.saving : copy.saveProfile}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                {copy.updateEmail}
              </h2>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={isSavingEmail}
                  className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  {isSavingEmail ? copy.saving : copy.updateEmail}
                </button>
                {!isVerified ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-xs font-semibold text-amber-700"
                  >
                    {isResending ? copy.sending : copy.resendVerification}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                {copy.updatePassword}
              </h2>
              {!hasPassword ? (
                <p className="mt-3 text-xs text-slate-500">
                  {copy.googleAccountHint}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSendResetPassword}
                  disabled={isSendingReset || !hasPassword}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {isSendingReset ? copy.sending : copy.sendResetLink}
                </button>
              </div>
            </section>

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                {info}
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
