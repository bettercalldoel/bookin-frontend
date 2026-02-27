"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { createBooking, fetchAuthMe, fetchBookingPreview } from "./confirmation-api";
import { BookingConfirmationBookerPanel } from "./confirmation-booker-panel";
import { CONFIRMATION_COPY } from "./confirmation-copy";
import { BookingConfirmationFinalModal } from "./confirmation-final-modal";
import { BookingConfirmationSummaryPanel } from "./confirmation-summary-panel";
import type {
  BookerForm,
  BookerProfileData,
  BookingPreviewResponse,
  BookingConfirmationQuery,
  CreateBookingResponse,
} from "./confirmation-types";
import { buildNightsCount, parseConfirmationQuery } from "./confirmation-utils";

const initialForm: BookerForm = { name: "", email: "", phone: "", paymentMethod: "MANUAL_TRANSFER" };

const toBreakfastPayload = (enabled: boolean, selected: boolean, pax: number) => ({
  breakfastSelected: enabled && selected,
  breakfastPax: enabled && selected ? pax : 0,
});

const buildBookingBody = (
  query: BookingConfirmationQuery,
  totalGuests: number,
  paymentMethod: BookerForm["paymentMethod"],
  breakfastSelected: boolean,
  breakfastPax: number,
) => ({ propertyId: query.propertyId, roomTypeId: query.roomTypeId, checkIn: query.checkIn, checkOut: query.checkOut, guests: totalGuests, rooms: 1, paymentMethod, ...toBreakfastPayload(query.breakfastEnabled, breakfastSelected, breakfastPax) });

const buildPaymentRedirectParams = (
  query: BookingConfirmationQuery,
  payload: CreateBookingResponse,
  preview: BookingPreviewResponse | null,
  paymentMethod: BookerForm["paymentMethod"],
  breakfastSelected: boolean,
) => new URLSearchParams({
  bookingId: payload.id ?? "", orderNo: payload.orderNo ?? "", total: payload.totalAmount ?? "", paymentDueAt: payload.paymentDueAt ?? "", paymentMethod: payload.paymentMethod ?? paymentMethod, xenditInvoiceUrl: payload.xenditInvoiceUrl ?? "",
  propertyName: query.propertyName, roomName: query.roomName, checkIn: query.checkIn, checkOut: query.checkOut, subtotalAmount: payload.pricing?.subtotal ?? preview?.pricing?.subtotal ?? "", roomSubtotal: preview?.pricing?.roomSubtotal ?? "",
  breakfastSelected: String(preview?.pricing?.breakfast.selected ?? (query.breakfastEnabled && breakfastSelected)), breakfastPax: String(preview?.pricing?.breakfast.pax ?? 0), breakfastUnitPrice: preview?.pricing?.breakfast.unitPrice ?? "",
  breakfastTotal: payload.pricing?.breakfastTotal ?? preview?.pricing?.breakfast.total ?? "", appFeeAmount: payload.pricing?.appFeeAmount ?? preview?.pricing?.appFeeAmount ?? "", taxAmount: payload.pricing?.taxAmount ?? preview?.pricing?.taxAmount ?? "", currency: payload.pricing?.currency ?? preview?.pricing?.currency ?? "IDR",
});

export const BookingConfirmationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useAppLocaleValue();
  const copy = CONFIRMATION_COPY[locale];
  const query = parseConfirmationQuery(searchParams);
  const totalGuests = query.adults + query.children;
  const nights = useMemo(() => buildNightsCount(query.checkIn, query.checkOut), [query.checkIn, query.checkOut]);

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFinalConfirmPopup, setShowFinalConfirmPopup] = useState(false);
  const [preview, setPreview] = useState<BookingPreviewResponse | null>(null);
  const [isBookerSelf, setIsBookerSelf] = useState(true);
  const [bookerProfileLoading, setBookerProfileLoading] = useState(false);
  const [bookerProfileError, setBookerProfileError] = useState<string | null>(null);
  const [selfBookerData, setSelfBookerData] = useState<BookerProfileData | null>(null);
  const [form, setForm] = useState<BookerForm>(initialForm);
  const [breakfastSelected, setBreakfastSelected] = useState(
    query.breakfastEnabled ? query.breakfastSelected : false,
  );
  const [breakfastPax, setBreakfastPax] = useState(Math.max(1, query.breakfastPax || totalGuests || 1));

  useEffect(() => {
    const maxPax = Math.max(1, totalGuests);
    setBreakfastPax((prev) => Math.min(Math.max(1, Number.isFinite(prev) ? prev : maxPax), maxPax));
  }, [totalGuests]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return setIsBookerSelf(false), setBookerProfileError(copy.pleaseFillManual);
    let active = true;
    setBookerProfileLoading(true);
    setBookerProfileError(null);
    fetchAuthMe(token, copy.accountUnavailable)
      .then((account) => {
        if (!active) return;
        const nextData = { name: account.name?.trim() ?? "", email: account.email?.trim() ?? "", phone: account.userProfile?.phone?.trim() ?? "" };
        setSelfBookerData(nextData);
        setForm((prev) => ({ ...prev, ...nextData }));
      })
      .catch((err) => active && (setIsBookerSelf(false), setBookerProfileError(err instanceof Error ? err.message : copy.accountUnavailableManual)))
      .finally(() => active && setBookerProfileLoading(false));
    return () => { active = false; };
  }, [copy.accountUnavailable, copy.accountUnavailableManual, copy.pleaseFillManual]);

  useEffect(() => {
    if (!isBookerSelf || !selfBookerData) return;
    setForm((prev) => ({ ...prev, ...selfBookerData }));
  }, [isBookerSelf, selfBookerData]);

  const canPreview = Boolean(query.propertyId && query.roomTypeId && query.checkIn && query.checkOut && totalGuests > 0);
  useEffect(() => {
    if (!canPreview) return setPreview(null);
    const token = getAuthToken();
    if (!token) return setPreview(null), setPreviewError(copy.loginForFinalPrice);
    const controller = new AbortController();
    setPreviewLoading(true);
    setPreviewError(null);
    fetchBookingPreview({
      token,
      fallbackMessage: copy.failedLoadPrice,
      signal: controller.signal,
      body: { propertyId: query.propertyId, roomTypeId: query.roomTypeId, checkIn: query.checkIn, checkOut: query.checkOut, guests: totalGuests, rooms: 1, paymentMethod: form.paymentMethod, ...toBreakfastPayload(query.breakfastEnabled, breakfastSelected, breakfastPax) },
    })
      .then(setPreview)
      .catch((err) => (err as Error).name !== "AbortError" && (setPreview(null), setPreviewError(err instanceof Error ? err.message : copy.failedLoadPrice)))
      .finally(() => setPreviewLoading(false));
    return () => controller.abort();
  }, [canPreview, copy.failedLoadPrice, copy.loginForFinalPrice, query, totalGuests, form.paymentMethod, breakfastSelected, breakfastPax]);

  const hasBookerContact = isBookerSelf
    ? form.name.trim().length > 0 && form.email.trim().length > 0
    : form.name.trim().length > 0 && form.email.trim().length > 0 && form.phone.trim().length > 0;
  const canSubmit = hasBookerContact && totalGuests > 0 && Boolean(preview) && !previewLoading;
  const paymentMethodLabel = form.paymentMethod === "XENDIT" ? copy.paymentGateway : copy.manualTransfer;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    const token = getAuthToken(); if (!token) return void router.push("/register");
    try {
      setLoading(true);
      setError(null);
      const payload = await createBooking({ token, fallbackMessage: copy.failedCreateBooking, body: buildBookingBody(query, totalGuests, form.paymentMethod, breakfastSelected, breakfastPax) });
      const params = buildPaymentRedirectParams(query, payload, preview, form.paymentMethod, breakfastSelected);
      router.replace(`/payment?${params}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failedCreateBooking);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_1fr]">
        <BookingConfirmationBookerPanel
          copy={copy}
          locale={locale}
          isBookerSelf={isBookerSelf}
          selfBookerData={selfBookerData}
          bookerProfileLoading={bookerProfileLoading}
          bookerProfileError={bookerProfileError}
          form={form}
          breakfastEnabled={query.breakfastEnabled}
          breakfastSelected={breakfastSelected}
          breakfastPax={breakfastPax}
          breakfastPricePerPax={query.breakfastPricePerPax}
          totalGuests={totalGuests}
          canSubmit={canSubmit}
          loading={loading}
          error={error}
          onBack={() => router.back()}
          onBookerSelfChange={setIsBookerSelf}
          onFormChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onBreakfastSelectedChange={setBreakfastSelected}
          onBreakfastPaxChange={(next) => Number.isFinite(next) && setBreakfastPax(Math.min(Math.max(1, Math.round(next)), Math.max(1, totalGuests)))}
          onOpenConfirm={() => canSubmit && !loading && setShowFinalConfirmPopup(true)}
        />
        <BookingConfirmationSummaryPanel
          copy={copy}
          locale={locale}
          propertyName={query.propertyName}
          roomName={query.roomName}
          checkIn={query.checkIn}
          checkOut={query.checkOut}
          totalGuests={totalGuests}
          nights={nights}
          previewLoading={previewLoading}
          previewError={previewError}
          preview={preview}
        />
      </div>

      <BookingConfirmationFinalModal
        open={showFinalConfirmPopup}
        copy={copy}
        checkIn={query.checkIn}
        checkOut={query.checkOut}
        totalGuests={totalGuests}
        nights={nights}
        paymentMethodLabel={paymentMethodLabel}
        onClose={() => setShowFinalConfirmPopup(false)}
        onConfirm={() => (setShowFinalConfirmPopup(false), void handleConfirm())}
      />
    </div>
  );
};
