import { BUTTON_THEME, INPUT_THEME } from "@/lib/button-theme";
import type { CustomerSectionProps } from "./tenant-dashboard-order-section.types";

type ReviewReplyCardProps = Pick<
  CustomerSectionProps,
  "reviewDrafts" | "onReviewDraftChange" | "onSubmitReply" | "reviewReplyLoadingId" | "formatDateTime"
> & { review: CustomerSectionProps["tenantReviews"][number] };

export const TenantDashboardReviewReplyCard = ({
  review,
  reviewDrafts,
  onReviewDraftChange,
  onSubmitReply,
  reviewReplyLoadingId,
  formatDateTime,
}: ReviewReplyCardProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{review.booking.property.name}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{review.user.fullName ?? review.user.email}</p>
        <p className="text-xs text-slate-500">{formatDateTime(review.createdAt)}</p>
      </div>
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        {"★".repeat(review.rating)} {review.rating}/5
      </span>
    </div>

    <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
    <div className="mt-4 space-y-2">
      {review.tenantReply ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-xs font-semibold text-emerald-700">Balasan Tenant</p>
          <p className="mt-1 text-sm text-slate-700">{review.tenantReply}</p>
          <p className="mt-2 text-xs text-slate-500">Dibalas pada: {formatDateTime(review.tenantRepliedAt)}</p>
        </div>
      ) : (
        <>
          <textarea
            value={reviewDrafts[review.id] ?? ""}
            onChange={(event) => onReviewDraftChange(review.id, event.target.value)}
            rows={3}
            placeholder="Tulis balasan untuk ulasan..."
            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
          />
          <button
            type="button"
            onClick={() => onSubmitReply(review.id)}
            disabled={reviewReplyLoadingId === review.id}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${BUTTON_THEME.solid} disabled:opacity-60`}
          >
            {reviewReplyLoadingId === review.id ? "Mengirim..." : "Kirim Balasan"}
          </button>
        </>
      )}
    </div>
  </div>
);
