import type { ReviewCopy } from "./my-review-types";

type MyReviewHeaderProps = {
  copy: ReviewCopy;
  loading: boolean;
  onRefresh: () => void;
};

export const MyReviewHeader = ({ copy, loading, onRefresh }: MyReviewHeaderProps) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">{copy.pageEyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900 lg:text-3xl">{copy.pageTitle}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">{copy.pageSubtitle}</p>
    </div>
    <div className="flex w-full flex-wrap gap-2 lg:w-auto">
      <a
        href="/my-transaction"
        className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:flex-none"
      >
        {copy.backTransactions}
      </a>
      <a
        href="/"
        className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:flex-none"
      >
        {copy.backHome}
      </a>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:flex-none"
      >
        {loading ? copy.refreshing : copy.refresh}
      </button>
    </div>
  </div>
);
