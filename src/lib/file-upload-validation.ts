export type FileValidationIssue = "extension" | "mime" | "size";

type FileValidationOptions = {
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxBytes: number;
};

const normalizeExtension = (name: string) =>
  name.split(".").pop()?.trim().toLowerCase() ?? "";

const normalizeMimeType = (value: string) => value.trim().toLowerCase();

export const validateUploadFile = (
  file: File,
  options: FileValidationOptions,
): FileValidationIssue | null => {
  const extension = normalizeExtension(file.name);
  if (!options.allowedExtensions.includes(extension)) return "extension";
  const mimeType = normalizeMimeType(file.type);
  if (!options.allowedMimeTypes.includes(mimeType)) return "mime";
  if (file.size > options.maxBytes) return "size";
  return null;
};
