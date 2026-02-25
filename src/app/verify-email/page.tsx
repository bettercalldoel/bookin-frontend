"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { getVerifyEmailCopy, type VerifyEmailCopy } from "./verify-copy";
import VerifyEmailFormView from "./verify-email-form.view";

type VerifyEmailFormState = {
  copy: VerifyEmailCopy;
  name: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string;
  success: string;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const validateVerifyEmailInput = (
  token: string,
  name: string,
  password: string,
  confirmPassword: string,
  copy: VerifyEmailCopy,
) => {
  if (name.trim().length < 2) return copy.nameMin;
  if (!token.trim()) return copy.missingToken;
  if (password.length < 8) return copy.passwordMin;
  if (password !== confirmPassword) return copy.confirmMismatch;
  return "";
};

const submitVerifyEmail = (token: string, name: string, password: string) =>
  apiFetch<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token, name, password }),
  });

const useVerifyEmailForm = function (): VerifyEmailFormState {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useAppLocaleValue();
  const copy = getVerifyEmailCopy(locale);
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) return;
    setToken(tokenFromUrl);
  }, [searchParams]);

  const handleSubmit = async function (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validateVerifyEmailInput(
      token,
      name,
      password,
      confirmPassword,
      copy,
    );
    if (validationError) return setError(validationError);
    setIsLoading(true);
    try {
      const result = await submitVerifyEmail(token.trim(), name.trim(), password);
      setSuccess(result.message);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.failed;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    copy,
    name,
    password,
    confirmPassword,
    isLoading,
    error,
    success,
    onNameChange: setName,
    onPasswordChange: setPassword,
    onConfirmPasswordChange: setConfirmPassword,
    onSubmit: handleSubmit,
  };
};

function VerifyEmailForm() {
  const form = useVerifyEmailForm();
  return <VerifyEmailFormView {...form} />;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
