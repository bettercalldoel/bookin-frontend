import type { ConfirmationCopy } from "./confirmation-copy";
import type { BookerForm, BookerProfileData, PaymentMethod } from "./confirmation-types";
import { formatIDR } from "./confirmation-utils";

type BookingConfirmationBookerPanelProps = {
  copy: ConfirmationCopy;
  locale: "id" | "en";
  isBookerSelf: boolean;
  selfBookerData: BookerProfileData | null;
  bookerProfileLoading: boolean;
  bookerProfileError: string | null;
  form: BookerForm;
  breakfastEnabled: boolean;
  breakfastSelected: boolean;
  breakfastPax: number;
  breakfastPricePerPax: number;
  totalGuests: number;
  canSubmit: boolean;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onBookerSelfChange: (checked: boolean) => void;
  onFormChange: (patch: Partial<BookerForm>) => void;
  onBreakfastSelectedChange: (checked: boolean) => void;
  onBreakfastPaxChange: (next: number) => void;
  onOpenConfirm: () => void;
};

const UserInfoLine = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    <p className="text-sm font-medium text-slate-900">{value.trim() || "-"}</p>
  </div>
);

export const BookingConfirmationBookerPanel = ({
  copy,
  locale,
  isBookerSelf,
  selfBookerData,
  bookerProfileLoading,
  bookerProfileError,
  form,
  breakfastEnabled,
  breakfastSelected,
  breakfastPax,
  breakfastPricePerPax,
  totalGuests,
  canSubmit,
  loading,
  error,
  onBack,
  onBookerSelfChange,
  onFormChange,
  onBreakfastSelectedChange,
  onBreakfastPaxChange,
  onOpenConfirm,
}: BookingConfirmationBookerPanelProps) => (
  <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">{copy.bookingConfirm}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{copy.fillBookerData}</h1>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
      >
        {copy.back}
      </button>
    </div>

    <div className="space-y-4">
      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isBookerSelf}
          disabled={bookerProfileLoading || !selfBookerData}
          onChange={(event) => onBookerSelfChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900"
        />
        <span className="space-y-1">
          <span className="block font-semibold text-slate-900">{copy.selfBooker}</span>
          <span className="block text-xs text-slate-500">{copy.selfBookerHint}</span>
          {bookerProfileLoading ? <span className="block text-xs text-slate-500">{copy.loadingAccount}</span> : null}
        </span>
      </label>

      {bookerProfileError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          {bookerProfileError}
        </div>
      ) : null}

      {isBookerSelf ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">{copy.accountDataFromProfile}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <UserInfoLine label={copy.name} value={form.name} />
            <UserInfoLine label={copy.email} value={form.email} />
            <UserInfoLine label={copy.phone} value={form.phone} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            {copy.bookerName}
            <input
              value={form.name}
              onChange={(event) => onFormChange({ name: event.target.value })}
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
              placeholder={copy.inputFullName}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            {copy.bookerEmail}
            <input
              type="email"
              value={form.email}
              onChange={(event) => onFormChange({ email: event.target.value })}
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
              placeholder="email@contoh.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
            {copy.bookerPhone}
            <input
              value={form.phone}
              onChange={(event) => onFormChange({ phone: event.target.value })}
              className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
              placeholder="08xxxxxxxxxx"
            />
          </label>
        </div>
      )}

      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
        {copy.paymentMethod}
        <select
          value={form.paymentMethod}
          onChange={(event) => onFormChange({ paymentMethod: event.target.value as PaymentMethod })}
          className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"
        >
          <option value="MANUAL_TRANSFER">{copy.manualTransfer}</option>
          <option value="XENDIT">{copy.paymentGateway}</option>
        </select>
      </label>
    </div>

    {breakfastEnabled ? (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.breakfastOption}</p>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
          <span className="font-semibold">
            {copy.addBreakfast} ({formatIDR(breakfastPricePerPax, locale)}/pax/{copy.nights})
          </span>
          <input
            type="checkbox"
            checked={breakfastSelected}
            onChange={(event) => onBreakfastSelectedChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900"
          />
        </label>
        {breakfastSelected ? (
          <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
            <span>{copy.breakfastPaxCount}</span>
            <input
              type="number"
              min={1}
              max={Math.max(1, totalGuests)}
              value={breakfastPax}
              onChange={(event) => onBreakfastPaxChange(Number(event.target.value))}
              className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm"
            />
          </label>
        ) : null}
      </div>
    ) : null}

    {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

    <button
      type="button"
      onClick={onOpenConfirm}
      disabled={!canSubmit || loading}
      className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${canSubmit && !loading ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300"}`}
    >
      {loading ? copy.processing : copy.confirmBooking}
    </button>
  </section>
);
