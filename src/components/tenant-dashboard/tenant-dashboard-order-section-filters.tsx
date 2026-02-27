import { INPUT_THEME } from "@/lib/button-theme";
import type { OrderSectionProps, StatusFilter } from "./tenant-dashboard-order-section.types";

type OrderFiltersProps = Pick<
  OrderSectionProps,
  | "statusFilter"
  | "onStatusFilterChange"
  | "transactionSearch"
  | "onTransactionSearchChange"
  | "transactionSortBy"
  | "onTransactionSortByChange"
  | "transactionSortOrder"
  | "onTransactionSortOrderChange"
  | "tenantPaymentProofsError"
  | "paymentActionError"
  | "paymentActionFeedback"
>;

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "MENUNGGU_PEMBAYARAN", label: "Menunggu" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DIPROSES", label: "Diproses" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
];

export const TenantOrderFilters = ({
  statusFilter,
  onStatusFilterChange,
  transactionSearch,
  onTransactionSearchChange,
  transactionSortBy,
  onTransactionSortByChange,
  transactionSortOrder,
  onTransactionSortOrderChange,
  tenantPaymentProofsError,
  paymentActionError,
  paymentActionFeedback,
}: OrderFiltersProps) => (
  <div className="border-b border-slate-200 bg-slate-50/60 p-4">
    <div className="flex gap-2 overflow-x-auto pb-1">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onStatusFilterChange(tab.value)}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
            statusFilter === tab.value
              ? "border border-cyan-200 bg-white text-cyan-900 shadow-sm"
              : "border border-transparent text-slate-600 hover:bg-cyan-50 hover:text-cyan-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    <div className="mt-4 flex gap-3">
      <div className="relative flex-1">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="7" strokeWidth="2" />
          <path d="M20 20L17 17" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={transactionSearch}
          onChange={(event) => onTransactionSearchChange(event.target.value)}
          placeholder="Cari nomor pesanan atau nama tamu"
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`}
        />
      </div>

      <select
        value={transactionSortBy}
        onChange={(event) =>
          onTransactionSortByChange(event.target.value as "submittedAt" | "total" | "checkIn" | "orderNo")
        }
        className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
        aria-label="Urutkan berdasarkan"
      >
        <option value="submittedAt">Urutkan: Waktu Pengajuan</option>
        <option value="checkIn">Urutkan: Check-in</option>
        <option value="total">Urutkan: Total</option>
        <option value="orderNo">Urutkan: No. Pesanan</option>
      </select>

      <select
        value={transactionSortOrder}
        onChange={(event) => onTransactionSortOrderChange(event.target.value as "asc" | "desc")}
        className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
        aria-label="Urutan"
      >
        <option value="desc">Terbaru</option>
        <option value="asc">Terlama</option>
      </select>
    </div>

    {tenantPaymentProofsError ? <p className="mt-3 text-xs text-rose-600">{tenantPaymentProofsError}</p> : null}
    {paymentActionError ? <p className="mt-3 text-xs text-rose-600">{paymentActionError}</p> : null}
    {paymentActionFeedback ? <p className="mt-3 text-xs text-emerald-700">{paymentActionFeedback}</p> : null}
  </div>
);
