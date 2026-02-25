"use client";

import type React from "react";
import GoogleSignInButton from "@/components/google-signin-button";
import type { LoginCopy } from "@/components/login-form.copy";
import LoginFormLinks from "@/components/login-form.links";

type AccountType = "USER" | "TENANT";

type LoginFormViewProps = {
  accountType: AccountType;
  isTenantLogin: boolean;
  copy: LoginCopy;
  pageTitle: string;
  pageSubtitle: string;
  submitLabel: string;
  email: string;
  password: string;
  isLoading: boolean;
  error: string;
  info: string;
  showResend: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
};

export default function LoginFormView({
  accountType,
  isTenantLogin,
  copy,
  pageTitle,
  pageSubtitle,
  submitLabel,
  email,
  password,
  isLoading,
  error,
  info,
  showResend,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onResend,
}: LoginFormViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-800" />
            BookIn
          </a>
          <a
            href={isTenantLogin ? "/login" : "/tenant-login"}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-cyan-800"
          >
            {isTenantLogin ? copy.userMode : copy.tenantMode}
          </a>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl items-center justify-center px-4 py-10">
        <section className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-22px_rgba(15,23,42,0.4)]">
          <div className="border-b border-slate-200 px-6 py-4 sm:px-8">
            <p className="text-center text-sm font-semibold text-slate-900">{pageTitle}</p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-slate-900">{copy.welcome}</h1>
              <p className="text-sm text-slate-600">{pageSubtitle}</p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onLogin}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  {copy.email}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="block h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 transition focus:border-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700" htmlFor="password">
                    {copy.password}
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs font-medium text-cyan-700 transition hover:text-cyan-800"
                  >
                    {copy.forgotPassword}
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className="block h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 transition focus:border-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                  required
                />
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

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-linear-to-r from-teal-700 to-cyan-700 px-5 text-sm font-semibold text-white transition hover:from-teal-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-600"
              >
                {isLoading ? copy.processing : submitLabel}
              </button>

              {showResend ? (
                <button
                  type="button"
                  onClick={onResend}
                  disabled={isLoading}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {isLoading ? copy.sending : copy.resendVerification}
                </button>
              ) : null}

              <div className="relative py-1">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
                <p className="relative mx-auto w-fit bg-white px-3 text-xs font-medium text-slate-500">
                  {copy.continueWith}
                </p>
              </div>
              <GoogleSignInButton accountType={accountType} />
            </form>

            <div className="mt-6 space-y-2 border-t border-slate-200 pt-5 text-sm text-slate-600">
              <LoginFormLinks isTenantLogin={isTenantLogin} copy={copy} />
            </div>

            <p className="mt-5 text-xs text-slate-500">{copy.terms}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
