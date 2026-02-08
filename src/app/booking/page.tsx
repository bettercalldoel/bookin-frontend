"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";

/* ======================
 * Types (ERD-aligned)
 * ====================== */
interface Booking {
  id: string;
  orderNo: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  units: number;
  totalAmount: number | string;
  status: string;
  createdAt: string;
}

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

const formatIDR = (value: string | number) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

/* ======================
 * Page Component
 * ====================== */
export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
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
  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) {
        throw new Error("Gagal memuat booking.");
      }
      const json = await res.json();
      setBookings(json.data ?? []);
    } catch (err) {
      setBookings([]);
    }
  };

  const fetchOptions = async () => {
    try {
      setOptionsLoading(true);
      setOptionsError(null);
      const res = await fetch(`${API_BASE_URL}/bookings/options`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        throw new Error("Gagal memuat daftar properti.");
      }

      const json = (await res.json()) as PropertyOption[];
      setProperties(json);
    } catch (err) {
      setOptionsError(
        err instanceof Error ? err.message : "Gagal memuat daftar properti.",
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
    setPreview(null);
    setPreviewError(null);
  }, [form]);

  /* ======================
   * Preview booking
   * ====================== */
  const previewBooking = async () => {
    if (!isFormReady) {
      setPreviewError("Lengkapi data booking terlebih dahulu.");
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
        throw new Error(payload.message || "Preview gagal.");
      }

      const json = (await res.json()) as BookingPreview;
      setPreview(json);
    } catch (err) {
      setPreview(null);
      setPreviewError(
        err instanceof Error ? err.message : "Preview gagal.",
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
        throw new Error(payload.message || "Gagal membuat booking");
      }

      await fetchBookings();
      alert("Booking created");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating booking");
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
      <h1>Booking</h1>

      {/* ======================
       * Create Booking Form
       * ====================== */}
      <section style={{ marginBottom: 32 }}>
        <h2>Create Booking</h2>

        <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Property
            <select
              value={form.propertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
            >
              <option value="">Pilih properti</option>
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
              Memuat daftar properti...
            </span>
          )}

          {optionsError && (
            <span style={{ fontSize: 12, color: "#c53030" }}>
              {optionsError}
            </span>
          )}

          <label style={{ display: "grid", gap: 6 }}>
            Room Type
            <select
              value={form.roomTypeId}
              onChange={(e) =>
                setForm({ ...form, roomTypeId: e.target.value })
              }
              disabled={!form.propertyId}
            >
              <option value="">Pilih room</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} · {formatIDR(room.basePrice)}
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
            Check-in
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) =>
                setForm({ ...form, checkIn: e.target.value })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Check-out
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) =>
                setForm({ ...form, checkOut: e.target.value })
              }
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Guests
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
            Rooms
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
              {previewLoading ? "Previewing..." : "Preview Harga"}
            </button>
            <button disabled={loading} onClick={createBooking}>
              {loading ? "Creating..." : "Create Booking"}
            </button>
          </div>
        </div>

        {previewError && (
          <p style={{ marginTop: 12, color: "#c53030" }}>{previewError}</p>
        )}

        {preview && (
          <div style={{ marginTop: 16 }}>
            <h3>Preview Harga</h3>
            <p>
              <strong>Total:</strong> {formatIDR(preview.totalAmount)}
            </p>
            <p>
              <strong>Jumlah malam:</strong> {preview.totalNights}
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
                  <p>Base: {formatIDR(night.basePrice)}</p>
                  <p>Penyesuaian: {formatIDR(night.adjustment)}</p>
                  <p>Final: {formatIDR(night.finalPrice)}</p>
                  <p>Stok tersedia: {night.availableUnits}</p>
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
        <h2>My Bookings</h2>

        {bookings.length === 0 && <p>No bookings yet</p>}

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
              <strong>Order:</strong> {b.orderNo}
            </p>
            <p>
              <strong>Date:</strong> {b.checkIn} → {b.checkOut}
            </p>
            <p>
              <strong>Guests:</strong> {b.guests}
            </p>
            <p>
              <strong>Rooms:</strong> {b.units}
            </p>
            <p>
              <strong>Status:</strong> {b.status}
            </p>
            <p>
              <strong>Total:</strong> {formatIDR(b.totalAmount)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
