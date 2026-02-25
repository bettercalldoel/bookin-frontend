export type GeocodePoint = {
  latitude: number;
  longitude: number;
  label: string;
};

type GeocodeItem = {
  lat: string;
  lon: string;
  display_name?: string;
};

export const OSM_MARKER_ICON = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize: [41, 41] as [number, number],
};

export const buildSearchUrl = (query: string) =>
  `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;

const buildGeocodeUrl = (query: string) => {
  const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
  geocodeUrl.searchParams.set("q", query);
  geocodeUrl.searchParams.set("format", "jsonv2");
  geocodeUrl.searchParams.set("limit", "1");
  geocodeUrl.searchParams.set("addressdetails", "1");
  return geocodeUrl;
};

const parseGeocodePayload = (payload: GeocodeItem[], fallbackLabel: string): GeocodePoint => {
  const point = payload[0];
  if (!point) throw new Error("Koordinat lokasi tidak ditemukan.");
  const latitude = Number(point.lat);
  const longitude = Number(point.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Koordinat lokasi tidak valid.");
  }
  return { latitude, longitude, label: point.display_name || fallbackLabel };
};

export const fetchGeocodePoint = async (
  query: string,
  signal: AbortSignal,
): Promise<GeocodePoint> => {
  const response = await fetch(buildGeocodeUrl(query).toString(), {
    signal,
    headers: { "Accept-Language": "id,en" },
  });
  if (!response.ok) throw new Error("Gagal mengambil koordinat lokasi.");
  const payload = (await response.json()) as GeocodeItem[];
  return parseGeocodePayload(payload, query);
};
