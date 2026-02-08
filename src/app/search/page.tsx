"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

 

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type SearchResponseItem = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  coverUrl?: string | null;
  minPrice?: string | null;
};

type SearchResponse = {
  data: SearchResponseItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type DisplayResult = {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: string;
  tag: string;
  highlight: string;
  image: string;
};

const diffNights = (start: string, end: string) => {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff <= 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsSnapshot = searchParams.toString();

  const [form, setForm] = useState(() => ({
    lat: searchParams.get("lat") ?? "",
    lng: searchParams.get("lng") ?? "",
    country: searchParams.get("country") ?? "",
    locTerm: searchParams.get("loc_term") ?? "",
    startDate: searchParams.get("start_date") ?? "",
    endDate: searchParams.get("end_date") ?? "",
    adults: parseNumber(searchParams.get("adults"), 0),
    children: parseNumber(searchParams.get("children"), 0),
    rooms: parseNumber(searchParams.get("rooms"), 1),
    page: parseNumber(searchParams.get("page"), 1),
  }));

  const [results, setResults] = useState<DisplayResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      lat: searchParams.get("lat") ?? "",
      lng: searchParams.get("lng") ?? "",
      country: searchParams.get("country") ?? "",
      locTerm: searchParams.get("loc_term") ?? "",
      startDate: searchParams.get("start_date") ?? "",
      endDate: searchParams.get("end_date") ?? "",
      adults: parseNumber(searchParams.get("adults"), 0),
      children: parseNumber(searchParams.get("children"), 0),
      rooms: parseNumber(searchParams.get("rooms"), 1),
      page: parseNumber(searchParams.get("page"), 1),
    });
  }, [paramsSnapshot]);

  const fallbackImages = useMemo(
    () => ["/images/property-1.jpg", "/images/property-2.jpg", "/images/property-3.jpg"],
    [],
  );

  const buildLocation = (item: SearchResponseItem) => {
    const parts = [item.address, item.city, item.province].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Lokasi belum tersedia";
  };

  const mapToDisplay = (items: SearchResponseItem[]) => {
    return items.map((item, index) => {
      const parsedPrice = item.minPrice ? Number(item.minPrice) : 0;
      return {
        id: item.id,
        name: item.name,
        location: buildLocation(item),
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        rating: "4.8",
        tag: "Properti",
        highlight: item.address ? "Akses mudah dan lokasi strategis" : "Properti terverifikasi",
        image: item.coverUrl || fallbackImages[index % fallbackImages.length],
      } satisfies DisplayResult;
    });
  };

  const totalGuests = form.adults + form.children;
  const nights = diffNights(form.startDate, form.endDate);

  const fetchResults = async () => {
    try {
      setResultsLoading(true);
      setResultsError(null);
      const url = paramsSnapshot
        ? `${API_BASE_URL}/properties/search?${paramsSnapshot}`
        : `${API_BASE_URL}/properties/search`;
      const res = await fetch(url);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || "Gagal memuat hasil pencarian.");
      }
      const payload = (await res.json()) as SearchResponse;
      setResults(mapToDisplay(payload.data ?? []));
    } catch (err) {
      setResults([]);
      setResultsError(
        err instanceof Error ? err.message : "Gagal memuat hasil pencarian.",
      );
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [paramsSnapshot]);

  const handleApplySearch = () => {
    const params = new URLSearchParams();
    if (form.lat) params.set("lat", form.lat);
    if (form.lng) params.set("lng", form.lng);
    if (form.country) params.set("country", form.country);
    if (form.startDate) params.set("start_date", form.startDate);
    if (form.endDate) params.set("end_date", form.endDate);
    params.set("adults", String(form.adults));
    params.set("children", String(form.children));
    params.set("rooms", String(form.rooms));
    params.set("loc_term", form.locTerm);
    params.set("page", String(form.page || 1));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-teal-950 px-6 py-16 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-200">
              BookIn Search
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Temukan properti dengan harga terbaik untuk perjalanan Anda.
            </h1>
            <p className="text-sm text-slate-200">
              {form.locTerm ? form.locTerm : "Semua destinasi"} - {nights || 0} malam -
              {" "}
              {totalGuests > 0 ? `${totalGuests} tamu` : "Tamu fleksibel"}
            </p>
          </div>
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Check-in</p>
              <p className="mt-2 text-lg font-semibold">
                {form.startDate || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Check-out</p>
              <p className="mt-2 text-lg font-semibold">
                {form.endDate || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Durasi</p>
              <p className="mt-2 text-lg font-semibold">
                {nights || 0} malam
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Jumlah tamu</p>
              <p className="mt-2 text-lg font-semibold">
                {totalGuests || 0} orang
              </p>
              <p className="text-xs text-teal-100">
                {form.rooms} kamar
              </p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 top-10 h-52 w-52 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-12 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" />
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Filter Pencarian
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">
              Sesuaikan kebutuhanmu
            </h2>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Lokasi
            <input
              value={form.locTerm}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, locTerm: event.target.value }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
              placeholder="Cari kota atau destinasi"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Check-in
            <input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Check-out
            <input
              type="date"
              value={form.endDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, endDate: event.target.value }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Dewasa
              <input
                type="number"
                min={0}
                value={form.adults}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    adults: Number(event.target.value),
                  }))
                }
                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Anak
              <input
                type="number"
                min={0}
                value={form.children}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    children: Number(event.target.value),
                  }))
                }
                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Jumlah kamar
            <input
              type="number"
              min={1}
              value={form.rooms}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  rooms: Number(event.target.value),
                }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={handleApplySearch}
            className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Terapkan pencarian
          </button>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            {resultsLoading
              ? "Memuat hasil pencarian..."
              : `Menampilkan ${results.length} properti yang paling relevan${
                  form.locTerm ? ` di ${form.locTerm}.` : "."
                }`}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-lg shadow-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Hasil pencarian
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {resultsLoading
                  ? "Memuat..."
                  : `${results.length} pilihan untuk kamu`}
              </h3>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Sort: Recommended
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {results.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-100 transition hover:-translate-y-1"
              >
                <div
                  className="h-48 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
                <div className="space-y-4 px-5 py-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    <span>{item.tag}</span>
                    <span>Rating {item.rating}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">
                      {item.name}
                    </h4>
                    <p className="text-sm text-slate-500">{item.location}</p>
                  </div>
                  <p className="text-sm text-slate-600">{item.highlight}</p>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">
                        {item.price > 0 ? formatIDR(item.price) : "Harga belum tersedia"}
                        <span className="text-xs font-normal text-slate-500">
                          {" "}/ malam
                        </span>
                      </p>
                      {item.price > 0 && nights > 0 && (
                        <p className="text-xs text-slate-500">
                          Total {formatIDR(item.price * nights * Math.max(form.rooms, 1))} ·{" "}
                          {nights} malam × {Math.max(form.rooms, 1)} kamar
                        </p>
                      )}
                    </div>
                    <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                      Lihat detail
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {!resultsLoading && results.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                Belum ada properti yang sesuai dengan pencarianmu.
              </div>
            )}
          </div>
          {resultsError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {resultsError}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
