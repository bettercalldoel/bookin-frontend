"use client";

import { getAmenityIcon } from "./listing-amenity-meta";
import type { ListingCopy, PropertyAmenity } from "./listing-types";

type Props = {
  copy: ListingCopy;
  propertyAmenities: PropertyAmenity[];
  onOpenModal: () => void;
};

export const ListingAmenitiesSection = ({
  copy,
  propertyAmenities,
  onOpenModal,
}: Props) => (
  <section className="surface-panel rounded-3xl p-6 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-xl font-semibold text-slate-900">{copy.propertyAmenities}</h3>
      <span className="text-sm font-medium text-slate-500">{propertyAmenities.length} {copy.amenitiesSuffix}</span>
    </div>
    {propertyAmenities.length > 0 ? (
      <div className="mt-5 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {propertyAmenities.slice(0, 8).map((item) => {
            const AmenityIcon = getAmenityIcon(item.key);
            return (
              <div key={item.key} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-700">
                  <AmenityIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-base font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.hint}</p>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={onOpenModal} className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900">
          {copy.showAllAmenities} ({propertyAmenities.length})
        </button>
      </div>
    ) : (
      <p className="mt-4 text-sm text-slate-500">{copy.noAmenities}</p>
    )}
  </section>
);
