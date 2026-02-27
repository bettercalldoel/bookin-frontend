import { INPUT_THEME } from "@/lib/button-theme";
import type { CustomerSectionProps } from "./tenant-dashboard-order-section.types";
import { TenantDashboardReviewReplyCard } from "./tenant-dashboard-review-reply-card";

const FeedbackBanner = ({
  message,
  type,
}: {
  message: string | null;
  type: "error" | "success";
}) => {
  if (!message) return null;
  const className =
    type === "error"
      ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700";
  return <div className={className}>{message}</div>;
};

export function TenantCustomerRelationsSection({
  reviewSearch,
  onReviewSearchChange,
  reviewRepliedFilter,
  onReviewRepliedFilterChange,
  reviewSortBy,
  onReviewSortByChange,
  reviewSortOrder,
  onReviewSortOrderChange,
  tenantReviewsError,
  reviewReplyFeedback,
  tenantReviewsLoading,
  tenantReviews,
  reviewDrafts,
  onReviewDraftChange,
  onSubmitReply,
  reviewReplyLoadingId,
  formatDateTime,
  reviewLimit,
  onReviewLimitChange,
  reviewPage,
  reviewTotalPages,
  onPrevPage,
  onNextPage,
}: CustomerSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">Ulasan & Balasan</p>
        <h2 className="text-2xl font-semibold text-slate-900">Balas ulasan pengguna</h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            value={reviewSearch}
            onChange={(event) => onReviewSearchChange(event.target.value)}
            placeholder="Cari order, properti, user, komentar"
            className={`h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 xl:col-span-2 ${INPUT_THEME.focus}`}
          />
          <select
            value={reviewRepliedFilter}
            onChange={(event) => onReviewRepliedFilterChange(event.target.value as "all" | "true" | "false")}
            className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
          >
            <option value="all">Semua status</option>
            <option value="false">Belum dibalas</option>
            <option value="true">Sudah dibalas</option>
          </select>
          <select
            value={reviewSortBy}
            onChange={(event) => onReviewSortByChange(event.target.value as "createdAt" | "rating")}
            className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
          >
            <option value="createdAt">Urutkan: tanggal review</option>
            <option value="rating">Urutkan: rating</option>
          </select>
          <select
            value={reviewSortOrder}
            onChange={(event) => onReviewSortOrderChange(event.target.value as "asc" | "desc")}
            className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
          >
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
        </div>
      </div>

      <FeedbackBanner message={tenantReviewsError} type="error" />
      <FeedbackBanner message={reviewReplyFeedback} type="success" />

      {tenantReviewsLoading ? <p className="text-xs text-slate-500">Memuat ulasan pengguna...</p> : null}
      {!tenantReviewsLoading && tenantReviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
          Tidak ada ulasan sesuai filter saat ini.
        </div>
      ) : null}

      <div className="grid gap-4">
        {tenantReviews.map((review) => (
          <TenantDashboardReviewReplyCard
            key={review.id}
            review={review}
            reviewDrafts={reviewDrafts}
            onReviewDraftChange={onReviewDraftChange}
            onSubmitReply={onSubmitReply}
            reviewReplyLoadingId={reviewReplyLoadingId}
            formatDateTime={formatDateTime}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="text-xs text-slate-500">
          Baris:
          <select
            value={reviewLimit}
            onChange={(event) => onReviewLimitChange(Number(event.target.value) || 10)}
            className={`ml-2 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 ${INPUT_THEME.focus}`}
          >
            {[5, 10, 20, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onPrevPage}
          disabled={tenantReviewsLoading || reviewPage <= 1}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <span className="text-xs font-semibold text-slate-600">
          {reviewPage} / {reviewTotalPages}
        </span>
        <button
          type="button"
          onClick={onNextPage}
          disabled={tenantReviewsLoading || reviewPage >= reviewTotalPages}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}
