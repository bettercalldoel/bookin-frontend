type CompactLocationInput = {
  address?: string | null;
  city?: string | null;
  province?: string | null;
  fallback?: string;
  addressPartsLimit?: number;
};

const DEFAULT_FALLBACK = "Lokasi belum tersedia";
const DEFAULT_ADDRESS_PARTS_LIMIT = 2;

const isNoiseAddressPart = (value: string) => {
  if (!value) return true;
  if (value === "indonesia" || value === "jawa" || value === "java") return true;
  if (/^\d{5}$/.test(value)) return true;
  if (/^rw\s*\d+/i.test(value) || /^rt\s*\d+/i.test(value)) return true;
  return false;
};

const toCompareKey = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(kota|kabupaten|provinsi)\s+/, "");

  if (!normalized) return "";
  if (
    normalized === "daerah khusus ibukota jakarta" ||
    normalized === "dki jakarta"
  ) {
    return "dki jakarta";
  }

  return normalized;
};

const splitAddressToCompactParts = (address: string, limit: number) => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const selected: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const key = toCompareKey(part);
    if (!key || seen.has(key) || isNoiseAddressPart(key)) continue;
    seen.add(key);
    selected.push(part);
    if (selected.length >= limit) break;
  }

  if (selected.length > 0) return selected.join(", ");
  return parts.slice(0, limit).join(", ");
};

export const formatCompactLocation = ({
  address,
  city,
  province,
  fallback = DEFAULT_FALLBACK,
  addressPartsLimit = DEFAULT_ADDRESS_PARTS_LIMIT,
}: CompactLocationInput) => {
  const selected: string[] = [];
  const seen = new Set<string>();

  const appendUnique = (value: string | null | undefined) => {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return;
    const key = toCompareKey(trimmed);
    if (!key || seen.has(key)) return;
    seen.add(key);
    selected.push(trimmed);
  };

  appendUnique(city);
  appendUnique(province);

  if (selected.length > 0) return selected.join(", ");

  const trimmedAddress = address?.trim() ?? "";
  if (trimmedAddress) {
    return splitAddressToCompactParts(
      trimmedAddress,
      Math.max(1, Math.floor(addressPartsLimit)),
    );
  }

  return fallback;
};

type DetailedLocationInput = {
  address?: string | null;
  city?: string | null;
  province?: string | null;
  fallback?: string;
};

export const formatDetailedLocation = ({
  address,
  city,
  province,
  fallback = DEFAULT_FALLBACK,
}: DetailedLocationInput) => {
  const selected: string[] = [];
  const seen = new Set<string>();

  const appendUnique = (value: string | null | undefined) => {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return;
    const key = toCompareKey(trimmed);
    if (!key || seen.has(key)) return;
    seen.add(key);
    selected.push(trimmed);
  };

  const addressParts = (address ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of addressParts) {
    appendUnique(part);
  }
  appendUnique(city);
  appendUnique(province);

  if (selected.length > 0) return selected.join(", ");
  return fallback;
};
