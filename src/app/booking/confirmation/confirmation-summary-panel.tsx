import type { AppLocale } from "@/lib/app-locale";
import type { ConfirmationCopy } from "./confirmation-copy";
import type { BookingPreviewResponse } from "./confirmation-types";
import { formatDateShort, formatIDR } from "./confirmation-utils";

type BookingConfirmationSummaryPanelProps = {
  copy: ConfirmationCopy;
  locale: AppLocale;
  propertyName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  nights: number;
  previewLoading: boolean;
  previewError: string | null;
  preview: BookingPreviewResponse | null;
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span>{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

export const BookingConfirmationSummaryPanel = ({
  copy,
  locale,
  propertyName,
  roomName,
  checkIn,
  checkOut,
  totalGuests,
  nights,
  previewLoading,
  previewError,
  preview,
}: BookingConfirmationSummaryPanelProps) => {
  const pricing = preview?.pricing;

  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{copy.summary}</p>
        <p className="mt-3 text-sm font-semibold text-slate-900">{propertyName}</p>
        <p className="text-sm text-slate-500">{roomName}</p>
        <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <SummaryRow label={copy.checkIn} value={formatDateShort(checkIn)} />
          <SummaryRow label={copy.checkOut} value={formatDateShort(checkOut)} />
          <p className="border-t border-slate-200 pt-2 text-xs font-medium text-slate-600">
            {totalGuests} {copy.guests} · {nights} {copy.nights}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-100">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{copy.priceDetails}</p>
        {previewLoading ? <p className="mt-3 text-xs text-slate-500">{copy.loadingPriceDetails}</p> : null}
        {previewError ? <p className="mt-3 text-xs text-rose-600">{previewError}</p> : null}
        {pricing ? (
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <SummaryRow label={copy.roomSubtotal} value={String(formatIDR(pricing.roomSubtotal, locale))} />
            <SummaryRow
              label={
                pricing.breakfast.selected
                  ? `${copy.breakfast} (${pricing.breakfast.pax} pax × ${pricing.breakfast.nights} ${copy.nights})`
                  : copy.breakfast
              }
              value={String(formatIDR(pricing.breakfast.total, locale))}
            />
            <SummaryRow label={copy.appServiceFee} value={String(formatIDR(pricing.appFeeAmount, locale))} />
            <SummaryRow label={copy.tax} value={String(formatIDR(pricing.taxAmount, locale))} />
            <div className="mt-3 border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              {copy.total} {formatIDR(pricing.totalAmount, locale)}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
};
