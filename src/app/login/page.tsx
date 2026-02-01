"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { setAuthToken } from "@/lib/auth-client";
import GoogleSignInButton from "@/components/google-signin-button";

type LoginResponse = {
  accessToken: string;
  account: { type: "USER" | "TENANT" };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showResend, setShowResend] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setShowResend(false);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Format email tidak valid.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      setAuthToken(result.accessToken);
      if (result.account.type === "TENANT") {
        router.push("/tenant-dashboard");
      } else {
        router.push("/profile");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login gagal.";
      setError(message);
      if (message.toLowerCase().includes("belum terverifikasi")) {
        setInfo("Silakan verifikasi email terlebih dahulu.");
        setShowResend(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Masukkan email yang valid terlebih dahulu.");
      return;
    }
    setError("");
    setInfo("");
    setIsLoading(true);
    try {
      const result = await apiFetch<{ message: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });
      setInfo(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengirim ulang.";
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
      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <div className="flex h-full w-full max-w-md flex-col items-center justify-center rounded-[28px] border border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-200/70 backdrop-blur">
          <div className="flex h-full w-full flex-col justify-center gap-4 p-6 sm:p-8">
            <div className="inline-block px-2 py-2.5 sm:px-4">
              <form className="flex flex-col gap-4 pb-4" onSubmit={handleLogin}>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">
                  Login
                </h1>
                <p className="text-sm text-slate-500">
                  Masuk untuk lanjutkan pemesanan.
                </p>
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="email">
                      Email
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
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="password">
                      Password
                    </label>
                  </div>
                  <div className="flex w-full rounded-lg pt-1">
                    <div className="relative w-full">
                      <input
                        id="password"
                        type="password"
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                        required
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-sky-600 hover:text-sky-700">
                    <a href="/forgot-password">Forgot password?</a>
                  </p>
                </div>
                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                    {error}
                  </p>
                ) : null}
                {info ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                    {info}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full border border-transparent bg-slate-900 p-0.5 text-white transition-colors hover:bg-slate-800 active:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                  >
                    <span className="flex items-center justify-center gap-1 px-2.5 py-1 text-base font-medium">
                      {isLoading ? "Memproses..." : "Masuk"}
                    </span>
                  </button>
                  <GoogleSignInButton accountType="USER" />
                  {showResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isLoading}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      {isLoading ? "Mengirim..." : "Kirim ulang email verifikasi"}
                    </button>
                  ) : null}
                </div>
              </form>
              <div className="min-w-[270px] space-y-3 text-center text-sm text-slate-600">
                <div>
                  Belum punya akun?{" "}
                  <a
                    className="text-sky-600 underline hover:text-sky-700"
                    href="/register"
                  >
                    Daftar di sini
                  </a>
                </div>
                <div>
                  Ingin jadi tenant?{" "}
                  <a
                    className="text-sky-600 underline hover:text-sky-700"
                    href="/tenant-register"
                  >
                    Daftar tenant
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
