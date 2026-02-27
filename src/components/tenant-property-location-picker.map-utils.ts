import type {
  PickedLocation,
  PointSelectionContext,
  ReverseGeocodeAddress,
  ReverseGeocodePayload,
  SetMarkerPosition,
} from "@/components/tenant-property-location-picker.types";

export const INDONESIA_CENTER: [number, number] = [-2.5489, 118.0149];

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

export const hasValidCoordinates = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) =>
  typeof latitude === "number" &&
  Number.isFinite(latitude) &&
  typeof longitude === "number" &&
  Number.isFinite(longitude);

const resolveCityCandidate = (address?: ReverseGeocodeAddress) =>
  address?.city ||
  address?.town ||
  address?.municipality ||
  address?.village ||
  address?.county;

const resolveDistrictCandidate = (address?: ReverseGeocodeAddress) =>
  address?.state_district || address?.county;

const buildReverseLookupUrl = (latitude: number, longitude: number) => {
  const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  reverseUrl.searchParams.set("lat", String(latitude));
  reverseUrl.searchParams.set("lon", String(longitude));
  reverseUrl.searchParams.set("format", "jsonv2");
  reverseUrl.searchParams.set("zoom", "18");
  reverseUrl.searchParams.set("addressdetails", "1");
  return reverseUrl.toString();
};

const fetchReverseLookup = async (
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodePayload> => {
  const response = await fetch(buildReverseLookupUrl(latitude, longitude), {
    headers: { "Accept-Language": "id,en" },
  });
  if (!response.ok) throw new Error("Alamat tidak dapat dipetakan.");
  return (await response.json()) as ReverseGeocodePayload;
};

const buildPickedLocationPayload = (
  latitude: number,
  longitude: number,
  payload: ReverseGeocodePayload,
): PickedLocation => {
  const address = payload.address;
  return {
    latitude,
    longitude,
    resolvedAddress: payload.display_name?.trim(),
    cityCandidate: resolveCityCandidate(address)?.trim(),
    districtCandidate: resolveDistrictCandidate(address)?.trim(),
    provinceCandidate: address?.state?.trim(),
    countryCandidate: address?.country?.trim(),
  };
};

const applyPendingSelection = (
  context: PointSelectionContext,
  latitude: number,
  longitude: number,
) => {
  context.setMarkerPosition(latitude, longitude, { popupText: "Mencari alamat..." });
  context.setStatusMessage("Mencari alamat dari titik yang dipilih...");
  context.setIsSearching(true);
};

const applyResolvedSelection = (
  context: PointSelectionContext,
  latitude: number,
  longitude: number,
  payload: ReverseGeocodePayload,
) => {
  const pickedLocation = buildPickedLocationPayload(latitude, longitude, payload);
  context.setMarkerPosition(latitude, longitude, {
    popupText: pickedLocation.resolvedAddress || "Titik properti terpilih",
  });
  context.onPickLocation(pickedLocation);
  context.setStatusMessage(
    pickedLocation.resolvedAddress
      ? "Alamat berhasil dipilih dari titik pada peta."
      : "Titik terpilih, tetapi alamat detail tidak ditemukan.",
  );
};

const applyFallbackSelection = (
  context: PointSelectionContext,
  latitude: number,
  longitude: number,
) => {
  context.onPickLocation({ latitude, longitude });
  context.setMarkerPosition(latitude, longitude, {
    popupText: "Titik properti terpilih",
  });
  context.setStatusMessage(
    "Titik berhasil dipilih, tetapi alamat detail belum ditemukan.",
  );
};

const resolveSelectedPoint = (
  context: PointSelectionContext,
  latitude: number,
  longitude: number,
) => {
  void fetchReverseLookup(latitude, longitude)
    .then((payload) => applyResolvedSelection(context, latitude, longitude, payload))
    .catch(() => applyFallbackSelection(context, latitude, longitude))
    .finally(() => context.setIsSearching(false));
};

export const createMapInstance = (
  Leaflet: typeof import("leaflet"),
  container: HTMLDivElement,
) =>
  Leaflet.map(container, {
    zoomControl: true,
    scrollWheelZoom: false,
  }).setView(INDONESIA_CENTER, 5);

export const attachTileLayer = (
  Leaflet: typeof import("leaflet"),
  map: import("leaflet").Map,
) => {
  Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);
};

export const attachClickHandler = (
  map: import("leaflet").Map,
  context: PointSelectionContext,
) => {
  map.on("click", (event) => {
    const latitude = Number(event.latlng.lat.toFixed(7));
    const longitude = Number(event.latlng.lng.toFixed(7));
    applyPendingSelection(context, latitude, longitude);
    resolveSelectedPoint(context, latitude, longitude);
  });
};

export const createPointSelectionContext = (
  setMarkerPosition: SetMarkerPosition,
  onPickLocation: (location: PickedLocation) => void,
  setStatusMessage: (message: string) => void,
  setIsSearching: (value: boolean) => void,
) => ({ setMarkerPosition, onPickLocation, setStatusMessage, setIsSearching });

export const finalizeMapInitialization = (
  map: import("leaflet").Map,
  setIsMapReady: (value: boolean) => void,
) => {
  map.whenReady(() => map.invalidateSize());
  setIsMapReady(true);
};
