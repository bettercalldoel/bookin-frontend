export const ALL_AMENITY_KEYS = [
  "wifi",
  "air_conditioning",
  "private_bathroom",
  "hot_water",
  "television",
  "workspace",
  "breakfast",
  "kitchen",
  "refrigerator",
  "parking",
  "elevator",
  "wheelchair_access",
  "front_desk_24h",
  "cctv",
  "smoke_detector",
  "fire_extinguisher",
  "swimming_pool",
  "gym",
  "playground",
  "family_room",
  "extra_bed",
  "baby_cot",
  "pet_friendly",
  "non_smoking_room",
  "smoking_area",
  "laundry_service",
  "airport_shuttle",
  "daily_housekeeping",
] as const;

export type AmenityKey = (typeof ALL_AMENITY_KEYS)[number];

export const AMENITY_LABEL_BY_KEY: Record<AmenityKey, string> = {
  wifi: "Wi-Fi",
  air_conditioning: "AC",
  private_bathroom: "Kamar mandi pribadi",
  hot_water: "Air panas",
  television: "TV",
  workspace: "Meja kerja",
  breakfast: "Sarapan",
  kitchen: "Dapur",
  refrigerator: "Kulkas",
  parking: "Parkir",
  elevator: "Lift",
  wheelchair_access: "Akses kursi roda",
  front_desk_24h: "Resepsionis 24 jam",
  cctv: "CCTV",
  smoke_detector: "Detektor asap",
  fire_extinguisher: "APAR",
  swimming_pool: "Kolam renang",
  gym: "Gym",
  playground: "Area bermain anak",
  family_room: "Kamar keluarga",
  extra_bed: "Extra bed tersedia",
  baby_cot: "Baby cot tersedia",
  pet_friendly: "Ramah hewan peliharaan",
  non_smoking_room: "Kamar bebas rokok",
  smoking_area: "Area merokok",
  laundry_service: "Layanan laundry",
  airport_shuttle: "Antar-jemput bandara",
  daily_housekeeping: "Housekeeping harian",
};

export const AMENITY_LABEL_BY_KEY_EN: Record<AmenityKey, string> = {
  wifi: "Wi-Fi",
  air_conditioning: "Air conditioning",
  private_bathroom: "Private bathroom",
  hot_water: "Hot water",
  television: "TV",
  workspace: "Workspace desk",
  breakfast: "Breakfast",
  kitchen: "Kitchen",
  refrigerator: "Refrigerator",
  parking: "Parking",
  elevator: "Elevator",
  wheelchair_access: "Wheelchair access",
  front_desk_24h: "24-hour front desk",
  cctv: "CCTV",
  smoke_detector: "Smoke detector",
  fire_extinguisher: "Fire extinguisher",
  swimming_pool: "Swimming pool",
  gym: "Gym",
  playground: "Kids playground",
  family_room: "Family room",
  extra_bed: "Extra bed available",
  baby_cot: "Baby cot available",
  pet_friendly: "Pet friendly",
  non_smoking_room: "Non-smoking room",
  smoking_area: "Smoking area",
  laundry_service: "Laundry service",
  airport_shuttle: "Airport shuttle",
  daily_housekeeping: "Daily housekeeping",
};

export const REQUIRED_AMENITY_KEYS: AmenityKey[] = [
  "wifi",
  "air_conditioning",
  "private_bathroom",
  "hot_water",
  "parking",
  "non_smoking_room",
];

export const HIGHLIGHT_AMENITY_KEYS: AmenityKey[] = [
  "breakfast",
  "kitchen",
  "workspace",
  "swimming_pool",
  "gym",
  "family_room",
  "pet_friendly",
  "elevator",
];

export const QUICK_FILTER_AMENITY_KEYS: AmenityKey[] = [
  "wifi",
  "air_conditioning",
  "parking",
  "breakfast",
  "swimming_pool",
  "family_room",
  "pet_friendly",
  "non_smoking_room",
];

export const DEFAULT_STANDARD_AMENITY_KEYS: AmenityKey[] = [
  "breakfast",
  "kitchen",
  "workspace",
  "family_room",
  "elevator",
];

export const MAX_HIGHLIGHT_AMENITIES = 5;

const requiredSet = new Set<AmenityKey>(REQUIRED_AMENITY_KEYS);
const highlightSet = new Set<AmenityKey>(HIGHLIGHT_AMENITY_KEYS);
const amenityKeySet = new Set<string>(ALL_AMENITY_KEYS);

export const EXTRA_AMENITY_KEYS: AmenityKey[] = ALL_AMENITY_KEYS.filter(
  (key) => !requiredSet.has(key) && !highlightSet.has(key),
);

export const ALL_AMENITY_OPTIONS: Array<{ key: AmenityKey; label: string }> =
  ALL_AMENITY_KEYS.map((key) => ({
    key,
    label: AMENITY_LABEL_BY_KEY[key],
  }));

export const isAmenityKey = (value: string): value is AmenityKey =>
  amenityKeySet.has(value);

export const normalizeAmenityKeys = (values: string[]): AmenityKey[] => {
  const uniqueValues = Array.from(
    new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)),
  );

  return uniqueValues.filter((value): value is AmenityKey => isAmenityKey(value));
};

export const getAmenityLabel = (key: string) => {
  if (isAmenityKey(key)) {
    return AMENITY_LABEL_BY_KEY[key];
  }
  return key;
};

export const getAmenityLabelByLocale = (
  key: string,
  locale: "id" | "en",
) => {
  if (!isAmenityKey(key)) return key;
  if (locale === "en") return AMENITY_LABEL_BY_KEY_EN[key];
  return AMENITY_LABEL_BY_KEY[key];
};
