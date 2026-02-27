"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { SEARCH_COPY } from "./search-copy";
import { fetchPublicCategories, fetchSearchResults } from "./search-api";
import { SearchHero } from "./search-hero";
import { SearchFilterSidebar } from "./search-filter-sidebar";
import { SearchResultsSection } from "./search-results-section";
import type { DisplayResult, PublicCategory, SearchFormState, SearchResultsMeta } from "./search-types";
import { addDays, buildFormFromParams, buildSearchQueryParams, formatIDR } from "./search-utils";

const FALLBACK_IMAGES = ["/images/property-1.jpg", "/images/property-2.jpg", "/images/property-3.jpg"];
const EMPTY_META: SearchResultsMeta = { page: 1, limit: 8, total: 0, totalPages: 1 };

export const SearchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsSnapshot = searchParams.toString();
  const locale = useAppLocaleValue();
  const copy = SEARCH_COPY[locale];
  const [form, setForm] = useState<SearchFormState>(() => buildFormFromParams(searchParams));
  const [results, setResults] = useState<DisplayResult[]>([]);
  const [resultsMeta, setResultsMeta] = useState<SearchResultsMeta>(EMPTY_META);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileAdvancedOpen, setMobileAdvancedOpen] = useState(false);
  const [showAllAmenitiesFilter, setShowAllAmenitiesFilter] = useState(false);
  const formatCurrency = useMemo(() => (value: number) => formatIDR(value, locale), [locale]);

  useEffect(() => setForm(buildFormFromParams(searchParams)), [paramsSnapshot, searchParams]);
  useEffect(() => { void fetchPublicCategories().then(setCategories); }, []);
  useEffect(() => {
    const load = async () => {
      try {
        setResultsLoading(true);
        setResultsError(null);
        const payload = await fetchSearchResults(paramsSnapshot, locale, copy, FALLBACK_IMAGES);
        setResults(payload.results);
        setResultsMeta(payload.meta ?? EMPTY_META);
      } catch (error) {
        setResults([]);
        setResultsMeta(EMPTY_META);
        setResultsError(error instanceof Error ? error.message : copy.failedLoadResults);
      } finally {
        setResultsLoading(false);
      }
    };
    void load();
  }, [paramsSnapshot, locale, copy]);

  const nights = Math.max(1, form.nights);
  const roomCount = Math.max(1, form.rooms);
  const totalGuests = form.adults + form.children;
  const checkOutDate = addDays(form.startDate, nights);
  const destinationLabel = form.destination.trim() || copy.allDestinations;
  const headerTitle = destinationLabel !== copy.allDestinations ? `${copy.headerChoicePrefix} ${destinationLabel}` : copy.headerDefaultTitle;
  const stayDateSummary = form.startDate ? `${formatDateDDMMYYYY(form.startDate)}${checkOutDate ? ` - ${formatDateDDMMYYYY(checkOutDate)}` : ""}` : copy.flexibleDates;
  const getNightLabel = (value: number) => (value === 1 ? copy.nightSingular : copy.nightPlural);
  const getGuestLabel = (value: number) => (value === 1 ? copy.guestSingular : copy.guestPlural);
  const getRoomLabel = (value: number) => (value === 1 ? copy.roomSingular : copy.roomPlural);
  const guestSummary = totalGuests > 0 ? `${totalGuests} ${getGuestLabel(totalGuests)}` : copy.flexibleGuests;

  const pushSearch = (nextForm: SearchFormState) => router.push(`/search?${buildSearchQueryParams(nextForm).toString()}`);
  const onApplySearch = () => {
    const nextForm = { ...form, page: 1 };
    setForm(nextForm);
    setMobileFiltersOpen(false);
    setMobileAdvancedOpen(false);
    pushSearch(nextForm);
  };
  const onChangePage = (page: number) => {
    if (page < 1 || page > resultsMeta.totalPages) return;
    const nextForm = { ...form, page };
    setForm(nextForm);
    pushSearch(nextForm);
  };
  const onSortBy = (value: "name" | "price") => {
    const nextForm = { ...form, sortBy: value, page: 1 };
    setForm(nextForm);
    pushSearch(nextForm);
  };
  const onSortOrder = (value: "asc" | "desc") => {
    const nextForm = { ...form, sortOrder: value, page: 1 };
    setForm(nextForm);
    pushSearch(nextForm);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SearchHero copy={copy} destinationLabel={destinationLabel} headerTitle={headerTitle} stayDateSummary={stayDateSummary} guestSummary={guestSummary} nights={nights} roomCount={roomCount} getNightLabel={getNightLabel} getRoomLabel={getRoomLabel} />
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[340px_1fr]">
        <SearchFilterSidebar copy={copy} locale={locale} form={form} setForm={setForm} categories={categories} resultsMeta={resultsMeta} resultsLoading={resultsLoading} destinationLabel={destinationLabel} stayDateSummary={stayDateSummary} guestSummary={guestSummary} nights={nights} roomCount={roomCount} mobileFiltersOpen={mobileFiltersOpen} setMobileFiltersOpen={setMobileFiltersOpen} mobileAdvancedOpen={mobileAdvancedOpen} setMobileAdvancedOpen={setMobileAdvancedOpen} showAllAmenitiesFilter={showAllAmenitiesFilter} setShowAllAmenitiesFilter={setShowAllAmenitiesFilter} getNightLabel={getNightLabel} getRoomLabel={getRoomLabel} onApplySearch={onApplySearch} />
        <SearchResultsSection copy={copy} locale={locale} form={form} results={results} resultsMeta={resultsMeta} resultsLoading={resultsLoading} resultsError={resultsError} nights={nights} formatCurrency={formatCurrency} getNightLabel={getNightLabel} getRoomLabel={getRoomLabel} onSortBy={onSortBy} onSortOrder={onSortOrder} onChangePage={onChangePage} />
      </section>
    </div>
  );
};
