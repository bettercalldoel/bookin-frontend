"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import GoogleSignInButton from "@/components/google-signin-button";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { getRegisterCopy } from "@/components/register-form.copy";

type RegisterFormProps = {
  accountType: "USER" | "TENANT";
};

type RegisterResponse = {
  message: string;
  email: string;
  expiresAt: string;
};

const validateRegisterEmail = (email: string, invalidMessage: string) => {
  if (!isValidEmail(email)) return invalidMessage;
  return "";
};

const requestRegister = (endpoint: string, email: string) =>
  apiFetch<RegisterResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export default function RegisterForm({ accountType }: RegisterFormProps) {
  const locale = useAppLocaleValue();
  const copy = getRegisterCopy(locale);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const isTenant = accountType === "TENANT";
  const endpoint = isTenant ? "/auth/register/tenant" : "/auth/register/user";

  const title = isTenant ? copy.tenantTitle : copy.userTitle;
  const subtitle = isTenant ? copy.tenantSubtitle : copy.userSubtitle;
  const submitLabel = copy.submit;

  const handleRegister = async function (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setShowPopup(false);

    const trimmedEmail = email.trim();
    const validationError = validateRegisterEmail(trimmedEmail, copy.invalidEmail);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await requestRegister(endpoint, trimmedEmail);
      setShowPopup(true);
      window.setTimeout(() => setShowPopup(false), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.registerFailed;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-800" />
            BookIn
          </a>
          <a
            href={isTenant ? "/tenant-login" : "/login"}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-cyan-800"
          >
            {copy.login}
          </a>
        </div>
      </header>

      {showPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white px-6 py-5 text-center shadow-xl">
            <p className="text-sm font-semibold text-emerald-700">{copy.popupMessage}</p>
            <p className="mt-2 text-xs text-slate-500">{copy.checkInbox}</p>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border border-emerald-200 px-4 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
            >
              {copy.close}
            </button>
          </div>
        </div>
      ) : null}

      <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl items-center justify-center px-4 py-10">
        <section className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(15,23,42,0.4)]">
          <div className="border-b border-slate-200 px-6 py-4 sm:px-8">
            <p className="text-center text-sm font-semibold text-slate-900">{title}</p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-slate-900">
                {isTenant ? copy.createTenantAccount : copy.createUserAccount}
              </h1>
              <p className="text-sm text-slate-600">{subtitle}</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="register-email">
                  {copy.email}
                </label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="block h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 transition focus:border-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  required
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-linear-to-r from-teal-700 to-cyan-700 px-5 text-sm font-semibold text-white transition hover:from-teal-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-600"
              >
                {isLoading ? copy.processing : submitLabel}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
                <p className="relative mx-auto w-fit bg-white px-3 text-xs font-medium text-slate-500">
                  {copy.continueWith}
                </p>
              </div>
              <GoogleSignInButton accountType={accountType} />
            </form>

            <div className="mt-6 space-y-2 border-t border-slate-200 pt-5 text-sm text-slate-600">
              <p>
                {isTenant ? copy.alreadyTenant : copy.alreadyHaveAccount}{" "}
                <a
                  href={isTenant ? "/tenant-login" : "/login"}
                  className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                >
                  {copy.login}
                </a>
              </p>
              {!isTenant ? (
                <p>
                  {copy.wantTenant}{" "}
                  <a
                    className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                    href="/tenant-register"
                  >
                    {copy.registerTenant}
                  </a>
                </p>
              ) : (
                <p>
                  {copy.wantUser}{" "}
                  <a
                    className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                    href="/register"
                  >
                    {copy.registerAccount}
                  </a>
                </p>
              )}
            </div>

            <p className="mt-5 text-xs text-slate-500">{copy.terms}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
