"use client";

import PropertyLocationMap from "@/components/property-location-map";
import type { ListingCopy } from "./listing-types";

type Props = {
  copy: ListingCopy;
  locationQuery: string | null;
  latitude: number | null;
  longitude: number | null;
  propertyName: string;
};

export const ListingLocationSection = ({
  copy,
  locationQuery,
  latitude,
  longitude,
  propertyName,
}: Props) => (
  <section className="surface-panel space-y-3 rounded-3xl p-6 sm:p-7">
    <h3 className="text-xl font-semibold text-slate-900">{copy.propertyLocation}</h3>
    <p className="text-sm text-slate-500">{copy.locationDesc}</p>
    <PropertyLocationMap locationQuery={locationQuery} latitude={latitude} longitude={longitude} propertyName={propertyName} />
  </section>
);
