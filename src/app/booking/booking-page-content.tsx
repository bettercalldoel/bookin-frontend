"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/lib/app-locale";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { BOOKING_COPY } from "./booking-copy";
import { BookingCreateSection } from "./booking-create-section";
import { fetchPaginatedResource, postBookingRequest } from "./booking-helpers";
import { BookingListSection } from "./booking-list-section";
import type { Booking, BookingForm, BookingPreview, PropertyOption } from "./booking-types";

type BookingPageContentProps = {
  locale: AppLocale;
};

const initialForm: BookingForm = {
  propertyId: "",
  roomTypeId: "",
  checkIn: "",
  checkOut: "",
  guests: 1,
  rooms: 1,
};

export const BookingPageContent = ({ locale }: BookingPageContentProps) => {
  const copy = BOOKING_COPY[locale];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [form, setForm] = useState<BookingForm>(initialForm);

  const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const isFormReady = Boolean(
    form.propertyId && form.roomTypeId && form.checkIn && form.checkOut && form.guests > 0 && form.rooms > 0,
  );

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === form.propertyId) ?? null,
    [properties, form.propertyId],
  );

  const availableRooms = selectedProperty?.roomTypes ?? [];

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setBookingsLoading(true);
    try {
      setBookingsError(null);
      const data = await fetchPaginatedResource<Booking>(
        `${API_BASE_URL}/bookings`,
        getAuthHeaders(),
        copy.failedLoadBooking,
      );
      setBookings(data);
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : copy.failedLoadBooking);
      setBookings([]);
    } finally {
      if (!silent) setBookingsLoading(false);
    }
  }, [copy.failedLoadBooking]);

  const fetchOptions = async () => {
    setOptionsLoading(true);
    setOptionsError(null);
    await fetchPaginatedResource<PropertyOption>(
      `${API_BASE_URL}/bookings/options`,
      getAuthHeaders(),
      copy.failedLoadProperty,
    )
      .then(setProperties)
      .catch((error) => (setOptionsError(error instanceof Error ? error.message : copy.failedLoadProperty), setProperties([])))
      .finally(() => setOptionsLoading(false));
  };

  const previewBooking = async () => {
    if (!isFormReady) return setPreviewError(copy.incompleteForm);
    setPreviewLoading(true);
    setPreviewError(null);
    await postBookingRequest<BookingPreview>("/bookings/preview", form, getAuthHeaders(), copy.previewFailed)
      .then(setPreview)
      .catch((error) => (setPreview(null), setPreviewError(error instanceof Error ? error.message : copy.previewFailed)))
      .finally(() => setPreviewLoading(false));
  };

  const createBooking = async () => {
    try {
      setLoading(true);
      await postBookingRequest("/bookings", form, getAuthHeaders(), copy.createFailedFallback);
      await fetchBookings(true);
      alert(copy.createdSuccess);
    } catch (error) {
      alert(error instanceof Error ? error.message : copy.createFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchBookings(); void fetchOptions(); }, []);
  useEffect(() => { setPreview(null); setPreviewError(null); }, [form]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) void fetchBookings(true); }, 15000);
    return () => window.clearInterval(timer);
  }, [fetchBookings]);

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6">
      <h1 className="text-2xl font-semibold text-slate-900">{copy.pageTitle}</h1>
      <BookingCreateSection
        copy={copy}
        locale={locale}
        form={form}
        properties={properties}
        availableRooms={availableRooms}
        selectedProperty={selectedProperty}
        optionsLoading={optionsLoading}
        optionsError={optionsError}
        previewLoading={previewLoading}
        loading={loading}
        previewError={previewError}
        preview={preview}
        onPropertyChange={(propertyId) => setForm((prev) => ({ ...prev, propertyId, roomTypeId: "" }))}
        onRoomTypeChange={(value) => setForm((prev) => ({ ...prev, roomTypeId: value }))}
        onCheckInChange={(value) => setForm((prev) => ({ ...prev, checkIn: value }))}
        onCheckOutChange={(value) => setForm((prev) => ({ ...prev, checkOut: value }))}
        onGuestsChange={(value) => setForm((prev) => ({ ...prev, guests: value }))}
        onRoomsChange={(value) => setForm((prev) => ({ ...prev, rooms: value }))}
        onPreviewBooking={() => void previewBooking()}
        onCreateBooking={() => void createBooking()}
      />
      <BookingListSection
        copy={copy}
        locale={locale}
        bookings={bookings}
        bookingsLoading={bookingsLoading}
        bookingsError={bookingsError}
        onRefresh={() => void fetchBookings()}
      />
    </div>
  );
};
