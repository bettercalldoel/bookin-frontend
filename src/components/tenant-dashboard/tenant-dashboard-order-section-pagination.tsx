import { INPUT_THEME } from "@/lib/button-theme";
import type { OrderSectionProps } from "./tenant-dashboard-order-section.types";

type OrderPaginationProps = Pick<
  OrderSectionProps,
  | "filteredTransactionRows"
  | "tenantPaymentProofMeta"
  | "transactionLimit"
  | "onTransactionLimitChange"
  | "onPrevPage"
  | "onNextPage"
  | "tenantPaymentProofsLoading"
>;

export const TenantOrderPagination = ({
  filteredTransactionRows,
  tenantPaymentProofMeta,
  transactionLimit,
  onTransactionLimitChange,
  onPrevPage,
  onNextPage,
  tenantPaymentProofsLoading,
}: OrderPaginationProps) => (
  <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-xs text-slate-500">
      Menampilkan {filteredTransactionRows.length} dari {tenantPaymentProofMeta.total} transaksi.
    </p>
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-500" htmlFor="transaction-limit">
        Baris
      </label>
      <select
        id="transaction-limit"
        value={transactionLimit}
        onChange={(event) => onTransactionLimitChange(Number(event.target.value) || 10)}
        className={`h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 ${INPUT_THEME.focus}`}
      >
        {[5, 10, 20, 50].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onPrevPage}
        disabled={tenantPaymentProofsLoading || !tenantPaymentProofMeta.hasPrev}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sebelumnya
      </button>
      <span className="text-xs font-semibold text-slate-600">
        {tenantPaymentProofMeta.page} / {tenantPaymentProofMeta.totalPages}
      </span>
      <button
        type="button"
        onClick={onNextPage}
        disabled={tenantPaymentProofsLoading || !tenantPaymentProofMeta.hasNext}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Selanjutnya
      </button>
    </div>
  </div>
);
