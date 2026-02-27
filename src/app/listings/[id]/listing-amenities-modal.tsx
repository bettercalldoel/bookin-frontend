"use client";

import { getAmenityIcon } from "./listing-amenity-meta";
import type { AmenityCategoryKey, ListingCopy, PropertyAmenity } from "./listing-types";

type AmenitySection = {
  key: AmenityCategoryKey;
  label: string;
  description: string;
  badge: string;
  items: PropertyAmenity[];
};

type Props = {
  open: boolean;
  copy: ListingCopy;
  sections: AmenitySection[];
  onClose: () => void;
};

export const ListingAmenitiesModal = ({ open, copy, sections, onClose }: Props) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 sm:p-6" onClick={onClose}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-8 sm:pt-6">
          <h3 className="min-w-0 text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">{copy.whatPlaceOffers}</h3>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-2xl leading-none text-slate-700 transition hover:border-slate-500" aria-label={copy.closeAmenitiesModalAria}>×</button>
        </div>
        <div className="overflow-y-auto px-6 pb-8 pt-2 sm:px-8">
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={`modal-${section.key}`} className="space-y-4">
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{section.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{section.description}</p>
                </div>
                <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
                  {section.items.map((item) => {
                    const AmenityIcon = getAmenityIcon(item.key);
                    return (
                      <div key={`modal-item-${item.key}`} className="flex items-start gap-4 px-4 py-4 sm:px-5 sm:py-5">
                        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${section.badge}`}>
                          <AmenityIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-lg font-medium text-slate-900">{item.label}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.hint}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
