export type TenantRoom = {
  id: string;
  name: string;
  price: string;
  totalUnits: number;
  maxGuests: number;
};

export type TenantProperty = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  cityName?: string | null;
  province?: string | null;
  coverUrl?: string | null;
  galleryUrls?: string[];
  rooms: TenantRoom[];
};

export type TenantPropertyMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search: string | null;
  sortBy: "createdAt" | "name" | "cityName";
  sortOrder: "asc" | "desc";
};

export type TenantPropertyListResponse = {
  data: TenantProperty[];
  meta: TenantPropertyMeta;
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

export type RateRule = {
  id: string;
  name: string;
  scope: "PROPERTY" | "ROOM_TYPE";
  propertyId: string | null;
  roomTypeId: string | null;
  startDate: string;
  endDate: string;
  adjustmentType: "PERCENT" | "NOMINAL";
  adjustmentValue: string;
  isActive: boolean;
};

export type PropertyRatingSummary = {
  average: number;
  count: number;
};

export type CatalogCategory = {
  id: string;
  name: string;
};

export type CatalogCategoryListResponse = {
  data: CatalogCategory[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

