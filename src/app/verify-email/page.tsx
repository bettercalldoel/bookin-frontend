"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendInfo, setResendInfo] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) setToken(tokenFromUrl);
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) setResendEmail(emailFromUrl);
  }, [searchParams]);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setResendInfo("");
    if (!token.trim()) {
      setError("Token verifikasi wajib diisi.");
      return;
    }
    const trimmedCurrentPassword = currentPassword.trim();

    if (trimmedCurrentPassword && trimmedCurrentPassword.length < 8) {
      setError("Password lama minimal 8 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiFetch<{ message: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          token: token.trim(),
          currentPassword: trimmedCurrentPassword || undefined,
        }),
      });
      setSuccess(result.message);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verifikasi gagal.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = resendEmail.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Masukkan email yang valid untuk kirim ulang verifikasi.");
      return;
    }
    setError("");
    setSuccess("");
    setResendInfo("");
    setIsLoading(true);

    try {
      const result = await apiFetch<{ message: string }>(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify({ email: trimmedEmail }),
        },
      );
      setResendInfo(result.message);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengirim ulang.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 py-20 text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <main className="relative z-10 flex h-full items-center justify-center px-6">
        <div className="flex h-full w-full max-w-md flex-col items-center justify-center rounded-[28px] border border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-200/70 backdrop-blur">
          <div className="flex h-full w-full flex-col justify-center gap-4 p-6 sm:p-8">
            <div className="inline-block px-2 py-2.5 sm:px-4">
              <form className="flex flex-col gap-4 pb-4" onSubmit={handleVerify}>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">
                  Verifikasi Email
                </h1>
                <p className="text-sm text-slate-500">
                  Masukkan token dan buat password akun Anda.
                </p>
                <p className="text-xs text-slate-400">
                  Token verifikasi berlaku maksimal 1 jam setelah email dikirim.
                </p>
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Token Verifikasi
                    </label>
                  </div>
                  <div className="flex w-full rounded-lg pt-1">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Masukkan token"
                        value={token}
                        onChange={(event) => setToken(event.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Password Lama
                    </label>
                  </div>
                  <div className="flex w-full rounded-lg pt-1">
                    <div className="relative w-full">
                      <input
                        type="password"
                        placeholder="Masukkan password lama (untuk ganti email)"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        autoComplete="current-password"
                        className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Wajib diisi saat verifikasi ulang setelah ganti email.
                  </p>
                </div>
                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                    {error}
                  </p>
                ) : null}
                {success ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                    {success}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full border border-transparent bg-slate-900 p-0.5 text-white transition-colors hover:bg-slate-800 active:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  <span className="flex items-center justify-center gap-1 px-2.5 py-1 text-base font-medium">
                    {isLoading ? "Memproses..." : "Verifikasi & Simpan Password"}
                  </span>
                </button>
              </form>
              <div className="border-t border-slate-100 pt-4 text-sm text-slate-600">
                <p className="text-xs text-slate-500">
                  Belum menerima email atau token sudah kedaluwarsa?
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="Masukkan email untuk kirim ulang"
                    value={resendEmail}
                    onChange={(event) => setResendEmail(event.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                  />
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    {isLoading ? "Mengirim..." : "Kirim ulang email verifikasi"}
                  </button>
                  {resendInfo ? (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                      {resendInfo}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3 text-center text-sm text-slate-600">
                <div>
                  Sudah punya akun?{" "}
                  <a
                    href="/login"
                    className="text-sky-600 underline hover:text-sky-700"
                  >
                    Masuk
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
