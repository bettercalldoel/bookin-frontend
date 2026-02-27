import type { ReviewCopy, ReviewView } from "./my-review-types";

type MyReviewViewToggleProps = {
  copy: ReviewCopy;
  reviewView: ReviewView;
  pendingCount: number;
  historyCount: number;
  onChange: (next: ReviewView) => void;
};

const ToggleButton = ({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition sm:flex-none ${
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`}
  >
    <span>{label}</span>
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
      {count}
    </span>
  </button>
);

export const MyReviewViewToggle = ({
  copy,
  reviewView,
  pendingCount,
  historyCount,
  onChange,
}: MyReviewViewToggleProps) => (
  <div className="mt-6 inline-flex w-full rounded-2xl border border-slate-200 bg-white p-1 sm:w-auto">
    <ToggleButton active={reviewView === "pending"} label={copy.pendingTitle} count={pendingCount} onClick={() => onChange("pending")} />
    <ToggleButton active={reviewView === "history"} label={copy.historyTitle} count={historyCount} onClick={() => onChange("history")} />
  </div>
);
