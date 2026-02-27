import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Baby,
  Ban,
  Bath,
  BedDouble,
  Bell,
  Briefcase,
  Building,
  Car,
  Cigarette,
  Circle,
  Coffee,
  CookingPot,
  Dumbbell,
  Flame,
  PawPrint,
  Plane,
  Shield,
  Snowflake,
  Sparkles,
  Tv,
  Users,
  Waves,
  Wifi,
} from "lucide-react";
import type { AmenityCategoryConfig, AmenityCategoryKey } from "./listing-types";

export const AMENITY_CATEGORY_CONFIG_ID: Record<AmenityCategoryKey, AmenityCategoryConfig> = {
  connectivity: { label: "Konektivitas", description: "Internet dan perangkat kerja atau hiburan.", surface: "border-cyan-200 bg-cyan-50/70", countText: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700" },
  comfort: { label: "Kenyamanan kamar", description: "Fasilitas utama untuk tidur dan istirahat.", surface: "border-emerald-200 bg-emerald-50/70", countText: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  wellness: { label: "Rekreasi", description: "Aktivitas santai, olahraga, dan fasilitas keluarga.", surface: "border-amber-200 bg-amber-50/70", countText: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  service: { label: "Layanan properti", description: "Bantuan operasional dan layanan tambahan tenant.", surface: "border-indigo-200 bg-indigo-50/70", countText: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
  general: { label: "Fasilitas lainnya", description: "Fasilitas pelengkap yang tetap tersedia untuk tamu.", surface: "border-slate-200 bg-slate-100/70", countText: "text-slate-700", badge: "bg-slate-200 text-slate-700" },
};

export const AMENITY_CATEGORY_CONFIG_EN: Record<AmenityCategoryKey, AmenityCategoryConfig> = {
  connectivity: { label: "Connectivity", description: "Internet, work, and entertainment essentials.", surface: "border-cyan-200 bg-cyan-50/70", countText: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700" },
  comfort: { label: "Room comfort", description: "Core amenities for rest and sleep quality.", surface: "border-emerald-200 bg-emerald-50/70", countText: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  wellness: { label: "Recreation", description: "Leisure, sports, and family-friendly facilities.", surface: "border-amber-200 bg-amber-50/70", countText: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  service: { label: "Property services", description: "Operational support and extra services.", surface: "border-indigo-200 bg-indigo-50/70", countText: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
  general: { label: "Other amenities", description: "Additional facilities available to guests.", surface: "border-slate-200 bg-slate-100/70", countText: "text-slate-700", badge: "bg-slate-200 text-slate-700" },
};

export const AMENITY_CATEGORY_ORDER: AmenityCategoryKey[] = ["comfort", "connectivity", "wellness", "service", "general"];

export const AMENITY_CATEGORY_BY_KEY: Partial<Record<string, AmenityCategoryKey>> = {
  wifi: "connectivity", television: "connectivity", workspace: "connectivity", cctv: "connectivity",
  air_conditioning: "comfort", private_bathroom: "comfort", hot_water: "comfort", non_smoking_room: "comfort", extra_bed: "comfort", family_room: "comfort", kitchen: "comfort", refrigerator: "comfort",
  breakfast: "service", laundry_service: "service", daily_housekeeping: "service", front_desk_24h: "service", airport_shuttle: "service", parking: "service", elevator: "service", wheelchair_access: "service", smoke_detector: "service", fire_extinguisher: "service", smoking_area: "service",
  swimming_pool: "wellness", gym: "wellness", playground: "wellness", baby_cot: "wellness", pet_friendly: "wellness",
};

const AMENITY_ICON_BY_KEY: Partial<Record<string, LucideIcon>> = {
  wifi: Wifi, air_conditioning: Snowflake, private_bathroom: Bath, hot_water: Flame, television: Tv, workspace: Briefcase, breakfast: Coffee, kitchen: CookingPot, refrigerator: CookingPot,
  parking: Car, elevator: Building, wheelchair_access: Accessibility, front_desk_24h: Bell, cctv: Shield, smoke_detector: Shield, fire_extinguisher: Shield, swimming_pool: Waves, gym: Dumbbell,
  playground: Users, family_room: Users, extra_bed: BedDouble, baby_cot: Baby, pet_friendly: PawPrint, non_smoking_room: Ban, smoking_area: Cigarette, laundry_service: Sparkles, airport_shuttle: Plane, daily_housekeeping: Sparkles,
};

export const getAmenityIcon = (key: string): LucideIcon => AMENITY_ICON_BY_KEY[key] ?? Circle;
