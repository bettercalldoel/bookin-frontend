"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth-client";
import {
  BUTTON_THEME,
  HOMEPAGE_PRIMARY_BUTTON,
  INPUT_THEME,
} from "@/lib/button-theme";
import { formatCompactLocation } from "@/lib/location-format";

type PublicCity = {
  id: string;
  name: string;
  province?: string | null;
};

type PublicCategory = {
  name: string;
};

type PublicCityListResponse = {
  data: PublicCity[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

type HomeSearchItem = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  categoryName?: string | null;
  amenityKeys?: string[];
  coverUrl?: string | null;
  minPrice?: string | null;
};

type HomeSearchResponse = {
  data: HomeSearchItem[];
  meta?: {
    total?: number;
  };
};

type HomePropertyCard = {
  id: string;
  name: string;
  location: string;
  category: string;
  image: string;
  minPrice: number | null;
  minPriceLabel: string;
  highlight: string;
};

type HomeHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
};

type HomeLocale = "id" | "en";

const FALLBACK_HOME_IMAGES = [
  "/images/property-1.jpg",
  "/images/property-2.jpg",
  "/images/property-3.jpg",
] as const;

const HOME_LOCALE_STORAGE_KEY = "bookin-home-locale";
const ALL_CATEGORY_KEY = "__all__";

const HOME_COPY = {
  id: {
    languageLabel: "Bahasa",
    allCategories: "Semua",
    navTenantHome: "Beranda",
    navTenantProperty: "Sewakan Properti",
    navStay: "Tempat Menginap",
    navExplore: "Jelajah",
    navSupport: "Bantuan",
    searchHeaderCta: "Cari Penginapan",
    menuOpenAria: "Buka menu",
    menuCloseAria: "Tutup menu",
    greeting: "Halo",
    menuLabel: "Menu",
    tenantDashboard: "Dashboard Tenant",
    myProfile: "Profil Saya",
    myTransactions: "Transaksi Saya",
    logout: "Keluar",
    login: "Masuk",
    defaultHeroTitle: "Temukan Properti Aktif di BookIn",
    defaultHeroLoadingSubtitle: "Sedang memuat listing terbaru...",
    defaultHeroEmptySubtitle: "Belum ada properti aktif untuk ditampilkan.",
    defaultHeroDescription:
      "Gunakan form pencarian untuk melihat ketersediaan properti secara realtime.",
    defaultHeroPricePrefix: "Harga mulai",
    defaultHeroPriceSuffix: "per malam.",
    defaultHeroNoPrice: "Lihat detail properti dan cek ketersediaan kamar.",
    searchFormLabel: "Form Pencarian",
    searchFormTitle: "Tentukan destinasi dan waktu menginap Anda",
    searchWhereLabel: "Lokasi",
    searchWherePlaceholder: "Cari kota tujuan",
    searchWhenLabel: "Tanggal",
    searchWhoLabel: "Tamu",
    searchSubmitAria: "Cari properti",
    searchSubmitText: "Cari",
    searchDateEmpty: "Tambah tanggal",
    whenPanelTitle: "Pilih tanggal",
    checkInLabel: "Check-in",
    stayDuration: "Durasi menginap",
    decreaseStayAria: "Kurangi durasi menginap",
    increaseStayAria: "Tambah durasi menginap",
    whoPanelTitle: "Jumlah tamu",
    adultsLabel: "Dewasa",
    adultsHint: "Usia 13 tahun ke atas",
    childrenLabel: "Anak",
    childrenHint: "Usia 0 - 12 tahun",
    decreaseAdultsAria: "Kurangi dewasa",
    increaseAdultsAria: "Tambah dewasa",
    decreaseChildrenAria: "Kurangi anak",
    increaseChildrenAria: "Tambah anak",
    nightSingular: "malam",
    nightPlural: "malam",
    guestSingular: "tamu",
    guestPlural: "tamu",
    discoverTitle: "Jelajahi kategori populer",
    seeListings: "Lihat listing",
    propertiesLabel: "Properti Tersedia",
    propertiesTitle: "Temukan properti yang siap dipesan",
    checkAvailability: "Cek ketersediaan",
    loadingListings: "Memuat listing properti terbaru...",
    noPropertiesMatched: "Belum ada properti yang cocok dengan filter saat ini.",
    amenitiesPrefix: "Fasilitas",
    roomDetailsFallback: "Cek detail kamar",
    roomAvailabilityFallback: "Lihat detail ketersediaan kamar",
    perNight: "/ malam",
    propertyPriceFallback: "Harga tersedia di detail properti",
    viewDetails: "Lihat detail",
    destinationNoExactPrefix: "Belum ada properti di",
    destinationNoExactSuffix: "Coba destinasi lain yang terdekat.",
    destinationNearbyPrefix: "Belum ada properti tepat di",
    destinationNearbySuffix:
      "Kami tampilkan opsi terdekat dalam radius 1 km.",
    destinationNearbyEmptySuffix:
      "dan area sekitarnya dalam radius 1 km.",
    failedLoadProperties: "Gagal memuat properti.",
    statsAvailableDesc: "Data listing realtime dari backend.",
    statsCategories: "Kategori Aktif",
    statsCategoriesDesc: "Diambil langsung dari kategori properti.",
    statsCities: "Kota Destinasi",
    statsCitiesDesc: "Kota dengan properti yang siap dipesan.",
    tenantModeLabel: "Hosting Mode",
    tenantHeroTitle: "Sewakan properti Anda dengan tampilan host yang lebih modern",
    tenantHeroDesc:
      "Dashboard tenant tetap dipertahankan, sementara home sekarang lebih eksploratif agar konsisten dengan pengalaman tamu seperti Airbnb.",
    tenantPrimaryCta: "Isi Detail Properti",
    tenantCards: [
      {
        title: "Lengkapi Profil Properti",
        desc: "Isi kategori, alamat, deskripsi, dan nilai tambah properti Anda.",
      },
      {
        title: "Kelola Kalender & Harga",
        desc: "Atur ketersediaan kamar dan harga musiman dengan cepat.",
      },
      {
        title: "Siap Terima Reservasi",
        desc: "Terhubung langsung dengan calon tamu yang sudah melakukan pencarian.",
      },
    ],
    footerAboutTitle: "Tentang BookIn",
    footerAboutDesc:
      "Platform booking akomodasi dengan pengalaman pencarian yang lebih cepat, visual listing yang lebih jelas, dan alur reservasi transparan.",
    footerFeaturesTitle: "Fitur Utama",
    footerFeature1: "Pencarian destinasi + filter fleksibel",
    footerFeature2: "Foto listing besar dan informatif",
    footerFeature3: "Ringkasan harga per malam",
    footerContactTitle: "Kontak",
    footerContactHours: "Jam layanan: 08.00 - 22.00 WIB",
    footerNavigationTitle: "Navigasi",
    footerNavHome: "Beranda",
    footerNavSearch: "Pencarian",
    footerNavProperties: "Properti",
    authRequired:
      "Silakan login terlebih dahulu untuk mengakses halaman tersebut.",
    authUnverified:
      "Akun Anda belum terverifikasi. Silakan verifikasi email terlebih dahulu.",
    authForbidden: "Anda tidak memiliki akses ke halaman tersebut.",
    slidePrevAria: "Slide sebelumnya",
    slideNextAria: "Slide selanjutnya",
  },
  en: {
    languageLabel: "Language",
    allCategories: "All",
    navTenantHome: "Home",
    navTenantProperty: "List Property",
    navStay: "Stays",
    navExplore: "Explore",
    navSupport: "Support",
    searchHeaderCta: "Find Stays",
    menuOpenAria: "Open menu",
    menuCloseAria: "Close menu",
    greeting: "Hi",
    menuLabel: "Menu",
    tenantDashboard: "Tenant Dashboard",
    myProfile: "My Profile",
    myTransactions: "My Transactions",
    logout: "Log out",
    login: "Sign in",
    defaultHeroTitle: "Discover Active Properties on BookIn",
    defaultHeroLoadingSubtitle: "Loading the latest listings...",
    defaultHeroEmptySubtitle: "No active properties are available yet.",
    defaultHeroDescription:
      "Use the search form to check real-time property availability.",
    defaultHeroPricePrefix: "Starting from",
    defaultHeroPriceSuffix: "per night.",
    defaultHeroNoPrice: "View property details and room availability.",
    searchFormLabel: "Search Form",
    searchFormTitle: "Set your destination and stay dates",
    searchWhereLabel: "Where",
    searchWherePlaceholder: "Search destination city",
    searchWhenLabel: "When",
    searchWhoLabel: "Who",
    searchSubmitAria: "Search properties",
    searchSubmitText: "Go",
    searchDateEmpty: "Add dates",
    whenPanelTitle: "Select dates",
    checkInLabel: "Check-in",
    stayDuration: "Stay duration",
    decreaseStayAria: "Decrease stay duration",
    increaseStayAria: "Increase stay duration",
    whoPanelTitle: "Guest count",
    adultsLabel: "Adults",
    adultsHint: "Ages 13 and above",
    childrenLabel: "Children",
    childrenHint: "Ages 0 - 12",
    decreaseAdultsAria: "Decrease adults",
    increaseAdultsAria: "Increase adults",
    decreaseChildrenAria: "Decrease children",
    increaseChildrenAria: "Increase children",
    nightSingular: "night",
    nightPlural: "nights",
    guestSingular: "guest",
    guestPlural: "guests",
    discoverTitle: "Explore popular categories",
    seeListings: "View listings",
    propertiesLabel: "Available Properties",
    propertiesTitle: "Find properties ready to book",
    checkAvailability: "Check availability",
    loadingListings: "Loading the latest property listings...",
    noPropertiesMatched: "No properties match your current filters yet.",
    amenitiesPrefix: "Amenities",
    roomDetailsFallback: "Check room details",
    roomAvailabilityFallback: "View room availability details",
    perNight: "/ night",
    propertyPriceFallback: "Price is available on the property detail page",
    viewDetails: "View details",
    destinationNoExactPrefix: "No properties found in",
    destinationNoExactSuffix: "Try another nearby destination.",
    destinationNearbyPrefix: "No exact properties found in",
    destinationNearbySuffix:
      "Showing nearby options within a 1 km radius.",
    destinationNearbyEmptySuffix:
      "and surrounding areas within a 1 km radius.",
    failedLoadProperties: "Failed to load properties.",
    statsAvailableDesc: "Real-time listing data from backend.",
    statsCategories: "Active Categories",
    statsCategoriesDesc: "Fetched directly from property categories.",
    statsCities: "Destination Cities",
    statsCitiesDesc: "Cities with properties ready to book.",
    tenantModeLabel: "Hosting Mode",
    tenantHeroTitle: "List your property with a cleaner host experience",
    tenantHeroDesc:
      "The tenant dashboard stays familiar, while home now feels more exploratory for better guest consistency.",
    tenantPrimaryCta: "Complete Property Details",
    tenantCards: [
      {
        title: "Complete Property Profile",
        desc: "Fill in category, address, description, and your property highlights.",
      },
      {
        title: "Manage Calendar & Pricing",
        desc: "Set room availability and seasonal pricing quickly.",
      },
      {
        title: "Ready for Reservations",
        desc: "Connect instantly with guests who are actively searching.",
      },
    ],
    footerAboutTitle: "About BookIn",
    footerAboutDesc:
      "An accommodation booking platform with faster search, clearer listing visuals, and transparent reservation flow.",
    footerFeaturesTitle: "Key Features",
    footerFeature1: "Destination search with flexible filters",
    footerFeature2: "Large and informative listing photos",
    footerFeature3: "Per-night price summary",
    footerContactTitle: "Contact",
    footerContactHours: "Service hours: 08:00 - 22:00 WIB",
    footerNavigationTitle: "Navigation",
    footerNavHome: "Home",
    footerNavSearch: "Search",
    footerNavProperties: "Properties",
    authRequired: "Please sign in first to access that page.",
    authUnverified: "Your account is not verified yet. Please verify your email first.",
    authForbidden: "You do not have access to that page.",
    slidePrevAria: "Previous slide",
    slideNextAria: "Next slide",
  },
} as const;

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultSearchForm = () => {
  const start = new Date();
  return {
    destination: "",
    startDate: formatLocalDate(start),
    nights: 2,
    adults: 2,
    children: 0,
    rooms: 1,
  };
};

const addDays = (value: string, days: number) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

const formatSearchDate = (
  value: string,
  locale: HomeLocale,
  emptyLabel: string,
) => {
  if (!value) return emptyLabel;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Home() {
  const router = useRouter();
  const [locale, setLocale] = useState<HomeLocale>("id");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userType, setUserType] = useState<"USER" | "TENANT" | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [searchForm, setSearchForm] = useState(() => getDefaultSearchForm());
  const [publicCities, setPublicCities] = useState<PublicCity[]>([]);
  const [publicCategories, setPublicCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_KEY);
  const [homeProperties, setHomeProperties] = useState<HomePropertyCard[]>([]);
  const [homeTotalProperties, setHomeTotalProperties] = useState(0);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);
  const [homeDestinationNotice, setHomeDestinationNotice] = useState<string | null>(null);
  const [debouncedDestination, setDebouncedDestination] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [openSearchPanel, setOpenSearchPanel] = useState<"when" | "who" | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const copy = HOME_COPY[locale];
  const isTenant = userType === "TENANT";
  const discoveryCategories = useMemo(
    () => [ALL_CATEGORY_KEY, ...Array.from(new Set(publicCategories))],
    [publicCategories],
  );
  const heroSlides = useMemo<HomeHeroSlide[]>(() => {
    if (homeProperties.length === 0) {
      return [
        {
          id: "home-default",
          title: copy.defaultHeroTitle,
          subtitle: homeLoading
            ? copy.defaultHeroLoadingSubtitle
            : copy.defaultHeroEmptySubtitle,
          description: copy.defaultHeroDescription,
          image: FALLBACK_HOME_IMAGES[0],
          badge: "BookIn",
        },
      ];
    }

    return homeProperties.slice(0, 3).map((property) => ({
      id: property.id,
      title: property.name,
      subtitle: property.location,
      description: property.minPrice !== null
        ? `${copy.defaultHeroPricePrefix} ${property.minPriceLabel} ${copy.defaultHeroPriceSuffix}`
        : copy.defaultHeroNoPrice,
      image: property.image,
      badge: property.category,
    }));
  }, [copy, homeLoading, homeProperties]);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(HOME_LOCALE_STORAGE_KEY);
    if (storedLocale === "id" || storedLocale === "en") {
      setLocale(storedLocale);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(HOME_LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedDestination(searchForm.destination.trim());
    }, 450);
    return () => window.clearTimeout(timer);
  }, [searchForm.destination]);

  useEffect(() => {
    if (activeCategory !== ALL_CATEGORY_KEY && !discoveryCategories.includes(activeCategory)) {
      setActiveCategory(ALL_CATEGORY_KEY);
    }
  }, [activeCategory, discoveryCategories]);

  useEffect(() => {
    if (activeSlide < heroSlides.length) return;
    setActiveSlide(0);
  }, [activeSlide, heroSlides.length]);

  useEffect(() => {
    if (isTenant || heroSlides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [heroSlides.length, isTenant]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const updatePosition = () => {
      if (!userMenuButtonRef.current) return;
      const rect = userMenuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };
    updatePosition();

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-user-menu]")) return;

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!openSearchPanel) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(event.target as Node)
      ) {
        setOpenSearchPanel(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [openSearchPanel]);

  useEffect(() => {
    const loadPublicCities = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/properties/cities?limit=300&page=1&sortBy=name&sortOrder=asc`,
        );
        if (!response.ok) return;
        const payload = (await response.json()) as PublicCity[] | PublicCityListResponse;
        const cityRows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        if (!Array.isArray(cityRows)) return;
        setPublicCities(
          cityRows
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
        setPublicCities([]);
      }
    };

    loadPublicCities();
  }, []);

  useEffect(() => {
    const loadPublicCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/properties/categories`);
        if (!response.ok) return;
        const payload = (await response.json()) as PublicCategory[];
        if (!Array.isArray(payload)) return;
        setPublicCategories(
          payload
            .map((item) => item?.name?.trim())
            .filter((name): name is string => Boolean(name)),
        );
      } catch {
        setPublicCategories([]);
      }
    };

    loadPublicCategories();
  }, []);

  useEffect(() => {
    if (isTenant) return;
    const controller = new AbortController();

    const mapHomeItems = (items: HomeSearchItem[]) =>
      items.map((item, index) => {
        const location = formatCompactLocation({
          address: item.address,
          city: item.city,
          province: item.province,
        });
        const parsedMinPrice = Number(item.minPrice);
        const minPrice = Number.isFinite(parsedMinPrice) ? parsedMinPrice : null;
        const amenities =
          Array.isArray(item.amenityKeys) && item.amenityKeys.length > 0
            ? item.amenityKeys
                .slice(0, 2)
                .map((key) => key.replaceAll("_", " ").toLowerCase())
            : [];

        return {
          id: item.id,
          name: item.name,
          location,
          category: item.categoryName?.trim() || (locale === "en" ? "Property" : "Properti"),
          image: item.coverUrl || FALLBACK_HOME_IMAGES[index % FALLBACK_HOME_IMAGES.length],
          minPrice,
          minPriceLabel: minPrice !== null ? formatIDR(minPrice) : copy.roomDetailsFallback,
          highlight:
            amenities.length > 0
              ? `${copy.amenitiesPrefix}: ${amenities.join(", ")}`
              : copy.roomAvailabilityFallback,
        } satisfies HomePropertyCard;
      });

    const fetchSearchPayload = async (params: URLSearchParams) => {
      const response = await fetch(
        `${API_BASE_URL}/properties/search?${params.toString()}`,
        { signal: controller.signal },
      );
      const payload = (await response.json().catch(() => ({}))) as HomeSearchResponse & {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message || copy.failedLoadProperties);
      }
      return payload;
    };

    const resolveDestinationCoordinates = async (destination: string) => {
      const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
      geocodeUrl.searchParams.set("q", destination);
      geocodeUrl.searchParams.set("format", "jsonv2");
      geocodeUrl.searchParams.set("limit", "1");
      geocodeUrl.searchParams.set("addressdetails", "0");
      geocodeUrl.searchParams.set("countrycodes", "id");

      const response = await fetch(geocodeUrl.toString(), {
        signal: controller.signal,
        headers: {
          "Accept-Language": locale === "en" ? "en,id" : "id,en",
        },
      });
      if (!response.ok) return null;

      const payload = (await response.json()) as Array<{
        lat?: string;
        lon?: string;
      }>;
      const firstResult = payload[0];
      const latitude = Number(firstResult?.lat);
      const longitude = Number(firstResult?.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return { latitude, longitude };
    };

    const loadHomeProperties = async () => {
      setHomeLoading(true);
      setHomeError(null);
      try {
        const searchParams = new URLSearchParams({
          page: "1",
          limit: "12",
          sort_by: "price",
          sort_order: "asc",
        });
        if (activeCategory !== ALL_CATEGORY_KEY) {
          searchParams.set("category", activeCategory);
        }
        if (debouncedDestination) {
          searchParams.set("loc_term", debouncedDestination);
        }
        const exactPayload = await fetchSearchPayload(searchParams);
        const exactItems = Array.isArray(exactPayload.data) ? exactPayload.data : [];
        const exactMapped = mapHomeItems(exactItems);

        if (exactMapped.length > 0) {
          setHomeProperties(exactMapped);
          setHomeTotalProperties(
            typeof exactPayload.meta?.total === "number"
              ? exactPayload.meta.total
              : exactMapped.length,
          );
          setHomeDestinationNotice(null);
          return;
        }

        if (!debouncedDestination) {
          setHomeProperties([]);
          setHomeTotalProperties(0);
          setHomeDestinationNotice(null);
          return;
        }

        const destinationCoordinates =
          await resolveDestinationCoordinates(debouncedDestination);
        if (!destinationCoordinates) {
          setHomeProperties([]);
          setHomeTotalProperties(0);
          setHomeDestinationNotice(
            `${copy.destinationNoExactPrefix} ${debouncedDestination}. ${copy.destinationNoExactSuffix}`,
          );
          return;
        }

        const nearParams = new URLSearchParams({
          page: "1",
          limit: "12",
          sort_by: "price",
          sort_order: "asc",
          lat: destinationCoordinates.latitude.toFixed(7),
          lng: destinationCoordinates.longitude.toFixed(7),
          radius_km: "1",
        });
        if (activeCategory !== ALL_CATEGORY_KEY) {
          nearParams.set("category", activeCategory);
        }

        const nearbyPayload = await fetchSearchPayload(nearParams);
        const nearbyItems = Array.isArray(nearbyPayload.data)
          ? nearbyPayload.data
          : [];
        const nearbyMapped = mapHomeItems(nearbyItems);
        setHomeProperties(nearbyMapped);
        setHomeTotalProperties(
          typeof nearbyPayload.meta?.total === "number"
            ? nearbyPayload.meta.total
            : nearbyMapped.length,
        );
        setHomeDestinationNotice(
          nearbyMapped.length > 0
            ? `${copy.destinationNearbyPrefix} ${debouncedDestination}. ${copy.destinationNearbySuffix}`
            : `${copy.destinationNoExactPrefix} ${debouncedDestination} ${copy.destinationNearbyEmptySuffix}`,
        );
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setHomeProperties([]);
        setHomeTotalProperties(0);
        setHomeDestinationNotice(null);
        setHomeError(
          error instanceof Error ? error.message : copy.failedLoadProperties,
        );
      } finally {
        setHomeLoading(false);
      }
    };

    void loadHomeProperties();
    return () => {
      controller.abort();
    };
  }, [activeCategory, copy, debouncedDestination, isTenant, locale]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    let isMounted = true;

    apiFetch<{ name: string; type: "USER" | "TENANT" }>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((data) => {
        if (!isMounted) return;
        setUserName(data.name);
        setUserType(data.type);
      })
      .catch(() => {
        if (!isMounted) return;
        setUserName(null);
        setUserType(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    const destination = searchForm.destination.trim();
    if (destination) {
      params.set("loc_term", destination);
    }

    const nights = clamp(searchForm.nights, 1, 30);
    const adults = clamp(searchForm.adults, 1, 10);
    const children = clamp(searchForm.children, 0, 10);
    const rooms = clamp(searchForm.rooms, 1, 8);
    const endDate = addDays(searchForm.startDate, nights);

    params.set("start_date", searchForm.startDate);
    params.set("nights", String(nights));
    if (endDate) {
      params.set("end_date", endDate);
    }
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("rooms", String(rooms));
    params.set("page", "1");
    setOpenSearchPanel(null);
    router.push(`/search?${params.toString()}`);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    clearAuthToken();
    setUserName(null);
    setUserType(null);
    setIsUserMenuOpen(false);
    window.location.href = "/";
  };

  const navItems = isTenant
    ? [
        { label: copy.navTenantHome, href: "#hero" },
        { label: copy.navTenantProperty, href: "/tenant-property" },
        { label: copy.navSupport, href: "#support" },
      ]
    : [
        { label: copy.navStay, href: "#properties" },
        { label: copy.navExplore, href: "#discover" },
        { label: copy.navSupport, href: "#support" },
      ];

  const guestCount = clamp(searchForm.adults, 1, 10) + clamp(searchForm.children, 0, 10);
  const nights = clamp(searchForm.nights, 1, 30);
  const whenSummary = `${formatSearchDate(searchForm.startDate, locale, copy.searchDateEmpty)} · ${nights} ${
    nights === 1 ? copy.nightSingular : copy.nightPlural
  }`;
  const whoSummary = `${guestCount} ${
    guestCount === 1 ? copy.guestSingular : copy.guestPlural
  }`;

  const updateAdults = (delta: number) => {
    setSearchForm((prev) => ({
      ...prev,
      adults: clamp(prev.adults + delta, 1, 10),
    }));
  };
  const updateChildren = (delta: number) => {
    setSearchForm((prev) => ({
      ...prev,
      children: clamp(prev.children + delta, 0, 10),
    }));
  };
  const updateNights = (delta: number) => {
    setSearchForm((prev) => ({
      ...prev,
      nights: clamp(prev.nights + delta, 1, 30),
    }));
  };
  const hasHomeProperties = homeProperties.length > 0;

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <header className="sticky top-0 z-[200] border-b border-slate-200/85 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-6 py-4">
          <a href="#hero" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-800" />
            <p className="font-display text-xl font-semibold text-slate-900">BookIn</p>
          </a>

          {!isTenant ? (
            <a
              href="#search"
              className="hidden items-center gap-2 text-sm font-semibold text-cyan-800 transition hover:text-cyan-900 lg:inline-flex"
            >
              <span>{copy.searchHeaderCta}</span>
              <span className="text-cyan-700">{">"}</span>
            </a>
          ) : null}

          <div className="flex items-center gap-3">
            <LanguageToggle locale={locale} onChange={setLocale} label={copy.languageLabel} />
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900 md:hidden"
              aria-label={copy.menuOpenAria}
            >
              <span className="flex flex-col gap-1.5">
                <span className="h-0.5 w-5 rounded-full bg-cyan-900" />
                <span className="h-0.5 w-5 rounded-full bg-cyan-900" />
                <span className="h-0.5 w-5 rounded-full bg-cyan-900" />
              </span>
            </button>

            {userName ? (
              <div
                ref={userMenuRef}
                data-user-menu
                className="relative hidden items-center gap-2 md:flex"
              >
                <span className="rounded-full bg-linear-to-r from-cyan-900 to-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  {copy.greeting}, {userName}
                </span>
                <button
                  type="button"
                  ref={userMenuButtonRef}
                  onClick={() => setIsUserMenuOpen((current) => !current)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900"
                >
                  {copy.menuLabel}
                </button>
                {isUserMenuOpen && menuPosition
                  ? createPortal(
                      <div
                        data-user-menu
                        className="fixed z-[1000] w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/15"
                        style={{
                          top: menuPosition.top,
                          right: menuPosition.right,
                        }}
                      >
                        {isTenant ? (
                          <a
                            href="/tenant-dashboard"
                            className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50"
                          >
                            {copy.tenantDashboard}
                          </a>
                        ) : (
                          <>
                            <a
                              href="/profile"
                              className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50"
                            >
                              {copy.myProfile}
                            </a>
                            <a
                              href="/my-transaction"
                              className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50"
                            >
                              {copy.myTransactions}
                            </a>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="block w-full px-4 py-3 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          {copy.logout}
                        </button>
                      </div>,
                      document.body,
                    )
                  : null}
              </div>
            ) : (
              <a
                href="/login"
                className="hidden rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900 md:inline-flex"
              >
                {copy.login}
              </a>
            )}
          </div>
        </nav>
      </header>

      <Suspense fallback={null}>
        <AuthNotice locale={locale} />
      </Suspense>

      <div
        className={`fixed inset-0 z-20 bg-slate-900/40 transition ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleCloseSidebar}
        aria-hidden={!isSidebarOpen}
      />
      <aside
        className={`fixed right-0 top-0 z-30 h-full w-72 border-l border-slate-200 bg-white/95 px-5 py-6 shadow-xl backdrop-blur transition-transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="flex items-center justify-end">
          <button
            onClick={handleCloseSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900"
            aria-label={copy.menuCloseAria}
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <LanguageToggle
            locale={locale}
            onChange={setLocale}
            label={copy.languageLabel}
            compact
          />
        </div>

        <nav className="mt-5 flex flex-col gap-2 text-sm font-semibold text-slate-700">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={handleCloseSidebar}
              className="rounded-2xl border border-transparent px-3 py-2 transition hover:border-cyan-200 hover:bg-cyan-50"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-6">
          {userName ? (
            <div className="space-y-2">
              <div className="rounded-full bg-linear-to-r from-cyan-900 to-teal-800 px-4 py-2 text-center text-sm font-semibold text-white">
                {copy.greeting}, {userName}
              </div>

              {isTenant ? (
                <a
                  href="/tenant-dashboard"
                  onClick={handleCloseSidebar}
                  className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                >
                  {copy.tenantDashboard}
                </a>
              ) : (
                <>
                  <a
                    href="/profile"
                    onClick={handleCloseSidebar}
                    className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                  >
                    {copy.myProfile}
                  </a>
                  <a
                    href="/my-transaction"
                    onClick={handleCloseSidebar}
                    className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                  >
                    {copy.myTransactions}
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  handleCloseSidebar();
                  handleLogout();
                }}
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900"
              >
                {copy.logout}
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="block w-full rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
            >
              {copy.login}
            </a>
          )}
        </div>
      </aside>

      <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 md:pt-12">
        {!isTenant ? (
          <>
            <section id="hero" className="surface-panel animate-rise-in rounded-[34px] p-5 md:p-7">
              <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-white/35 md:min-h-[410px]">
                {heroSlides.map((slide, index) => (
                  <article
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                    aria-hidden={index !== activeSlide}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${slide.image})` }}
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-slate-950/70 via-slate-900/40 to-slate-900/20" />
                    <div className="relative z-10 flex min-h-[360px] flex-col justify-between p-6 text-white md:min-h-[410px] md:p-8">
                      <div className="space-y-3">
                        <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
                          {slide.badge}
                        </span>
                        <h1 className="font-display max-w-2xl text-4xl leading-tight md:text-5xl">
                          {slide.title}
                        </h1>
                        <p className="max-w-2xl text-base text-white/90">{slide.subtitle}</p>
                        <p className="max-w-2xl text-sm text-white/80">{slide.description}</p>
                      </div>
                    </div>
                  </article>
                ))}

                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-4 md:p-6">
                  <div className="flex gap-2">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        className={`h-2.5 rounded-full transition ${
                          index === activeSlide ? "w-8 bg-white" : "w-3 bg-white/55 hover:bg-white/80"
                        }`}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlide((current) =>
                          current === 0 ? heroSlides.length - 1 : current - 1,
                        )
                      }
                      disabled={heroSlides.length <= 1}
                      className="h-9 w-9 rounded-full border border-white/60 bg-white/15 text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={copy.slidePrevAria}
                    >
                      {"<"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSlide((current) => (current + 1) % heroSlides.length)
                      }
                      disabled={heroSlides.length <= 1}
                      className="h-9 w-9 rounded-full border border-white/60 bg-white/15 text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={copy.slideNextAria}
                    >
                      {">"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section id="search" className="animate-rise-in mt-8 w-full">
              <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.38)] sm:px-5 sm:py-5">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                      {copy.searchFormLabel}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900 md:text-lg">
                      {copy.searchFormTitle}
                    </h2>
                  </div>
                  
                </div>

                <div ref={searchPanelRef} className="relative mt-4">
                  <form
                    className="overflow-hidden rounded-full border border-slate-200 bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.28)]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSearchSubmit();
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-stretch">
                      <div className="border-b border-slate-200 px-4 py-2.5 md:flex-1 md:border-b-0 md:border-r">
                        <label className="text-[11px] font-semibold text-slate-700">
                          {copy.searchWhereLabel}
                        </label>
                        <input
                          type="text"
                          value={searchForm.destination}
                          onChange={(event) =>
                            setSearchForm((prev) => ({
                              ...prev,
                              destination: event.target.value,
                            }))
                          }
                          placeholder={copy.searchWherePlaceholder}
                          className={`mt-0.5 h-6 w-full rounded-md border border-transparent bg-white px-0 text-sm font-medium text-slate-800 ${INPUT_THEME.focus}`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenSearchPanel((current) =>
                            current === "when" ? null : "when",
                          )
                        }
                        className={`border-b border-slate-200 px-4 py-2.5 text-left transition md:flex-1 md:border-b-0 md:border-r ${
                          openSearchPanel === "when" ? "bg-cyan-50/60" : "hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-[11px] font-semibold text-slate-700">
                          {copy.searchWhenLabel}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-800">{whenSummary}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenSearchPanel((current) =>
                            current === "who" ? null : "who",
                          )
                        }
                        className={`border-b border-slate-200 px-4 py-2.5 text-left transition md:w-52 md:border-b-0 md:border-r ${
                          openSearchPanel === "who" ? "bg-cyan-50/60" : "hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-[11px] font-semibold text-slate-700">
                          {copy.searchWhoLabel}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-800">{whoSummary}</p>
                      </button>

                      <div className="flex items-center justify-center px-2.5 py-2.5 md:py-2">
                        <button
                          type="submit"
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${BUTTON_THEME.solid}`}
                          aria-label={copy.searchSubmitAria}
                        >
                          {copy.searchSubmitText}
                        </button>
                      </div>
                    </div>
                  </form>

                  {openSearchPanel === "when" ? (
                    <div className="absolute left-1/2 top-full z-20 mt-3 w-full -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_24px_38px_-24px_rgba(15,23,42,0.55)] md:w-[420px]">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {copy.whenPanelTitle}
                      </p>
                      <label className="mt-3 block text-xs font-semibold text-slate-600">
                        {copy.checkInLabel}
                      </label>
                      <input
                        type="date"
                        value={searchForm.startDate}
                        onChange={(event) =>
                          setSearchForm((prev) => ({
                            ...prev,
                            startDate: event.target.value,
                          }))
                        }
                        className={`mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 ${INPUT_THEME.focus}`}
                      />

                      <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700">
                            {copy.stayDuration}
                          </p>
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateNights(-1)}
                              disabled={searchForm.nights <= 1}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                              aria-label={copy.decreaseStayAria}
                            >
                              -
                            </button>
                            <span className="min-w-6 text-center text-sm font-semibold text-slate-900">
                              {searchForm.nights}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateNights(1)}
                              disabled={searchForm.nights >= 30}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                              aria-label={copy.increaseStayAria}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {openSearchPanel === "who" ? (
                    <div className="absolute left-1/2 top-full z-20 mt-3 w-full -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_24px_38px_-24px_rgba(15,23,42,0.55)] md:w-[420px]">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {copy.whoPanelTitle}
                      </p>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{copy.adultsLabel}</p>
                            <p className="text-xs text-slate-500">{copy.adultsHint}</p>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateAdults(-1)}
                              disabled={searchForm.adults <= 1}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                              aria-label={copy.decreaseAdultsAria}
                            >
                              -
                            </button>
                            <span className="min-w-4 text-center text-sm font-semibold text-slate-900">
                              {searchForm.adults}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateAdults(1)}
                              disabled={searchForm.adults >= 10}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                              aria-label={copy.increaseAdultsAria}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {copy.childrenLabel}
                            </p>
                            <p className="text-xs text-slate-500">{copy.childrenHint}</p>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateChildren(-1)}
                              disabled={searchForm.children <= 0}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                              aria-label={copy.decreaseChildrenAria}
                            >
                              -
                            </button>
                            <span className="min-w-4 text-center text-sm font-semibold text-slate-900">
                              {searchForm.children}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateChildren(1)}
                              disabled={searchForm.children >= 10}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                              aria-label={copy.increaseChildrenAria}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                

              </div>
            </section>

            <section id="discover" className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
                  {copy.discoverTitle}
                </h2>
                <a
                  href="#properties"
                  className="text-sm font-semibold text-cyan-800 transition hover:text-cyan-900"
                >
                  {copy.seeListings}
                </a>
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {discoveryCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === category
                        ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-800"
                    }`}
                  >
                    {category === ALL_CATEGORY_KEY ? copy.allCategories : category}
                  </button>
                ))}
              </div>
            </section>

            <section id="properties" className="mt-10">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                    {copy.propertiesLabel}
                  </p>
                  <h2 className="font-display mt-2 text-4xl text-slate-900">
                    {copy.propertiesTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className={`inline-flex items-center justify-center ${HOMEPAGE_PRIMARY_BUTTON} ${BUTTON_THEME.solid}`}
                >
                  {copy.checkAvailability}
                </button>
              </div>

              {homeDestinationNotice ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {homeDestinationNotice}
                </div>
              ) : null}

              {homeLoading ? (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">
                  {copy.loadingListings}
                </div>
              ) : null}

              {homeError ? (
                <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">
                  {homeError}
                </div>
              ) : null}

              {!homeLoading && !homeError && hasHomeProperties ? (
                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {homeProperties.map((property, index) => (
                    <article
                      key={property.id}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div
                        className="relative h-60 bg-cover bg-center"
                        style={{ backgroundImage: `url(${property.image})` }}
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 via-transparent to-transparent" />
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                          {property.category}
                        </span>
                      </div>

                      <div className="space-y-3 p-4">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            {property.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">{property.location}</p>
                        </div>

                        <p className="text-sm text-slate-500">{property.highlight}</p>
                        <p className="pt-1 text-sm font-semibold text-slate-900">
                          {property.minPrice !== null ? (
                            <>
                              {property.minPriceLabel}{" "}
                              <span className="font-normal text-slate-500">{copy.perNight}</span>
                            </>
                          ) : (
                            <span className="font-normal text-slate-500">
                              {copy.propertyPriceFallback}
                            </span>
                          )}
                        </p>
                        <a
                          href={`/listings/${property.id}`}
                          className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900"
                        >
                          {copy.viewDetails}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {!homeLoading && !homeError && !hasHomeProperties ? (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">
                  {copy.noPropertiesMatched}
                </div>
              ) : null}
            </section>

            <section className="mt-12">
              <div className="grid gap-4 md:grid-cols-3">
                <article className="rounded-3xl border border-slate-200 bg-linear-to-br from-cyan-100 via-white to-teal-100 p-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    {copy.propertiesLabel}
                  </h3>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {homeTotalProperties}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {copy.statsAvailableDesc}
                  </p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-linear-to-br from-teal-100 via-white to-emerald-100 p-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    {copy.statsCategories}
                  </h3>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {publicCategories.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {copy.statsCategoriesDesc}
                  </p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-linear-to-br from-sky-100 via-white to-cyan-100 p-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    {copy.statsCities}
                  </h3>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {publicCities.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {copy.statsCitiesDesc}
                  </p>
                </article>
              </div>
            </section>
          </>
        ) : (
          <section id="hero" className="surface-panel animate-rise-in rounded-[34px] p-6 md:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  {copy.tenantModeLabel}
                </p>
                <h1 className="font-display text-4xl leading-tight text-slate-900 md:text-5xl">
                  {copy.tenantHeroTitle}
                </h1>
                <p className="text-sm text-slate-600 md:text-base">
                  {copy.tenantHeroDesc}
                </p>
              </div>

              <a
                href="/tenant-property"
                className={`inline-flex items-center justify-center ${HOMEPAGE_PRIMARY_BUTTON} ${BUTTON_THEME.solid}`}
              >
                {copy.tenantPrimaryCta}
              </a>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {copy.tenantCards.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 bg-white/88 px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer
        id="support"
        className="border-t border-slate-200 bg-white/82 backdrop-blur"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <p className="font-display text-2xl text-slate-900">{copy.footerAboutTitle}</p>
            <p className="text-sm text-slate-500">{copy.footerAboutDesc}</p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {copy.footerFeaturesTitle}
            </p>
            <p>{copy.footerFeature1}</p>
            <p>{copy.footerFeature2}</p>
            <p>{copy.footerFeature3}</p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {copy.footerContactTitle}
            </p>
            <p>{copy.footerContactHours}</p>
            <p>Email: support@bookin.id</p>
            <p>WhatsApp: +62 812-3456-7890</p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {copy.footerNavigationTitle}
            </p>
            <a className="block transition hover:text-slate-900" href="#hero">
              {copy.footerNavHome}
            </a>
            {!isTenant ? (
              <>
                <a className="block transition hover:text-slate-900" href="#search">
                  {copy.footerNavSearch}
                </a>
                <a className="block transition hover:text-slate-900" href="#properties">
                  {copy.footerNavProperties}
                </a>
              </>
            ) : (
              <a
                className="block transition hover:text-slate-900"
                href="/tenant-property"
              >
                {copy.navTenantProperty}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function LanguageToggle({
  locale,
  onChange,
  label,
  compact = false,
}: {
  locale: HomeLocale;
  onChange: (next: HomeLocale) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 ${
        compact ? "w-full justify-between" : "justify-end"
      }`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ${
          compact ? "" : "hidden lg:inline"
        }`}
      >
        {label}
      </span>
      <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => onChange("id")}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
            locale === "id"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-pressed={locale === "id"}
        >
          ID
        </button>
        <button
          type="button"
          onClick={() => onChange("en")}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
            locale === "en"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-pressed={locale === "en"}
        >
          EN
        </button>
      </div>
    </div>
  );
}

function AuthNotice({ locale }: { locale: HomeLocale }) {
  const searchParams = useSearchParams();
  const authReason = searchParams.get("auth");
  const copy = HOME_COPY[locale];

  if (!authReason) return null;

  return (
    <div className="relative z-10 mx-auto mt-6 w-full max-w-7xl px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        {authReason === "required" && copy.authRequired}
        {authReason === "unverified" && copy.authUnverified}
        {authReason === "forbidden" && copy.authForbidden}
      </div>
    </div>
  );
}
