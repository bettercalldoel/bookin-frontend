import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";

type SignatureResponse = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder?: string;
  allowedFormats?: string[];
  maxFileSize?: number;
};

const buildUploadFormData = (file: File, signature: SignatureResponse) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", signature.timestamp.toString());
  formData.append("signature", signature.signature);
  if (signature.folder) formData.append("folder", signature.folder);
  if (signature.allowedFormats?.length) {
    formData.append("allowed_formats", signature.allowedFormats.join(","));
  }
  if (typeof signature.maxFileSize === "number") {
    formData.append("max_file_size", String(signature.maxFileSize));
  }
  return formData;
};

export const fetchTenantProfileSignature = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized.");
  return apiFetch<SignatureResponse>("/media/profile-signature", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const uploadTenantAvatarWithSignature = async (
  file: File,
  signature: SignatureResponse,
) => {
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    body: buildUploadFormData(file, signature),
  });
  const data = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };
  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Upload avatar gagal.");
  }
  return data.secure_url;
};
