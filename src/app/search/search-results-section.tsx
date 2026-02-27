"use client";

import type { AppLocale } from "@/lib/app-locale";
import type { SearchCopy } from "./search-copy";
import type { DisplayResult, SearchFormState, SearchResultsMeta } from "./search-types";
import { SearchPagination } from "./search-pagination";
import { SearchResultsControls } from "./search-results-controls";
import { SearchResultsGrid } from "./search-results-grid";

type Props = {
  copy: SearchCopy;
  locale: AppLocale;
  form: SearchFormState;
  results: DisplayResult[];
  resultsMeta: SearchResultsMeta;
  resultsLoading: boolean;
  resultsError: string | null;
  nights: number;
  formatCurrency: (value: number) => string;
  getNightLabel: (value: number) => string;
  getRoomLabel: (value: number) => string;
  onSortBy: (value: "name" | "price") => void;
  onSortOrder: (value: "asc" | "desc") => void;
  onChangePage: (page: number) => void;
};

export const SearchResultsSection = ({
  copy,
  locale,
  form,
  results,
  resultsMeta,
  resultsLoading,
  resultsError,
  nights,
  formatCurrency,
  getNightLabel,
  getRoomLabel,
  onSortBy,
  onSortOrder,
  onChangePage,
}: Props) => (
  <div className="space-y-6">
    <SearchResultsControls copy={copy} form={form} total={resultsMeta.total} loading={resultsLoading} onSortBy={onSortBy} onSortOrder={onSortOrder} />
    <SearchResultsGrid results={results} copy={copy} locale={locale} form={form} nights={nights} loading={resultsLoading} formatCurrency={formatCurrency} getNightLabel={getNightLabel} getRoomLabel={getRoomLabel} />
    {resultsError ? (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{resultsError}</div>
    ) : null}
    <SearchPagination copy={copy} meta={resultsMeta} loading={resultsLoading} onChangePage={onChangePage} />
  </div>
);
