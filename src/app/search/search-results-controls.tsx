"use client";

import type { SearchCopy } from "./search-copy";
import type { SearchFormState } from "./search-types";

type Props = {
  copy: SearchCopy;
  form: SearchFormState;
  total: number;
  loading: boolean;
  onSortBy: (value: "name" | "price") => void;
  onSortOrder: (value: "asc" | "desc") => void;
};

export const SearchResultsControls = ({
  copy,
  form,
  total,
  loading,
  onSortBy,
  onSortOrder,
}: Props) => (
  <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-lg shadow-slate-100 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{copy.searchResults}</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">
        {loading ? copy.loadingListings : `${total} ${copy.listingChoicesSuffix}`}
      </h3>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.sortBy}</label>
      <select value={form.sortBy} onChange={(event) => onSortBy(event.target.value as "name" | "price")} className="h-9 rounded-full border border-slate-200 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 focus:border-teal-500 focus:outline-none">
        <option value="name">{copy.sortName}</option>
        <option value="price">{copy.sortPrice}</option>
      </select>
      <select value={form.sortOrder} onChange={(event) => onSortOrder(event.target.value as "asc" | "desc")} className="h-9 rounded-full border border-slate-200 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 focus:border-teal-500 focus:outline-none">
        <option value="asc">{copy.sortAsc}</option>
        <option value="desc">{copy.sortDesc}</option>
      </select>
    </div>
  </div>
);
