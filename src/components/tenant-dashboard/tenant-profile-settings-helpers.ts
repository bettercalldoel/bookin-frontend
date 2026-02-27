import { validateUploadFile } from "@/lib/file-upload-validation";
import type { TenantProfileCopy } from "@/components/tenant-dashboard/tenant-profile-settings-copy";

const MAX_AVATAR_SIZE = 1024 * 1024;
const ALLOWED_AVATAR_EXT = ["jpg", "jpeg", "png", "gif"];
const ALLOWED_AVATAR_MIME = ["image/jpeg", "image/png", "image/gif"];

export const asErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const validateAvatarFile = (file: File, copy: TenantProfileCopy) => {
  const issue = validateUploadFile(file, {
    allowedExtensions: ALLOWED_AVATAR_EXT,
    allowedMimeTypes: ALLOWED_AVATAR_MIME,
    maxBytes: MAX_AVATAR_SIZE,
  });
  if (issue === "size") return copy.invalidAvatarSize;
  if (issue === "extension" || issue === "mime") return copy.invalidAvatarFormat;
  return issue;
};

export const buildTenantNamePayload = (name: string) => ({ name: name.trim() });
export const buildTenantEmailPayload = (email: string) => ({ email: email.trim() });
