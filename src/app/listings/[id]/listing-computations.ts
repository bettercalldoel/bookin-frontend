import { getAmenityLabelByLocale, normalizeAmenityKeys } from "@/lib/amenities";
import { formatDate } from "./listing-utils";
import type {
  AmenityCategoryConfig,
  AmenityCategoryKey,
  AvailabilityItem,
  ListingDetail,
  PropertyAmenity,
} from "./listing-types";
import { AMENITY_CATEGORY_BY_KEY, AMENITY_CATEGORY_ORDER } from "./listing-amenity-meta";
import type { AppLocale } from "@/lib/app-locale";

export const buildPropertyAmenities = (
  data: ListingDetail | null,
  locale: AppLocale,
  amenityHints: Partial<Record<string, string>>,
) => {
  if (!data?.amenityKeys) return [];
  return normalizeAmenityKeys(data.amenityKeys).map((key) => ({
    key,
    label: getAmenityLabelByLocale(key, locale),
    hint: amenityHints[key] ?? (locale === "en" ? "Amenity is available during your stay." : "Fasilitas tersedia selama menginap."),
    category: AMENITY_CATEGORY_BY_KEY[key] ?? "general",
  }));
};

type AmenitySection = {
  key: AmenityCategoryKey;
  label: string;
  description: string;
  surface: string;
  countText: string;
  badge: string;
  items: PropertyAmenity[];
};

export const buildAmenitySections = (
  propertyAmenities: PropertyAmenity[],
  amenityCategoryConfig: Record<AmenityCategoryKey, AmenityCategoryConfig>,
): AmenitySection[] =>
  AMENITY_CATEGORY_ORDER.map((key) => ({ key, ...amenityCategoryConfig[key], items: propertyAmenities.filter((item) => item.category === key) }))
    .filter((section) => section.items.length > 0);

export const getSelectedNights = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
};

export const isRangeAvailable = (
  start: string,
  end: string,
  availabilityMap: Map<string, AvailabilityItem>,
) => {
  if (!start || !end) return false;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) return false;
  const cursor = new Date(startDate.getTime());
  while (cursor < endDate) {
    const item = availabilityMap.get(formatDate(cursor));
    if (!item || item.isClosed || item.availableUnits <= 0) return false;
    cursor.setDate(cursor.getDate() + 1);
  }
  return true;
};
