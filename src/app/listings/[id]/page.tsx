"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  type LucideIcon,
  Accessibility,
  Baby,
  Ban,
  Bath,
  BedDouble,
  Bell,
  Briefcase,
  Building,
  Car,
  Cigarette,
  Circle,
  Coffee,
  CookingPot,
  Dumbbell,
  Flame,
  PawPrint,
  Plane,
  Shield,
  Snowflake,
  Sparkles,
  Tv,
  Users,
  Waves,
  Wifi,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import {
  getAmenityLabelByLocale,
  normalizeAmenityKeys,
} from "@/lib/amenities";
import PropertyLocationMap from "@/components/property-location-map";
import { formatDetailedLocation } from "@/lib/location-format";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import type { AppLocale } from "@/lib/app-locale";

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
  latitude?: number | null;
  longitude?: number | null;
  categoryName?: string | null;
  cityName?: string | null;
  province?: string | null;
  amenityKeys?: string[];
  breakfast?: {
    enabled?: boolean;
    pricePerPax?: string;
    currency?: string;
  };
  coverUrl?: string | null;
  galleryUrls: string[];
  rooms: ListingRoom[];
};

const formatIDR = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatIDRPlain = (value: string | number, locale: AppLocale) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
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

const formatMonthYear = (value: string, locale: AppLocale) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return locale === "en" ? "Calendar" : "Kalender";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

const WEEKDAY_LABELS: Record<AppLocale, string[]> = {
  id: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const AMENITY_HINT_BY_KEY_ID: Partial<Record<string, string>> = {
  wifi: "Internet tersedia di area properti.",
  air_conditioning: "Kamar lebih nyaman untuk istirahat.",
  private_bathroom: "Privasi lebih baik selama menginap.",
  hot_water: "Air hangat tersedia untuk mandi.",
  television: "Hiburan di kamar setiap saat.",
  workspace: "Cocok untuk kerja singkat dari properti.",
  breakfast: "Pilihan sarapan tersedia sesuai kebijakan properti.",
  kitchen: "Bisa menyiapkan makanan ringan.",
  parking: "Area parkir tersedia untuk tamu.",
  elevator: "Akses lantai lebih mudah.",
  swimming_pool: "Fasilitas kolam untuk aktivitas santai.",
  gym: "Area olahraga tersedia untuk tamu.",
  laundry_service: "Layanan laundry sesuai ketentuan properti.",
  daily_housekeeping: "Kamar dibersihkan secara berkala.",
};

const AMENITY_HINT_BY_KEY_EN: Partial<Record<string, string>> = {
  wifi: "Internet is available throughout the property.",
  air_conditioning: "More comfortable room temperature for rest.",
  private_bathroom: "Better privacy during your stay.",
  hot_water: "Hot water is available.",
  television: "In-room entertainment at any time.",
  workspace: "Suitable for short work sessions.",
  breakfast: "Breakfast option follows property policy.",
  kitchen: "Prepare light meals easily.",
  parking: "Parking area is available for guests.",
  elevator: "Easier access to upper floors.",
  swimming_pool: "Pool facility for relaxing activities.",
  gym: "Workout area for guests.",
  laundry_service: "Laundry service based on property terms.",
  daily_housekeeping: "Room cleaning is done regularly.",
};

type AmenityCategoryKey =
  | "connectivity"
  | "comfort"
  | "wellness"
  | "service"
  | "general";

type AmenityCategoryConfig = {
  label: string;
  description: string;
  surface: string;
  countText: string;
  badge: string;
};

const AMENITY_CATEGORY_CONFIG_ID: Record<AmenityCategoryKey, AmenityCategoryConfig> = {
  connectivity: {
    label: "Konektivitas",
    description: "Internet dan perangkat kerja atau hiburan.",
    surface: "border-cyan-200 bg-cyan-50/70",
    countText: "text-cyan-700",
    badge: "bg-cyan-100 text-cyan-700",
  },
  comfort: {
    label: "Kenyamanan kamar",
    description: "Fasilitas utama untuk tidur dan istirahat.",
    surface: "border-emerald-200 bg-emerald-50/70",
    countText: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
  },
  wellness: {
    label: "Rekreasi",
    description: "Aktivitas santai, olahraga, dan fasilitas keluarga.",
    surface: "border-amber-200 bg-amber-50/70",
    countText: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
  service: {
    label: "Layanan properti",
    description: "Bantuan operasional dan layanan tambahan tenant.",
    surface: "border-indigo-200 bg-indigo-50/70",
    countText: "text-indigo-700",
    badge: "bg-indigo-100 text-indigo-700",
  },
  general: {
    label: "Fasilitas lainnya",
    description: "Fasilitas pelengkap yang tetap tersedia untuk tamu.",
    surface: "border-slate-200 bg-slate-100/70",
    countText: "text-slate-700",
    badge: "bg-slate-200 text-slate-700",
  },
};

const AMENITY_CATEGORY_CONFIG_EN: Record<AmenityCategoryKey, AmenityCategoryConfig> = {
  connectivity: {
    label: "Connectivity",
    description: "Internet, work, and entertainment essentials.",
    surface: "border-cyan-200 bg-cyan-50/70",
    countText: "text-cyan-700",
    badge: "bg-cyan-100 text-cyan-700",
  },
  comfort: {
    label: "Room comfort",
    description: "Core amenities for rest and sleep quality.",
    surface: "border-emerald-200 bg-emerald-50/70",
    countText: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
  },
  wellness: {
    label: "Recreation",
    description: "Leisure, sports, and family-friendly facilities.",
    surface: "border-amber-200 bg-amber-50/70",
    countText: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
  service: {
    label: "Property services",
    description: "Operational support and extra services.",
    surface: "border-indigo-200 bg-indigo-50/70",
    countText: "text-indigo-700",
    badge: "bg-indigo-100 text-indigo-700",
  },
  general: {
    label: "Other amenities",
    description: "Additional facilities available to guests.",
    surface: "border-slate-200 bg-slate-100/70",
    countText: "text-slate-700",
    badge: "bg-slate-200 text-slate-700",
  },
};

const AMENITY_CATEGORY_ORDER: AmenityCategoryKey[] = [
  "comfort",
  "connectivity",
  "wellness",
  "service",
  "general",
];

const AMENITY_CATEGORY_BY_KEY: Partial<Record<string, AmenityCategoryKey>> = {
  wifi: "connectivity",
  television: "connectivity",
  workspace: "connectivity",
  cctv: "connectivity",
  air_conditioning: "comfort",
  private_bathroom: "comfort",
  hot_water: "comfort",
  non_smoking_room: "comfort",
  extra_bed: "comfort",
  family_room: "comfort",
  kitchen: "comfort",
  refrigerator: "comfort",
  breakfast: "service",
  laundry_service: "service",
  daily_housekeeping: "service",
  front_desk_24h: "service",
  airport_shuttle: "service",
  parking: "service",
  elevator: "service",
  wheelchair_access: "service",
  smoke_detector: "service",
  fire_extinguisher: "service",
  smoking_area: "service",
  swimming_pool: "wellness",
  gym: "wellness",
  playground: "wellness",
  baby_cot: "wellness",
  pet_friendly: "wellness",
};

const AMENITY_ICON_BY_KEY: Partial<Record<string, LucideIcon>> = {
  wifi: Wifi,
  air_conditioning: Snowflake,
  private_bathroom: Bath,
  hot_water: Flame,
  television: Tv,
  workspace: Briefcase,
  breakfast: Coffee,
  kitchen: CookingPot,
  refrigerator: CookingPot,
  parking: Car,
  elevator: Building,
  wheelchair_access: Accessibility,
  front_desk_24h: Bell,
  cctv: Shield,
  smoke_detector: Shield,
  fire_extinguisher: Shield,
  swimming_pool: Waves,
  gym: Dumbbell,
  playground: Users,
  family_room: Users,
  extra_bed: BedDouble,
  baby_cot: Baby,
  pet_friendly: PawPrint,
  non_smoking_room: Ban,
  smoking_area: Cigarette,
  laundry_service: Sparkles,
  airport_shuttle: Plane,
  daily_housekeeping: Sparkles,
};

const getAmenityIcon = (key: string): LucideIcon => AMENITY_ICON_BY_KEY[key] ?? Circle;

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

type PropertyAmenity = {
  key: string;
  label: string;
  hint: string;
  category: AmenityCategoryKey;
};

const LISTING_COPY = {
  id: {
    failedLoadDetail: "Gagal memuat detail properti.",
    failedLoadCalendar: "Gagal memuat kalender.",
    failedLoadDate: "Tanggal tersebut tidak tersedia penuh.",
    roomSelectionRequired: "Pilih kamar terlebih dahulu.",
    dateSelectionRequired:
      "Pilih tanggal check-in dan check-out untuk melanjutkan pemesanan.",
    capacityExceededPrefix: "Jumlah tamu melebihi kapasitas kamar",
    rangeUnavailable:
      "Rentang tanggal yang dipilih tidak tersedia penuh. Pilih tanggal lain.",
    bookingReady:
      "Data pemesanan sudah valid. Klik tombol untuk melanjutkan ke konfirmasi.",
    bookingPriceFrom: "Harga mulai",
    chooseRoom: "Pilih kamar",
    chooseStayDate: "Pilih tanggal menginap",
    hideCalendar: "Sembunyikan kalender",
    showCalendar: "Buka kalender",
    checkIn: "Check-in",
    checkOut: "Check-out",
    nightsSelectedSuffix: "malam dipilih.",
    loadingCalendar: "Memuat kalender...",
    pricePerNightIDR: "Harga per malam (IDR)",
    available: "Tersedia",
    selected: "Dipilih",
    unavailable: "Tidak tersedia",
    full: "Penuh",
    guestsCount: "Jumlah tamu",
    guestUnit: "tamu",
    adults: "Dewasa",
    children: "Anak-anak",
    age13Plus: "Usia 13+",
    age0to12: "Usia 0-12",
    maxCapacityPrefix: "Kapasitas maksimal",
    breakfastOption: "Opsi sarapan",
    noBreakfastOption: "Properti ini tidak menyediakan opsi sarapan.",
    withoutBreakfast: "Tanpa sarapan",
    withBreakfast: "Dengan sarapan",
    perPaxPerNight: "per pax per malam",
    breakfastPax: "Pax sarapan",
    maxPaxPrefix: "Maksimal",
    bookNow: "Pesan sekarang",
    completeBookingData: "Lengkapi data pemesanan",
    loadingDetail: "Memuat detail properti...",
    featuredProperty: "Properti pilihan",
    indonesia: "Indonesia",
    photoOf: "Foto",
    from: "dari",
    previous: "Sebelumnya",
    next: "Selanjutnya",
    roomsAvailableSuffix: "tipe kamar tersedia.",
    noDescription: "Tenant belum menambahkan deskripsi properti.",
    propertyAmenities: "Fasilitas properti",
    amenitiesSuffix: "fasilitas",
    showAllAmenities: "Lihat semua fasilitas",
    noAmenities: "Tenant belum menambahkan fasilitas untuk properti ini.",
    roomOptions: "Pilihan room",
    capacity: "Kapasitas",
    unit: "unit",
    selectedLabel: "Dipilih",
    selectRoom: "Pilih room",
    propertyLocation: "Lokasi Properti",
    locationDesc:
      "Titik properti ditampilkan melalui peta interaktif untuk memudahkan orientasi area.",
    whatPlaceOffers: "Yang tersedia di properti ini",
    closeAmenitiesModalAria: "Tutup popup fasilitas",
    perNight: "per malam",
    finalPriceHint: "Harga final akan menyesuaikan tanggal dan opsi tamu.",
  },
  en: {
    failedLoadDetail: "Failed to load property detail.",
    failedLoadCalendar: "Failed to load calendar.",
    failedLoadDate: "The selected date range is not fully available.",
    roomSelectionRequired: "Please select a room first.",
    dateSelectionRequired:
      "Please select check-in and check-out dates to continue.",
    capacityExceededPrefix: "Guest count exceeds room capacity",
    rangeUnavailable:
      "The selected date range is not fully available. Please choose another date.",
    bookingReady: "Booking data is valid. Continue to confirmation.",
    bookingPriceFrom: "Starting from",
    chooseRoom: "Choose room",
    chooseStayDate: "Choose stay dates",
    hideCalendar: "Hide calendar",
    showCalendar: "Open calendar",
    checkIn: "Check-in",
    checkOut: "Check-out",
    nightsSelectedSuffix: "nights selected.",
    loadingCalendar: "Loading calendar...",
    pricePerNightIDR: "Price per night (IDR)",
    available: "Available",
    selected: "Selected",
    unavailable: "Unavailable",
    full: "Sold out",
    guestsCount: "Guest count",
    guestUnit: "guests",
    adults: "Adults",
    children: "Children",
    age13Plus: "Age 13+",
    age0to12: "Age 0-12",
    maxCapacityPrefix: "Maximum capacity",
    breakfastOption: "Breakfast option",
    noBreakfastOption: "This property does not provide breakfast.",
    withoutBreakfast: "Without breakfast",
    withBreakfast: "With breakfast",
    perPaxPerNight: "per pax per night",
    breakfastPax: "Breakfast pax",
    maxPaxPrefix: "Maximum",
    bookNow: "Book now",
    completeBookingData: "Complete booking details",
    loadingDetail: "Loading property detail...",
    featuredProperty: "Featured property",
    indonesia: "Indonesia",
    photoOf: "Photo",
    from: "of",
    previous: "Previous",
    next: "Next",
    roomsAvailableSuffix: "room types available.",
    noDescription: "Tenant has not added a property description yet.",
    propertyAmenities: "Property amenities",
    amenitiesSuffix: "amenities",
    showAllAmenities: "Show all amenities",
    noAmenities: "Tenant has not added amenities for this property yet.",
    roomOptions: "Room options",
    capacity: "Capacity",
    unit: "units",
    selectedLabel: "Selected",
    selectRoom: "Select room",
    propertyLocation: "Property location",
    locationDesc:
      "Property point is shown on an interactive map to help area orientation.",
    whatPlaceOffers: "What this place offers",
    closeAmenitiesModalAria: "Close amenities popup",
    perNight: "per night",
    finalPriceHint: "Final price may vary based on dates and guest options.",
  },
} as const;

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useAppLocaleValue();
  const copy = LISTING_COPY[locale];
  const amenityHints = locale === "en" ? AMENITY_HINT_BY_KEY_EN : AMENITY_HINT_BY_KEY_ID;
  const amenityCategoryConfig =
    locale === "en" ? AMENITY_CATEGORY_CONFIG_EN : AMENITY_CATEGORY_CONFIG_ID;
  const weekdayLabels = WEEKDAY_LABELS[locale];
  const listingId = params?.id as string | undefined;
  const [data, setData] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
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
  const [guests, setGuests] = useState({ adults: 2, children: 1 });
  const [breakfastSelected, setBreakfastSelected] = useState(false);
  const [breakfastPax, setBreakfastPax] = useState(1);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
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
          throw new Error(payload.message || copy.failedLoadDetail);
        }
        setData(payload as ListingDetail);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : copy.failedLoadDetail,
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
    return () => controller.abort();
  }, [copy.failedLoadDetail, listingId]);

  useEffect(() => {
    if (!data?.rooms?.length) return;
    if (!selectedRoomId) {
      setSelectedRoomId(data.rooms[0].id);
    }
  }, [data, selectedRoomId]);

  useEffect(() => {
    setActiveGalleryIndex(0);
  }, [listingId]);

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
          throw new Error(payload.message || copy.failedLoadCalendar);
        }
        setAvailability(payload as AvailabilityResponse);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setAvailability(null);
        setAvailabilityError(
          err instanceof Error ? err.message : copy.failedLoadCalendar,
        );
      } finally {
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();
    setCheckIn("");
    setCheckOut("");
    return () => controller.abort();
  }, [calendarEnd, calendarStart, copy.failedLoadCalendar, selectedRoomId]);

  const gallery = useMemo(() => {
    if (!data) return fallbackGallery;
    const images = [data.coverUrl, ...data.galleryUrls].filter(
      (item): item is string => Boolean(item),
    );
    if (images.length > 0) return images;
    return fallbackGallery;
  }, [data]);

  useEffect(() => {
    setActiveGalleryIndex((previous) => {
      if (!gallery.length) return 0;
      return Math.min(previous, gallery.length - 1);
    });
  }, [gallery.length]);

  const locationText = useMemo(() => {
    if (!data) return "";
    return formatDetailedLocation({
      address: data.address,
      city: data.cityName,
      province: data.province,
    });
  }, [data]);
  const locationSegments = useMemo(() => {
    const segments = locationText
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const ignored = new Set(["indonesia", "jawa", "java"]);

    return segments.filter((segment) => {
      const normalized = segment
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^(kota|kabupaten|provinsi)\s+/, "");
      const isPostalCode = /^\d{5}$/.test(normalized);
      const isRtRw = /^r[wt]\s*\d+/i.test(normalized);
      if (!normalized || ignored.has(normalized) || seen.has(normalized)) {
        return false;
      }
      if (isPostalCode || isRtRw) return false;
      seen.add(normalized);
      return true;
    });
  }, [locationText]);

  const locationSummary = useMemo(() => {
    if (locationSegments.length > 0) {
      return locationSegments.slice(0, 3).join(", ");
    }
    return locationText;
  }, [locationSegments, locationText]);

  const locationQuery = useMemo(() => {
    if (!data) return null;
    const combined = locationSegments.join(", ");
    if (combined.trim()) return combined;
    const fallback = locationText.trim();
    return fallback ? fallback : null;
  }, [data, locationSegments, locationText]);

  const selectedRoom = useMemo(() => {
    return data?.rooms.find((room) => room.id === selectedRoomId) ?? null;
  }, [data, selectedRoomId]);
  const propertyAmenities = useMemo<PropertyAmenity[]>(() => {
    if (!data?.amenityKeys) return [];
    return normalizeAmenityKeys(data.amenityKeys).map((key) => ({
      key,
      label: getAmenityLabelByLocale(key, locale),
      hint:
        amenityHints[key] ??
        (locale === "en"
          ? "Amenity is available during your stay."
          : "Fasilitas tersedia selama menginap."),
      category: AMENITY_CATEGORY_BY_KEY[key] ?? "general",
    }));
  }, [amenityHints, data?.amenityKeys, locale]);
  const amenitySections = useMemo(() => {
    return AMENITY_CATEGORY_ORDER.map((categoryKey) => {
      const items = propertyAmenities.filter(
        (item) => item.category === categoryKey,
      );
      if (items.length === 0) return null;
      return {
        key: categoryKey,
        ...amenityCategoryConfig[categoryKey],
        items,
      };
    }).filter(
      (section): section is {
        key: AmenityCategoryKey;
        label: string;
        description: string;
        surface: string;
        countText: string;
        badge: string;
        items: PropertyAmenity[];
      } => Boolean(section),
    );
  }, [amenityCategoryConfig, propertyAmenities]);
  const activeGalleryImage = useMemo(() => {
    if (!gallery.length) return null;
    const normalizedIndex = Math.min(
      Math.max(activeGalleryIndex, 0),
      gallery.length - 1,
    );
    return gallery[normalizedIndex] ?? gallery[0];
  }, [activeGalleryIndex, gallery]);
  const sideGalleryImages = useMemo(
    () =>
      gallery
        .map((image, index) => ({ image, index }))
        .filter((item) => item.index !== activeGalleryIndex)
        .slice(0, 4),
    [gallery, activeGalleryIndex],
  );
  const galleryImageCount = gallery.length;
  const activeGalleryDisplayIndex =
    galleryImageCount > 0 ? Math.min(activeGalleryIndex + 1, galleryImageCount) : 0;
  const locationHeadline = useMemo(() => {
    const parts = [data?.cityName, data?.province]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));
    return parts.join(", ");
  }, [data?.cityName, data?.province]);
  const totalGuests = guests.adults + guests.children;
  const breakfastEnabled = Boolean(data?.breakfast?.enabled);
  const breakfastPricePerPax =
    Number(data?.breakfast?.pricePerPax ?? 0) > 0
      ? Number(data?.breakfast?.pricePerPax ?? 0)
      : 0;

  useEffect(() => {
    if (!breakfastEnabled) {
      setBreakfastSelected(false);
      return;
    }

    setBreakfastPax((prev) => {
      const normalizedGuests = Math.max(1, totalGuests);
      if (!Number.isFinite(prev) || prev < 1) return normalizedGuests;
      return Math.min(prev, normalizedGuests);
    });
  }, [breakfastEnabled, totalGuests]);

  useEffect(() => {
    if (!showAmenitiesModal) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAmenitiesModal(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showAmenitiesModal]);

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
  const selectedNights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (end <= start) return 0;
    const diff = end.getTime() - start.getTime();
    return Math.round(diff / (24 * 60 * 60 * 1000));
  }, [checkIn, checkOut]);
  const calendarMonthLabel = useMemo(
    () => formatMonthYear(calendarStart, locale),
    [calendarStart, locale],
  );

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
    if (!selectedRoomId) return copy.roomSelectionRequired;
    if (!checkIn || !checkOut)
      return copy.dateSelectionRequired;
    if (guestExceedsCapacity && selectedRoom)
      return `${copy.capacityExceededPrefix} (${selectedRoom.maxGuests} ${copy.guestUnit}).`;
    if (!rangeAvailable)
      return copy.rangeUnavailable;
    return copy.bookingReady;
  }, [
    checkIn,
    checkOut,
    copy.bookingReady,
    copy.capacityExceededPrefix,
    copy.dateSelectionRequired,
    copy.guestUnit,
    copy.rangeUnavailable,
    copy.roomSelectionRequired,
    guestExceedsCapacity,
    rangeAvailable,
    selectedRoom,
    selectedRoomId,
  ]);

  const handleGalleryNavigate = (direction: 1 | -1) => {
    if (!galleryImageCount) return;
    setActiveGalleryIndex(
      (previous) => (previous + direction + galleryImageCount) % galleryImageCount,
    );
  };

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
      setAvailabilityError(copy.failedLoadDate);
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
      breakfastSelected: String(breakfastSelected && breakfastEnabled),
      breakfastPax: String(
        breakfastSelected && breakfastEnabled ? breakfastPax : 0,
      ),
      breakfastEnabled: String(breakfastEnabled),
      breakfastPricePerPax: String(breakfastPricePerPax),
    });
    router.push(`/booking/confirmation?${params.toString()}`);
  };

  const bookingPanel = (
    <div className="surface-panel space-y-5 rounded-[28px] p-6">
      <div className="rounded-2xl border border-cyan-100/80 bg-linear-to-br from-cyan-50/80 via-white to-teal-50/80 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-600">
              {copy.bookingPriceFrom}
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {selectedRoom
                ? formatIDR(selectedRoom.basePrice, locale)
                : copy.chooseRoom}
            </p>
          </div>
          <p className="text-xs text-slate-500">{copy.perNight}</p>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {copy.finalPriceHint}
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-slate-800">
          1. {copy.chooseRoom}
        </span>
        <select
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 focus:border-cyan-500 focus:outline-hidden focus:ring-4 focus:ring-cyan-100"
        >
          {data?.rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} · {formatIDR(room.basePrice, locale)}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-2xl border border-slate-300 bg-white/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">
            2. {copy.chooseStayDate}
          </p>
          <button
            type="button"
            onClick={() => setShowCalendar((prev) => !prev)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
          >
            {showCalendar ? copy.hideCalendar : copy.showCalendar}
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium text-slate-500">{copy.checkIn}</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatDisplayDate(checkIn)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium text-slate-500">{copy.checkOut}</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatDisplayDate(checkOut)}
            </p>
          </div>
        </div>
        {selectedNights > 0 && (
          <p className="mt-2 text-xs font-medium text-cyan-700">
            {selectedNights} {copy.nightsSelectedSuffix}
          </p>
        )}

        {showCalendar && (
          <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            {availabilityLoading && (
              <p className="text-xs text-slate-500">{copy.loadingCalendar}</p>
            )}
            {availabilityError && (
              <p className="text-xs text-rose-600">{availabilityError}</p>
            )}
            {availability && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {calendarMonthLabel}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {copy.pricePerNightIDR}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-[3px] border border-slate-300 bg-white" />
                    {copy.available}
                  </span>
                  <span className="inline-flex items-center gap-2 text-cyan-700">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-cyan-600" />
                    {copy.selected}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-slate-300" />
                    {copy.unavailable}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500 sm:gap-2">
                  {weekdayLabels.map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {Array.from({
                    length: new Date(`${calendarStart}T00:00:00`).getDay(),
                  }).map((_, index) => (
                    <div key={`empty-${index}`} />
                  ))}
                  {availability.items.map((item) => {
                    const isDisabled = item.isClosed || item.availableUnits <= 0;
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
                        className={`flex h-16 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition ${
                          isDisabled
                            ? "border-slate-200 bg-slate-100 text-slate-400"
                            : isStart || isEnd
                              ? "border-cyan-700 bg-cyan-700 text-white shadow-sm"
                              : inRange
                                ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                                : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
                        }`}
                      >
                        <span className="text-base font-semibold leading-none">
                          {item.date.split("-")[2]}
                        </span>
                        <span
                          className={`text-[9px] font-medium ${
                            isDisabled
                              ? "text-slate-400"
                              : isStart || isEnd
                                ? "text-white/80"
                                : inRange
                                  ? "text-cyan-700"
                                  : "text-slate-500"
                          }`}
                        >
                          {isDisabled
                            ? copy.full
                            : formatIDRPlain(item.finalPrice, locale)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-300 bg-white/90 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">
            3. {copy.guestsCount}
          </p>
          <span className="text-xs font-medium text-slate-500">
            {totalGuests} {copy.guestUnit}
          </span>
        </div>
        <div className="mt-3 grid gap-2">
          {(["adults", "children"] as const).map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {key === "adults" ? copy.adults : copy.children}
                </p>
                <p className="text-[11px] text-slate-500">
                  {key === "adults" ? copy.age13Plus : copy.age0to12}
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
                  className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
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
                  className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {guestExceedsCapacity && selectedRoom && (
        <p className="text-xs text-rose-600">
          {copy.maxCapacityPrefix} {selectedRoom.maxGuests} {copy.guestUnit}.
        </p>
      )}

      <div className="rounded-2xl border border-slate-300 bg-white/90 p-4">
        <p className="text-sm font-semibold text-slate-800">
          4. {copy.breakfastOption}
        </p>
        {!breakfastEnabled ? (
          <p className="mt-2 text-sm text-slate-500">
            {copy.noBreakfastOption}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBreakfastSelected(false)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  !breakfastSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                }`}
              >
                {copy.withoutBreakfast}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBreakfastSelected(true);
                  setBreakfastPax((prev) =>
                    Math.min(Math.max(1, prev), Math.max(1, totalGuests)),
                  );
                }}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  breakfastSelected
                    ? "border-cyan-700 bg-cyan-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
                }`}
              >
                {copy.withBreakfast}
              </button>
            </div>
            <p className="text-xs text-cyan-800/90">
              + {formatIDR(breakfastPricePerPax, locale)} {copy.perPaxPerNight}
            </p>
            {breakfastSelected ? (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {copy.breakfastPax}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {copy.maxPaxPrefix} {Math.max(1, totalGuests)} pax
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBreakfastPax((prev) => Math.max(1, prev - 1))}
                    className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    -
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-slate-900">
                    {breakfastPax}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBreakfastPax((prev) =>
                        Math.min(Math.max(1, totalGuests), prev + 1),
                      )
                    }
                    className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleBooking}
        disabled={!canBook}
        className={`w-full rounded-xl border px-6 py-3 text-sm font-semibold transition ${
          canBook
            ? "border-transparent bg-linear-to-r from-teal-700 to-cyan-700 text-white shadow-[0_12px_24px_-16px_rgba(8,145,178,0.8)] hover:from-teal-600 hover:to-cyan-600"
            : "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500"
        }`}
      >
        {canBook ? copy.bookNow : copy.completeBookingData}
      </button>
      <p className={`text-xs ${canBook ? "text-cyan-700" : "text-slate-500"}`}>
        {bookingHelperText}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            {copy.loadingDetail}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && data && (
          <div className="animate-rise-in space-y-10">
            <header className="rounded-[30px] border border-slate-200 bg-white/90 px-6 py-6 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.35)] sm:px-8">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {data.name}
                </h1>
                <p className="text-sm text-slate-600">
                  {data.categoryName ?? copy.featuredProperty} ·{" "}
                  {locationHeadline || locationSummary || copy.indonesia}
                </p>
              </div>
            </header>

            <section className="surface-panel space-y-3 rounded-[30px] p-3 sm:p-4">
              <div className="grid gap-2 lg:grid-cols-[2fr_1fr]">
                <div className="relative h-[20rem] overflow-hidden rounded-2xl sm:h-[25rem] lg:h-[28rem] lg:rounded-r-none">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500"
                    style={{ backgroundImage: `url(${activeGalleryImage ?? gallery[0]})` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, slot) => {
                    const item = sideGalleryImages[slot];
                    if (!item) {
                      return (
                        <div
                          key={`photo-empty-${slot}`}
                          className="h-[9.7rem] rounded-xl bg-linear-to-br from-slate-100 to-slate-200 sm:h-[13.8rem]"
                        />
                      );
                    }
                    return (
                      <button
                        key={`${item.image}-${item.index}`}
                        type="button"
                        onClick={() => setActiveGalleryIndex(item.index)}
                        className="relative h-[9.7rem] overflow-hidden rounded-xl border border-slate-200/80 shadow-[0_12px_22px_-18px_rgba(15,23,42,0.45)] transition hover:scale-[1.01] hover:shadow-[0_18px_28px_-18px_rgba(14,116,144,0.5)] sm:h-[13.8rem]"
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.image})` }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  {copy.photoOf} {activeGalleryDisplayIndex} {copy.from} {galleryImageCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGalleryNavigate(-1)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                  >
                    {copy.previous}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGalleryNavigate(1)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                  >
                    {copy.next}
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
              <div className="space-y-8">
                <section className="surface-panel rounded-3xl p-6 sm:p-7">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {data.categoryName ?? copy.featuredProperty}{" "}
                    {locale === "en" ? "in" : "di"}{" "}
                    {locationHeadline || locationSummary || copy.indonesia}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {data.rooms.length} {copy.roomsAvailableSuffix}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    {data.description?.trim()
                      ? data.description
                      : copy.noDescription}
                  </p>
                </section>

                <section className="surface-panel rounded-3xl p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {copy.propertyAmenities}
                    </h3>
                    <span className="text-sm font-medium text-slate-500">
                      {propertyAmenities.length} {copy.amenitiesSuffix}
                    </span>
                  </div>
                  {amenitySections.length > 0 ? (
                    <div className="mt-5 space-y-6">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {propertyAmenities.slice(0, 8).map((item) => {
                          const AmenityIcon = getAmenityIcon(item.key);
                          return (
                            <div
                              key={item.key}
                              className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-3"
                            >
                              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-700">
                                <AmenityIcon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <div>
                                <p className="text-base font-medium text-slate-900">
                                  {item.label}
                                </p>
                                <p className="text-xs text-slate-500">{item.hint}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAmenitiesModal(true)}
                        className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
                      >
                        {copy.showAllAmenities} ({propertyAmenities.length})
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      {copy.noAmenities}
                    </p>
                  )}
                </section>

                <section className="surface-panel rounded-3xl p-6 sm:p-7">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {copy.roomOptions}
                  </h3>
                  <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white/90">
                    {data.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex flex-col gap-3 p-4 transition hover:bg-cyan-50/40 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {room.name}
                          </p>
                          <p className="text-sm text-slate-600">{room.description}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {copy.capacity} {room.maxGuests} {copy.guestUnit} ·{" "}
                            {room.totalUnits} {copy.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatIDR(room.basePrice, locale)}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedRoomId(room.id)}
                            className={`rounded-lg border px-4 py-1.5 text-xs font-semibold transition ${
                              selectedRoomId === room.id
                                ? "border-cyan-700 bg-cyan-700 text-white shadow-sm"
                                : "border-slate-300 text-slate-700 hover:border-cyan-300 hover:text-cyan-900"
                            }`}
                          >
                            {selectedRoomId === room.id
                              ? copy.selectedLabel
                              : copy.selectRoom}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="surface-panel space-y-3 rounded-3xl p-6 sm:p-7">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {copy.propertyLocation}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {copy.locationDesc}
                  </p>
                  <PropertyLocationMap
                    locationQuery={locationQuery}
                    latitude={data.latitude ?? null}
                    longitude={data.longitude ?? null}
                    propertyName={data.name}
                  />
                </section>
              </div>

              <aside className="self-start lg:sticky lg:top-24">{bookingPanel}</aside>
            </section>
          </div>
        )}
      </main>
      {showAmenitiesModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 p-4 sm:p-6"
          onClick={() => setShowAmenitiesModal(false)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5 sm:px-8 sm:pt-6">
              <h3 className="text-2xl font-semibold text-slate-900">
                {copy.whatPlaceOffers}
              </h3>
              <button
                type="button"
                onClick={() => setShowAmenitiesModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-2xl leading-none text-slate-700 transition hover:border-slate-500"
                aria-label={copy.closeAmenitiesModalAria}
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-6 pb-8 pt-2 sm:px-8">
              <div className="space-y-8">
                {amenitySections.map((section) => (
                  <section key={`modal-${section.key}`} className="space-y-4">
                    <div>
                      <p className="text-2xl font-semibold text-slate-900">
                        {section.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {section.description}
                      </p>
                    </div>
                    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
                      {section.items.map((item) => {
                        const AmenityIcon = getAmenityIcon(item.key);
                        return (
                          <div
                            key={`modal-item-${item.key}`}
                            className="flex items-start gap-4 px-4 py-4 sm:px-5 sm:py-5"
                          >
                            <span
                              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${section.badge}`}
                            >
                              <AmenityIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                              <p className="text-lg font-medium text-slate-900">
                                {item.label}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {item.hint}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
