export type HomeLocale = "id" | "en";

export type PublicCity = {
  id: string;
  name: string;
  province?: string | null;
};

export type PublicCategory = {
  name: string;
};

export type PublicCityListResponse = {
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

export type HomeSearchItem = {
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

export type HomeSearchResponse = {
  data: HomeSearchItem[];
  meta?: {
    total?: number;
  };
};

export type HomePropertyCard = {
  id: string;
  name: string;
  location: string;
  category: string;
  image: string;
  minPrice: number | null;
  minPriceLabel: string;
  highlight: string;
};

export type HomeHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
};

export type HomeSearchForm = {
  destination: string;
  startDate: string;
  nights: number;
  adults: number;
  children: number;
  rooms: number;
};
