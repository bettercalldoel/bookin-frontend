export type CategoryRow = {
  id: string;
  name: string;
  propertiesCount: number;
};

export type PropertyCard = {
  id: string;
  image: string;
  name: string;
  status: string;
  type: string;
  rating: string;
  ratingCount: number;
  location: string;
  rooms: Array<{ id: string }>;
};
