"use client";

import type { SearchCopy } from "./search-copy";
import type { AppLocale } from "@/lib/app-locale";
import type { PublicCategory, SearchFormSetter, SearchFormState, SearchResultsMeta } from "./search-types";
import { SearchFilterSummary } from "./search-filter-summary";
import { SearchFilterLocationSection } from "./search-filter-location-section";
import { SearchFilterStaySection } from "./search-filter-stay-section";
import { SearchFilterAmenitiesSection } from "./search-filter-amenities-section";

type Props = {
  copy: SearchCopy;
  locale: AppLocale;
  form: SearchFormState;
  setForm: SearchFormSetter;
  categories: PublicCategory[];
  resultsMeta: SearchResultsMeta;
  resultsLoading: boolean;
  destinationLabel: string;
  stayDateSummary: string;
  guestSummary: string;
  nights: number;
  roomCount: number;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (open: boolean) => void;
  mobileAdvancedOpen: boolean;
  setMobileAdvancedOpen: (open: boolean) => void;
  showAllAmenitiesFilter: boolean;
  setShowAllAmenitiesFilter: (open: boolean) => void;
  getNightLabel: (value: number) => string;
  getRoomLabel: (value: number) => string;
  onApplySearch: () => void;
};

export const SearchFilterSidebar = ({
  copy,
  locale,
  form,
  setForm,
  categories,
  resultsMeta,
  resultsLoading,
  destinationLabel,
  stayDateSummary,
  guestSummary,
  nights,
  roomCount,
  mobileFiltersOpen,
  setMobileFiltersOpen,
  mobileAdvancedOpen,
  setMobileAdvancedOpen,
  showAllAmenitiesFilter,
  setShowAllAmenitiesFilter,
  getNightLabel,
  getRoomLabel,
  onApplySearch,
}: Props) => (
  <aside className="h-fit space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-100 sm:p-6 lg:sticky lg:top-24">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{copy.filter}</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{copy.adjustSearch}</h2>
      </div>
      <button type="button" onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)} className="inline-flex h-9 items-center rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 lg:hidden">
        {mobileFiltersOpen ? copy.hideFilters : copy.editFilters}
      </button>
    </div>
    <SearchFilterSummary copy={copy} destinationLabel={destinationLabel} stayDateSummary={stayDateSummary} nights={nights} guestSummary={guestSummary} roomCount={roomCount} category={form.category} amenitiesCount={form.amenities.length} loading={resultsLoading} total={resultsMeta.total} getNightLabel={getNightLabel} getRoomLabel={getRoomLabel} />
    <div className={`${mobileFiltersOpen ? "space-y-4" : "hidden"} lg:block lg:space-y-5`}>
      <SearchFilterLocationSection copy={copy} form={form} categories={categories} mobileAdvancedOpen={mobileAdvancedOpen} setMobileAdvancedOpen={setMobileAdvancedOpen} setForm={setForm} />
      <SearchFilterStaySection copy={copy} form={form} setForm={setForm} getNightLabel={getNightLabel} getRoomLabel={getRoomLabel} />
      <SearchFilterAmenitiesSection copy={copy} locale={locale} form={form} setForm={setForm} showAllAmenitiesFilter={showAllAmenitiesFilter} setShowAllAmenitiesFilter={setShowAllAmenitiesFilter} mobileAdvancedOpen={mobileAdvancedOpen} />
      <button type="button" onClick={onApplySearch} className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">{copy.applySearch}</button>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        {resultsLoading ? copy.loadingResults : `${copy.showingPrefix} ${resultsMeta.total} ${copy.showingSuffix}${destinationLabel !== copy.allDestinations ? ` ${copy.locationConnector} ${destinationLabel}.` : "."}`}
      </div>
    </div>
  </aside>
);
