"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type PickedLocation = {
  latitude: number;
  longitude: number;
  resolvedAddress?: string;
  cityCandidate?: string;
  districtCandidate?: string;
  provinceCandidate?: string;
  countryCandidate?: string;
};

type TenantPropertyLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  searchQuery: string;
  onPickLocation: (location: PickedLocation) => void;
};

const INDONESIA_CENTER: [number, number] = [-2.5489, 118.0149];

const OSM_MARKER_ICON = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize: [41, 41] as [number, number],
};

const hasValidCoordinates = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) =>
  typeof latitude === "number" &&
  Number.isFinite(latitude) &&
  typeof longitude === "number" &&
  Number.isFinite(longitude);

export default function TenantPropertyLocationPicker({
  latitude,
  longitude,
  searchQuery,
  onPickLocation,
}: TenantPropertyLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const lastAutoSearchQueryRef = useRef("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Klik peta untuk memilih titik lokasi properti.",
  );

  const normalizedSearchQuery = useMemo(
    () => searchQuery.trim(),
    [searchQuery],
  );

  const setMarkerPosition = useCallback(
    (
      nextLatitude: number,
      nextLongitude: number,
      options?: {
        zoom?: number;
        popupText?: string;
      },
    ) => {
      if (!leafletRef.current || !mapInstanceRef.current) return;

      const Leaflet = leafletRef.current;
      const map = mapInstanceRef.current;
      const point: [number, number] = [nextLatitude, nextLongitude];

      if (!markerRef.current) {
        markerRef.current = Leaflet.marker(point, {
          icon: Leaflet.icon(OSM_MARKER_ICON),
        }).addTo(map);
      } else {
        markerRef.current.setLatLng(point);
      }

      if (options?.popupText) {
        markerRef.current.bindPopup(options.popupText);
        markerRef.current.openPopup();
      }

      const nextZoom = options?.zoom ?? Math.max(map.getZoom(), 15);
      map.setView(point, nextZoom);
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const initializeMap = async () => {
      const Leaflet = await import("leaflet");
      if (!active || !mapContainerRef.current) return;

      leafletRef.current = Leaflet;
      const map = Leaflet.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView(INDONESIA_CENTER, 5);

      mapInstanceRef.current = map;

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (event) => {
        const nextLatitude = Number(event.latlng.lat.toFixed(7));
        const nextLongitude = Number(event.latlng.lng.toFixed(7));

        setMarkerPosition(nextLatitude, nextLongitude, {
          popupText: "Mencari alamat...",
        });
        setStatusMessage("Mencari alamat dari titik yang dipilih...");
        setIsSearching(true);

        const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        reverseUrl.searchParams.set("lat", String(nextLatitude));
        reverseUrl.searchParams.set("lon", String(nextLongitude));
        reverseUrl.searchParams.set("format", "jsonv2");
        reverseUrl.searchParams.set("zoom", "18");
        reverseUrl.searchParams.set("addressdetails", "1");

        void fetch(reverseUrl.toString(), {
          headers: {
            "Accept-Language": "id,en",
          },
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("Alamat tidak dapat dipetakan.");
            }
            const payload = (await response.json()) as {
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
            const resolvedAddress = payload.display_name?.trim();
            const addressDetails = payload.address;
            const cityCandidate =
              addressDetails?.city ||
              addressDetails?.town ||
              addressDetails?.municipality ||
              addressDetails?.village ||
              addressDetails?.county;
            const districtCandidate =
              addressDetails?.state_district || addressDetails?.county;

            setMarkerPosition(nextLatitude, nextLongitude, {
              popupText: resolvedAddress || "Titik properti terpilih",
            });
            onPickLocation({
              latitude: nextLatitude,
              longitude: nextLongitude,
              resolvedAddress,
              cityCandidate: cityCandidate?.trim(),
              districtCandidate: districtCandidate?.trim(),
              provinceCandidate: addressDetails?.state?.trim(),
              countryCandidate: addressDetails?.country?.trim(),
            });
            setStatusMessage(
              resolvedAddress
                ? "Alamat berhasil dipilih dari titik pada peta."
                : "Titik terpilih, tetapi alamat detail tidak ditemukan.",
            );
          })
          .catch(() => {
            onPickLocation({
              latitude: nextLatitude,
              longitude: nextLongitude,
            });
            setMarkerPosition(nextLatitude, nextLongitude, {
              popupText: "Titik properti terpilih",
            });
            setStatusMessage(
              "Titik berhasil dipilih, tetapi alamat detail belum ditemukan.",
            );
          })
          .finally(() => {
            setIsSearching(false);
          });
      });

      map.whenReady(() => {
        map.invalidateSize();
      });
      setIsMapReady(true);
    };

    void initializeMap();

    return () => {
      active = false;
      markerRef.current = null;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onPickLocation]);

  useEffect(() => {
    if (!isMapReady) return;
    if (!hasValidCoordinates(latitude, longitude)) return;

    setMarkerPosition(latitude as number, longitude as number, {
      zoom: 15,
      popupText: "Lokasi properti",
    });
  }, [isMapReady, latitude, longitude]);

  const searchLocationOnMap = useCallback(
    async (query: string, source: "manual" | "auto") => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        if (source === "manual") {
          setStatusMessage("Isi alamat terlebih dahulu untuk pencarian.");
        }
        return;
      }
      if (!isMapReady) {
        setStatusMessage("Peta masih dimuat. Coba lagi sebentar.");
        return;
      }

      setIsSearching(true);
      if (source === "manual") {
        setStatusMessage("Mencari lokasi pada peta...");
      }

      try {
        const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
        searchUrl.searchParams.set("q", normalizedQuery);
        searchUrl.searchParams.set("format", "jsonv2");
        searchUrl.searchParams.set("limit", "1");
        searchUrl.searchParams.set("addressdetails", "1");

        const response = await fetch(searchUrl.toString(), {
          headers: {
            "Accept-Language": "id,en",
          },
        });
        if (!response.ok) {
          throw new Error("Lokasi tidak ditemukan.");
        }
        const payload = (await response.json()) as Array<{
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
        }>;
        const point = payload[0];
        const nextLatitude = Number(point?.lat);
        const nextLongitude = Number(point?.lon);
        if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
          throw new Error("Lokasi tidak ditemukan.");
        }

        setMarkerPosition(nextLatitude, nextLongitude, {
          zoom: 15,
          popupText: point?.display_name || "Lokasi ditemukan",
        });
        onPickLocation({
          latitude: Number(nextLatitude.toFixed(7)),
          longitude: Number(nextLongitude.toFixed(7)),
          resolvedAddress: point?.display_name?.trim(),
          cityCandidate:
            point?.address?.city?.trim() ||
            point?.address?.town?.trim() ||
            point?.address?.municipality?.trim() ||
            point?.address?.village?.trim() ||
            point?.address?.county?.trim(),
          districtCandidate:
            point?.address?.state_district?.trim() ||
            point?.address?.county?.trim(),
          provinceCandidate: point?.address?.state?.trim(),
          countryCandidate: point?.address?.country?.trim(),
        });
        setStatusMessage("Lokasi ditemukan. Klik peta jika ingin mengubah titik.");
      } catch {
        setStatusMessage("Lokasi tidak ditemukan. Periksa kembali alamat.");
      } finally {
        setIsSearching(false);
      }
    },
    [isMapReady, onPickLocation, setMarkerPosition],
  );

  const handleSearchOnMap = useCallback(async () => {
    lastAutoSearchQueryRef.current = normalizedSearchQuery;
    await searchLocationOnMap(normalizedSearchQuery, "manual");
  }, [normalizedSearchQuery, searchLocationOnMap]);

  useEffect(() => {
    if (!isMapReady) return;
    if (isSearching) return;
    if (normalizedSearchQuery.length < 8) return;
    if (normalizedSearchQuery === lastAutoSearchQueryRef.current) return;

    const timer = window.setTimeout(() => {
      lastAutoSearchQueryRef.current = normalizedSearchQuery;
      void searchLocationOnMap(normalizedSearchQuery, "auto");
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isMapReady, isSearching, normalizedSearchQuery, searchLocationOnMap]);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">Lokasi di peta</p>
          <p className="text-xs text-slate-500">
            Klik titik di peta untuk menentukan alamat otomatis.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSearchOnMap}
          disabled={isSearching}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? "Mencari..." : "Cari di peta"}
        </button>
      </div>
      <div
        ref={mapContainerRef}
        className="h-72 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white"
      />
      <p className="text-xs text-slate-500">{statusMessage}</p>
    </div>
  );
}
