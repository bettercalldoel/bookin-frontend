"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, apiFetchWithHeaders } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { extractTokenFromAuthHeader, setAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { getLoginCopy, type LoginCopy } from "@/components/login-form.copy";
import LoginFormView from "@/components/login-form.view";

type AccountType = "USER" | "TENANT";

type LoginResponse = {
  account: { type: AccountType };
};

type LoginFormProps = {
  accountType: AccountType;
};

type SetString = (value: string) => void;
type SetBoolean = (value: boolean) => void;

const resolveDashboardPath = (accountType: AccountType) =>
  accountType === "TENANT" ? "/tenant-dashboard" : "/profile";

const isUnverifiedMessage = (message: string) =>
  message.toLowerCase().includes("belum terverifikasi");

const validateLoginInput = (email: string, password: string, copy: LoginCopy) => {
  if (!isValidEmail(email)) return copy.invalidEmail;
  if (password.length < 8) return copy.passwordMin;
  return "";
};

const requestLogin = (email: string, password: string) =>
  apiFetchWithHeaders<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

const assertMatchingAccountType = (
  actualType: AccountType,
  expectedType: AccountType,
  isTenantLogin: boolean,
  copy: LoginCopy,
) => {
  if (actualType === expectedType) return;
  throw new Error(isTenantLogin ? copy.notTenant : copy.isTenant);
};

const saveTokenFromHeaders = (headers: Headers, copy: LoginCopy) => {
  const token = extractTokenFromAuthHeader(headers.get("authorization"));
  if (!token) throw new Error(copy.tokenMissing);
  setAuthToken(token);
};

const applyLoginError = (
  err: unknown,
  copy: LoginCopy,
  setError: SetString,
  setInfo: SetString,
  setShowResend: SetBoolean,
) => {
  const message = err instanceof Error ? err.message : copy.loginFailed;
  setError(message);
  if (!isUnverifiedMessage(message)) return;
  setInfo(copy.verifyFirst);
  setShowResend(true);
};

const requestResend = (email: string) =>
  apiFetch<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export default function LoginForm({ accountType }: LoginFormProps) {
  const router = useRouter();
  const locale = useAppLocaleValue();
  const copy = getLoginCopy(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showResend, setShowResend] = useState(false);

  const isTenantLogin = accountType === "TENANT";
  const pageTitle = isTenantLogin ? copy.tenantTitle : copy.userTitle;
  const pageSubtitle = isTenantLogin
    ? copy.tenantSubtitle
    : copy.userSubtitle;
  const submitLabel = copy.submit;

  const clearFeedback = () => {
    setError("");
    setInfo("");
    setShowResend(false);
  };

  const performLogin = async (trimmedEmail: string) => {
    const { data, headers } = await requestLogin(trimmedEmail, password);
    assertMatchingAccountType(data.account.type, accountType, isTenantLogin, copy);
    saveTokenFromHeaders(headers, copy);
    router.push(resolveDashboardPath(data.account.type));
  };

  const handleLogin = async function (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    const trimmedEmail = email.trim();
    const validationError = validateLoginInput(trimmedEmail, password, copy);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    try {
      await performLogin(trimmedEmail);
    } catch (err) {
      applyLoginError(err, copy, setError, setInfo, setShowResend);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async function () {
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError(copy.validEmailFirst);
      return;
    }
    setError("");
    setInfo("");
    setIsLoading(true);
    try {
      const result = await requestResend(trimmedEmail);
      setInfo(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.resendFailed;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginFormView
      accountType={accountType}
      isTenantLogin={isTenantLogin}
      copy={copy}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      submitLabel={submitLabel}
      email={email}
      password={password}
      isLoading={isLoading}
      error={error}
      info={info}
      showResend={showResend}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onLogin={handleLogin}
      onResend={handleResend}
    />
  );
}
