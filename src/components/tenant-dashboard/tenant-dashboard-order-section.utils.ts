import type { TenantOrderRow } from "./tenant-dashboard-booking.types";

export const hasPaymentProofLink = (order: TenantOrderRow) => Boolean(order.paymentProofImageUrl);

export const canReviewPaymentProof = (order: TenantOrderRow) => {
  if (!hasPaymentProofLink(order)) return false;
  if (order.paymentProofStatus !== "SUBMITTED") return false;
  return (
    order.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN" || order.status === "MENUNGGU_PEMBAYARAN"
  );
};

export const canCancelOrderByTenant = (order: TenantOrderRow) =>
  order.status === "MENUNGGU_PEMBAYARAN" && !hasPaymentProofLink(order);
