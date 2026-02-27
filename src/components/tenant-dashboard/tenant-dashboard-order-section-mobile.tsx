import type { OrderSectionProps } from "./tenant-dashboard-order-section.types";
import { TenantOrderProofIcon } from "./tenant-dashboard-order-proof-icon";
import {
  canCancelOrderByTenant,
  canReviewPaymentProof,
  hasPaymentProofLink,
} from "./tenant-dashboard-order-section.utils";

type MobileOrderListProps = Pick<
  OrderSectionProps,
  | "filteredTransactionRows"
  | "getTransactionStatusMeta"
  | "formatDateTime"
  | "formatCurrency"
  | "onPaymentProofReview"
  | "onCancelOrderByTenant"
  | "paymentActionLoadingId"
>;

export const TenantOrderMobileList = ({
  filteredTransactionRows,
  getTransactionStatusMeta,
  formatDateTime,
  formatCurrency,
  onPaymentProofReview,
  onCancelOrderByTenant,
  paymentActionLoadingId,
}: MobileOrderListProps) => (
  <div className="divide-y divide-slate-100 sm:hidden">
    {filteredTransactionRows.length === 0 ? (
      <div className="px-4 py-6 text-center text-sm text-slate-500">Tidak ada transaksi untuk filter ini.</div>
    ) : (
      filteredTransactionRows.map((order) => {
        const statusMeta = getTransactionStatusMeta(order.status);
        return (
          <div key={order.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{order.orderNo}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{order.property}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                {statusMeta.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
              <div>
                <p className="text-xs text-slate-400">Tamu</p>
                <p>{order.user}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Check-in</p>
                <p>{formatDateTime(order.checkIn)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="font-semibold text-slate-900">{formatCurrency(order.total)}</p>
                <p className="mt-1 text-xs text-slate-500">Net payout {formatCurrency(order.netPayout)}</p>
                {order.breakfastSelected ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Sarapan {order.breakfastPax} pax · {formatCurrency(order.breakfastTotal)}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {canReviewPaymentProof(order) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onPaymentProofReview(order.paymentProofId, "approve")}
                      disabled={paymentActionLoadingId === order.paymentProofId}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600"
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
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600"
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
                    className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700"
                  >
                    Batalkan
                  </button>
                ) : null}

                <TenantOrderProofIcon
                  imageUrl={hasPaymentProofLink(order) ? order.paymentProofImageUrl : null}
                  linkClassName="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                />
              </div>
            </div>
          </div>
        );
      })
    )}
  </div>
);
