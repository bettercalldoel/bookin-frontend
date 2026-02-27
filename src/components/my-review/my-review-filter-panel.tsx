import type { SearchFilters, ReviewCopy } from "./my-review-types";

type MyReviewFilterPanelProps = {
  copy: ReviewCopy;
  filters: SearchFilters;
  onFiltersChange: (patch: Partial<SearchFilters>) => void;
  onApplySearch: () => void;
  onResetSearch: () => void;
};

export const MyReviewFilterPanel = ({
  copy,
  filters,
  onFiltersChange,
  onApplySearch,
  onResetSearch,
}: MyReviewFilterPanelProps) => (
  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
    <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.orderNoLabel}</span>
        <input
          type="text"
          value={filters.orderNo}
          onChange={(event) => onFiltersChange({ orderNo: event.target.value })}
          placeholder={copy.searchOrderPlaceholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.sortByLabel}</span>
        <select
          value={filters.sortBy}
          onChange={(event) => onFiltersChange({ sortBy: event.target.value as SearchFilters["sortBy"] })}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
        >
          <option value="createdAt">{copy.sortByCreatedAt}</option>
          <option value="checkIn">{copy.sortByCheckIn}</option>
          <option value="totalAmount">{copy.sortByTotalAmount}</option>
          <option value="orderNo">{copy.sortByOrderNo}</option>
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.sortOrderLabel}</span>
        <select
          value={filters.sortOrder}
          onChange={(event) => onFiltersChange({ sortOrder: event.target.value as SearchFilters["sortOrder"] })}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
        >
          <option value="desc">{copy.sortOrderDesc}</option>
          <option value="asc">{copy.sortOrderAsc}</option>
        </select>
      </label>
      <div className="flex gap-2 lg:justify-end">
        <button
          type="button"
          onClick={onApplySearch}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 lg:flex-none"
        >
          {copy.applySearch}
        </button>
        <button
          type="button"
          onClick={onResetSearch}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 lg:flex-none"
        >
          {copy.resetSearch}
        </button>
      </div>
    </div>
  </div>
);
