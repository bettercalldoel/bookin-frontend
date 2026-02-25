"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import type { AppLocale } from "@/lib/app-locale";

/* ======================
 * Types (ERD-aligned)
 * ====================== */
type BookingStatus =
  | "MENUNGGU_PEMBAYARAN"
  | "MENUNGGU_KONFIRMASI_PEMBAYARAN"
  | "DIPROSES"
  | "DIBATALKAN"
  | "SELESAI";

interface Booking {
  id: string;
  orderNo: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalAmount: number | string;
  status: BookingStatus;
  createdAt: string;
}

type BookingListResponse = {
  data: Booking[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
};

type BookingPreviewNight = {
  date: string;
  basePrice: string;
  adjustment: string;
  finalPrice: string;
  availableUnits: number;
  isClosed: boolean;
};

type BookingPreview = {
  roomTypeId: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  totalNights: number;
  totalAmount: string;
  nights: BookingPreviewNight[];
};

type RoomTypeOption = {
  id: string;
  name: string;
  basePrice: string;
  totalUnits: number;
  maxGuests: number;
};

type PropertyOption = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  roomTypes: RoomTypeOption[];
};

type BookingOptionListResponse = {
  data: PropertyOption[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
};

const BOOKING_COPY = {
  id: {
    failedLoadBooking: "Gagal memuat pesanan.",
    failedLoadProperty: "Gagal memuat daftar properti.",
    incompleteForm: "Lengkapi data pemesanan terlebih dahulu.",
    previewFailed: "Pratinjau gagal.",
    createFailed: "Terjadi kesalahan saat membuat pemesanan.",
    createdSuccess: "Pemesanan berhasil dibuat.",
    createFailedFallback: "Gagal membuat pemesanan",
    pageTitle: "Pemesanan",
    createTitle: "Buat Pemesanan",
    property: "Properti",
    selectProperty: "Pilih properti",
    loadingPropertyList: "Memuat daftar properti...",
    roomType: "Tipe Kamar",
    selectRoom: "Pilih kamar",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Tamu",
    rooms: "Kamar",
    previewPrice: "Pratinjau Harga",
    previewing: "Meninjau...",
    creating: "Membuat...",
    createBooking: "Buat Pemesanan",
    previewTitle: "Pratinjau Harga",
    total: "Total",
    totalNights: "Jumlah malam",
    basePrice: "Harga dasar",
    adjustment: "Penyesuaian",
    finalPrice: "Harga akhir",
    stock: "Stok tersedia",
    listTitle: "Daftar Pesanan Saya",
    refreshStatus: "Muat Ulang Status",
    refreshing: "Memuat ulang...",
    lastSynced: "Sinkron terakhir",
    noOrders: "Belum ada pesanan.",
    orderNo: "No. Pesanan",
    date: "Tanggal",
    status: "Status",
  },
  en: {
    failedLoadBooking: "Failed to load bookings.",
    failedLoadProperty: "Failed to load properties.",
    incompleteForm: "Please complete booking details first.",
    previewFailed: "Preview failed.",
    createFailed: "Something went wrong while creating booking.",
    createdSuccess: "Booking created successfully.",
    createFailedFallback: "Failed to create booking",
    pageTitle: "Booking",
    createTitle: "Create Booking",
    property: "Property",
    selectProperty: "Select property",
    loadingPropertyList: "Loading properties...",
    roomType: "Room Type",
    selectRoom: "Select room",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    rooms: "Rooms",
    previewPrice: "Price Preview",
    previewing: "Previewing...",
    creating: "Creating...",
    createBooking: "Create Booking",
    previewTitle: "Price Preview",
    total: "Total",
    totalNights: "Total nights",
    basePrice: "Base price",
    adjustment: "Adjustment",
    finalPrice: "Final price",
    stock: "Available stock",
    listTitle: "My Booking List",
    refreshStatus: "Refresh Status",
    refreshing: "Refreshing...",
    lastSynced: "Last synced",
    noOrders: "No bookings yet.",
    orderNo: "Order No.",
    date: "Date",
    status: "Status",
  },
} satisfies Record<AppLocale, Record<string, string>>;

const formatIDR = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatDateTime = (value: string, locale: AppLocale) => {
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

const formatBookingStatus = (status: BookingStatus, locale: AppLocale) => {
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

/* ======================
 * Page Component
 * ====================== */
export default function BookingPage() {
  const locale = useAppLocaleValue();
  const copy = BOOKING_COPY[locale];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  const [form, setForm] = useState({
    propertyId: "",
    roomTypeId: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    rooms: 1,
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const isFormReady =
    form.propertyId &&
    form.roomTypeId &&
    form.checkIn &&
    form.checkOut &&
    form.guests > 0 &&
    form.rooms > 0;

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === form.propertyId) ?? null,
    [properties, form.propertyId],
  );

  const availableRooms = selectedProperty?.roomTypes ?? [];

  /* ======================
   * Fetch bookings
   * ====================== */
  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) {
      setBookingsLoading(true);
    }
    try {
      setBookingsError(null);
      const limit = 50;
      let page = 1;
      let totalPages = 1;
      const aggregated: Booking[] = [];

      do {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const res = await fetch(`${API_BASE_URL}/bookings?${query.toString()}`, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.message || copy.failedLoadBooking);
        }
        const json = (await res.json()) as BookingListResponse;
        aggregated.push(...(json.data ?? []));
        totalPages = Math.max(1, json.meta?.totalPages ?? 1);
        page += 1;
      } while (page <= totalPages);

      setBookings(aggregated);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setBookingsError(
        err instanceof Error ? err.message : copy.failedLoadBooking,
      );
      setBookings([]);
    } finally {
      if (!silent) {
        setBookingsLoading(false);
      }
    }
  }, [copy.failedLoadBooking]);

  const fetchOptions = async () => {
    try {
      setOptionsLoading(true);
      setOptionsError(null);
      const limit = 50;
      let page = 1;
      let totalPages = 1;
      const aggregated: PropertyOption[] = [];

      do {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const res = await fetch(
          `${API_BASE_URL}/bookings/options?${query.toString()}`,
          {
            headers: {
              ...getAuthHeaders(),
            },
          },
        );

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.message || copy.failedLoadProperty);
        }

        const json = (await res.json()) as BookingOptionListResponse;
        aggregated.push(...(json.data ?? []));
        totalPages = Math.max(1, json.meta?.totalPages ?? 1);
        page += 1;
      } while (page <= totalPages);

      setProperties(aggregated);
    } catch (err) {
      setOptionsError(
        err instanceof Error ? err.message : copy.failedLoadProperty,
      );
      setProperties([]);
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchOptions();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      fetchBookings(true);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [fetchBookings]);

  useEffect(() => {
    setPreview(null);
    setPreviewError(null);
  }, [form]);

  /* ======================
   * Preview booking
   * ====================== */
  const previewBooking = async () => {
    if (!isFormReady) {
      setPreviewError(copy.incompleteForm);
      return;
    }

    try {
      setPreviewLoading(true);
      setPreviewError(null);

      const res = await fetch(`${API_BASE_URL}/bookings/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || copy.previewFailed);
      }

      const json = (await res.json()) as BookingPreview;
      setPreview(json);
    } catch (err) {
      setPreview(null);
      setPreviewError(
        err instanceof Error ? err.message : copy.previewFailed,
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ======================
   * Create booking
   * ====================== */
  const createBooking = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || copy.createFailedFallback);
      }

      await fetchBookings(true);
      alert(copy.createdSuccess);
    } catch (err) {
      alert(err instanceof Error ? err.message : copy.createFailed);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setForm((prev) => ({
      ...prev,
      propertyId,
      roomTypeId: "",
    }));
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>{copy.pageTitle}</h1>

      {/* ======================
       * Create Booking Form
       * ====================== */}
      <section style={{ marginBottom: 32 }}>
        <h2>{copy.createTitle}</h2>

        <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
          <label style={{ display: "grid", gap: 6 }}>
            {copy.property}
            <select
              value={form.propertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
            >
              <option value="">{copy.selectProperty}</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                  {property.city ? ` · ${property.city}` : ""}
                </option>
              ))}
            </select>
          </label>

          {optionsLoading && (
            <span style={{ fontSize: 12, color: "#718096" }}>
              {copy.loadingPropertyList}
            </span>
          )}

          {optionsError && (
            <span style={{ fontSize: 12, color: "#c53030" }}>
              {optionsError}
            </span>
          )}

          <label style={{ display: "grid", gap: 6 }}>
            {copy.roomType}
            <select
              value={form.roomTypeId}
              onChange={(e) =>
                setForm({ ...form, roomTypeId: e.target.value })
              }
              disabled={!form.propertyId}
            >
              <option value="">{copy.selectRoom}</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} · {formatIDR(room.basePrice, locale)}
                </option>
              ))}
            </select>
          </label>

          {selectedProperty && (
            <div style={{ fontSize: 12, color: "#4A5568" }}>
              {selectedProperty.address ?? ""}
              {selectedProperty.address && selectedProperty.city ? ", " : ""}
              {selectedProperty.city ?? ""}
              {selectedProperty.province ? `, ${selectedProperty.province}` : ""}
            </div>
          )}

          <label style={{ display: "grid", gap: 6 }}>
            {copy.checkIn}
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) =>
                setForm({ ...form, checkIn: e.target.value })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            {copy.checkOut}
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) =>
                setForm({ ...form, checkOut: e.target.value })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            {copy.guests}
            <input
              type="number"
              min={1}
              value={form.guests}
              onChange={(e) =>
                setForm({ ...form, guests: Number(e.target.value) })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            {copy.rooms}
            <input
              type="number"
              min={1}
              value={form.rooms}
              onChange={(e) =>
                setForm({ ...form, rooms: Number(e.target.value) })
              }
            />
          </label>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button disabled={previewLoading} onClick={previewBooking}>
              {previewLoading ? copy.previewing : copy.previewPrice}
            </button>
            <button disabled={loading} onClick={createBooking}>
              {loading ? copy.creating : copy.createBooking}
            </button>
          </div>
        </div>

        {previewError && (
          <p style={{ marginTop: 12, color: "#c53030" }}>{previewError}</p>
        )}

        {preview && (
          <div style={{ marginTop: 16 }}>
            <h3>{copy.previewTitle}</h3>
            <p>
              <strong>{copy.total}:</strong> {formatIDR(preview.totalAmount, locale)}
            </p>
            <p>
              <strong>{copy.totalNights}:</strong> {preview.totalNights}
            </p>
            <div style={{ marginTop: 12 }}>
              {preview.nights.map((night) => (
                <div
                  key={night.date}
                  style={{
                    border: "1px solid #eee",
                    padding: 10,
                    marginBottom: 8,
                  }}
                >
                  <p>
                    <strong>{night.date}</strong>
                  </p>
                  <p>
                    {copy.basePrice}: {formatIDR(night.basePrice, locale)}
                  </p>
                  <p>
                    {copy.adjustment}: {formatIDR(night.adjustment, locale)}
                  </p>
                  <p>
                    {copy.finalPrice}: {formatIDR(night.finalPrice, locale)}
                  </p>
                  <p>
                    {copy.stock}: {night.availableUnits}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ======================
       * Booking List
       * ====================== */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2>{copy.listTitle}</h2>
          <button
            type="button"
            onClick={() => fetchBookings()}
            disabled={bookingsLoading}
          >
            {bookingsLoading ? copy.refreshing : copy.refreshStatus}
          </button>
        </div>

        {lastSyncedAt && (
          <p style={{ fontSize: 12, color: "#718096" }}>
            {copy.lastSynced}: {formatDateTime(lastSyncedAt, locale)}
          </p>
        )}

        {bookingsError && (
          <p style={{ fontSize: 12, color: "#c53030" }}>{bookingsError}</p>
        )}

        {!bookingsLoading && bookings.length === 0 && <p>{copy.noOrders}</p>}

        {bookings.map((b) => (
          <div
            key={b.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 12,
            }}
          >
            <p>
              <strong>{copy.orderNo}:</strong> {b.orderNo}
            </p>
            <p>
              <strong>{copy.date}:</strong> {formatDateTime(b.checkIn, locale)} →{" "}
              {formatDateTime(b.checkOut, locale)}
            </p>
            <p>
              <strong>{copy.guests}:</strong> {b.guests}
            </p>
            <p>
              <strong>{copy.rooms}:</strong> {b.rooms}
            </p>
            <p>
              <strong>{copy.status}:</strong> {formatBookingStatus(b.status, locale)}
            </p>
            <p>
              <strong>{copy.total}:</strong> {formatIDR(b.totalAmount, locale)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
