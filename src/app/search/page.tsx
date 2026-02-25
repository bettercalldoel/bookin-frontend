"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { formatCompactLocation } from "@/lib/location-format";
import {
  ALL_AMENITY_KEYS,
  QUICK_FILTER_AMENITY_KEYS,
  getAmenityLabelByLocale,
  isAmenityKey,
  type AmenityKey,
} from "@/lib/amenities";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import type { AppLocale } from "@/lib/app-locale";

const formatIDR = (value: number, locale: AppLocale) =>
  new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
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

const parseAmenitiesMode = (value: string | null): "all" | "any" =>
  value === "all" ? "all" : "any";

const parseAmenityKeysFromParam = (value: string | null): AmenityKey[] => {
  if (!value?.trim()) return [];

  const uniqueValues = Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  return uniqueValues.filter((item): item is AmenityKey => isAmenityKey(item));
};

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
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  province?: string | null;
  categoryName?: string | null;
  amenityKeys?: string[];
  coverUrl?: string | null;
  minPrice?: string | null;
  breakfast?: {
    enabled?: boolean;
    pricePerPax?: string | null;
    currency?: string | null;
  };
};

type PublicCategory = {
  name: string;
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
  amenityKeys: AmenityKey[];
  breakfastEnabled: boolean;
  breakfastPricePerPax: number;
};

type SearchFormState = {
  destination: string;
  propertyName: string;
  category: string;
  amenities: AmenityKey[];
  amenitiesMode: "all" | "any";
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
    destination: params.get("loc_term") ?? "",
    propertyName: params.get("property_name") ?? "",
    category: params.get("category") ?? "",
    amenities: parseAmenityKeysFromParam(params.get("amenities")),
    amenitiesMode: parseAmenitiesMode(params.get("amenities_mode")),
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

const SEARCH_COPY = {
  id: {
    allDestinations: "Semua destinasi",
    headerChoicePrefix: "Pilihan di",
    headerDefaultTitle: "Pilih properti yang cocok",
    flexibleDates: "Tanggal fleksibel",
    flexibleGuests: "Tamu fleksibel",
    backToHome: "Kembali ke Home",
    searchResults: "Hasil pencarian",
    filter: "Filter",
    adjustSearch: "Atur pencarian",
    location: "Lokasi",
    destination: "Destinasi",
    destinationPlaceholder: "Ketik kota tujuan",
    propertyName: "Nama properti",
    optional: "Opsional",
    category: "Kategori",
    allCategories: "Semua kategori",
    amenities: "Fasilitas",
    amenitiesHint: "Pilih fasilitas yang dibutuhkan.",
    filterMode: "Mode filter",
    filterAny: "Salah satu",
    filterAll: "Semua terpilih",
    hide: "Sembunyikan",
    otherAmenities: "Fasilitas lain",
    stay: "Menginap",
    travelDate: "Tanggal berangkat",
    stayDuration: "Durasi menginap",
    decreaseStayAria: "Kurangi durasi menginap",
    increaseStayAria: "Tambah durasi menginap",
    adults: "Dewasa",
    children: "Anak",
    totalRooms: "Jumlah kamar",
    decreaseAdultsAria: "Kurangi jumlah dewasa",
    increaseAdultsAria: "Tambah jumlah dewasa",
    decreaseChildrenAria: "Kurangi jumlah anak",
    increaseChildrenAria: "Tambah jumlah anak",
    decreaseRoomsAria: "Kurangi jumlah kamar",
    increaseRoomsAria: "Tambah jumlah kamar",
    applySearch: "Terapkan pencarian",
    loadingResults: "Memuat hasil pencarian...",
    showingPrefix: "Menampilkan",
    showingSuffix: "properti",
    locationConnector: "di",
    loadingListings: "Memuat...",
    listingChoicesSuffix: "pilihan untuk Anda",
    sortBy: "Urutkan",
    sortName: "Nama",
    sortPrice: "Harga",
    sortAsc: "Ascending",
    sortDesc: "Descending",
    rating: "Rating",
    breakfastAvailable: "Sarapan tersedia",
    noBreakfast: "Tanpa opsi sarapan",
    priceUnavailable: "Harga belum tersedia",
    perNight: "/ malam",
    totalLabel: "Total",
    notIncludeFees: "Belum termasuk biaya layanan aplikasi 2% dan pajak 11%.",
    viewDetails: "Lihat detail",
    noResults: "Belum ada properti yang sesuai dengan pencarianmu.",
    previous: "Sebelumnya",
    next: "Selanjutnya",
    guestSingular: "tamu",
    guestPlural: "tamu",
    nightSingular: "malam",
    nightPlural: "malam",
    roomSingular: "kamar",
    roomPlural: "kamar",
    peopleUnit: "orang",
    amenityPrefix: "Fasilitas",
    propertyTagFallback: "Properti",
    highlightAddress: "Akses mudah dan lokasi strategis",
    highlightDefault: "Properti terverifikasi",
    failedLoadResults: "Gagal memuat hasil pencarian.",
  },
  en: {
    allDestinations: "All destinations",
    headerChoicePrefix: "Options in",
    headerDefaultTitle: "Choose the right property",
    flexibleDates: "Flexible dates",
    flexibleGuests: "Flexible guests",
    backToHome: "Back to Home",
    searchResults: "Search results",
    filter: "Filter",
    adjustSearch: "Adjust search",
    location: "Location",
    destination: "Destination",
    destinationPlaceholder: "Type destination city",
    propertyName: "Property name",
    optional: "Optional",
    category: "Category",
    allCategories: "All categories",
    amenities: "Amenities",
    amenitiesHint: "Choose the amenities you need.",
    filterMode: "Filter mode",
    filterAny: "Any selected",
    filterAll: "All selected",
    hide: "Hide",
    otherAmenities: "More amenities",
    stay: "Stay",
    travelDate: "Departure date",
    stayDuration: "Stay duration",
    decreaseStayAria: "Decrease stay duration",
    increaseStayAria: "Increase stay duration",
    adults: "Adults",
    children: "Children",
    totalRooms: "Rooms",
    decreaseAdultsAria: "Decrease adults",
    increaseAdultsAria: "Increase adults",
    decreaseChildrenAria: "Decrease children",
    increaseChildrenAria: "Increase children",
    decreaseRoomsAria: "Decrease rooms",
    increaseRoomsAria: "Increase rooms",
    applySearch: "Apply search",
    loadingResults: "Loading search results...",
    showingPrefix: "Showing",
    showingSuffix: "properties",
    locationConnector: "in",
    loadingListings: "Loading...",
    listingChoicesSuffix: "options for you",
    sortBy: "Sort by",
    sortName: "Name",
    sortPrice: "Price",
    sortAsc: "Ascending",
    sortDesc: "Descending",
    rating: "Rating",
    breakfastAvailable: "Breakfast available",
    noBreakfast: "No breakfast option",
    priceUnavailable: "Price not available",
    perNight: "/ night",
    totalLabel: "Total",
    notIncludeFees: "Excludes 2% app service fee and 11% tax.",
    viewDetails: "View details",
    noResults: "No properties match your search yet.",
    previous: "Previous",
    next: "Next",
    guestSingular: "guest",
    guestPlural: "guests",
    nightSingular: "night",
    nightPlural: "nights",
    roomSingular: "room",
    roomPlural: "rooms",
    peopleUnit: "people",
    amenityPrefix: "Amenities",
    propertyTagFallback: "Property",
    highlightAddress: "Easy access and strategic location",
    highlightDefault: "Verified property",
    failedLoadResults: "Failed to load search results.",
  },
} as const;

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
  const locale = useAppLocaleValue();
  const copy = SEARCH_COPY[locale];
  const formatCurrency = useMemo(
    () => (value: number) => formatIDR(value, locale),
    [locale],
  );

  const getNightLabel = (value: number) =>
    value === 1 ? copy.nightSingular : copy.nightPlural;
  const getGuestLabel = (value: number) =>
    value === 1 ? copy.guestSingular : copy.guestPlural;
  const getRoomLabel = (value: number) =>
    value === 1 ? copy.roomSingular : copy.roomPlural;

  const [form, setForm] = useState<SearchFormState>(() =>
    buildFormFromParams(searchParams),
  );

  const [results, setResults] = useState<DisplayResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [showAllAmenitiesFilter, setShowAllAmenitiesFilter] = useState(false);
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
    return formatCompactLocation({
      address: item.address,
      city: item.city,
      province: item.province,
    });
  };

  const mapToDisplay = (items: SearchResponseItem[]) => {
    return items.map((item, index) => {
      const parsedPrice = item.minPrice ? Number(item.minPrice) : 0;
      const amenityKeys = Array.isArray(item.amenityKeys)
        ? item.amenityKeys.filter((key): key is AmenityKey => isAmenityKey(key))
        : [];

      return {
        id: item.id,
        name: item.name,
        location: buildLocation(item),
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        rating: "4.8",
        tag: item.categoryName?.trim() || copy.propertyTagFallback,
        highlight:
          amenityKeys.length > 0
            ? `${copy.amenityPrefix}: ${amenityKeys
                .slice(0, 2)
                .map((key) => getAmenityLabelByLocale(key, locale))
                .join(", ")}`
            : item.address
              ? copy.highlightAddress
              : copy.highlightDefault,
        image: item.coverUrl || fallbackImages[index % fallbackImages.length],
        amenityKeys,
        breakfastEnabled: Boolean(item.breakfast?.enabled),
        breakfastPricePerPax: Number(item.breakfast?.pricePerPax ?? 0) || 0,
      } satisfies DisplayResult;
    });
  };

  const totalGuests = form.adults + form.children;
  const nights = Math.max(1, form.nights);
  const checkOutDate = addDays(form.startDate, nights);
  const destinationLabel = form.destination.trim() || copy.allDestinations;
  const headerTitle =
    destinationLabel !== copy.allDestinations
      ? `${copy.headerChoicePrefix} ${destinationLabel}`
      : copy.headerDefaultTitle;
  const stayDateSummary = form.startDate
    ? `${formatDateDDMMYYYY(form.startDate)}${
        checkOutDate ? ` - ${formatDateDDMMYYYY(checkOutDate)}` : ""
      }`
    : copy.flexibleDates;
  const guestSummary =
    totalGuests > 0
      ? `${totalGuests} ${getGuestLabel(totalGuests)}`
      : copy.flexibleGuests;

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
        throw new Error(payload.message || copy.failedLoadResults);
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
        err instanceof Error ? err.message : copy.failedLoadResults,
      );
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [paramsSnapshot, locale]);

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

  const pushSearch = (nextForm: SearchFormState) => {
    const params = new URLSearchParams();
    if (nextForm.destination.trim()) {
      params.set("loc_term", nextForm.destination.trim());
    }
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
    if (nextForm.amenities.length > 0) {
      params.set("amenities", nextForm.amenities.join(","));
      params.set("amenities_mode", nextForm.amenitiesMode);
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

  const handleToggleAmenity = (key: AmenityKey) => {
    setForm((prev) => {
      const selected = prev.amenities.includes(key)
        ? prev.amenities.filter((item) => item !== key)
        : [...prev.amenities, key];

      const nextAmenities = ALL_AMENITY_KEYS.filter((item) =>
        selected.includes(item),
      );

      return {
        ...prev,
        amenities: nextAmenities,
        page: 1,
      };
    });
  };

  const updateNights = (delta: number) => {
    setForm((prev) => ({
      ...prev,
      nights: Math.max(1, Math.min(30, prev.nights + delta)),
      page: 1,
    }));
  };

  const updateAdults = (delta: number) => {
    setForm((prev) => ({
      ...prev,
      adults: Math.max(0, Math.min(10, prev.adults + delta)),
      page: 1,
    }));
  };

  const updateChildren = (delta: number) => {
    setForm((prev) => ({
      ...prev,
      children: Math.max(0, Math.min(10, prev.children + delta)),
      page: 1,
    }));
  };

  const updateRooms = (delta: number) => {
    setForm((prev) => ({
      ...prev,
      rooms: Math.max(1, Math.min(8, prev.rooms + delta)),
      page: 1,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-teal-950 px-6 py-12 text-white">
        <div className="mx-auto w-full max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/15"
          >
            <span aria-hidden="true">{"<"}</span>
            {copy.backToHome}
          </Link>
          <div className="mt-4 rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">
              {copy.searchResults}
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {headerTitle}
            </h1>
            <p className="mt-2 text-sm text-slate-200">
              {stayDateSummary}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95">
                {destinationLabel}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95">
                {nights} {getNightLabel(nights)}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95">
                {guestSummary}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95">
                {Math.max(form.rooms, 1)} {getRoomLabel(Math.max(form.rooms, 1))}
              </span>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 top-10 h-52 w-52 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-12 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" />
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[340px_1fr]">
        <aside className="h-fit space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 lg:sticky lg:top-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {copy.filter}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {copy.adjustSearch}
            </h2>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.location}
            </p>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            {copy.destination}
            <input
              type="text"
              value={form.destination}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  destination: event.target.value,
                  page: 1,
                }))
              }
              placeholder={copy.destinationPlaceholder}
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            {copy.propertyName}
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
              placeholder={copy.optional}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            {copy.category}
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
              <option value="">{copy.allCategories}</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {copy.amenities}
              </p>
              <p className="text-xs text-slate-500">{copy.amenitiesHint}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_FILTER_AMENITY_KEYS.map((key) => {
                const selected = form.amenities.includes(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggleAmenity(key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "border-teal-300 bg-teal-100 text-teal-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {getAmenityLabelByLocale(key, locale)}
                  </button>
                );
              })}
            </div>

            <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              {copy.filterMode}
              <select
                value={form.amenitiesMode}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    amenitiesMode: event.target.value as "all" | "any",
                    page: 1,
                  }))
                }
                className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold tracking-normal text-slate-700 focus:border-teal-500 focus:outline-none"
              >
                <option value="any">{copy.filterAny}</option>
                <option value="all">{copy.filterAll}</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => setShowAllAmenitiesFilter((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {showAllAmenitiesFilter ? copy.hide : copy.otherAmenities}
            </button>

            {showAllAmenitiesFilter ? (
              <div className="flex flex-wrap gap-2">
                {ALL_AMENITY_KEYS.filter(
                  (key) => !QUICK_FILTER_AMENITY_KEYS.includes(key),
                ).map((key) => {
                  const selected = form.amenities.includes(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleToggleAmenity(key)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selected
                          ? "border-sky-300 bg-sky-100 text-sky-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {getAmenityLabelByLocale(key, locale)}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.stay}
            </p>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            {copy.travelDate}
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

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{copy.stayDuration}</p>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2.5">
              <p className="text-sm font-semibold text-slate-700">
                {nights} {getNightLabel(nights)}
              </p>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateNights(-1)}
                  disabled={nights <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label={copy.decreaseStayAria}
                >
                  -
                </button>
                <span className="min-w-6 text-center text-sm font-semibold text-slate-900">
                  {nights}
                </span>
                <button
                  type="button"
                  onClick={() => updateNights(1)}
                  disabled={nights >= 30}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label={copy.increaseStayAria}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{copy.adults}</p>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2.5">
              <p className="text-sm font-semibold text-slate-700">
                {form.adults} {copy.peopleUnit}
              </p>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateAdults(-1)}
                  disabled={form.adults <= 0}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label={copy.decreaseAdultsAria}
                >
                  -
                </button>
                <span className="min-w-6 text-center text-sm font-semibold text-slate-900">
                  {form.adults}
                </span>
                <button
                  type="button"
                  onClick={() => updateAdults(1)}
                  disabled={form.adults >= 10}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label={copy.increaseAdultsAria}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{copy.children}</p>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2.5">
              <p className="text-sm font-semibold text-slate-700">
                {form.children} {copy.peopleUnit}
              </p>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateChildren(-1)}
                  disabled={form.children <= 0}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label={copy.decreaseChildrenAria}
                >
                  -
                </button>
                <span className="min-w-6 text-center text-sm font-semibold text-slate-900">
                  {form.children}
                </span>
                <button
                  type="button"
                  onClick={() => updateChildren(1)}
                  disabled={form.children >= 10}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label={copy.increaseChildrenAria}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{copy.totalRooms}</p>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2.5">
              <p className="text-sm font-semibold text-slate-700">
                {Math.max(form.rooms, 1)} {getRoomLabel(Math.max(form.rooms, 1))}
              </p>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateRooms(-1)}
                  disabled={form.rooms <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label={copy.decreaseRoomsAria}
                >
                  -
                </button>
                <span className="min-w-6 text-center text-sm font-semibold text-slate-900">
                  {Math.max(form.rooms, 1)}
                </span>
                <button
                  type="button"
                  onClick={() => updateRooms(1)}
                  disabled={form.rooms >= 8}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label={copy.increaseRoomsAria}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          </div>

          <button
            type="button"
            onClick={handleApplySearch}
            className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {copy.applySearch}
          </button>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            {resultsLoading
              ? copy.loadingResults
              : `${copy.showingPrefix} ${resultsMeta.total} ${copy.showingSuffix}${
                  destinationLabel !== copy.allDestinations
                    ? ` ${copy.locationConnector} ${destinationLabel}.`
                    : "."
                }`}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-lg shadow-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {copy.searchResults}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {resultsLoading
                  ? copy.loadingListings
                  : `${resultsMeta.total} ${copy.listingChoicesSuffix}`}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {copy.sortBy}
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
                <option value="name">{copy.sortName}</option>
                <option value="price">{copy.sortPrice}</option>
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
                <option value="asc">{copy.sortAsc}</option>
                <option value="desc">{copy.sortDesc}</option>
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
                    <span>
                      {copy.rating} {item.rating}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">
                      {item.name}
                    </h4>
                    <p className="text-sm text-slate-500">{item.location}</p>
                  </div>
                  <p className="text-sm text-slate-600">{item.highlight}</p>
                  {item.breakfastEnabled ? (
                    <p className="text-xs font-semibold text-teal-700">
                      {copy.breakfastAvailable} · +{formatCurrency(item.breakfastPricePerPax)}/pax
                      {copy.perNight}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">{copy.noBreakfast}</p>
                  )}
                  {item.amenityKeys.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.amenityKeys.slice(0, 4).map((key) => (
                        <span
                          key={`${item.id}-${key}`}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                        >
                          {getAmenityLabelByLocale(key, locale)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">
                        {item.price > 0
                          ? formatCurrency(item.price)
                          : copy.priceUnavailable}
                        <span className="text-xs font-normal text-slate-500">
                          {" "}
                          {copy.perNight}
                        </span>
                      </p>
                      {item.price > 0 && form.startDate && nights > 0 && (
                        <p className="text-xs text-slate-500">
                          {copy.totalLabel}{" "}
                          {formatCurrency(item.price * nights * Math.max(form.rooms, 1))} ·{" "}
                          {nights} {getNightLabel(nights)} × {Math.max(form.rooms, 1)}{" "}
                          {getRoomLabel(Math.max(form.rooms, 1))}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        {copy.notIncludeFees}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                      {copy.viewDetails}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {!resultsLoading && results.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                {copy.noResults}
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
                {copy.previous}
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
                {copy.next}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
