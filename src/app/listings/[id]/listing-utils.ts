import type { AppLocale } from "@/lib/app-locale";

export const FALLBACK_GALLERY = [
  "/images/property-1.jpg",
  "/images/property-2.jpg",
  "/images/property-3.jpg",
];

export const WEEKDAY_LABELS: Record<AppLocale, string[]> = {
  id: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export const formatIDR = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

export const formatIDRPlain = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    maximumFractionDigits: 0,
  }).format(parsed);
};

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, days: number) => {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

export const formatDisplayDate = (value: string) => {
  if (!value) return "DD-MM-YYYY";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "DD-MM-YYYY";
  return `${day}-${month}-${year}`;
};

export const formatMonthYear = (value: string, locale: AppLocale) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return locale === "en" ? "Calendar" : "Kalender";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", { month: "long", year: "numeric" }).format(date);
};

export const sanitizeLocationSegments = (locationText: string) => {
  const segments = locationText.split(",").map((segment) => segment.trim()).filter(Boolean);
  const seen = new Set<string>();
  const ignored = new Set(["indonesia", "jawa", "java"]);
  return segments.filter((segment) => {
    const normalized = segment.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().replace(/^(kota|kabupaten|provinsi)\s+/, "");
    if (!normalized || ignored.has(normalized) || seen.has(normalized)) return false;
    if (/^\d{5}$/.test(normalized) || /^r[wt]\s*\d+/i.test(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};
