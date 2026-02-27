import type { AppLocale } from "@/lib/app-locale";
import {
  buildStaySummary,
  formatDateTime,
  formatIDR,
  formatPaymentMethodLabel,
} from "./my-transaction-shared";
import {
  formatStatusLabel,
  statusBadgeClass,
} from "./my-transaction-status";
import type { TransactionCopy, TransactionItem } from "./my-transaction-types";

type MyTransactionCardProps = {
  trx: TransactionItem;
  copy: TransactionCopy;
  locale: AppLocale;
};

const PriceBreakdown = ({
  trx,
  copy,
  locale,
}: {
  trx: TransactionItem;
  copy: TransactionCopy;
  locale: AppLocale;
}) => {
  if (!trx.subtotalAmount && !trx.appFeeAmount && !trx.taxAmount) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
      <div className="flex items-start justify-between gap-3 py-0.5">
        <span>{copy.roomSubtotal}</span>
        <span className="shrink-0 text-right font-semibold text-slate-900">{formatIDR(trx.roomSubtotal ?? "0", locale)}</span>
      </div>
      <div className="flex items-start justify-between gap-3 py-0.5">
        <span>
          {copy.breakfast}
          {trx.breakfastSelected && (trx.breakfastPax ?? 0) > 0 ? ` (${trx.breakfastPax} pax)` : ""}
        </span>
        <span className="shrink-0 text-right font-semibold text-slate-900">{formatIDR(trx.breakfastTotal ?? "0", locale)}</span>
      </div>
      <div className="flex items-start justify-between gap-3 border-t border-slate-100 pt-1.5">
        <span>{copy.subtotal}</span>
        <span className="shrink-0 text-right font-semibold text-slate-900">{formatIDR(trx.subtotalAmount ?? "0", locale)}</span>
      </div>
      <div className="flex items-start justify-between gap-3 py-0.5">
        <span>{copy.appFee}</span>
        <span className="shrink-0 text-right font-semibold text-slate-900">{formatIDR(trx.appFeeAmount ?? "0", locale)}</span>
      </div>
      <div className="flex items-start justify-between gap-3 py-0.5">
        <span>{copy.tax}</span>
        <span className="shrink-0 text-right font-semibold text-slate-900">{formatIDR(trx.taxAmount ?? "0", locale)}</span>
      </div>
    </div>
  );
};

export const MyTransactionCard = ({ trx, copy, locale }: MyTransactionCardProps) => {
  const staySummary = buildStaySummary(trx.checkIn, trx.checkOut, locale);
  const canReview = trx.status === "SELESAI" && !trx.review;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:px-6 lg:py-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="break-all text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:tracking-[0.2em]">{trx.orderNo}</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{trx.roomType?.name ?? copy.fallbackRoomName}</p>
          <p className="text-sm text-slate-500">{copy.bookedAt}: {formatDateTime(trx.createdAt, locale)}</p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 lg:flex-col lg:items-end lg:justify-start lg:bg-transparent lg:px-0 lg:py-0">
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusBadgeClass(trx.status)}`}>
            {formatStatusLabel(trx.status, locale)}
          </span>
          <p className="text-base font-semibold text-slate-900">{copy.total}: {formatIDR(trx.totalAmount, locale)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <dl className="grid gap-y-3 text-sm sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2">
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.stayPeriod}</dt>
            <dd className="text-[15px] font-semibold leading-snug text-slate-900">{staySummary.periodLabel}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.duration}</dt>
            <dd className="text-[15px] font-semibold leading-snug text-slate-900">{staySummary.nightsLabel}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.guestsRooms}</dt>
            <dd className="text-[15px] font-semibold leading-snug text-slate-900">{trx.guests} / {trx.rooms}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.paymentMethod}</dt>
            <dd className="text-[15px] font-semibold leading-snug text-slate-900">{formatPaymentMethodLabel(trx.paymentMethod, locale)}</dd>
          </div>
        </dl>
      </div>

      <PriceBreakdown trx={trx} copy={copy} locale={locale} />

      {trx.status === "MENUNGGU_PEMBAYARAN" && trx.paymentMethod === "XENDIT" && trx.xenditInvoiceUrl ? (
        <a
          href={trx.xenditInvoiceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        >
          {copy.payNow}
        </a>
      ) : null}

      {canReview ? (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-cyan-200 bg-cyan-50/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-cyan-900">{copy.reviewNeeded}</p>
          <a
            href={`/my-review?bookingId=${encodeURIComponent(trx.id)}`}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            {copy.writeReview}
          </a>
        </div>
      ) : null}
    </article>
  );
};
