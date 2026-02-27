"use client";

import { useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";
import { getAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { validateUploadFile } from "@/lib/file-upload-validation";
import { buildUserProfileCopy, type UserProfileCopy } from "@/components/user-profile/user-profile-copy";
import { fetchProfileSignature, uploadAvatarWithSignature } from "@/components/user-profile/user-profile-upload";
import { UserProfileSummarySection } from "@/components/user-profile/user-profile-summary-section";
import { UserProfilePersonalSection } from "@/components/user-profile/user-profile-personal-section";
import { UserProfileAccountSection } from "@/components/user-profile/user-profile-account-section";
import { UserProfileFeedback } from "@/components/user-profile/user-profile-feedback";
import { UserProfileShell } from "@/components/user-profile/user-profile-shell";

export type UserProfileMe = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  emailVerifiedAt: string | null;
  isVerified?: boolean;
  hasPassword?: boolean;
};

const MAX_AVATAR_SIZE = 1024 * 1024;
const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif"];
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif"];

const asErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getInvalidAvatarMessage = (file: File, copy: UserProfileCopy) => {
  const issue = validateUploadFile(file, {
    allowedExtensions: ALLOWED_EXT,
    allowedMimeTypes: ALLOWED_MIME,
    maxBytes: MAX_AVATAR_SIZE,
  });
  if (issue === "size") return copy.invalidAvatarSize;
  if (issue === "extension" || issue === "mime") return copy.invalidAvatarFormat;
  return issue;
};

const buildProfilePayload = (
  name: string,
  avatarUrl: string,
  initialAvatarUrl: string | null | undefined,
) => {
  const payload: { name?: string; avatarUrl?: string } = {};
  const trimmedName = name.trim();
  const trimmedAvatar = avatarUrl.trim();
  if (trimmedName) payload.name = trimmedName;
  if (trimmedAvatar && trimmedAvatar !== (initialAvatarUrl ?? "").trim()) {
    payload.avatarUrl = trimmedAvatar;
  }
  return payload;
};

export default function UserProfileClient({ me }: { me: UserProfileMe }) {
  const locale = useAppLocaleValue();
  const copy = useMemo(() => buildUserProfileCopy(locale), [locale]);
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [emailVerifiedAt, setEmailVerifiedAt] = useState(me.emailVerifiedAt);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const isVerified = Boolean(emailVerifiedAt);
  const hasPassword = Boolean(me.hasPassword);
  const initials = useMemo(() => {
    const parts = name.trim().split(" ");
    if (!parts.length) return "U";
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  }, [name]);

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

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    const validation = getInvalidAvatarMessage(file, copy);
    if (validation) return setError(validation);
    resetMessages();
    await runPendingAction(setIsUploadingAvatar, async () => {
      const signature = await fetchProfileSignature();
      const uploadedUrl = await uploadAvatarWithSignature(file, signature);
      setAvatarUrl(uploadedUrl);
      setInfo(copy.avatarUploaded);
    }, copy.uploadFailed);
  };

  const handleSaveProfile = async () => {
    resetMessages();
    const token = ensureAuthToken();
    if (!token) return;
    const payload = buildProfilePayload(name, avatarUrl, me.avatarUrl);
    await runPendingAction(setIsSavingProfile, async () => {
      const result = await apiFetch<{ message: string }>("/auth/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      setInfo(result.message);
    }, copy.updateFailed);
  };

  const handleSendResetPassword = async () => {
    resetMessages();
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) return setError(copy.invalidEmail);
    await runPendingAction(setIsSendingReset, async () => {
      const result = await apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });
      setInfo(result.message);
    }, copy.resetFailed);
  };

  const handleSaveEmail = async () => {
    resetMessages();
    const token = ensureAuthToken(); if (!token) return;
    const trimmedEmail = email.trim(); if (!isValidEmail(trimmedEmail)) return setError(copy.invalidEmail);
    await runPendingAction(setIsSavingEmail, async () => {
      const result = await apiFetch<{ message: string; email: string }>("/auth/email", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      setInfo(result.message); setEmail(result.email); setEmailVerifiedAt(null);
    }, copy.updateFailed);
  };

  const handleResend = async () => {
    resetMessages();
    const token = ensureAuthToken();
    if (!token) return;
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) return setError(copy.invalidEmail);
    await runPendingAction(setIsResending, async () => {
      const result = await apiFetch<{ message: string }>("/auth/resend-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      setInfo(result.message);
    }, copy.resendFailed);
  };

  return (
    <UserProfileShell>
      <UserProfileSummarySection copy={copy} name={name} email={email} avatarUrl={avatarUrl} initials={initials} isVerified={isVerified} />
      <div className="mt-8 space-y-5">
        <UserProfilePersonalSection copy={copy} name={name} setName={setName} avatarInputRef={avatarInputRef} isUploadingAvatar={isUploadingAvatar} isSavingProfile={isSavingProfile} onAvatarUpload={handleAvatarUpload} onSaveProfile={handleSaveProfile} />
        <UserProfileAccountSection copy={copy} email={email} isVerified={isVerified} hasPassword={hasPassword} isSavingEmail={isSavingEmail} isResending={isResending} isSendingReset={isSendingReset} onEmailChange={setEmail} onSaveEmail={handleSaveEmail} onResend={handleResend} onSendResetPassword={handleSendResetPassword} />
        <UserProfileFeedback error={error} info={info} />
      </div>
    </UserProfileShell>
  );
}
