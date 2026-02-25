"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  buildSearchUrl,
  fetchGeocodePoint,
  OSM_MARKER_ICON,
} from "./property-location-map.helpers";

type PropertyLocationMapProps = {
  locationQuery: string | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyName?: string;
};

type MapStatus = "idle" | "loading" | "ready" | "error";

export default function PropertyLocationMap({
  locationQuery,
  latitude,
  longitude,
  propertyName,
}: PropertyLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const [status, setStatus] = useState<MapStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const normalizedQuery = useMemo(
    () => locationQuery?.trim() ?? "",
    [locationQuery],
  );
  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  useEffect(() => {
    const renderMap = async (params: {
      latitude: number;
      longitude: number;
      locationLabel: string;
    }) => {
      const Leaflet = await import("leaflet");
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = Leaflet.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([params.latitude, params.longitude], 15);
      mapInstanceRef.current = map;

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = Leaflet.marker([params.latitude, params.longitude], {
        icon: Leaflet.icon(OSM_MARKER_ICON),
      });
      marker.addTo(map);

      const popupLines = [
        propertyName?.trim() || "Lokasi properti",
        params.locationLabel,
      ];
      marker.bindPopup(popupLines.join("<br/>"));
      marker.openPopup();

      map.whenReady(() => map.invalidateSize());
      setStatus("ready");
      setStatusMessage(null);
    };

    if (hasCoordinates) {
      setStatus("loading");
      setStatusMessage("Memuat peta lokasi...");
      void renderMap({
        latitude: latitude as number,
        longitude: longitude as number,
        locationLabel: normalizedQuery || "Koordinat properti",
      }).catch(() => {
        setStatus("error");
        setStatusMessage("Peta belum dapat ditampilkan.");
      });
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }

    if (!normalizedQuery) {
      setStatus("idle");
      setStatusMessage("Lokasi detail belum tersedia.");
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }

    const abortController = new AbortController();
    let active = true;

    const setupMapByGeocoding = async function () {
      try {
        setStatus("loading");
        setStatusMessage("Memuat peta lokasi...");
        const point = await fetchGeocodePoint(
          normalizedQuery,
          abortController.signal,
        );
        if (!active) return;
        await renderMap({
          latitude: point.latitude,
          longitude: point.longitude,
          locationLabel: point.label,
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setStatus("error");
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Peta belum dapat ditampilkan.",
        );
      }
    };

    void setupMapByGeocoding();

    return () => {
      active = false;
      abortController.abort();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hasCoordinates, latitude, longitude, normalizedQuery, propertyName]);

  const isIdle = status === "idle";
  const isError = status === "error";
  const isLoading = status === "loading";

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.45)]">
        <div
          ref={mapContainerRef}
          className={`h-56 w-full sm:h-64 ${
            status === "ready"
              ? "bg-white"
              : "bg-linear-to-br from-slate-100 via-white to-slate-200"
          }`}
        />
      </div>

      {(isIdle || isLoading || isError) && statusMessage && (
        <p
          className={`text-xs ${
            isError ? "text-rose-600" : "text-slate-500"
          }`}
        >
          {statusMessage}
        </p>
      )}

      {!isIdle && normalizedQuery && (
        <a
          href={buildSearchUrl(normalizedQuery)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
        >
          Buka di OpenStreetMap
        </a>
      )}
    </div>
  );
}
