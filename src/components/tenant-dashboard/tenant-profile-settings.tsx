"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { isValidEmail } from "@/lib/validation";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { buildTenantProfileCopy, type TenantProfileCopy } from "@/components/tenant-dashboard/tenant-profile-settings-copy";
import { fetchTenantProfileSignature, uploadTenantAvatarWithSignature } from "@/components/tenant-dashboard/tenant-profile-settings-upload";
import { TenantProfileSummary } from "@/components/tenant-dashboard/tenant-profile-settings-summary";
import { TenantProfilePersonalSection } from "@/components/tenant-dashboard/tenant-profile-settings-personal";
import { TenantProfileAccountSection } from "@/components/tenant-dashboard/tenant-profile-settings-account";
import { TenantProfileFeedback } from "@/components/tenant-dashboard/tenant-profile-settings-feedback";
import {
  asErrorMessage,
  buildTenantEmailPayload,
  buildTenantNamePayload,
  validateAvatarFile,
} from "@/components/tenant-dashboard/tenant-profile-settings-helpers";

export type TenantProfileAccount = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  emailVerifiedAt: string | null;
  hasPassword?: boolean;
  tenantProfile?: { companyName?: string | null } | null;
};

type TenantProfileUpdate = Partial<Pick<TenantProfileAccount, "name" | "email" | "avatarUrl" | "emailVerifiedAt">>;

export default function TenantProfileSettings({ me, onProfileUpdated }: { me: TenantProfileAccount; onProfileUpdated?: (next: TenantProfileUpdate) => void }) {
  const locale = useAppLocaleValue();
  const copy = useMemo(() => buildTenantProfileCopy(locale === "en"), [locale]);
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [emailVerifiedAt, setEmailVerifiedAt] = useState(me.emailVerifiedAt);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setName(me.name);
    setEmail(me.email);
    setAvatarUrl(me.avatarUrl ?? "");
    setEmailVerifiedAt(me.emailVerifiedAt);
  }, [me.avatarUrl, me.email, me.emailVerifiedAt, me.name]);

  const isVerified = Boolean(emailVerifiedAt);
  const hasPassword = Boolean(me.hasPassword);
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "TN";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }, [name]);

  const normalizedName = name.trim();
  const normalizedEmail = email.trim();
  const normalizedAvatar = avatarUrl.trim();
  const initialName = me.name.trim();
  const initialEmail = me.email.trim();
  const initialAvatar = (me.avatarUrl ?? "").trim();
  const isProfileDirty = normalizedName !== initialName || normalizedAvatar !== initialAvatar;
  const isEmailDirty = normalizedEmail.toLowerCase() !== initialEmail.toLowerCase();
  const canSaveEmail = isEmailDirty && isValidEmail(normalizedEmail);
  const companyName = me.tenantProfile?.companyName ?? copy.defaultCompany;

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const ensureAuthToken = () => {
    const token = getAuthToken();
    if (!token) return setError(copy.unauthorized), null;
    return token;
  };

  const runPendingAction = async (
    setPending: (value: boolean) => void,
    action: () => Promise<void>,
    fallbackMessage: string,
  ) => {
    setPending(true);
    try { await action(); } catch (error) {
      setError(asErrorMessage(error, fallbackMessage));
    } finally {
      setPending(false);
    }
  };

  const saveUploadedAvatar = async (uploadedUrl: string) => {
    const token = ensureAuthToken(); if (!token) return;
    setIsSavingProfile(true);
    try {
      await apiFetch<{ message: string }>("/auth/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl: uploadedUrl }),
      });
      setInfo(copy.avatarUploaded); onProfileUpdated?.({ avatarUrl: uploadedUrl });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    const validationError = validateAvatarFile(file, copy);
    if (validationError) return setError(validationError);
    resetMessages();
    await runPendingAction(setIsUploadingAvatar, async () => {
      const signature = await fetchTenantProfileSignature();
      const uploadedUrl = await uploadTenantAvatarWithSignature(file, signature);
      setAvatarUrl(uploadedUrl);
      await saveUploadedAvatar(uploadedUrl);
    }, copy.uploadFailed);
  };

  const handleSaveName = async () => {
    resetMessages();
    if (!normalizedName) return setError(copy.nameRequired);
    if (normalizedName === initialName) return;
    const token = ensureAuthToken();
    if (!token) return;
    await runPendingAction(setIsSavingProfile, async () => {
      await apiFetch<{ message: string }>("/auth/profile", {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildTenantNamePayload(normalizedName)),
      });
      setInfo(copy.profileUpdated);
      onProfileUpdated?.({ name: normalizedName });
    }, copy.updateFailed);
  };

  const handleSaveEmail = async () => {
    resetMessages();
    if (!isEmailDirty) return setInfo(copy.noChanges);
    if (!isValidEmail(normalizedEmail)) return setError(copy.invalidEmail);
    const token = ensureAuthToken();
    if (!token) return;
    await runPendingAction(setIsSavingEmail, async () => {
      const result = await apiFetch<{ message: string; email: string }>("/auth/email", {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildTenantEmailPayload(normalizedEmail)),
      });
      setInfo(result.message); setEmail(result.email); setEmailVerifiedAt(null);
      onProfileUpdated?.({ email: result.email, emailVerifiedAt: null });
    }, copy.updateFailed);
  };

  const handleResendVerification = async () => {
    resetMessages();
    const token = ensureAuthToken();
    if (!token) return;
    if (!isValidEmail(normalizedEmail)) return setError(copy.invalidEmail);
    await runPendingAction(setIsResending, async () => {
      const result = await apiFetch<{ message: string }>("/auth/resend-verification", {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildTenantEmailPayload(normalizedEmail)),
      });
      setInfo(result.message);
    }, copy.resendFailed);
  };

  const handleSendResetPassword = async () => {
    setError(""); setInfo("");
    if (!isValidEmail(normalizedEmail)) return setError(copy.invalidEmail);
    setIsSendingReset(true);
    try {
      const result = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST", body: JSON.stringify({ email: normalizedEmail }),
      });
      setInfo(result.message);
    } catch (resetError) {
      setError(asErrorMessage(resetError, copy.resetFailed));
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      <TenantProfileSummary copy={copy} name={name} email={email} avatarUrl={avatarUrl} initials={initials} companyName={companyName} isVerified={isVerified} isProfileDirty={isProfileDirty} isEmailDirty={isEmailDirty} isUploadingAvatar={isUploadingAvatar} />
      <div className="grid gap-4 2xl:grid-cols-[1.3fr_1fr]">
        <TenantProfilePersonalSection copy={copy} name={name} companyName={companyName} avatarInputRef={avatarInputRef} isUploadingAvatar={isUploadingAvatar} isSavingProfile={isSavingProfile} onNameChange={setName} onNameBlur={handleSaveName} onAvatarUpload={handleAvatarUpload} />
        <TenantProfileAccountSection copy={copy} email={email} isVerified={isVerified} hasPassword={hasPassword} canSaveEmail={canSaveEmail} isSavingEmail={isSavingEmail} isResending={isResending} isSendingReset={isSendingReset} onEmailChange={setEmail} onSaveEmail={handleSaveEmail} onResendVerification={handleResendVerification} onSendResetPassword={handleSendResetPassword} />
      </div>
      <TenantProfileFeedback error={error} info={info} />
    </div>
  );
}
