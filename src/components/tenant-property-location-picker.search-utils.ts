import type {
  PickedLocation,
  SetMarkerPosition,
} from "@/components/tenant-property-location-picker.types";

type SearchLocationOnMapInput = {
  query: string;
  source: "manual" | "auto";
  isMapReady: boolean;
  setIsSearching: (value: boolean) => void;
  setStatusMessage: (message: string) => void;
  setMarkerPosition: SetMarkerPosition;
  onPickLocation: (location: PickedLocation) => void;
};

type SearchPoint = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  };
};

const toPickedLocationFromPoint = (
  point: SearchPoint,
  latitude: number,
  longitude: number,
): PickedLocation => ({
  latitude: Number(latitude.toFixed(7)),
  longitude: Number(longitude.toFixed(7)),
  resolvedAddress: point.display_name?.trim(),
  cityCandidate:
    point.address?.city?.trim() ||
    point.address?.town?.trim() ||
    point.address?.municipality?.trim() ||
    point.address?.village?.trim() ||
    point.address?.county?.trim(),
  districtCandidate:
    point.address?.state_district?.trim() || point.address?.county?.trim(),
  provinceCandidate: point.address?.state?.trim(),
  countryCandidate: point.address?.country?.trim(),
});

const createSearchUrl = (query: string) => {
  const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("format", "jsonv2");
  searchUrl.searchParams.set("limit", "1");
  searchUrl.searchParams.set("addressdetails", "1");
  return searchUrl.toString();
};

const fetchSearchPoint = async (query: string) => {
  const response = await fetch(createSearchUrl(query), {
    headers: { "Accept-Language": "id,en" },
  });
  if (!response.ok) throw new Error("Lokasi tidak ditemukan.");
  const payload = (await response.json()) as SearchPoint[];
  return payload[0];
};

const resolvePointCoordinates = (point?: SearchPoint) => {
  const latitude = Number(point?.lat);
  const longitude = Number(point?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Lokasi tidak ditemukan.");
  }
  return { latitude, longitude };
};

export const searchLocationOnMap = async ({
  query,
  source,
  isMapReady,
  setIsSearching,
  setStatusMessage,
  setMarkerPosition,
  onPickLocation,
}: SearchLocationOnMapInput) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    if (source === "manual") setStatusMessage("Isi alamat terlebih dahulu untuk pencarian.");
    return;
  }
  if (!isMapReady) {
    setStatusMessage("Peta masih dimuat. Coba lagi sebentar.");
    return;
  }

  setIsSearching(true);
  if (source === "manual") setStatusMessage("Mencari lokasi pada peta...");

  try {
    const point = await fetchSearchPoint(normalizedQuery);
    const { latitude, longitude } = resolvePointCoordinates(point);
    setMarkerPosition(latitude, longitude, {
      zoom: 15,
      popupText: point?.display_name || "Lokasi ditemukan",
    });
    onPickLocation(toPickedLocationFromPoint(point ?? {}, latitude, longitude));
    setStatusMessage("Lokasi ditemukan. Klik peta jika ingin mengubah titik.");
  } catch {
    setStatusMessage("Lokasi tidak ditemukan. Periksa kembali alamat.");
  } finally {
    setIsSearching(false);
  }
};
