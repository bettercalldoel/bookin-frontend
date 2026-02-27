import type { AppLocale } from "@/lib/app-locale";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import type { PaymentCopy } from "./payment-types";

const MAX_PROOF_FILE_SIZE = 1024 * 1024;
const ALLOWED_PROOF_EXTENSIONS = [".jpg", ".png"];
const ALLOWED_PROOF_MIME_TYPES = ["image/jpeg", "image/png"];

export const formatIDR = (value: string, locale: AppLocale) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

export const formatPaymentDateTime = (value: string) => formatDateDDMMYYYY(value, value);

const hasAllowedProofExtension = (fileName: string) =>
  ALLOWED_PROOF_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));

export const validateProofFile = (file: File, copy: PaymentCopy) => {
  const mimeType = file.type.toLowerCase();
  const hasValidType =
    hasAllowedProofExtension(file.name) && ALLOWED_PROOF_MIME_TYPES.includes(mimeType);
  if (!hasValidType) return copy.invalidProofType;
  if (file.size > MAX_PROOF_FILE_SIZE) return copy.invalidProofSize;
  return null;
};
