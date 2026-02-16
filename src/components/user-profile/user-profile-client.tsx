"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { isValidEmail, isValidUrl } from "@/lib/validation";
import { getAuthToken } from "@/lib/auth-client";

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
      return "Format foto harus .jpg, .jpeg, .png, atau .gif.";
    }
    if (file.size > MAX_AVATAR_SIZE) {
      return "Ukuran foto maksimal 1MB.";
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
      setInfo("Foto profil berhasil diunggah.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload gagal.";
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
      setError("Unauthorized.");
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
        setError("URL foto profil tidak valid.");
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
      const message = err instanceof Error ? err.message : "Gagal memperbarui.";
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
      setError("Format email tidak valid.");
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
      const message =
        err instanceof Error ? err.message : "Gagal mengirim atur ulang password.";
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
      setError("Unauthorized.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Format email tidak valid.");
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
      const message = err instanceof Error ? err.message : "Gagal memperbarui.";
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
      setError("Unauthorized.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Format email tidak valid.");
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
      const message = err instanceof Error ? err.message : "Gagal mengirim.";
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
                Profil Pengguna
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Kelola profil dan keamanan akun
              </h1>
              <p className="mt-2 text-sm text-slate-500">{email}</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Kembali ke Beranda
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
                  Status Email
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {isVerified ? "Terverifikasi" : "Belum terverifikasi"}
                </p>
              </div>
            </div>
          </div>

          {!isVerified ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Email belum terverifikasi. Silakan verifikasi ulang.
            </div>
          ) : null}

          <div className="mt-8 grid gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Data Personal
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nama Lengkap
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
                    Foto Profil
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
                    Format: jpg, jpeg, png, gif. Maksimal 1MB.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <input
                  type="url"
                  placeholder="Atau tempel URL foto profil"
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
                  {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Perbarui Email
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
                  {isSavingEmail ? "Menyimpan..." : "Perbarui Email"}
                </button>
                {!isVerified ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-xs font-semibold text-amber-700"
                  >
                    {isResending ? "Mengirim..." : "Verifikasi ulang"}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Perbarui Password
              </h2>
              {!hasPassword ? (
                <p className="mt-3 text-xs text-slate-500">
                  Akun ini masuk melalui Google. Atur ulang password hanya tersedia untuk
                  akun yang dibuat dengan email dan password.
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSendResetPassword}
                  disabled={isSendingReset || !hasPassword}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {isSendingReset ? "Mengirim..." : "Kirim Link Atur Ulang ke Email"}
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
