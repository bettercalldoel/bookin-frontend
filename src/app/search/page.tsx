"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { formatDateDDMMYYYY } from "@/lib/date-format";

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

const parseSortBy = (value: string | null): "name" | "price" =>
  value === "price" ? "price" : "name";

const parseSortOrder = (value: string | null): "asc" | "desc" =>
  value === "desc" ? "desc" : "asc";

const diffNights = (start: string, end: string) => {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff <= 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (value: string, days: number) => {
  if (!value) return "";
  const base = new Date(`${value}T00:00:00`);
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  return toDateValue(base);
};

type SearchParamsSource = {
  get: (key: string) => string | null;
};

type SearchResponseItem = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  categoryName?: string | null;
  coverUrl?: string | null;
  minPrice?: string | null;
};

type PublicCategory = {
  name: string;
};

type PublicCity = {
  id: string;
  name: string;
  province?: string | null;
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

type SearchFormState = {
  cityId: string;
  propertyName: string;
  category: string;
  sortBy: "name" | "price";
  sortOrder: "asc" | "desc";
  startDate: string;
  nights: number;
  adults: number;
  children: number;
  rooms: number;
  page: number;
};

const buildFormFromParams = (params: SearchParamsSource): SearchFormState => {
  const legacyNights = diffNights(
    params.get("start_date") ?? "",
    params.get("end_date") ?? "",
  );
  const nightsFromQuery = parseNumber(params.get("nights"), 0);
  const nights =
    nightsFromQuery >= 1
      ? Math.min(Math.floor(nightsFromQuery), 30)
      : legacyNights >= 1
        ? Math.min(legacyNights, 30)
        : 1;

  return {
    cityId: params.get("city_id") ?? "",
    propertyName: params.get("property_name") ?? "",
    category: params.get("category") ?? "",
    sortBy: parseSortBy(params.get("sort_by")),
    sortOrder: parseSortOrder(params.get("sort_order")),
    startDate: params.get("start_date") ?? "",
    nights,
    adults: Math.max(0, parseNumber(params.get("adults"), 0)),
    children: Math.max(0, parseNumber(params.get("children"), 0)),
    rooms: Math.max(1, parseNumber(params.get("rooms"), 1)),
    page: Math.max(1, parseNumber(params.get("page"), 1)),
  };
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

  const [form, setForm] = useState<SearchFormState>(() =>
    buildFormFromParams(searchParams),
  );

  const [results, setResults] = useState<DisplayResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [cities, setCities] = useState<PublicCity[]>([]);
  const [resultsMeta, setResultsMeta] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    setForm(buildFormFromParams(searchParams));
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
        tag: item.categoryName?.trim() || "Properti",
        highlight: item.address
          ? "Akses mudah dan lokasi strategis"
          : "Properti terverifikasi",
        image: item.coverUrl || fallbackImages[index % fallbackImages.length],
      } satisfies DisplayResult;
    });
  };

  const totalGuests = form.adults + form.children;
  const nights = Math.max(1, form.nights);
  const checkOutDate = addDays(form.startDate, nights);

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === form.cityId) ?? null,
    [cities, form.cityId],
  );
  const legacyLocTerm = (searchParams.get("loc_term") ?? "").trim();
  const destinationLabel =
    selectedCity?.name || legacyLocTerm || "Semua destinasi";

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
      setResultsMeta({
        page: payload.meta?.page ?? 1,
        limit: payload.meta?.limit ?? 8,
        total: payload.meta?.total ?? 0,
        totalPages: payload.meta?.totalPages ?? 1,
      });
    } catch (err) {
      setResults([]);
      setResultsMeta({
        page: 1,
        limit: 8,
        total: 0,
        totalPages: 1,
      });
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

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/properties/categories`);
      if (!res.ok) return;
      const payload = (await res.json()) as PublicCategory[];
      if (!Array.isArray(payload)) return;
      setCategories(
        payload
          .filter((item): item is PublicCategory => {
            return typeof item?.name === "string" && item.name.trim().length > 0;
          })
          .map((item) => ({ name: item.name.trim() })),
      );
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/properties/cities?limit=300`);
      if (!res.ok) return;
      const payload = (await res.json()) as PublicCity[];
      if (!Array.isArray(payload)) return;
      setCities(
        payload
          .filter((item): item is PublicCity => {
            return (
              typeof item?.id === "string" &&
              item.id.trim().length > 0 &&
              typeof item?.name === "string" &&
              item.name.trim().length > 0
            );
          })
          .map((item) => ({
            id: item.id,
            name: item.name.trim(),
            province: item.province?.trim() || null,
          })),
      );
    } catch {
      setCities([]);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const pushSearch = (nextForm: SearchFormState) => {
    const params = new URLSearchParams();
    if (nextForm.cityId) params.set("city_id", nextForm.cityId);
    if (nextForm.startDate) {
      params.set("start_date", nextForm.startDate);
      const computedEndDate = addDays(nextForm.startDate, Math.max(1, nextForm.nights));
      if (computedEndDate) {
        params.set("end_date", computedEndDate);
      }
    }
    params.set("nights", String(Math.max(1, Math.min(30, nextForm.nights))));
    params.set("adults", String(Math.max(0, nextForm.adults)));
    params.set("children", String(Math.max(0, nextForm.children)));
    params.set("rooms", String(Math.max(1, nextForm.rooms)));
    if (nextForm.propertyName.trim()) {
      params.set("property_name", nextForm.propertyName.trim());
    }
    if (nextForm.category.trim()) {
      params.set("category", nextForm.category.trim());
    }
    params.set("sort_by", nextForm.sortBy);
    params.set("sort_order", nextForm.sortOrder);
    params.set("page", String(Math.max(1, nextForm.page || 1)));
    router.push(`/search?${params.toString()}`);
  };

  const handleApplySearch = () => {
    const nextForm = { ...form, page: 1 };
    setForm(nextForm);
    pushSearch(nextForm);
  };

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > resultsMeta.totalPages) return;
    const nextForm = { ...form, page: nextPage };
    setForm(nextForm);
    pushSearch(nextForm);
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
              {destinationLabel} - {nights} malam - {" "}
              {totalGuests > 0 ? `${totalGuests} tamu` : "Tamu fleksibel"}
            </p>
          </div>
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Destinasi</p>
              <p className="mt-2 text-lg font-semibold">
                {destinationLabel}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Tanggal berangkat</p>
              <p className="mt-2 text-lg font-semibold">
                {form.startDate ? formatDateDDMMYYYY(form.startDate) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Check-out</p>
              <p className="mt-2 text-lg font-semibold">
                {checkOutDate ? formatDateDDMMYYYY(checkOutDate) : "-"}
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
            Kota destinasi
            <select
              value={form.cityId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  cityId: event.target.value,
                  page: 1,
                }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Semua kota</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.province ? `${city.name}, ${city.province}` : city.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Nama properti
            <input
              value={form.propertyName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  propertyName: event.target.value,
                  page: 1,
                }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
              placeholder="Cari nama properti"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Kategori
            <select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  category: event.target.value,
                  page: 1,
                }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Tanggal berangkat
            <input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  startDate: event.target.value,
                  page: 1,
                }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Durasi menginap
            <select
              value={String(nights)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  nights: Math.max(1, Number(event.target.value) || 1),
                  page: 1,
                }))
              }
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              {Array.from({ length: 30 }, (_, index) => index + 1).map((night) => (
                <option key={night} value={night}>
                  {night} malam
                </option>
              ))}
            </select>
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
                    adults: Math.max(0, Number(event.target.value) || 0),
                    page: 1,
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
                    children: Math.max(0, Number(event.target.value) || 0),
                    page: 1,
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
                  rooms: Math.max(1, Number(event.target.value) || 1),
                  page: 1,
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
              : `Menampilkan ${resultsMeta.total} properti${
                  destinationLabel !== "Semua destinasi"
                    ? ` di ${destinationLabel}.`
                    : "."
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
                  : `${resultsMeta.total} pilihan untuk kamu`}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Sort By
              </label>
              <select
                value={form.sortBy}
                onChange={(event) => {
                  const nextForm = {
                    ...form,
                    sortBy: event.target.value as "name" | "price",
                    page: 1,
                  };
                  setForm(nextForm);
                  pushSearch(nextForm);
                }}
                className="h-9 rounded-full border border-slate-200 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 focus:border-teal-500 focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
              <select
                value={form.sortOrder}
                onChange={(event) => {
                  const nextForm = {
                    ...form,
                    sortOrder: event.target.value as "asc" | "desc",
                    page: 1,
                  };
                  setForm(nextForm);
                  pushSearch(nextForm);
                }}
                className="h-9 rounded-full border border-slate-200 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 focus:border-teal-500 focus:outline-none"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
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
                      {item.price > 0 && form.startDate && nights > 0 && (
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

          {resultsMeta.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => handleChangePage(resultsMeta.page - 1)}
                disabled={resultsMeta.page <= 1 || resultsLoading}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: resultsMeta.totalPages }, (_, index) => index + 1)
                .slice(
                  Math.max(0, resultsMeta.page - 3),
                  Math.max(0, resultsMeta.page - 3) + 5,
                )
                .map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handleChangePage(pageNumber)}
                    disabled={resultsLoading}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      pageNumber === resultsMeta.page
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => handleChangePage(resultsMeta.page + 1)}
                disabled={
                  resultsMeta.page >= resultsMeta.totalPages || resultsLoading
                }
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
