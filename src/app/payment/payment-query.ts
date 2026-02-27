import type { ReadonlyURLSearchParams } from "next/navigation";
import type { PaymentMethod, PaymentQueryData } from "./payment-types";

const readValue = (searchParams: ReadonlyURLSearchParams, key: string) =>
  searchParams.get(key) ?? "";

export const getPaymentQueryData = (
  searchParams: ReadonlyURLSearchParams,
): PaymentQueryData => ({
  bookingId: readValue(searchParams, "bookingId"),
  orderNo: readValue(searchParams, "orderNo"),
  total: readValue(searchParams, "total"),
  paymentDueAt: readValue(searchParams, "paymentDueAt"),
  propertyName: readValue(searchParams, "propertyName"),
  roomName: readValue(searchParams, "roomName"),
  checkIn: readValue(searchParams, "checkIn"),
  checkOut: readValue(searchParams, "checkOut"),
  paymentMethod: (searchParams.get("paymentMethod") ?? "MANUAL_TRANSFER") as PaymentMethod,
  xenditInvoiceUrl: readValue(searchParams, "xenditInvoiceUrl"),
  subtotalAmount: readValue(searchParams, "subtotalAmount"),
  roomSubtotal: readValue(searchParams, "roomSubtotal"),
  breakfastSelected: searchParams.get("breakfastSelected") === "true",
  breakfastPax: readValue(searchParams, "breakfastPax"),
  breakfastUnitPrice: readValue(searchParams, "breakfastUnitPrice"),
  breakfastTotal: readValue(searchParams, "breakfastTotal"),
  appFeeAmount: readValue(searchParams, "appFeeAmount"),
  taxAmount: readValue(searchParams, "taxAmount"),
});
