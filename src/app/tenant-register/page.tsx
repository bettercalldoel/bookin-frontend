"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import GoogleSignInButton from "@/components/google-signin-button";

type RegisterResponse = {
  message: string;
  email: string;
  expiresAt: string;
};

export default function TenantRegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (trimmedName.length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("Format email tidak valid.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiFetch<RegisterResponse>("/auth/register/tenant", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail, name: trimmedName }),
      });
      setSuccess(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registrasi gagal.";
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
              <form className="flex flex-col gap-4 pb-4" onSubmit={handleRegister}>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">
                  Daftar Tenant
                </h1>
                <p className="text-sm text-slate-500">
                  Daftarkan properti Anda dan kelola pemesanan lebih mudah.
                </p>
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Nama
                    </label>
                  </div>
                  <div className="flex w-full rounded-lg pt-1">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Nama penanggung jawab"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-2">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                  </div>
                  <div className="flex w-full rounded-lg pt-1">
                    <div className="relative w-full">
                      <input
                        type="email"
                        placeholder="Masukkan email tenant"
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
                {success ? (
                  <a
                    href={`/verify-email?email=${encodeURIComponent(email)}`}
                    className="inline-flex w-full items-center justify-center rounded-full border border-emerald-200 px-5 py-3 text-xs font-semibold text-emerald-700"
                  >
                    Lanjut ke verifikasi email
                  </a>
                ) : null}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full border border-transparent bg-slate-900 p-0.5 text-white transition-colors hover:bg-slate-800 active:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  <span className="flex items-center justify-center gap-1 px-2.5 py-1 text-base font-medium">
                    {isLoading ? "Memproses..." : "Daftar Tenant"}
                  </span>
                </button>
                <div className="flex flex-col gap-2">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    atau masuk dengan
                  </p>
                  <GoogleSignInButton accountType="TENANT" />
                </div>
              </form>
              <div className="space-y-3 text-center text-sm text-slate-600">
                <div>
                  Sudah terdaftar sebagai tenant?{" "}
                  <a
                    href="/login"
                    className="text-sky-600 underline hover:text-sky-700"
                  >
                    Masuk
                  </a>
                </div>
              </div>
              <p className="mt-6 text-center text-xs text-slate-500">
                Dengan mendaftar, Anda menyetujui Kebijakan Privasi BookIn.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
