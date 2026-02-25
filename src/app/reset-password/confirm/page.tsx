"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { getResetConfirmCopy, type ResetConfirmCopy } from "./reset-copy";
import ConfirmResetFormView from "./confirm-reset-form.view";

type ConfirmResetFormState = {
  copy: ResetConfirmCopy;
  hasTokenFromUrl: boolean;
  token: string;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string;
  success: string;
  onTokenChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const validateResetConfirm = (
  token: string,
  newPassword: string,
  confirmPassword: string,
  copy: ResetConfirmCopy,
) => {
  if (!token.trim()) return copy.tokenRequired;
  if (newPassword.length < 8) return copy.passwordMin;
  if (newPassword !== confirmPassword) return copy.confirmMismatch;
  return "";
};

const submitResetConfirm = (
  token: string,
  newPassword: string,
) =>
  apiFetch<{ message: string }>("/auth/confirm-reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });

const useConfirmResetForm = function (): ConfirmResetFormState {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useAppLocaleValue();
  const copy = getResetConfirmCopy(locale);
  const [token, setToken] = useState("");
  const [hasTokenFromUrl, setHasTokenFromUrl] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) return;
    setToken(tokenFromUrl);
    setHasTokenFromUrl(true);
  }, [searchParams]);

  const handleSubmit = async function (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validateResetConfirm(
      token,
      newPassword,
      confirmPassword,
      copy,
    );
    if (validationError) return setError(validationError);
    setIsLoading(true);
    try {
      const result = await submitResetConfirm(token.trim(), newPassword);
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
    hasTokenFromUrl,
    token,
    newPassword,
    confirmPassword,
    isLoading,
    error,
    success,
    onTokenChange: setToken,
    onNewPasswordChange: setNewPassword,
    onConfirmPasswordChange: setConfirmPassword,
    onSubmit: handleSubmit,
  };
};

function ConfirmResetForm() {
  const form = useConfirmResetForm();
  return <ConfirmResetFormView {...form} />;
}

export default function ConfirmResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmResetForm />
    </Suspense>
  );
}
