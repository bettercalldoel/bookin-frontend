"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function ConfirmResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmResetForm />
    </Suspense>
  );
}

function ConfirmResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [hasTokenFromUrl, setHasTokenFromUrl] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setHasTokenFromUrl(true);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token.trim()) {
      setError("Token atur ulang wajib diisi.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiFetch<{ message: string }>(
        "/auth/confirm-reset-password",
        {
          method: "POST",
          body: JSON.stringify({ token: token.trim(), newPassword }),
        },
      );
      setSuccess(result.message);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Atur ulang password gagal.";
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
              <form className="flex flex-col gap-4 pb-4" onSubmit={handleSubmit}>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">
                  Konfirmasi Atur Ulang Password
                </h1>
                {!hasTokenFromUrl ? (
                  <div>
                    <div className="mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Token Atur Ulang
                      </label>
                    </div>
                    <div className="flex w-full rounded-lg pt-1">
                      <div className="relative w-full">
                        <input
                          type="text"
                          placeholder="Tempel token atur ulang"
                          value={token}
                          onChange={(event) => setToken(event.target.value)}
                          className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-3">
                  <div>
                    <div className="mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Password Baru
                      </label>
                    </div>
                    <input
                      type="password"
                      placeholder="Minimal 8 karakter"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <div className="mb-2">
                      <label className="text-sm font-medium text-slate-700">
                        Konfirmasi Password
                      </label>
                    </div>
                    <input
                      type="password"
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                      minLength={8}
                      required
                    />
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
                      {isLoading ? "Memproses..." : "Atur Ulang Password"}
                    </span>
                  </button>
                  <a
                    href="/forgot-password"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Kirim ulang link atur ulang
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
