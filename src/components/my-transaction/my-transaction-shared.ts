import type { AppLocale } from "@/lib/app-locale";

export type PaymentMethod = "MANUAL_TRANSFER" | "XENDIT";

export type StaySummary = {
  periodLabel: string;
  checkInLabel: string;
  checkOutLabel: string;
  nightsLabel: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCALE_CODE: Record<AppLocale, string> = {
  id: "id-ID",
  en: "en-US",
};

export const parseDateValue = (value: string) => {
  if (!value) return null;

  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year, (month ?? 1) - 1, day, 12, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateLabel = (
  value: string,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = {},
) => {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";

  return new Intl.DateTimeFormat(LOCALE_CODE[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(parsed);
};

export const formatDateTime = (value: string, locale: AppLocale) => {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";

  return new Intl.DateTimeFormat(LOCALE_CODE[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
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

export const buildStaySummary = (
  checkIn: string,
  checkOut: string,
  locale: AppLocale,
): StaySummary => {
  const checkInDate = parseDateValue(checkIn);
  const checkOutDate = parseDateValue(checkOut);

  const checkInLabel = formatDateLabel(checkIn, locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const checkOutLabel = formatDateLabel(checkOut, locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (!checkInDate || !checkOutDate) {
    return {
      periodLabel: `${checkInLabel} - ${checkOutLabel}`,
      checkInLabel,
      checkOutLabel,
      nightsLabel: "-",
    };
  }

  const checkInDay = new Date(
    checkInDate.getFullYear(),
    checkInDate.getMonth(),
    checkInDate.getDate(),
  ).getTime();
  const checkOutDay = new Date(
    checkOutDate.getFullYear(),
    checkOutDate.getMonth(),
    checkOutDate.getDate(),
  ).getTime();

  const nights = Math.max(0, Math.round((checkOutDay - checkInDay) / MS_PER_DAY));
  const nightsLabel =
    nights <= 0
      ? "-"
      : locale === "en"
        ? nights === 1
          ? "1 night"
          : `${nights} nights`
        : nights === 1
          ? "1 malam"
          : `${nights} malam`;

  return {
    periodLabel: `${checkInLabel} - ${checkOutLabel}`,
    checkInLabel,
    checkOutLabel,
    nightsLabel,
  };
};

export const formatPaymentMethodLabel = (method: PaymentMethod, locale: AppLocale) => {
  switch (method) {
    case "MANUAL_TRANSFER":
      return locale === "en" ? "Manual Transfer" : "Transfer Manual";
    case "XENDIT":
      return locale === "en" ? "Payment Gateway" : "Gateway Pembayaran";
    default:
      return method;
  }
};
