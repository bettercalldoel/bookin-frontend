"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import type { AppLocale } from "@/lib/app-locale";

type BookingStatus =
  | "MENUNGGU_PEMBAYARAN"
  | "MENUNGGU_KONFIRMASI_PEMBAYARAN"
  | "DIPROSES"
  | "DIBATALKAN"
  | "SELESAI";

type PaymentMethod = "MANUAL_TRANSFER" | "XENDIT";

type TransactionReview = {
  id: string;
  rating: number;
  comment: string;
  tenantReply: string | null;
  tenantRepliedAt: string | null;
  createdAt: string;
};

type TransactionItem = {
  id: string;
  orderNo: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalAmount: string;
  roomSubtotal?: string;
  subtotalAmount?: string;
  appFeeAmount?: string;
  taxAmount?: string;
  breakfastSelected?: boolean;
  breakfastPax?: number;
  breakfastUnitPrice?: string;
  breakfastTotal?: string;
  currency?: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  xenditInvoiceUrl?: string | null;
  createdAt: string;
  review?: TransactionReview | null;
  roomType?: {
    id: string;
    name: string;
  } | null;
};

type TransactionResponse = {
  data: TransactionItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ReviewDraft = {
  rating: string;
  comment: string;
};

type SearchFilters = {
  orderNo: string;
  startDate: string;
  endDate: string;
};

type StaySummary = {
  periodLabel: string;
  checkInLabel: string;
  checkOutLabel: string;
  nightsLabel: string;
};

type TransactionCopy = {
  loginAgain: string;
  failedLoad: string;
  failedReview: string;
  reviewSuccess: string;
  ratingRange: string;
  reviewRequired: string;
  historyEyebrow: string;
  historyTitle: string;
  historySubtitle: string;
  backHome: string;
  refresh: string;
  refreshing: string;
  searchOrderPlaceholder: string;
  applySearch: string;
  resetSearch: string;
  lastSynced: string;
  emptyState: string;
  fallbackRoomName: string;
  bookedAt: string;
  stayPeriod: string;
  duration: string;
  checkIn: string;
  checkOut: string;
  guestsRooms: string;
  paymentMethod: string;
  total: string;
  roomSubtotal: string;
  breakfast: string;
  subtotal: string;
  appFee: string;
  tax: string;
  payNow: string;
  yourReview: string;
  reviewSentAt: string;
  tenantReply: string;
  tenantRepliedAt: string;
  writeReview: string;
  reviewPlaceholder: string;
  submitReview: string;
  submittingReview: string;
  searchStartDate: string;
  searchEndDate: string;
  searchOrderLabel: string;
  ratingOptions: Array<{ value: string; label: string }>;
};

const TRANSACTION_COPY: Record<AppLocale, TransactionCopy> = {
  id: {
    loginAgain: "Silakan login kembali.",
    failedLoad: "Gagal memuat transaksi.",
    failedReview: "Gagal mengirim review.",
    reviewSuccess: "Review berhasil dikirim.",
    ratingRange: "Rating review harus antara 1 sampai 5.",
    reviewRequired: "Komentar review wajib diisi.",
    historyEyebrow: "Riwayat Transaksi",
    historyTitle: "Daftar transaksi pemesanan Anda",
    historySubtitle:
      "Cari berdasarkan nomor pesanan atau rentang tanggal pembuatan transaksi.",
    backHome: "Kembali ke Beranda",
    refresh: "Muat Ulang",
    refreshing: "Memuat ulang...",
    searchOrderPlaceholder: "Cari nomor pesanan",
    applySearch: "Cari",
    resetSearch: "Atur Ulang",
    lastSynced: "Terakhir sinkron",
    emptyState: "Belum ada transaksi.",
    fallbackRoomName: "Kamar",
    bookedAt: "Dipesan",
    stayPeriod: "Periode menginap",
    duration: "Durasi",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guestsRooms: "Tamu / Kamar",
    paymentMethod: "Metode Bayar",
    total: "Total",
    roomSubtotal: "Subtotal kamar",
    breakfast: "Sarapan",
    subtotal: "Subtotal",
    appFee: "Biaya layanan aplikasi",
    tax: "Pajak",
    payNow: "Bayar Sekarang",
    yourReview: "Ulasan Anda",
    reviewSentAt: "Dikirim",
    tenantReply: "Balasan Tenant",
    tenantRepliedAt: "Dibalas pada",
    writeReview: "Tulis Ulasan",
    reviewPlaceholder: "Bagikan pengalaman menginap Anda...",
    submitReview: "Kirim Ulasan",
    submittingReview: "Mengirim...",
    searchStartDate: "Tanggal mulai",
    searchEndDate: "Tanggal akhir",
    searchOrderLabel: "Nomor pesanan",
    ratingOptions: [
      { value: "5", label: "5 - Sangat baik" },
      { value: "4", label: "4 - Baik" },
      { value: "3", label: "3 - Cukup" },
      { value: "2", label: "2 - Kurang" },
      { value: "1", label: "1 - Buruk" },
    ],
  },
  en: {
    loginAgain: "Please sign in again.",
    failedLoad: "Failed to load transactions.",
    failedReview: "Failed to submit review.",
    reviewSuccess: "Review submitted successfully.",
    ratingRange: "Review rating must be between 1 and 5.",
    reviewRequired: "Review comment is required.",
    historyEyebrow: "Transaction History",
    historyTitle: "Your booking transactions",
    historySubtitle:
      "Search by order number or a transaction creation date range.",
    backHome: "Back to Home",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    searchOrderPlaceholder: "Search order number",
    applySearch: "Search",
    resetSearch: "Reset",
    lastSynced: "Last synced",
    emptyState: "No transactions yet.",
    fallbackRoomName: "Room",
    bookedAt: "Booked",
    stayPeriod: "Stay period",
    duration: "Duration",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guestsRooms: "Guests / Rooms",
    paymentMethod: "Payment method",
    total: "Total",
    roomSubtotal: "Room subtotal",
    breakfast: "Breakfast",
    subtotal: "Subtotal",
    appFee: "Application service fee",
    tax: "Tax",
    payNow: "Pay Now",
    yourReview: "Your Review",
    reviewSentAt: "Submitted",
    tenantReply: "Tenant Reply",
    tenantRepliedAt: "Replied at",
    writeReview: "Write a Review",
    reviewPlaceholder: "Share your stay experience...",
    submitReview: "Submit Review",
    submittingReview: "Submitting...",
    searchStartDate: "Start date",
    searchEndDate: "End date",
    searchOrderLabel: "Order number",
    ratingOptions: [
      { value: "5", label: "5 - Excellent" },
      { value: "4", label: "4 - Good" },
      { value: "3", label: "3 - Fair" },
      { value: "2", label: "2 - Poor" },
      { value: "1", label: "1 - Bad" },
    ],
  },
};

const formatIDR = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCALE_CODE: Record<AppLocale, string> = {
  id: "id-ID",
  en: "en-US",
};

const parseDateValue = (value: string) => {
  if (!value) return null;

  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year, (month ?? 1) - 1, day, 12, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateLabel = (
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

const formatDateTime = (value: string, locale: AppLocale) => {
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

const buildStaySummary = (
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

const formatStatusLabel = (status: BookingStatus, locale: AppLocale) => {
  switch (status) {
    case "MENUNGGU_PEMBAYARAN":
      return locale === "en" ? "Waiting Payment" : "Menunggu Pembayaran";
    case "MENUNGGU_KONFIRMASI_PEMBAYARAN":
      return locale === "en"
        ? "Waiting Payment Confirmation"
        : "Menunggu Konfirmasi Pembayaran";
    case "DIPROSES":
      return locale === "en" ? "In Process" : "Diproses";
    case "DIBATALKAN":
      return locale === "en" ? "Cancelled" : "Dibatalkan";
    case "SELESAI":
      return locale === "en" ? "Completed" : "Selesai";
    default:
      return status;
  }
};

const formatPaymentMethodLabel = (method: PaymentMethod, locale: AppLocale) => {
  switch (method) {
    case "MANUAL_TRANSFER":
      return locale === "en" ? "Manual Transfer" : "Transfer Manual";
    case "XENDIT":
      return locale === "en" ? "Payment Gateway" : "Gateway Pembayaran";
    default:
      return method;
  }
};

const statusBadgeClass = (status: BookingStatus) => {
  switch (status) {
    case "MENUNGGU_PEMBAYARAN":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "MENUNGGU_KONFIRMASI_PEMBAYARAN":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "DIPROSES":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "DIBATALKAN":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "SELESAI":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const createDefaultFilters = (): SearchFilters => ({
  orderNo: "",
  startDate: "",
  endDate: "",
});

const buildDraftFromReview = (): ReviewDraft => ({
  rating: "5",
  comment: "",
});

export default function MyTransactionClient() {
  const locale = useAppLocaleValue();
  const copy = TRANSACTION_COPY[locale];
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [reviewSubmittingId, setReviewSubmittingId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [filters, setFilters] = useState<SearchFilters>(createDefaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFilters>(createDefaultFilters);

  const buildQueryString = useCallback(
    (page: number, limit: number, targetFilters: SearchFilters) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (targetFilters.orderNo.trim()) {
        params.set("orderNo", targetFilters.orderNo.trim());
      }
      if (targetFilters.startDate) {
        params.set("startDate", targetFilters.startDate);
      }
      if (targetFilters.endDate) {
        params.set("endDate", targetFilters.endDate);
      }

      return params.toString();
    },
    [],
  );

  const fetchTransactions = useCallback(
    async (silent = false, targetFilters: SearchFilters = appliedFilters) => {
      const token = getAuthToken();
      if (!token) {
        setError(copy.loginAgain);
        setTransactions([]);
        return;
      }

      try {
        if (!silent) setLoading(true);
        setError(null);

        const limit = 50;
        const requestPage = async (page: number) => {
          const query = buildQueryString(page, limit, targetFilters);
          const response = await fetch(`${API_BASE_URL}/bookings?${query}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const payload = (await response.json().catch(() => ({}))) as
            | (TransactionResponse & { message?: string })
            | { message?: string };

          if (!response.ok) {
            throw new Error(payload.message || copy.failedLoad);
          }

          return payload as TransactionResponse;
        };

        const firstPage = await requestPage(1);
        const totalPages = firstPage.meta?.totalPages ?? 1;

        if (totalPages <= 1) {
          setTransactions(firstPage.data ?? []);
        } else {
          const restPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              requestPage(index + 2),
            ),
          );

          setTransactions([
            ...(firstPage.data ?? []),
            ...restPages.flatMap((pageData) => pageData.data ?? []),
          ]);
        }

        setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.failedLoad);
        setTransactions([]);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [appliedFilters, buildQueryString, copy.failedLoad, copy.loginAgain],
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, appliedFilters]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      fetchTransactions(true, appliedFilters);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [appliedFilters, fetchTransactions]);

  const groupedStatus = useMemo(() => {
    return transactions.reduce<Record<BookingStatus, number>>(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      },
      {
        MENUNGGU_PEMBAYARAN: 0,
        MENUNGGU_KONFIRMASI_PEMBAYARAN: 0,
        DIPROSES: 0,
        DIBATALKAN: 0,
        SELESAI: 0,
      },
    );
  }, [transactions]);

  const handleApplySearch = () => {
    setFeedback(null);
    setAppliedFilters({
      orderNo: filters.orderNo.trim(),
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  };

  const handleResetSearch = () => {
    const reset = createDefaultFilters();
    setFeedback(null);
    setFilters(reset);
    setAppliedFilters(reset);
  };

  const handleReviewDraftChange = (
    bookingId: string,
    patch: Partial<ReviewDraft>,
  ) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] ?? buildDraftFromReview()),
        ...patch,
      },
    }));
  };

  const handleSubmitReview = async (bookingId: string) => {
    const token = getAuthToken();
    if (!token) {
      setError(copy.loginAgain);
      return;
    }

    const draft = reviewDrafts[bookingId] ?? buildDraftFromReview();
    const rating = Number(draft.rating);
    const comment = draft.comment.trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError(copy.ratingRange);
      return;
    }
    if (!comment) {
      setError(copy.reviewRequired);
      return;
    }

    try {
      setReviewSubmittingId(bookingId);
      setError(null);
      setFeedback(null);

      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message || copy.failedReview);
      }

      setFeedback(payload.message ?? copy.reviewSuccess);
      setReviewDrafts((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      await fetchTransactions(true, appliedFilters);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failedReview);
    } finally {
      setReviewSubmittingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 py-16 text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                {copy.historyEyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                {copy.historyTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {copy.historySubtitle}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="/"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                {copy.backHome}
              </a>
              <button
                type="button"
                onClick={() => fetchTransactions(false, appliedFilters)}
                disabled={loading}
                className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? copy.refreshing : copy.refresh}
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <input
                type="text"
                value={filters.orderNo}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, orderNo: event.target.value }))
                }
                aria-label={copy.searchOrderLabel}
                placeholder={copy.searchOrderPlaceholder}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
              />
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, startDate: event.target.value }))
                }
                aria-label={copy.searchStartDate}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, endDate: event.target.value }))
                }
                aria-label={copy.searchEndDate}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApplySearch}
                  className="flex-1 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  {copy.applySearch}
                </button>
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  {copy.resetSearch}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(groupedStatus) as BookingStatus[]).map((status) => (
              <div
                key={status}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {formatStatusLabel(status, locale)}
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {groupedStatus[status]}
                </p>
              </div>
            ))}
          </div>

          {lastSyncedAt ? (
            <p className="mt-4 text-xs text-slate-500">
              {copy.lastSynced}: {formatDateTime(lastSyncedAt, locale)}
            </p>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {feedback ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {feedback}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {!loading && transactions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                {copy.emptyState}
              </div>
            ) : null}

            {transactions.map((trx) => {
              const draft = reviewDrafts[trx.id] ?? buildDraftFromReview();
              const staySummary = buildStaySummary(trx.checkIn, trx.checkOut, locale);

              return (
                <article
                  key={trx.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {trx.orderNo}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {trx.roomType?.name ?? copy.fallbackRoomName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {copy.bookedAt}: {formatDateTime(trx.createdAt, locale)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusBadgeClass(
                        trx.status,
                      )}`}
                    >
                      {formatStatusLabel(trx.status, locale)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>
                      {copy.stayPeriod}:{" "}
                      <span className="font-semibold text-slate-900">
                        {staySummary.periodLabel}
                      </span>
                    </p>
                    <p>
                      {copy.duration}:{" "}
                      <span className="font-semibold text-slate-900">
                        {staySummary.nightsLabel}
                      </span>
                    </p>
                    <p>
                      {copy.checkIn}:{" "}
                      <span className="font-semibold text-slate-900">
                        {staySummary.checkInLabel}
                      </span>
                    </p>
                    <p>
                      {copy.checkOut}:{" "}
                      <span className="font-semibold text-slate-900">
                        {staySummary.checkOutLabel}
                      </span>
                    </p>
                    <p>
                      {copy.guestsRooms}:{" "}
                      <span className="font-semibold text-slate-900">
                        {trx.guests} / {trx.rooms}
                      </span>
                    </p>
                    <p>
                      {copy.paymentMethod}:{" "}
                      <span className="font-semibold text-slate-900">
                        {formatPaymentMethodLabel(trx.paymentMethod, locale)}
                      </span>
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    {copy.total}: {formatIDR(trx.totalAmount, locale)}
                  </p>

                  {(trx.subtotalAmount || trx.appFeeAmount || trx.taxAmount) && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>{copy.roomSubtotal}</span>
                        <span className="font-semibold text-slate-900">
                          {formatIDR(trx.roomSubtotal ?? "0", locale)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span>
                          {copy.breakfast}
                          {trx.breakfastSelected && (trx.breakfastPax ?? 0) > 0
                            ? ` (${trx.breakfastPax} pax)`
                            : ""}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatIDR(trx.breakfastTotal ?? "0", locale)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span>{copy.subtotal}</span>
                        <span className="font-semibold text-slate-900">
                          {formatIDR(trx.subtotalAmount ?? "0", locale)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span>{copy.appFee}</span>
                        <span className="font-semibold text-slate-900">
                          {formatIDR(trx.appFeeAmount ?? "0", locale)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span>{copy.tax}</span>
                        <span className="font-semibold text-slate-900">
                          {formatIDR(trx.taxAmount ?? "0", locale)}
                        </span>
                      </div>
                    </div>
                  )}

                  {trx.status === "MENUNGGU_PEMBAYARAN" &&
                  trx.paymentMethod === "XENDIT" &&
                  trx.xenditInvoiceUrl ? (
                    <a
                      href={trx.xenditInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      {copy.payNow}
                    </a>
                  ) : null}

                  {trx.review ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {copy.yourReview}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-700">
                        {"★".repeat(Math.max(0, Math.min(5, trx.review.rating)))}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">{trx.review.comment}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {copy.reviewSentAt}: {formatDateTime(trx.review.createdAt, locale)}
                      </p>
                      {trx.review.tenantReply ? (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <p className="text-xs font-semibold text-emerald-700">
                            {copy.tenantReply}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {trx.review.tenantReply}
                          </p>
                          {trx.review.tenantRepliedAt ? (
                            <p className="mt-2 text-xs text-slate-500">
                              {copy.tenantRepliedAt}:{" "}
                              {formatDateTime(trx.review.tenantRepliedAt, locale)}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {trx.status === "SELESAI" && !trx.review ? (
                    <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {copy.writeReview}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                        <select
                          value={draft.rating}
                          onChange={(event) =>
                            handleReviewDraftChange(trx.id, {
                              rating: event.target.value,
                            })
                          }
                          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                        >
                          {copy.ratingOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <textarea
                          rows={3}
                          value={draft.comment}
                          onChange={(event) =>
                            handleReviewDraftChange(trx.id, {
                              comment: event.target.value,
                            })
                          }
                          placeholder={copy.reviewPlaceholder}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSubmitReview(trx.id)}
                        disabled={reviewSubmittingId === trx.id}
                        className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {reviewSubmittingId === trx.id
                          ? copy.submittingReview
                          : copy.submitReview}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
