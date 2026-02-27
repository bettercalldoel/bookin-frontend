import { TenantOrderFilters } from "./tenant-dashboard-order-section-filters";
import { TenantOrderMobileList } from "./tenant-dashboard-order-section-mobile";
import { TenantOrderPagination } from "./tenant-dashboard-order-section-pagination";
import { TenantOrderDesktopTable } from "./tenant-dashboard-order-section-table";
import type { OrderSectionProps } from "./tenant-dashboard-order-section.types";

export function TenantOrderManagementSection({
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
  filteredTransactionRows,
  getTransactionStatusMeta,
  formatDateTime,
  formatCurrency,
  onPaymentProofReview,
  onCancelOrderByTenant,
  paymentActionLoadingId,
  tenantPaymentProofMeta,
  tenantPaymentProofsLoading,
  transactionLimit,
  onTransactionLimitChange,
  onPrevPage,
  onNextPage,
}: OrderSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-slate-900">Transaksi</h2>
        <p className="mt-1 text-sm text-slate-500">Kelola pesanan dan konfirmasi pembayaran.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/88 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
        <TenantOrderFilters
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          transactionSearch={transactionSearch}
          onTransactionSearchChange={onTransactionSearchChange}
          transactionSortBy={transactionSortBy}
          onTransactionSortByChange={onTransactionSortByChange}
          transactionSortOrder={transactionSortOrder}
          onTransactionSortOrderChange={onTransactionSortOrderChange}
          tenantPaymentProofsError={tenantPaymentProofsError}
          paymentActionError={paymentActionError}
          paymentActionFeedback={paymentActionFeedback}
        />

        <TenantOrderDesktopTable
          filteredTransactionRows={filteredTransactionRows}
          getTransactionStatusMeta={getTransactionStatusMeta}
          formatDateTime={formatDateTime}
          formatCurrency={formatCurrency}
          onPaymentProofReview={onPaymentProofReview}
          onCancelOrderByTenant={onCancelOrderByTenant}
          paymentActionLoadingId={paymentActionLoadingId}
        />

        <TenantOrderMobileList
          filteredTransactionRows={filteredTransactionRows}
          getTransactionStatusMeta={getTransactionStatusMeta}
          formatDateTime={formatDateTime}
          formatCurrency={formatCurrency}
          onPaymentProofReview={onPaymentProofReview}
          onCancelOrderByTenant={onCancelOrderByTenant}
          paymentActionLoadingId={paymentActionLoadingId}
        />

        <TenantOrderPagination
          filteredTransactionRows={filteredTransactionRows}
          tenantPaymentProofMeta={tenantPaymentProofMeta}
          transactionLimit={transactionLimit}
          onTransactionLimitChange={onTransactionLimitChange}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
          tenantPaymentProofsLoading={tenantPaymentProofsLoading}
        />
      </div>
    </div>
  );
}
