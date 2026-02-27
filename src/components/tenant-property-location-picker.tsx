"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  attachClickHandler,
  attachTileLayer,
  createMapInstance,
  createPointSelectionContext,
  finalizeMapInitialization,
  hasValidCoordinates,
  OSM_MARKER_ICON,
} from "@/components/tenant-property-location-picker.map-utils";
import { searchLocationOnMap } from "@/components/tenant-property-location-picker.search-utils";
import type {
  SetMarkerPosition,
  TenantPropertyLocationPickerProps,
} from "@/components/tenant-property-location-picker.types";

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

  const normalizedSearchQuery = useMemo(() => searchQuery.trim(), [searchQuery]);

  const setMarkerPosition = useCallback<SetMarkerPosition>(
    (nextLatitude, nextLongitude, options) => {
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
    void (async () => {
      const Leaflet = await import("leaflet");
      if (!active || !mapContainerRef.current) return;
      const map = createMapInstance(Leaflet, mapContainerRef.current);
      leafletRef.current = Leaflet;
      mapInstanceRef.current = map;
      attachTileLayer(Leaflet, map);
      attachClickHandler(
        map,
        createPointSelectionContext(
          setMarkerPosition,
          onPickLocation,
          setStatusMessage,
          setIsSearching,
        ),
      );
      finalizeMapInitialization(map, setIsMapReady);
    })();

    return () => {
      active = false;
      markerRef.current = null;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onPickLocation, setMarkerPosition]);

  useEffect(() => {
    if (!isMapReady || !hasValidCoordinates(latitude, longitude)) return;
    setMarkerPosition(latitude as number, longitude as number, {
      zoom: 15,
      popupText: "Lokasi properti",
    });
  }, [isMapReady, latitude, longitude, setMarkerPosition]);

  const handleSearchOnMap = useCallback(async () => {
    lastAutoSearchQueryRef.current = normalizedSearchQuery;
    await searchLocationOnMap({
      query: normalizedSearchQuery,
      source: "manual",
      isMapReady,
      setIsSearching,
      setStatusMessage,
      setMarkerPosition,
      onPickLocation,
    });
  }, [isMapReady, normalizedSearchQuery, onPickLocation, setMarkerPosition]);

  useEffect(() => {
    if (!isMapReady || isSearching) return;
    if (normalizedSearchQuery.length < 8) return;
    if (normalizedSearchQuery === lastAutoSearchQueryRef.current) return;

    const timer = window.setTimeout(() => {
      lastAutoSearchQueryRef.current = normalizedSearchQuery;
      void searchLocationOnMap({
        query: normalizedSearchQuery,
        source: "auto",
        isMapReady,
        setIsSearching,
        setStatusMessage,
        setMarkerPosition,
        onPickLocation,
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isMapReady, isSearching, normalizedSearchQuery, onPickLocation, setMarkerPosition]);

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
