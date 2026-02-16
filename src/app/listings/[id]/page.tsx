"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

const fallbackGallery = [
  "/images/property-1.jpg",
  "/images/property-2.jpg",
  "/images/property-3.jpg",
];

type ListingRoom = {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  totalUnits: number;
  maxGuests: number;
};

type ListingDetail = {
  id: string;
  name: string;
  description: string;
  address?: string | null;
  categoryName?: string | null;
  cityName?: string | null;
  province?: string | null;
  coverUrl?: string | null;
  galleryUrls: string[];
  rooms: ListingRoom[];
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

const formatIDRPlain = (value: string | number) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value: string) => {
  if (!value) return "DD-MM-YYYY";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "DD-MM-YYYY";
  return `${day}-${month}-${year}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

const weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

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

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string | undefined;
  const [data, setData] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestOpen, setGuestOpen] = useState(false);
  const [guests, setGuests] = useState({ adults: 2, children: 1 });
  const calendarStart = useMemo(() => formatDate(new Date()), []);
  const calendarEnd = useMemo(() => formatDate(addDays(new Date(), 30)), []);

  useEffect(() => {
    if (!listingId) return;
    const controller = new AbortController();

    const loadDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${API_BASE_URL}/properties/public/${listingId}`,
          { signal: controller.signal },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || "Gagal memuat detail properti.");
        }
        setData(payload as ListingDetail);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Gagal memuat detail properti.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
    return () => controller.abort();
  }, [listingId]);

  useEffect(() => {
    if (!data?.rooms?.length) return;
    if (!selectedRoomId) {
      setSelectedRoomId(data.rooms[0].id);
    }
  }, [data, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) return;
    const controller = new AbortController();

    const loadAvailability = async () => {
      try {
        setAvailabilityLoading(true);
        setAvailabilityError(null);
        const params = new URLSearchParams({
          startDate: calendarStart,
          endDate: calendarEnd,
        });
        const response = await fetch(
          `${API_BASE_URL}/availability/public/room-types/${selectedRoomId}?${params.toString()}`,
          { signal: controller.signal },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || "Gagal memuat kalender.");
        }
        setAvailability(payload as AvailabilityResponse);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setAvailability(null);
        setAvailabilityError(
          err instanceof Error ? err.message : "Gagal memuat kalender.",
        );
      } finally {
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();
    setCheckIn("");
    setCheckOut("");
    return () => controller.abort();
  }, [selectedRoomId, calendarStart, calendarEnd]);

  const gallery = useMemo(() => {
    if (!data) return fallbackGallery;
    const images = [data.coverUrl, ...data.galleryUrls].filter(
      (item): item is string => Boolean(item),
    );
    if (images.length > 0) return images;
    return fallbackGallery;
  }, [data]);

  const locationText = useMemo(() => {
    if (!data) return "";
    const parts = [data.address, data.cityName, data.province].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Lokasi belum tersedia";
  }, [data]);

  const selectedRoom = useMemo(() => {
    return data?.rooms.find((room) => room.id === selectedRoomId) ?? null;
  }, [data, selectedRoomId]);

  const totalGuests = guests.adults + guests.children;

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityItem>();
    availability?.items.forEach((item) => map.set(item.date, item));
    return map;
  }, [availability]);

  const isRangeAvailable = (start: string, end: string) => {
    if (!start || !end) return false;
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return false;
    }
    if (endDate <= startDate) return false;
    const cursor = new Date(startDate.getTime());
    while (cursor < endDate) {
      const key = formatDate(cursor);
      const item = availabilityMap.get(key);
      if (!item || item.isClosed || item.availableUnits <= 0) {
        return false;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return true;
  };

  const rangeAvailable = checkIn && checkOut ? isRangeAvailable(checkIn, checkOut) : false;

  const guestExceedsCapacity =
    selectedRoom && totalGuests > 0 ? totalGuests > selectedRoom.maxGuests : false;

  const canBook =
    Boolean(selectedRoomId) &&
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    totalGuests > 0 &&
    !guestExceedsCapacity &&
    rangeAvailable;

  const bookingHelperText = useMemo(() => {
    if (!selectedRoomId) return "Pilih kamar terlebih dahulu.";
    if (!checkIn || !checkOut)
      return "Pilih tanggal check-in dan check-out untuk melanjutkan pemesanan.";
    if (guestExceedsCapacity && selectedRoom)
      return `Jumlah tamu melebihi kapasitas kamar (${selectedRoom.maxGuests} tamu).`;
    if (!rangeAvailable)
      return "Rentang tanggal yang dipilih tidak tersedia penuh. Pilih tanggal lain.";
    return "Data pemesanan sudah valid. Klik tombol untuk melanjutkan ke konfirmasi.";
  }, [checkIn, checkOut, guestExceedsCapacity, rangeAvailable, selectedRoom, selectedRoomId]);

  const handleDateClick = (item: AvailabilityItem) => {
    if (item.isClosed || item.availableUnits <= 0) return;
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(item.date);
      setCheckOut("");
      setAvailabilityError(null);
      return;
    }
    if (item.date <= checkIn) {
      setCheckIn(item.date);
      setCheckOut("");
      setAvailabilityError(null);
      return;
    }
    if (!isRangeAvailable(checkIn, item.date)) {
      setAvailabilityError("Tanggal tersebut tidak tersedia penuh.");
      return;
    }
    setCheckOut(item.date);
    setAvailabilityError(null);
  };

  const handleBooking = async () => {
    if (!data || !selectedRoomId) return;
    if (!canBook) return;

    const params = new URLSearchParams({
      propertyId: data.id,
      roomTypeId: selectedRoomId,
      propertyName: data.name,
      roomName: selectedRoom?.name ?? "",
      checkIn,
      checkOut,
      adults: String(guests.adults),
      children: String(guests.children),
    });
    router.push(`/booking/confirmation?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-teal-950 px-6 py-14 text-white">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {data?.name ?? "Memuat properti..."}
          </h1>
          <p className="text-sm text-slate-200">
            {data?.categoryName ?? "Properti pilihan"} · {locationText}
          </p>
        </div>
        <div className="pointer-events-none absolute -right-24 top-6 h-44 w-44 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        {loading && (
          <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/70 p-6 text-sm text-slate-500 shadow-xl shadow-slate-200/70">
            Memuat detail properti...
          </div>
        )}
        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="grid gap-4">
                <div
                  className="h-72 rounded-3xl bg-cover bg-center shadow-lg shadow-slate-200"
                  style={{ backgroundImage: `url(${gallery[0]})` }}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {gallery.slice(1, 5).map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="h-40 rounded-2xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/70 p-6 shadow-2xl shadow-slate-200/70">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Pemesanan
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {selectedRoom
                      ? formatIDR(selectedRoom.basePrice)
                      : "Pilih kamar terlebih dahulu"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Harga dasar kamar per malam
                  </p>
                </div>

                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                  Pilih kamar
                  <select
                    value={selectedRoomId}
                    onChange={(event) => setSelectedRoomId(event.target.value)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
                  >
                    {data.rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} · {formatIDR(room.basePrice)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Pilih tanggal
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        Check In {formatDisplayDate(checkIn)} → Check Out{" "}
                        {formatDisplayDate(checkOut)}
                      </p>
                    </div>
                    {!showCalendar && (
                      <button
                        type="button"
                        onClick={() => setShowCalendar(true)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                      >
                        Pilih tanggal
                      </button>
                    )}
                  </div>

                  {showCalendar && (
                    <div className="mt-4 space-y-3">
                      {availabilityLoading && (
                        <p className="text-xs text-slate-500">
                          Memuat kalender...
                        </p>
                      )}
                      {availabilityError && (
                        <p className="text-xs text-rose-600">
                          {availabilityError}
                        </p>
                      )}
                      {availability && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full border border-slate-200 bg-white" />
                              Tersedia
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                              Dipilih
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                              Tidak tersedia
                            </span>
                          </div>
                          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                            {weekdayLabels.map((day) => (
                              <div key={day}>{day}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                            {Array.from({
                              length: new Date(`${calendarStart}T00:00:00`).getDay(),
                            }).map((_, index) => (
                              <div key={`empty-${index}`} />
                            ))}
                            {availability.items.map((item) => {
                              const isDisabled =
                                item.isClosed || item.availableUnits <= 0;
                              const inRange =
                                checkIn &&
                                item.date >= checkIn &&
                                (!checkOut || item.date <= checkOut);
                              const isStart = checkIn === item.date;
                              const isEnd = checkOut === item.date;

                              return (
                                <button
                                  key={item.date}
                                  type="button"
                                  onClick={() => handleDateClick(item)}
                                  disabled={isDisabled}
                                  className={`flex h-14 flex-col items-center justify-center rounded-2xl border text-xs font-semibold transition ${
                                    isDisabled
                                      ? "border-slate-200 bg-slate-100 text-slate-400"
                                      : isStart || isEnd
                                        ? "border-teal-600 bg-teal-600 text-white"
                                        : inRange
                                          ? "border-teal-200 bg-teal-50 text-teal-700"
                                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50"
                                  }`}
                                >
                                  <span className="text-sm font-semibold">
                                    {item.date.split("-")[2]}
                                  </span>
                                  <span
                                    className={`text-[9px] font-medium ${
                                      isDisabled
                                        ? "text-slate-400"
                                        : isStart || isEnd
                                          ? "text-white/80"
                                          : inRange
                                            ? "text-teal-700"
                                            : "text-slate-500"
                                    }`}
                                  >
                                    {isDisabled ? "Penuh" : formatIDRPlain(item.finalPrice)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Harga dalam Rupiah (IDR).
                          </p>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowCalendar(false)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                        >
                          Tutup kalender
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setGuestOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    <span>Jumlah tamu</span>
                    <span>{totalGuests} tamu</span>
                  </button>
                  {guestOpen && (
                    <div className="absolute left-0 top-full z-10 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                      {(["adults", "children"] as const).map((key) => (
                        <div
                          key={key}
                          className="flex items-center justify-between py-2 text-sm text-slate-600"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {key === "adults" ? "Dewasa" : "Anak-anak"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {key === "adults" ? "Usia 13+" : "Usia 0-12"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setGuests((prev) => ({
                                  ...prev,
                                  [key]: Math.max(0, prev[key] - 1),
                                }))
                              }
                              className="h-8 w-8 rounded-full border border-slate-200 text-sm font-semibold text-slate-600"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-slate-900">
                              {guests[key]}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setGuests((prev) => ({
                                  ...prev,
                                  [key]: prev[key] + 1,
                                }))
                              }
                              className="h-8 w-8 rounded-full border border-slate-200 text-sm font-semibold text-slate-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {guestExceedsCapacity && selectedRoom && (
                  <p className="text-xs text-rose-600">
                    Kapasitas maksimal {selectedRoom.maxGuests} tamu.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleBooking}
                  disabled={!canBook}
                  className={`w-full rounded-full border px-6 py-3 text-sm font-semibold shadow-sm transition ${
                    canBook
                      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                      : "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500"
                  }`}
                >
                  {canBook ? "Pesan sekarang" : "Lengkapi data pemesanan"}
                </button>
                <p
                  className={`text-xs ${
                    canBook ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {bookingHelperText}
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/70 p-6 shadow-xl shadow-slate-200/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Fasilitas utama
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {[
                      "Wi-Fi cepat",
                      "Kolam renang",
                      "Parkir luas",
                      "Dapur lengkap",
                      "Breakfast opsional",
                      "Smart TV",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-600"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/70 p-6 shadow-xl shadow-slate-200/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Pilihan room
                  </p>
                  <div className="mt-4 grid gap-4">
                    {data.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/80 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {room.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {room.description}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Kapasitas {room.maxGuests} tamu · {room.totalUnits} unit
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Harga dasar</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {formatIDR(room.basePrice)}
                          </p>
                          <button className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
                            Pilih room
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/70 p-5 shadow-xl shadow-slate-200/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Informasi lokasi
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    {locationText}
                  </p>
                  <div className="mt-4 h-44 rounded-2xl bg-linear-to-br from-slate-100 via-white to-slate-200" />
                </div>
                <div className="rounded-3xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50 to-slate-100/70 p-5 shadow-xl shadow-slate-200/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Highlight
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>Gratis pembatalan hingga 48 jam sebelum check-in.</li>
                    <li>Lokasi premium dekat pusat kota.</li>
                    <li>Harga dasar room transparan.</li>
                  </ul>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
