import type { AppLocale } from "@/lib/app-locale";
import type { BookingStatus, TransactionItem } from "./my-transaction-types";

const STATUS_LABELS: Record<
  BookingStatus,
  { id: string; en: string; idShort: string; enShort: string; badgeClass: string }
> = {
  MENUNGGU_PEMBAYARAN: {
    id: "Menunggu Pembayaran",
    en: "Waiting Payment",
    idShort: "Menunggu Bayar",
    enShort: "Waiting Pay",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
  },
  MENUNGGU_KONFIRMASI_PEMBAYARAN: {
    id: "Menunggu Konfirmasi Pembayaran",
    en: "Waiting Payment Confirmation",
    idShort: "Menunggu Konfirmasi",
    enShort: "Waiting Confirm",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
  },
  DIPROSES: {
    id: "Diproses",
    en: "In Process",
    idShort: "Diproses",
    enShort: "In Process",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  DIBATALKAN: {
    id: "Dibatalkan",
    en: "Cancelled",
    idShort: "Dibatalkan",
    enShort: "Cancelled",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
  },
  SELESAI: {
    id: "Selesai",
    en: "Completed",
    idShort: "Selesai",
    enShort: "Completed",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export const statusBadgeClass = (status: BookingStatus) => STATUS_LABELS[status].badgeClass;

export const formatStatusLabel = (status: BookingStatus, locale: AppLocale) =>
  locale === "en" ? STATUS_LABELS[status].en : STATUS_LABELS[status].id;

export const formatStatusOverviewLabel = (status: BookingStatus, locale: AppLocale) =>
  locale === "en" ? STATUS_LABELS[status].enShort : STATUS_LABELS[status].idShort;

const emptyStatusCounts: Record<BookingStatus, number> = {
  MENUNGGU_PEMBAYARAN: 0,
  MENUNGGU_KONFIRMASI_PEMBAYARAN: 0,
  DIPROSES: 0,
  DIBATALKAN: 0,
  SELESAI: 0,
};

export const countTransactionsByStatus = (transactions: TransactionItem[]) =>
  transactions.reduce<Record<BookingStatus, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, { ...emptyStatusCounts });
