import type { AppLocale } from "@/lib/app-locale";
import type { BookingStatus } from "./my-transaction-types";
import {
  formatStatusLabel,
  formatStatusOverviewLabel,
  statusBadgeClass,
} from "./my-transaction-status";

type MyTransactionStatusOverviewProps = {
  locale: AppLocale;
  groupedStatus: Record<BookingStatus, number>;
};

export const MyTransactionStatusOverview = ({
  locale,
  groupedStatus,
}: MyTransactionStatusOverviewProps) => (
  <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0">
    {(Object.keys(groupedStatus) as BookingStatus[]).map((status) => (
      <div
        key={status}
        title={formatStatusLabel(status, locale)}
        className={`flex min-w-[164px] items-center justify-between gap-2 rounded-xl border px-3 py-2 ${statusBadgeClass(status)}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">
          {formatStatusOverviewLabel(status, locale)}
        </p>
        <p className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/85 px-2 text-sm font-semibold text-slate-900">
          {groupedStatus[status]}
        </p>
      </div>
    ))}
  </div>
);
