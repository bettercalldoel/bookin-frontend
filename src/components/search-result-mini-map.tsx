"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type SearchResultMiniMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
};

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

export default function SearchResultMiniMap({
  latitude,
  longitude,
  title,
}: SearchResultMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    if (!hasValidCoordinates(latitude, longitude)) return;
    let active = true;

    const initializeMap = async function initializeMap() {
      const Leaflet = await import("leaflet");
      if (!active || !mapContainerRef.current) return;

      leafletRef.current = Leaflet;
      const point: [number, number] = [latitude as number, longitude as number];

      const map = Leaflet.map(mapContainerRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      }).setView(point, 13);

      mapRef.current = map;

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = Leaflet.marker(point, {
        icon: Leaflet.icon(OSM_MARKER_ICON),
      }).addTo(map);
      markerRef.current = marker;
      marker.bindPopup(title || "Lokasi properti");

      map.whenReady(() => map.invalidateSize());
    };

    void initializeMap();

    return () => {
      active = false;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, title]);

  if (!hasValidCoordinates(latitude, longitude)) {
    return (
      <div className="h-32 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        Titik lokasi belum tersedia untuk properti ini.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={mapContainerRef}
        className="h-32 w-full overflow-hidden rounded-2xl border border-slate-200"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
      >
        Buka peta
      </a>
    </div>
  );
}
