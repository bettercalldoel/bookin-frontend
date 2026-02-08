"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";

const formatIDR = (value: string | number) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

type AvailabilityItem = {
  date: string;
  availableUnits: number;
  isClosed: boolean;
  basePrice: string;
  adjustment: string;
  finalPrice: string;
};

type AvailabilityResponse = {
  roomTypeId: string;
  propertyId: string;
  totalUnits: number;
  items: AvailabilityItem[];
};

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
  const propertyId = searchParams.get("propertyId") ?? "";
  const roomTypeId = searchParams.get("roomTypeId") ?? "";
  const propertyName = searchParams.get("propertyName") ?? "";
  const roomName = searchParams.get("roomName") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const adults = parseNumber(searchParams.get("adults"), 0);
  const children = parseNumber(searchParams.get("children"), 0);

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    paymentMethod: "MANUAL_TRANSFER",
  });

  const totalGuests = adults + children;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diff = end.getTime() - start.getTime();
    if (diff <= 0) return 0;
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const endDateForCalendar = useMemo(() => {
    if (!checkIn || !checkOut) return "";
    const end = new Date(`${checkOut}T00:00:00`);
    const lastNight = addDays(end, -1);
    return formatDate(lastNight);
  }, [checkOut, checkIn]);

  useEffect(() => {
    if (!roomTypeId || !checkIn || !checkOut) return;
    const controller = new AbortController();

    const loadAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          startDate: checkIn,
          endDate: endDateForCalendar,
        });
        const response = await fetch(
          `${API_BASE_URL}/availability/public/room-types/${roomTypeId}?${params.toString()}`,
          { signal: controller.signal },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || "Gagal memuat harga.");
        }
        setAvailability(payload as AvailabilityResponse);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Gagal memuat harga.");
        setAvailability(null);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
    return () => controller.abort();
  }, [roomTypeId, checkIn, checkOut, endDateForCalendar]);

  const totalPrice = useMemo(() => {
    if (!availability) return 0;
    return availability.items.reduce(
      (acc, item) => acc + Number(item.finalPrice || 0),
      0,
    );
  }, [availability]);

  const canSubmit =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.paymentMethod === "MANUAL_TRANSFER" &&
    totalGuests > 0 &&
    nights > 0;

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
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Gagal membuat booking.");
      }
      const params = new URLSearchParams({
        orderNo: payload.orderNo ?? "",
        total: payload.totalAmount ?? "",
        paymentDueAt: payload.paymentDueAt ?? "",
        propertyName,
        roomName,
        checkIn,
        checkOut,
      });
      router.push(`/payment?${params.toString()}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal membuat booking.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto mb-6 flex w-full max-w-5xl items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
        >
          Kembali
        </button>
      </div>
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
              Konfirmasi Booking
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Lengkapi data pemesan
            </h1>
          </div>

          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Nama pemesan
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
                placeholder="Masukkan nama lengkap"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Email pemesan
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
              Nomor telepon
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
                placeholder="08xxxxxxxxxx"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              Metode pembayaran
              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: event.target.value,
                  }))
                }
                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
              >
                <option value="MANUAL_TRANSFER">Transfer Manual</option>
                <option value="COMING_SOON" disabled>
                  Coming soon
                </option>
              </select>
            </label>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit || loading}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
              canSubmit && !loading
                ? "bg-slate-900 hover:bg-slate-800"
                : "bg-slate-300"
            }`}
          >
            {loading ? "Memproses..." : "Konfirmasi booking"}
          </button>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Ringkasan
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {propertyName}
            </p>
            <p className="text-sm text-slate-500">{roomName}</p>
            <p className="mt-2 text-xs text-slate-500">
              {checkIn} {"->"} {checkOut} · {totalGuests} tamu
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Rincian harga
            </p>
            {loading && (
              <p className="mt-3 text-xs text-slate-500">Memuat harga...</p>
            )}
            {availability && (
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {availability.items.map((item) => (
                  <div key={item.date} className="flex items-center justify-between">
                    <span>{item.date}</span>
                    <span className="font-semibold text-slate-900">
                      {formatIDR(item.finalPrice)}
                    </span>
                  </div>
                ))}
                <div className="mt-3 border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                  Total {formatIDR(totalPrice)}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
