import type { AppLocale } from "@/lib/app-locale";

export type ListingRoom = {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  totalUnits: number;
  maxGuests: number;
};

export type ListingDetail = {
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

export type AvailabilityItem = {
  date: string;
  availableUnits: number;
  isClosed: boolean;
  basePrice: string;
  adjustment: string;
  finalPrice: string;
};

export type AvailabilityResponse = {
  roomTypeId: string;
  propertyId: string;
  totalUnits: number;
  items: AvailabilityItem[];
};

export type AmenityCategoryKey =
  | "connectivity"
  | "comfort"
  | "wellness"
  | "service"
  | "general";

export type AmenityCategoryConfig = {
  label: string;
  description: string;
  surface: string;
  countText: string;
  badge: string;
};

export type PropertyAmenity = {
  key: string;
  label: string;
  hint: string;
  category: AmenityCategoryKey;
};

export type ListingCopy = {
  failedLoadDetail: string;
  failedLoadCalendar: string;
  failedLoadDate: string;
  roomSelectionRequired: string;
  dateSelectionRequired: string;
  capacityExceededPrefix: string;
  rangeUnavailable: string;
  bookingReady: string;
  bookingPriceFrom: string;
  chooseRoom: string;
  chooseStayDate: string;
  hideCalendar: string;
  showCalendar: string;
  checkIn: string;
  checkOut: string;
  nightsSelectedSuffix: string;
  loadingCalendar: string;
  pricePerNightIDR: string;
  available: string;
  selected: string;
  unavailable: string;
  full: string;
  guestsCount: string;
  guestUnit: string;
  adults: string;
  children: string;
  age13Plus: string;
  age0to12: string;
  maxCapacityPrefix: string;
  breakfastOption: string;
  noBreakfastOption: string;
  withoutBreakfast: string;
  withBreakfast: string;
  perPaxPerNight: string;
  breakfastPax: string;
  maxPaxPrefix: string;
  bookNow: string;
  completeBookingData: string;
  loadingDetail: string;
  featuredProperty: string;
  indonesia: string;
  photoOf: string;
  from: string;
  previous: string;
  next: string;
  roomsAvailableSuffix: string;
  noDescription: string;
  propertyAmenities: string;
  amenitiesSuffix: string;
  showAllAmenities: string;
  noAmenities: string;
  roomOptions: string;
  capacity: string;
  unit: string;
  selectedLabel: string;
  selectRoom: string;
  propertyLocation: string;
  locationDesc: string;
  whatPlaceOffers: string;
  closeAmenitiesModalAria: string;
  perNight: string;
  finalPriceHint: string;
};

export type ListingLocale = AppLocale;
