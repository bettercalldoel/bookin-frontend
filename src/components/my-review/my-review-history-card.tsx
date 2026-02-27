import type { AppLocale } from "@/lib/app-locale";
import { buildStaySummary, formatDateTime } from "@/components/my-transaction/my-transaction-shared";
import type { ReviewCopy, TransactionItem } from "./my-review-types";

type MyReviewHistoryCardProps = {
  copy: ReviewCopy;
  trx: TransactionItem;
  locale: AppLocale;
};

const StarBadge = ({ rating }: { rating: number }) => (
  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
    <p className="text-sm font-semibold text-amber-700">{"★".repeat(Math.max(0, Math.min(5, rating)))}</p>
    <p className="text-xs font-semibold text-amber-700">{rating}/5</p>
  </div>
);

export const MyReviewHistoryCard = ({ copy, trx, locale }: MyReviewHistoryCardProps) => {
  const review = trx.review;
  if (!review) return null;
  const staySummary = buildStaySummary(trx.checkIn, trx.checkOut, locale);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm lg:px-6 lg:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="break-all text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{trx.orderNo}</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{trx.roomType?.name ?? copy.fallbackRoomName}</p>
          <p className="text-sm text-slate-500">{staySummary.periodLabel}</p>
        </div>
        <StarBadge rating={review.rating} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{copy.reviewSentAt}</p>
        <p className="mt-1 text-sm text-slate-500">{formatDateTime(review.createdAt, locale)}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.comment}</p>
      </div>

      {review.tenantReply ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">{copy.tenantReply}</p>
          <p className="mt-1 text-sm text-slate-700">{review.tenantReply}</p>
          {review.tenantRepliedAt ? (
            <p className="mt-2 text-xs text-emerald-700/90">{copy.tenantRepliedAt}: {formatDateTime(review.tenantRepliedAt, locale)}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};
