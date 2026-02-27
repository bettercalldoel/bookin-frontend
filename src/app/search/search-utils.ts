import { formatCompactLocation } from "@/lib/location-format";
import {
  ALL_AMENITY_KEYS,
  type AmenityKey,
  getAmenityLabelByLocale,
  isAmenityKey,
} from "@/lib/amenities";
import type {
  DisplayResult,
  PublicCategory,
  SearchCopyShape,
  SearchFormState,
  SearchParamsSource,
  SearchResponseItem,
  SearchSortBy,
  SearchSortOrder,
} from "./search-types";
import type { AppLocale } from "@/lib/app-locale";

export const formatIDR = (value: number, locale: AppLocale) =>
  new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseSortBy = (value: string | null): SearchSortBy =>
  value === "price" ? "price" : "name";

const parseSortOrder = (value: string | null): SearchSortOrder =>
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

export const addDays = (value: string, days: number) => {
  if (!value) return "";
  const base = new Date(`${value}T00:00:00`);
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  return toDateValue(base);
};

export const buildFormFromParams = (params: SearchParamsSource): SearchFormState => {
  const legacyNights = diffNights(params.get("start_date") ?? "", params.get("end_date") ?? "");
  const nightsFromQuery = parseNumber(params.get("nights"), 0);
  const nights = nightsFromQuery >= 1 ? Math.min(Math.floor(nightsFromQuery), 30) : legacyNights >= 1 ? Math.min(legacyNights, 30) : 1;
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

const parsePriceValue = (value?: string | null) => {
  const parsed = value ? Number(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeItemAmenities = (keys?: string[]) =>
  Array.isArray(keys) ? keys.filter((key): key is AmenityKey => isAmenityKey(key)) : [];

const buildSearchHighlight = (
  item: SearchResponseItem,
  amenityKeys: AmenityKey[],
  locale: AppLocale,
  copy: SearchCopyShape,
) =>
  amenityKeys.length > 0
    ? `${copy.amenityPrefix}: ${amenityKeys.slice(0, 2).map((key) => getAmenityLabelByLocale(key, locale)).join(", ")}`
    : item.address
      ? copy.highlightAddress
      : copy.highlightDefault;

const mapSearchItemToDisplay = (
  item: SearchResponseItem,
  index: number,
  locale: AppLocale,
  copy: SearchCopyShape,
  fallbackImages: string[],
): DisplayResult => {
  const amenityKeys = normalizeItemAmenities(item.amenityKeys);
  return {
    id: item.id,
    name: item.name,
    location: formatCompactLocation({ address: item.address, city: item.city, province: item.province }),
    price: parsePriceValue(item.minPrice),
    rating: "4.8",
    tag: item.categoryName?.trim() || copy.propertyTagFallback,
    highlight: buildSearchHighlight(item, amenityKeys, locale, copy),
    image: item.coverUrl || fallbackImages[index % fallbackImages.length],
    amenityKeys,
    breakfastEnabled: Boolean(item.breakfast?.enabled),
    breakfastPricePerPax: Number(item.breakfast?.pricePerPax ?? 0) || 0,
  };
};

export const mapSearchResultsToDisplay = (
  items: SearchResponseItem[],
  locale: AppLocale,
  copy: SearchCopyShape,
  fallbackImages: string[],
) => items.map((item, index) => mapSearchItemToDisplay(item, index, locale, copy, fallbackImages));

export const normalizePublicCategories = (payload: Array<Partial<PublicCategory>>) =>
  payload
    .filter((item): item is PublicCategory => typeof item?.name === "string" && item.name.trim().length > 0)
    .map((item) => ({ name: item.name.trim() }));

const setSearchParamIfFilled = (params: URLSearchParams, key: string, value: string) => {
  const normalized = value.trim();
  if (normalized) params.set(key, normalized);
};

const applySearchDateParams = (params: URLSearchParams, form: SearchFormState) => {
  if (!form.startDate) return;
  params.set("start_date", form.startDate);
  const computedEndDate = addDays(form.startDate, Math.max(1, form.nights));
  if (computedEndDate) params.set("end_date", computedEndDate);
};

export const buildSearchQueryParams = (nextForm: SearchFormState) => {
  const params = new URLSearchParams();
  setSearchParamIfFilled(params, "loc_term", nextForm.destination);
  setSearchParamIfFilled(params, "property_name", nextForm.propertyName);
  setSearchParamIfFilled(params, "category", nextForm.category);
  applySearchDateParams(params, nextForm);
  params.set("nights", String(Math.max(1, Math.min(30, nextForm.nights))));
  params.set("adults", String(Math.max(0, nextForm.adults)));
  params.set("children", String(Math.max(0, nextForm.children)));
  params.set("rooms", String(Math.max(1, nextForm.rooms)));
  if (nextForm.amenities.length > 0) params.set("amenities", nextForm.amenities.join(","));
  if (nextForm.amenities.length > 0) params.set("amenities_mode", nextForm.amenitiesMode);
  params.set("sort_by", nextForm.sortBy);
  params.set("sort_order", nextForm.sortOrder);
  params.set("page", String(Math.max(1, nextForm.page || 1)));
  return params;
};

export const toggleAmenitySelection = (selected: AmenityKey[], key: AmenityKey) =>
  ALL_AMENITY_KEYS.filter((item) => (selected.includes(key) ? selected.filter((value) => value !== key) : [...selected, key]).includes(item));
