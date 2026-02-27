import type { AppLocale } from "@/lib/app-locale";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import type { BookingConfirmationQuery } from "./confirmation-types";

export const formatIDR = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

export const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseConfirmationQuery = (
  searchParams: { get: (name: string) => string | null },
): BookingConfirmationQuery => ({
  propertyId: searchParams.get("propertyId") ?? "",
  roomTypeId: searchParams.get("roomTypeId") ?? "",
  propertyName: searchParams.get("propertyName") ?? "",
  roomName: searchParams.get("roomName") ?? "",
  checkIn: searchParams.get("checkIn") ?? "",
  checkOut: searchParams.get("checkOut") ?? "",
  adults: parseNumber(searchParams.get("adults"), 0),
  children: parseNumber(searchParams.get("children"), 0),
  breakfastEnabled: searchParams.get("breakfastEnabled") === "true",
  breakfastSelected: searchParams.get("breakfastSelected") === "true",
  breakfastPax: parseNumber(searchParams.get("breakfastPax"), 0),
  breakfastPricePerPax: parseNumber(searchParams.get("breakfastPricePerPax"), 0),
});

export const buildNightsCount = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = end.getTime() - start.getTime();
  if (diff <= 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

export const formatDateShort = (value: string) => formatDateDDMMYYYY(value);
