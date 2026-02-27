import type { TenantOrderRow } from "./tenant-dashboard-booking.types";
import { TenantOrderProofIcon } from "./tenant-dashboard-order-proof-icon";
import type { OrderSectionProps } from "./tenant-dashboard-order-section.types";
import {
  canCancelOrderByTenant,
  canReviewPaymentProof,
  hasPaymentProofLink,
} from "./tenant-dashboard-order-section.utils";

type OrderTableProps = Pick<
  OrderSectionProps,
  | "filteredTransactionRows"
  | "getTransactionStatusMeta"
  | "formatDateTime"
  | "formatCurrency"
  | "onPaymentProofReview"
  | "onCancelOrderByTenant"
  | "paymentActionLoadingId"
>;

type OrderRowActionsProps = {
  order: TenantOrderRow;
} & Pick<OrderSectionProps, "onPaymentProofReview" | "onCancelOrderByTenant" | "paymentActionLoadingId">;

const OrderRowActions = ({
  order,
  onPaymentProofReview,
  onCancelOrderByTenant,
  paymentActionLoadingId,
}: OrderRowActionsProps) => (
  <div className="flex items-center justify-end gap-2">
    {canReviewPaymentProof(order) ? (
      <>
        <button
          type="button"
          onClick={() => onPaymentProofReview(order.paymentProofId, "approve")}
          disabled={paymentActionLoadingId === order.paymentProofId}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-60"
          aria-label="Setujui pembayaran"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
            <path d="M5 12L10 17L19 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onPaymentProofReview(order.paymentProofId, "reject")}
          disabled={paymentActionLoadingId === order.paymentProofId}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
          aria-label="Tolak pembayaran"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
            <path d="M6 6L18 18M6 18L18 6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </>
    ) : null}

    {canCancelOrderByTenant(order) ? (
      <button
        type="button"
        onClick={() => onCancelOrderByTenant(order.id, order.orderNo)}
        disabled={paymentActionLoadingId === order.id}
        className="flex h-9 items-center justify-center rounded-lg border border-amber-200 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
      >
        Batalkan
      </button>
    ) : null}

    <TenantOrderProofIcon imageUrl={hasPaymentProofLink(order) ? order.paymentProofImageUrl : null} />
  </div>
);

export const TenantOrderDesktopTable = ({
  filteredTransactionRows,
  getTransactionStatusMeta,
  formatDateTime,
  formatCurrency,
  onPaymentProofReview,
  onCancelOrderByTenant,
  paymentActionLoadingId,
}: OrderTableProps) => (
  <div className="hidden overflow-x-auto sm:block">
    <table className="w-full min-w-[980px] text-left text-sm">
      <thead className="border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
        <tr>
          <th className="px-6 py-4">No. Pesanan</th>
          <th className="px-6 py-4">Tamu</th>
          <th className="px-6 py-4">Properti</th>
          <th className="px-6 py-4">Check-in</th>
          <th className="px-6 py-4">Total</th>
          <th className="px-6 py-4">Net Payout</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {filteredTransactionRows.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-6 py-6 text-center text-sm text-slate-500">
              Tidak ada transaksi untuk filter ini.
            </td>
          </tr>
        ) : (
          filteredTransactionRows.map((order) => {
            const statusMeta = getTransactionStatusMeta(order.status);
            return (
              <tr key={order.id} className="hover:bg-slate-50/70">
                <td className="px-6 py-4 font-semibold text-slate-800">{order.orderNo}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{order.user}</td>
                <td className="px-6 py-4 text-slate-500">{order.property}</td>
                <td className="px-6 py-4 text-slate-500">{formatDateTime(order.checkIn)}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(order.total)}</td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{formatCurrency(order.netPayout)}</p>
                  <p className="text-xs text-slate-500">Fee tenant {formatCurrency(order.tenantFee)}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <OrderRowActions
                    order={order}
                    onPaymentProofReview={onPaymentProofReview}
                    onCancelOrderByTenant={onCancelOrderByTenant}
                    paymentActionLoadingId={paymentActionLoadingId}
                  />
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
