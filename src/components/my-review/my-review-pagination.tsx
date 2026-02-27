import type { ReviewCopy } from "./my-review-types";

type MyReviewPaginationProps = {
  copy: ReviewCopy;
  loading: boolean;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export const MyReviewPagination = ({
  copy,
  loading,
  page,
  totalPages,
  onPrev,
  onNext,
}: MyReviewPaginationProps) =>
  totalPages > 1 ? (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row">
      <p>{copy.pageInfo} {page} / {totalPages}</p>
      <div className="flex w-full gap-2 sm:w-auto">
        <button
          type="button"
          onClick={onPrev}
          disabled={loading || page <= 1}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60 sm:flex-none"
        >
          {copy.prevPage}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={loading || page >= totalPages}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:flex-none"
        >
          {copy.nextPage}
        </button>
      </div>
    </div>
  ) : null;
