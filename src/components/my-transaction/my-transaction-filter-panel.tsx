import type { SearchFilters, TransactionCopy } from "./my-transaction-types";

type MyTransactionFilterPanelProps = {
  copy: TransactionCopy;
  filters: SearchFilters;
  onFiltersChange: (patch: Partial<SearchFilters>) => void;
  onApplySearch: () => void;
  onResetSearch: () => void;
};

export const MyTransactionFilterPanel = ({
  copy,
  filters,
  onFiltersChange,
  onApplySearch,
  onResetSearch,
}: MyTransactionFilterPanelProps) => (
  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
      <label className="block space-y-1.5 md:col-span-2 lg:col-span-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.searchOrderLabel}</span>
        <input
          type="text"
          value={filters.orderNo}
          onChange={(event) => onFiltersChange({ orderNo: event.target.value })}
          aria-label={copy.searchOrderLabel}
          placeholder={copy.searchOrderPlaceholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.sortByLabel}</span>
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
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.sortOrderLabel}</span>
        <select
          value={filters.sortOrder}
          onChange={(event) => onFiltersChange({ sortOrder: event.target.value as SearchFilters["sortOrder"] })}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
        >
          <option value="desc">{copy.sortOrderDesc}</option>
          <option value="asc">{copy.sortOrderAsc}</option>
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.searchStartDate}</span>
        <input
          type="date"
          value={filters.startDate}
          onChange={(event) => onFiltersChange({ startDate: event.target.value })}
          aria-label={copy.searchStartDate}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.searchEndDate}</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(event) => onFiltersChange({ endDate: event.target.value })}
          aria-label={copy.searchEndDate}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
        />
      </label>
      <div className="grid grid-cols-2 gap-2 md:col-span-2 lg:col-span-1 lg:flex lg:justify-end">
        <button
          type="button"
          onClick={onApplySearch}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 lg:flex-none"
        >
          {copy.applySearch}
        </button>
        <button
          type="button"
          onClick={onResetSearch}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-slate-300 lg:flex-none"
        >
          {copy.resetSearch}
        </button>
      </div>
    </div>
  </div>
);
