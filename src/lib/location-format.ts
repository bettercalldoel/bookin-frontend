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

const normalizeLocationKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(kota|kabupaten|provinsi)\s+/, "");

const mapSpecialLocationKey = (value: string) => {
  if (value === "daerah khusus ibukota jakarta" || value === "dki jakarta") {
    return "dki jakarta";
  }
  return value;
};

const toCompareKey = (value: string) => {
  const normalized = normalizeLocationKey(value);
  if (!normalized) return "";
  return mapSpecialLocationKey(normalized);
};

const buildAddressParts = (address: string) =>
  address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const pushUniquePart = (
  value: string | null | undefined,
  selected: string[],
  seen: Set<string>,
) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return;
  const key = toCompareKey(trimmed);
  if (!key || seen.has(key)) return;
  seen.add(key);
  selected.push(trimmed);
};

const appendAddressParts = (
  value: string | null | undefined,
  selected: string[],
  seen: Set<string>,
) => {
  buildAddressParts(value ?? "").forEach((part) => pushUniquePart(part, selected, seen));
};

const splitAddressToCompactParts = (address: string, limit: number) => {
  const parts = buildAddressParts(address);
  const selected: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const key = toCompareKey(part);
    if (!key || seen.has(key) || isNoiseAddressPart(key)) continue;
    seen.add(key);
    selected.push(part);
    if (selected.length >= limit) break;
  }

  return selected.length > 0 ? selected.join(", ") : parts.slice(0, limit).join(", ");
};

const collectUniqueLocationParts = (
  values: Array<string | null | undefined>,
  includeAddressParts = false,
) => {
  const selected: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (includeAddressParts) appendAddressParts(value, selected, seen);
    else pushUniquePart(value, selected, seen);
  }
  return selected;
};

export const formatCompactLocation = ({
  address,
  city,
  province,
  fallback = DEFAULT_FALLBACK,
  addressPartsLimit = DEFAULT_ADDRESS_PARTS_LIMIT,
}: CompactLocationInput) => {
  const selected = collectUniqueLocationParts([city, province]);
  if (selected.length > 0) return selected.join(", ");

  const trimmedAddress = address?.trim() ?? "";
  if (!trimmedAddress) return fallback;

  const limit = Math.max(1, Math.floor(addressPartsLimit));
  return splitAddressToCompactParts(trimmedAddress, limit);
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
  const selected = collectUniqueLocationParts([address, city, province], true);
  if (selected.length > 0) return selected.join(", ");
  return fallback;
};
