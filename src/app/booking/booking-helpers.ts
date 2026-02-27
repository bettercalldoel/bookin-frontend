import type { AppLocale } from "@/lib/app-locale";
import { API_BASE_URL } from "@/lib/api";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import type { BookingStatus } from "./booking-types";

export const formatIDR = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

export const formatDateTime = (value: string, locale: AppLocale) => {
  const formatted = formatDateDDMMYYYY(value, value);
  if (formatted === value) return value;
  const [day, month, year] = formatted.split("-");
  if (!day || !month || !year) return formatted;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(parsed.getTime())) return formatted;
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

export const formatBookingStatus = (status: BookingStatus, locale: AppLocale) => {
  const labels: Record<BookingStatus, { id: string; en: string }> = {
    MENUNGGU_PEMBAYARAN: { id: "Menunggu Pembayaran", en: "Waiting Payment" },
    MENUNGGU_KONFIRMASI_PEMBAYARAN: { id: "Menunggu Konfirmasi Pembayaran", en: "Waiting Payment Confirmation" },
    DIPROSES: { id: "Diproses", en: "In Process" },
    DIBATALKAN: { id: "Dibatalkan", en: "Cancelled" },
    SELESAI: { id: "Selesai", en: "Completed" },
  };
  return locale === "en" ? labels[status].en : labels[status].id;
};

const readErrorMessage = async (response: Response, fallback: string) => {
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  return payload.message || fallback;
};

export const postBookingRequest = async <T,>(
  path: string,
  payload: unknown,
  headers: Record<string, string>,
  fallback: string,
) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
  return (await response.json()) as T;
};

export const fetchPaginatedResource = async <T,>(
  url: string,
  headers: Record<string, string>,
  fallbackError: string,
) => {
  const limit = 50;
  let page = 1;
  let totalPages = 1;
  const aggregated: T[] = [];

  do {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await fetch(`${url}?${query.toString()}`, { headers });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.message || fallbackError);
    }
    const json = (await res.json()) as { data?: T[]; meta?: { totalPages?: number } };
    aggregated.push(...(json.data ?? []));
    totalPages = Math.max(1, json.meta?.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return aggregated;
};
