import { formatCompactLocation } from "@/lib/location-format";
import type { HomeLocale, HomePropertyCard, HomeSearchForm, HomeSearchItem } from "./home-types";

export const FALLBACK_HOME_IMAGES = ["/images/property-1.jpg", "/images/property-2.jpg", "/images/property-3.jpg"] as const;
export const HOME_LOCALE_STORAGE_KEY = "bookin-home-locale";
export const ALL_CATEGORY_KEY = "__all__";

export const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDefaultSearchForm = (): HomeSearchForm => ({
  destination: "",
  startDate: formatLocalDate(new Date()),
  nights: 2,
  adults: 2,
  children: 0,
  rooms: 1,
});

export const addDays = (value: string, days: number) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

export const formatSearchDate = (value: string, locale: HomeLocale, emptyLabel: string) => {
  if (!value) return emptyLabel;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export const mapHomeItems = (
  items: HomeSearchItem[],
  locale: HomeLocale,
  copy: {
    amenitiesPrefix: string;
    roomAvailabilityFallback: string;
    roomDetailsFallback: string;
  },
): HomePropertyCard[] =>
  items.map((item, index) => {
    const location = formatCompactLocation({ address: item.address, city: item.city, province: item.province });
    const parsedMinPrice = Number(item.minPrice);
    const minPrice = Number.isFinite(parsedMinPrice) ? parsedMinPrice : null;
    const amenities = Array.isArray(item.amenityKeys) && item.amenityKeys.length > 0 ? item.amenityKeys.slice(0, 2).map((key) => key.replaceAll("_", " ").toLowerCase()) : [];
    return {
      id: item.id,
      name: item.name,
      location,
      category: item.categoryName?.trim() || (locale === "en" ? "Property" : "Properti"),
      image: item.coverUrl || FALLBACK_HOME_IMAGES[index % FALLBACK_HOME_IMAGES.length],
      minPrice,
      minPriceLabel: minPrice !== null ? formatIDR(minPrice) : copy.roomDetailsFallback,
      highlight: amenities.length > 0 ? `${copy.amenitiesPrefix}: ${amenities.join(", ")}` : copy.roomAvailabilityFallback,
    };
  });
