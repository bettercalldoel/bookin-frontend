import type { AmenityKey } from "@/lib/amenities";
import type { AppLocale } from "@/lib/app-locale";
import type { Dispatch, SetStateAction } from "react";

export type SearchSortBy = "name" | "price";
export type SearchSortOrder = "asc" | "desc";
export type SearchAmenitiesMode = "all" | "any";

export type SearchParamsSource = {
  get: (key: string) => string | null;
};

export type SearchResponseItem = {
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

export type PublicCategory = {
  name: string;
};

export type SearchResponse = {
  data: SearchResponseItem[];
  meta: SearchResultsMeta;
};

export type DisplayResult = {
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

export type SearchFormState = {
  destination: string;
  propertyName: string;
  category: string;
  amenities: AmenityKey[];
  amenitiesMode: SearchAmenitiesMode;
  sortBy: SearchSortBy;
  sortOrder: SearchSortOrder;
  startDate: string;
  nights: number;
  adults: number;
  children: number;
  rooms: number;
  page: number;
};

export type SearchResultsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SearchCopyShape = {
  amenityPrefix: string;
  highlightAddress: string;
  highlightDefault: string;
  propertyTagFallback: string;
  failedLoadResults: string;
  allDestinations: string;
  headerChoicePrefix: string;
  headerDefaultTitle: string;
  flexibleDates: string;
  flexibleGuests: string;
  guestSingular: string;
  guestPlural: string;
  nightSingular: string;
  nightPlural: string;
  roomSingular: string;
  roomPlural: string;
  locationConnector: string;
  showingPrefix: string;
  showingSuffix: string;
  loadingResults: string;
  loadingListings: string;
  listingChoicesSuffix: string;
  noResults: string;
  previous: string;
  next: string;
  sortName: string;
  sortPrice: string;
  sortAsc: string;
  sortDesc: string;
  sortBy: string;
  rating: string;
  breakfastAvailable: string;
  noBreakfast: string;
  priceUnavailable: string;
  perNight: string;
  totalLabel: string;
  notIncludeFees: string;
  viewDetails: string;
};

export type SearchPageLocale = AppLocale;
export type SearchFormSetter = Dispatch<SetStateAction<SearchFormState>>;
