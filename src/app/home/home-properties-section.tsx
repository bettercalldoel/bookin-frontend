"use client";

import { BUTTON_THEME, HOMEPAGE_PRIMARY_BUTTON } from "@/lib/button-theme";
import type { HomeCopy } from "./home-copy";
import type { HomePropertyCard } from "./home-types";

type Props = {
  copy: HomeCopy;
  properties: HomePropertyCard[];
  loading: boolean;
  error: string | null;
  destinationNotice: string | null;
  onCheckAvailability: () => void;
};

export const HomePropertiesSection = ({
  copy,
  properties,
  loading,
  error,
  destinationNotice,
  onCheckAvailability,
}: Props) => {
  const hasProperties = properties.length > 0;
  return (
    <section id="properties" className="mt-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">{copy.propertiesLabel}</p><h2 className="font-display mt-2 text-4xl text-slate-900">{copy.propertiesTitle}</h2></div>
        <button type="button" onClick={onCheckAvailability} className={`inline-flex items-center justify-center ${HOMEPAGE_PRIMARY_BUTTON} ${BUTTON_THEME.solid}`}>{copy.checkAvailability}</button>
      </div>
      {destinationNotice ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{destinationNotice}</div> : null}
      {loading ? <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">{copy.loadingListings}</div> : null}
      {error ? <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">{error}</div> : null}
      {!loading && !error && hasProperties ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property, index) => (
            <article key={property.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl" style={{ animationDelay: `${index * 60}ms` }}>
              <div className="relative h-60 bg-cover bg-center" style={{ backgroundImage: `url(${property.image})` }}><div className="absolute inset-0 bg-linear-to-t from-slate-900/40 via-transparent to-transparent" /><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">{property.category}</span></div>
              <div className="space-y-3 p-4"><div><h3 className="text-base font-semibold text-slate-900">{property.name}</h3><p className="mt-1 text-sm text-slate-500">{property.location}</p></div><p className="text-sm text-slate-500">{property.highlight}</p><p className="pt-1 text-sm font-semibold text-slate-900">{property.minPrice !== null ? <>{property.minPriceLabel} <span className="font-normal text-slate-500">{copy.perNight}</span></> : <span className="font-normal text-slate-500">{copy.propertyPriceFallback}</span>}</p><a href={`/listings/${property.id}`} className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">{copy.viewDetails}</a></div>
            </article>
          ))}
        </div>
      ) : null}
      {!loading && !error && !hasProperties ? <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">{copy.noPropertiesMatched}</div> : null}
    </section>
  );
};
