import { formatDateShort } from "./confirmation-utils";
import type { ConfirmationCopy } from "./confirmation-copy";

type BookingConfirmationFinalModalProps = {
  open: boolean;
  copy: ConfirmationCopy;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  nights: number;
  paymentMethodLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

export const BookingConfirmationFinalModal = ({
  open,
  copy,
  checkIn,
  checkOut,
  totalGuests,
  nights,
  paymentMethodLabel,
  onClose,
  onConfirm,
}: BookingConfirmationFinalModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 sm:p-6" onClick={onClose}>
      <div
        className="mx-auto mt-16 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/25"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.recheckConfirm}</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{copy.isBookingDataCorrect}</h2>
        <p className="mt-1 text-sm text-slate-500">{copy.recheckHint}</p>

        <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{copy.checkIn}</span>
            <span className="font-semibold text-slate-900">{formatDateShort(checkIn)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{copy.checkOut}</span>
            <span className="font-semibold text-slate-900">{formatDateShort(checkOut)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{copy.duration}</span>
            <span className="font-semibold text-slate-900">
              {totalGuests} {copy.guests} · {nights} {copy.nights}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{copy.payMethod}</span>
            <span className="font-semibold text-slate-900">{paymentMethodLabel}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
          >
            {copy.recheck}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            {copy.yesContinue}
          </button>
        </div>
      </div>
    </div>
  );
};
