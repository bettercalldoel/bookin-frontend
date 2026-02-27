import type { AppLocale } from "@/lib/app-locale";
import {
  buildStaySummary,
  formatDateTime,
  formatIDR,
  formatPaymentMethodLabel,
} from "@/components/my-transaction/my-transaction-shared";
import type { ReviewCopy, ReviewDraft, TransactionItem } from "./my-review-types";

type MyReviewPendingCardProps = {
  copy: ReviewCopy;
  trx: TransactionItem;
  locale: AppLocale;
  draft: ReviewDraft;
  highlighted: boolean;
  reviewSubmittingId: string | null;
  onDraftChange: (patch: Partial<ReviewDraft>) => void;
  onSubmit: () => void;
};

export const MyReviewPendingCard = ({
  copy,
  trx,
  locale,
  draft,
  highlighted,
  reviewSubmittingId,
  onDraftChange,
  onSubmit,
}: MyReviewPendingCardProps) => {
  const staySummary = buildStaySummary(trx.checkIn, trx.checkOut, locale);

  return (
    <article className={`rounded-2xl border bg-white px-4 py-4 shadow-sm lg:px-6 lg:py-5 ${highlighted ? "border-cyan-300 ring-2 ring-cyan-200" : "border-slate-200"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="break-all text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{trx.orderNo}</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{trx.roomType?.name ?? copy.fallbackRoomName}</p>
          <p className="text-sm text-slate-500">{copy.bookedAt}: {formatDateTime(trx.createdAt, locale)}</p>
        </div>
        <p className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900">
          {copy.total}: {formatIDR(trx.totalAmount, locale)}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <dl className="grid gap-2 text-sm sm:grid-cols-2 sm:gap-x-6">
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.stayPeriod}</dt>
            <dd className="font-semibold text-slate-900">{staySummary.periodLabel}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.duration}</dt>
            <dd className="font-semibold text-slate-900">{staySummary.nightsLabel}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.guestsRooms}</dt>
            <dd className="font-semibold text-slate-900">{trx.guests} / {trx.rooms}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.paymentMethod}</dt>
            <dd className="font-semibold text-slate-900">{formatPaymentMethodLabel(trx.paymentMethod, locale)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.writeReview}</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select value={draft.rating} onChange={(event) => onDraftChange({ rating: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm sm:w-52">
            {copy.ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onSubmit}
            disabled={reviewSubmittingId === trx.id}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:ml-auto sm:w-auto"
          >
            {reviewSubmittingId === trx.id ? copy.submittingReview : copy.submitReview}
          </button>
        </div>
        <textarea
          rows={3}
          value={draft.comment}
          onChange={(event) => onDraftChange({ comment: event.target.value })}
          placeholder={copy.reviewPlaceholder}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
        />
      </div>
    </article>
  );
};
