import type { TransactionCopy } from "./my-transaction-types";

type MyTransactionHeaderProps = {
  copy: TransactionCopy;
  loading: boolean;
  onRefresh: () => void;
};

export const MyTransactionHeader = ({ copy, loading, onRefresh }: MyTransactionHeaderProps) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">{copy.historyEyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900 lg:text-3xl">{copy.historyTitle}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">{copy.historySubtitle}</p>
    </div>
    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:flex-wrap lg:w-auto lg:justify-end">
      <a
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:flex-none sm:px-4"
      >
        {copy.backHome}
      </a>
      <a
        href="/my-review"
        className="inline-flex h-11 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100 sm:flex-none sm:px-4"
      >
        {copy.myReviews}
      </a>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:flex-none sm:px-4"
      >
        {loading ? copy.refreshing : copy.refresh}
      </button>
    </div>
  </div>
);
