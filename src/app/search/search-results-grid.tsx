"use client";

import type { AppLocale } from "@/lib/app-locale";
import type { SearchCopy } from "./search-copy";
import type { DisplayResult, SearchFormState } from "./search-types";
import { SearchResultsCard } from "./search-results-card";

type Props = {
  results: DisplayResult[];
  copy: SearchCopy;
  locale: AppLocale;
  form: SearchFormState;
  nights: number;
  loading: boolean;
  formatCurrency: (value: number) => string;
  getNightLabel: (value: number) => string;
  getRoomLabel: (value: number) => string;
};

export const SearchResultsGrid = ({
  results,
  copy,
  locale,
  form,
  nights,
  loading,
  formatCurrency,
  getNightLabel,
  getRoomLabel,
}: Props) => (
  <div className="grid gap-6 lg:grid-cols-2">
    {results.map((item) => (
      <SearchResultsCard key={item.id} item={item} copy={copy} locale={locale} form={form} nights={nights} formatCurrency={formatCurrency} getNightLabel={getNightLabel} getRoomLabel={getRoomLabel} />
    ))}
    {!loading && results.length === 0 ? (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        {copy.noResults}
      </div>
    ) : null}
  </div>
);
