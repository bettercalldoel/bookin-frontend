"use client";

import type { SearchCopy } from "./search-copy";
import type { SearchResultsMeta } from "./search-types";

type Props = {
  copy: SearchCopy;
  meta: SearchResultsMeta;
  loading: boolean;
  onChangePage: (page: number) => void;
};

export const SearchPagination = ({ copy, meta, loading, onChangePage }: Props) => {
  if (meta.totalPages <= 1) return null;
  const start = Math.max(1, meta.page - 2);
  const pages = Array.from({ length: Math.min(5, meta.totalPages - start + 1) }, (_, index) => start + index);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <button type="button" onClick={() => onChangePage(meta.page - 1)} disabled={meta.page <= 1 || loading} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50">
        {copy.previous}
      </button>
      {pages.map((pageNumber) => (
        <button key={pageNumber} type="button" onClick={() => onChangePage(pageNumber)} disabled={loading} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${pageNumber === meta.page ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-700 hover:border-slate-300"}`}>
          {pageNumber}
        </button>
      ))}
      <button type="button" onClick={() => onChangePage(meta.page + 1)} disabled={meta.page >= meta.totalPages || loading} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50">
        {copy.next}
      </button>
    </div>
  );
};
