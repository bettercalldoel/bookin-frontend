"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import type { AppLocale } from "@/lib/app-locale";

const formatIDR = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

type PaymentMethod = "MANUAL_TRANSFER" | "XENDIT";

type BookingPreviewResponse = {
  roomTypeId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  totalNights: number;
  totalAmount: string;
  pricing?: {
    currency: string;
    roomSubtotal: string;
    breakfast: {
      selected: boolean;
      pax: number;
      unitPrice: string;
      nights: number;
      total: string;
    };
    subtotal: string;
    appFeeRate: string;
    appFeeAmount: string;
    taxRate: string;
    taxAmount: string;
    tenantFeeRate: string;
    tenantFeeAmount: string;
    tenantPayoutAmount: string;
    totalAmount: string;
  };
};

type CreateBookingResponse = {
  id?: string;
  orderNo?: string;
  totalAmount?: string;
  paymentDueAt?: string;
  paymentMethod?: PaymentMethod;
  xenditInvoiceUrl?: string | null;
  message?: string;
  pricing?: {
    subtotal?: string;
    appFeeAmount?: string;
    taxAmount?: string;
    tenantFeeAmount?: string;
    tenantPayoutAmount?: string;
    breakfastTotal?: string;
    currency?: string;
  };
};

type AuthMeResponse = {
  name?: string;
  email?: string;
  userProfile?: {
    phone?: string | null;
  } | null;
};

const CONFIRMATION_COPY = {
  id: {
    fillBookerData: "Lengkapi data pemesan",
    back: "Kembali",
    bookingConfirm: "Konfirmasi Pemesanan",
    selfBooker: "Pemesan adalah saya sendiri",
    selfBookerHint: "Gunakan data akun login untuk nama, email, dan nomor telepon.",
    loadingAccount: "Memuat data akun...",
    accountDataFromProfile: "Data pemesan diambil dari profil akun Anda.",
    name: "Nama",
    email: "Email",
    phone: "Telepon",
    bookerName: "Nama pemesan",
    bookerEmail: "Email pemesan",
    bookerPhone: "Nomor telepon",
    inputFullName: "Masukkan nama lengkap",
    paymentMethod: "Metode pembayaran",
    manualTransfer: "Transfer Manual",
    paymentGateway: "Gateway Pembayaran",
    breakfastOption: "Opsi Sarapan",
    addBreakfast: "Tambahkan sarapan",
    breakfastPaxCount: "Jumlah pax sarapan",
    processing: "Memproses...",
    confirmBooking: "Konfirmasi Pemesanan",
    summary: "Ringkasan",
    priceDetails: "Rincian harga",
    loadingPriceDetails: "Memuat rincian harga...",
    roomSubtotal: "Subtotal kamar",
    breakfast: "Sarapan",
    appServiceFee: "Biaya layanan aplikasi (2%)",
    tax: "Pajak (11%)",
    total: "Total",
    recheckConfirm: "Konfirmasi Ulang",
    isBookingDataCorrect: "Apakah data pemesanan sudah benar?",
    recheckHint: "Pastikan tanggal, jumlah tamu, dan metode pembayaran sudah sesuai.",
    duration: "Durasi",
    payMethod: "Metode bayar",
    recheck: "Periksa lagi",
    yesContinue: "Ya, lanjutkan",
    guests: "tamu",
    nights: "malam",
    pleaseFillManual: "Silakan isi data pemesan secara manual.",
    accountUnavailable: "Data akun tidak tersedia.",
    accountUnavailableManual: "Data akun tidak tersedia. Silakan isi manual.",
    loginForFinalPrice: "Silakan login untuk melihat rincian harga final.",
    failedLoadPrice: "Gagal memuat rincian harga.",
    failedCreateBooking: "Gagal membuat pemesanan.",
    checkIn: "Check-in",
    checkOut: "Check-out",
  },
  en: {
    fillBookerData: "Complete booker details",
    back: "Back",
    bookingConfirm: "Booking Confirmation",
    selfBooker: "I am the booker",
    selfBookerHint: "Use your logged-in account data for name, email, and phone.",
    loadingAccount: "Loading account data...",
    accountDataFromProfile: "Booker data is taken from your account profile.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    bookerName: "Booker name",
    bookerEmail: "Booker email",
    bookerPhone: "Phone number",
    inputFullName: "Enter full name",
    paymentMethod: "Payment method",
    manualTransfer: "Manual transfer",
    paymentGateway: "Payment gateway",
    breakfastOption: "Breakfast option",
    addBreakfast: "Add breakfast",
    breakfastPaxCount: "Breakfast pax count",
    processing: "Processing...",
    confirmBooking: "Confirm booking",
    summary: "Summary",
    priceDetails: "Price details",
    loadingPriceDetails: "Loading price details...",
    roomSubtotal: "Room subtotal",
    breakfast: "Breakfast",
    appServiceFee: "App service fee (2%)",
    tax: "Tax (11%)",
    total: "Total",
    recheckConfirm: "Final confirmation",
    isBookingDataCorrect: "Is your booking data correct?",
    recheckHint: "Please ensure date, guest count, and payment method are correct.",
    duration: "Duration",
    payMethod: "Payment method",
    recheck: "Review again",
    yesContinue: "Yes, continue",
    guests: "guests",
    nights: "nights",
    pleaseFillManual: "Please fill booker details manually.",
    accountUnavailable: "Account data is unavailable.",
    accountUnavailableManual: "Account data is unavailable. Please fill manually.",
    loginForFinalPrice: "Please sign in to view final pricing details.",
    failedLoadPrice: "Failed to load pricing details.",
    failedCreateBooking: "Failed to create booking.",
    checkIn: "Check-in",
    checkOut: "Check-out",
  },
} as const;

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <BookingConfirmationContent />
    </Suspense>
  );
}

function BookingConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useAppLocaleValue();
  const copy = CONFIRMATION_COPY[locale];
  const propertyId = searchParams.get("propertyId") ?? "";
  const roomTypeId = searchParams.get("roomTypeId") ?? "";
  const propertyName = searchParams.get("propertyName") ?? "";
  const roomName = searchParams.get("roomName") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const adults = parseNumber(searchParams.get("adults"), 0);
  const children = parseNumber(searchParams.get("children"), 0);
  const initialBreakfastEnabled = searchParams.get("breakfastEnabled") === "true";
  const initialBreakfastSelected =
    searchParams.get("breakfastSelected") === "true";
  const initialBreakfastPax = parseNumber(searchParams.get("breakfastPax"), 0);
  const breakfastPricePerPax = parseNumber(
    searchParams.get("breakfastPricePerPax"),
    0,
  );

  const totalGuests = adults + children;

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFinalConfirmPopup, setShowFinalConfirmPopup] = useState(false);
  const [preview, setPreview] = useState<BookingPreviewResponse | null>(null);
  const [isBookerSelf, setIsBookerSelf] = useState(true);
  const [bookerProfileLoading, setBookerProfileLoading] = useState(false);
  const [bookerProfileError, setBookerProfileError] = useState<string | null>(null);
  const [selfBookerData, setSelfBookerData] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    paymentMethod: "MANUAL_TRANSFER" as PaymentMethod,
  });
  const [breakfastSelected, setBreakfastSelected] = useState(
    initialBreakfastEnabled ? initialBreakfastSelected : false,
  );
  const [breakfastPax, setBreakfastPax] = useState(
    Math.max(1, initialBreakfastPax || totalGuests || 1),
  );

  useEffect(() => {
    const maxPax = Math.max(1, totalGuests);
    setBreakfastPax((prev) => {
      if (!Number.isFinite(prev) || prev < 1) return maxPax;
      return Math.min(prev, maxPax);
    });
  }, [totalGuests]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsBookerSelf(false);
      setBookerProfileError(copy.pleaseFillManual);
      return;
    }

    let active = true;

    const loadBookerProfile = async () => {
      try {
        setBookerProfileLoading(true);
        setBookerProfileError(null);
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = (await response.json().catch(() => ({}))) as
          | AuthMeResponse
          | { message?: string };
        if (!response.ok) {
          throw new Error(
            (payload as { message?: string }).message ||
              copy.accountUnavailable,
          );
        }

        const account = payload as AuthMeResponse;
        const nextName = account.name?.trim() ?? "";
        const nextEmail = account.email?.trim() ?? "";
        const nextPhone = account.userProfile?.phone?.trim() ?? "";
        if (!active) return;

        setSelfBookerData({
          name: nextName,
          email: nextEmail,
          phone: nextPhone,
        });
        setForm((prev) => ({
          ...prev,
          name: nextName,
          email: nextEmail,
          phone: nextPhone,
        }));
      } catch (err) {
        if (!active) return;
        setIsBookerSelf(false);
        setBookerProfileError(
          err instanceof Error
            ? err.message
            : copy.accountUnavailableManual,
        );
      } finally {
        if (!active) return;
        setBookerProfileLoading(false);
      }
    };

    void loadBookerProfile();
    return () => {
      active = false;
    };
  }, [copy.accountUnavailable, copy.accountUnavailableManual, copy.pleaseFillManual]);

  useEffect(() => {
    if (!isBookerSelf || !selfBookerData) return;
    setForm((prev) => ({
      ...prev,
      name: selfBookerData.name,
      email: selfBookerData.email,
      phone: selfBookerData.phone,
    }));
  }, [isBookerSelf, selfBookerData]);

  const canPreview =
    Boolean(propertyId) &&
    Boolean(roomTypeId) &&
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    totalGuests > 0;

  useEffect(() => {
    if (!canPreview) {
      setPreview(null);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setPreview(null);
      setPreviewError(copy.loginForFinalPrice);
      return;
    }

    const controller = new AbortController();

    const loadPreview = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        const response = await fetch(`${API_BASE_URL}/bookings/preview`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            propertyId,
            roomTypeId,
            checkIn,
            checkOut,
            guests: totalGuests,
            rooms: 1,
            paymentMethod: form.paymentMethod,
            breakfastSelected:
              initialBreakfastEnabled && breakfastSelected ? true : false,
            breakfastPax:
              initialBreakfastEnabled && breakfastSelected ? breakfastPax : 0,
          }),
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => ({}))) as
          | BookingPreviewResponse
          | { message?: string };
        if (!response.ok) {
          throw new Error(
            (payload as { message?: string }).message || copy.failedLoadPrice,
          );
        }

        setPreview(payload as BookingPreviewResponse);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setPreview(null);
        setPreviewError(
          err instanceof Error ? err.message : copy.failedLoadPrice,
        );
      } finally {
        setPreviewLoading(false);
      }
    };

    void loadPreview();

    return () => controller.abort();
  }, [
    canPreview,
    copy.failedLoadPrice,
    copy.loginForFinalPrice,
    propertyId,
    roomTypeId,
    checkIn,
    checkOut,
    totalGuests,
    form.paymentMethod,
    breakfastSelected,
    breakfastPax,
    initialBreakfastEnabled,
  ]);

  const hasBookerContact = isBookerSelf
    ? form.name.trim().length > 0 && form.email.trim().length > 0
    : form.name.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.phone.trim().length > 0;

  const canSubmit =
    hasBookerContact &&
    (form.paymentMethod === "MANUAL_TRANSFER" ||
      form.paymentMethod === "XENDIT") &&
    totalGuests > 0 &&
    Boolean(preview) &&
    !previewLoading;

  const paymentMethodLabel =
    form.paymentMethod === "XENDIT" ? copy.paymentGateway : copy.manualTransfer;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    const token = getAuthToken();
    if (!token) {
      router.push("/register");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId,
          roomTypeId,
          checkIn,
          checkOut,
          guests: totalGuests,
          rooms: 1,
          paymentMethod: form.paymentMethod,
          breakfastSelected:
            initialBreakfastEnabled && breakfastSelected ? true : false,
          breakfastPax:
            initialBreakfastEnabled && breakfastSelected ? breakfastPax : 0,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as CreateBookingResponse;
      if (!response.ok) {
        throw new Error(payload.message || copy.failedCreateBooking);
      }

      const paymentMethod = payload.paymentMethod ?? form.paymentMethod;
      const params = new URLSearchParams({
        bookingId: payload.id ?? "",
        orderNo: payload.orderNo ?? "",
        total: payload.totalAmount ?? "",
        paymentDueAt: payload.paymentDueAt ?? "",
        paymentMethod,
        xenditInvoiceUrl: payload.xenditInvoiceUrl ?? "",
        propertyName,
        roomName,
        checkIn,
        checkOut,
        subtotalAmount: payload.pricing?.subtotal ?? preview?.pricing?.subtotal ?? "",
        roomSubtotal: preview?.pricing?.roomSubtotal ?? "",
        breakfastSelected: String(
          preview?.pricing?.breakfast.selected ??
            (initialBreakfastEnabled && breakfastSelected),
        ),
        breakfastPax: String(preview?.pricing?.breakfast.pax ?? 0),
        breakfastUnitPrice: preview?.pricing?.breakfast.unitPrice ?? "",
        breakfastTotal:
          payload.pricing?.breakfastTotal ?? preview?.pricing?.breakfast.total ?? "",
        appFeeAmount:
          payload.pricing?.appFeeAmount ?? preview?.pricing?.appFeeAmount ?? "",
        taxAmount: payload.pricing?.taxAmount ?? preview?.pricing?.taxAmount ?? "",
        currency: payload.pricing?.currency ?? preview?.pricing?.currency ?? "IDR",
      });
      router.replace(`/payment?${params.toString()}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : copy.failedCreateBooking,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFinalConfirmPopup = () => {
    if (!canSubmit || loading) return;
    setShowFinalConfirmPopup(true);
  };

  const handleApproveFinalConfirm = async () => {
    setShowFinalConfirmPopup(false);
    await handleConfirm();
  };

  const pricing = preview?.pricing;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diff = end.getTime() - start.getTime();
    if (diff <= 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto mb-6 flex w-full max-w-5xl items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
        >
          {copy.back}
        </button>
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
              {copy.bookingConfirm}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {copy.fillBookerData}
            </h1>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isBookerSelf}
                disabled={bookerProfileLoading || !selfBookerData}
                onChange={(event) => setIsBookerSelf(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              <span className="space-y-1">
                <span className="block font-semibold text-slate-900">
                  {copy.selfBooker}
                </span>
                <span className="block text-xs text-slate-500">
                  {copy.selfBookerHint}
                </span>
                {bookerProfileLoading ? (
                  <span className="block text-xs text-slate-500">
                    {copy.loadingAccount}
                  </span>
                ) : null}
              </span>
            </label>

            {bookerProfileError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                {bookerProfileError}
              </div>
            ) : null}

            {isBookerSelf ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">
                  {copy.accountDataFromProfile}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">{copy.name}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {form.name.trim() || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">{copy.email}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {form.email.trim() || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">{copy.phone}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {form.phone.trim() || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                  {copy.bookerName}
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
                    placeholder={copy.inputFullName}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                  {copy.bookerEmail}
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
                    placeholder="email@contoh.com"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                  {copy.bookerPhone}
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
                    placeholder="08xxxxxxxxxx"
                  />
                </label>
              </div>
            )}

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              {copy.paymentMethod}
              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: event.target.value as PaymentMethod,
                  }))
                }
                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
              >
                <option value="MANUAL_TRANSFER">{copy.manualTransfer}</option>
                <option value="XENDIT">{copy.paymentGateway}</option>
              </select>
            </label>
          </div>

          {initialBreakfastEnabled ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {copy.breakfastOption}
              </p>
              <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <span className="font-semibold">
                  {copy.addBreakfast} ({formatIDR(breakfastPricePerPax, locale)}/pax/
                  {copy.nights})
                </span>
                <input
                  type="checkbox"
                  checked={breakfastSelected}
                  onChange={(event) => setBreakfastSelected(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </label>
              {breakfastSelected ? (
                <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span>{copy.breakfastPaxCount}</span>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, totalGuests)}
                    value={breakfastPax}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (!Number.isFinite(next)) return;
                      setBreakfastPax(
                        Math.min(
                          Math.max(1, Math.round(next)),
                          Math.max(1, totalGuests),
                        ),
                      );
                    }}
                    className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleOpenFinalConfirmPopup}
            disabled={!canSubmit || loading}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
              canSubmit && !loading
                ? "bg-slate-900 hover:bg-slate-800"
                : "bg-slate-300"
            }`}
          >
            {loading ? copy.processing : copy.confirmBooking}
          </button>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {copy.summary}
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {propertyName}
            </p>
            <p className="text-sm text-slate-500">{roomName}</p>
            <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">{copy.checkIn}</span>
                <span className="font-semibold text-slate-900">
                  {formatDateDDMMYYYY(checkIn)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-500">{copy.checkOut}</span>
                <span className="font-semibold text-slate-900">
                  {formatDateDDMMYYYY(checkOut)}
                </span>
              </div>
              <p className="border-t border-slate-200 pt-2 text-xs font-medium text-slate-600">
                {totalGuests} {copy.guests} · {nights} {copy.nights}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {copy.priceDetails}
            </p>
            {previewLoading ? (
              <p className="mt-3 text-xs text-slate-500">{copy.loadingPriceDetails}</p>
            ) : null}
            {previewError ? (
              <p className="mt-3 text-xs text-rose-600">{previewError}</p>
            ) : null}
            {pricing ? (
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>{copy.roomSubtotal}</span>
                  <span className="font-semibold text-slate-900">
                    {formatIDR(pricing.roomSubtotal, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    {copy.breakfast}
                    {pricing.breakfast.selected
                      ? ` (${pricing.breakfast.pax} pax × ${pricing.breakfast.nights} ${copy.nights})`
                      : ""}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatIDR(pricing.breakfast.total, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{copy.appServiceFee}</span>
                  <span className="font-semibold text-slate-900">
                    {formatIDR(pricing.appFeeAmount, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{copy.tax}</span>
                  <span className="font-semibold text-slate-900">
                    {formatIDR(pricing.taxAmount, locale)}
                  </span>
                </div>
                <div className="mt-3 border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                  {copy.total} {formatIDR(pricing.totalAmount, locale)}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {showFinalConfirmPopup && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 p-4 sm:p-6"
          onClick={() => setShowFinalConfirmPopup(false)}
        >
          <div
            className="mx-auto mt-16 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/25"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {copy.recheckConfirm}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {copy.isBookingDataCorrect}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {copy.recheckHint}
            </p>

            <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{copy.checkIn}</span>
                <span className="font-semibold text-slate-900">
                  {formatDateDDMMYYYY(checkIn)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{copy.checkOut}</span>
                <span className="font-semibold text-slate-900">
                  {formatDateDDMMYYYY(checkOut)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{copy.duration}</span>
                <span className="font-semibold text-slate-900">
                  {totalGuests} {copy.guests} · {nights} {copy.nights}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">{copy.payMethod}</span>
                <span className="font-semibold text-slate-900">{paymentMethodLabel}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFinalConfirmPopup(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
              >
                {copy.recheck}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleApproveFinalConfirm();
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.yesContinue}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
