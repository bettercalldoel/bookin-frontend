"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { useAppLocaleValue } from "@/hooks/use-app-locale";

type ResetPasswordResponse = {
  message: string;
  email?: string;
  expiresAt?: string;
};

type SetString = (value: string) => void;
type SetBoolean = (value: boolean) => void;

const validateResetEmail = (email: string, invalidMessage: string) => {
  if (!isValidEmail(email)) return invalidMessage;
  return "";
};

const requestResetPassword = (email: string) =>
  apiFetch<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

const submitResetPassword = async (
  email: string,
  setSuccess: SetString,
  setError: SetString,
  fallbackMessage: string,
) => {
  try {
    const result = await requestResetPassword(email);
    setSuccess(result.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : fallbackMessage;
    setError(message);
  }
};

const withLoading = async (setLoading: SetBoolean, task: () => Promise<void>) => {
  setLoading(true);
  try {
    await task();
  } finally {
    setLoading(false);
  }
};

export default function ForgotPasswordPage() {
  const locale = useAppLocaleValue();
  const copy = {
    invalidEmail: locale === "en" ? "Invalid email format." : "Format email tidak valid.",
    failed:
      locale === "en"
        ? "Failed to request password reset."
        : "Gagal mengirim atur ulang password.",
    title: locale === "en" ? "Reset Password" : "Atur Ulang Password",
    subtitle:
      locale === "en"
        ? "Enter your email to receive a password reset link."
        : "Masukkan email untuk menerima link atur ulang password.",
    email: "Email",
    sending: locale === "en" ? "Sending..." : "Mengirim...",
    sendLink: locale === "en" ? "Send Reset Link" : "Kirim Link Atur Ulang",
    backLogin: locale === "en" ? "Back to Sign in" : "Kembali ke Masuk",
  };
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async function (
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();
    const validationError = validateResetEmail(trimmedEmail, copy.invalidEmail);
    if (validationError) {
      setError(validationError);
      return;
    }

    await withLoading(setIsLoading, async () => {
      await submitResetPassword(trimmedEmail, setSuccess, setError, copy.failed);
    });
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
              <form className="flex flex-col gap-4 pb-4" onSubmit={handleSubmit}>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">
                  {copy.title}
                </h1>
                <p className="text-sm text-slate-500">
                  {copy.subtitle}
                </p>
                <div>
                  <div className="mb-2">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="email"
                    >
                      {copy.email}
                    </label>
                  </div>
                  <div className="flex w-full rounded-lg pt-1">
                    <div className="relative w-full">
                      <input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                        required
                      />
                    </div>
                  </div>
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
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full border border-transparent bg-slate-900 p-0.5 text-white transition-colors hover:bg-slate-800 active:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                  >
                    <span className="flex items-center justify-center gap-1 px-2.5 py-1 text-base font-medium">
                      {isLoading ? copy.sending : copy.sendLink}
                    </span>
                  </button>
                  <a
                    href="/login"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {copy.backLogin}
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
