"use client";

import type { AvailabilityItem, AvailabilityResponse, ListingCopy, ListingLocale } from "./listing-types";
import { formatDisplayDate, formatIDRPlain } from "./listing-utils";

type Props = {
  copy: ListingCopy;
  locale: ListingLocale;
  availability: AvailabilityResponse | null;
  availabilityLoading: boolean;
  availabilityError: string | null;
  showCalendar: boolean;
  setShowCalendar: (next: boolean) => void;
  checkIn: string;
  checkOut: string;
  selectedNights: number;
  calendarMonthLabel: string;
  weekdayLabels: string[];
  calendarStart: string;
  onDateClick: (item: AvailabilityItem) => void;
};

export const ListingBookingDateSection = ({
  copy,
  locale,
  availability,
  availabilityLoading,
  availabilityError,
  showCalendar,
  setShowCalendar,
  checkIn,
  checkOut,
  selectedNights,
  calendarMonthLabel,
  weekdayLabels,
  calendarStart,
  onDateClick,
}: Props) => (
  <div className="rounded-2xl border border-slate-300 bg-white/90 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-800">2. {copy.chooseStayDate}</p>
      <button type="button" onClick={() => setShowCalendar(!showCalendar)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">
        {showCalendar ? copy.hideCalendar : copy.showCalendar}
      </button>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <DateCard label={copy.checkIn} value={formatDisplayDate(checkIn)} />
      <DateCard label={copy.checkOut} value={formatDisplayDate(checkOut)} />
    </div>
    {selectedNights > 0 ? <p className="mt-2 text-xs font-medium text-cyan-700">{selectedNights} {copy.nightsSelectedSuffix}</p> : null}
    {showCalendar ? (
      <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        {availabilityLoading ? <p className="text-xs text-slate-500">{copy.loadingCalendar}</p> : null}
        {availabilityError ? <p className="text-xs text-rose-600">{availabilityError}</p> : null}
        {availability ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{calendarMonthLabel}</p>
              <p className="text-[11px] text-slate-500">{copy.pricePerNightIDR}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
              <Legend color="border border-slate-300 bg-white" label={copy.available} />
              <Legend color="bg-cyan-600" label={copy.selected} className="text-cyan-700" />
              <Legend color="bg-slate-300" label={copy.unavailable} />
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500 sm:gap-2">{weekdayLabels.map((day) => <div key={day}>{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: new Date(`${calendarStart}T00:00:00`).getDay() }).map((_, index) => <div key={`empty-${index}`} />)}
              {availability.items.map((item) => <DateButton key={item.date} item={item} checkIn={checkIn} checkOut={checkOut} onClick={onDateClick} copy={copy} locale={locale} />)}
            </div>
          </div>
        ) : null}
      </div>
    ) : null}
  </div>
);

const DateCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
    <p className="text-[11px] font-medium text-slate-500">{label}</p>
    <p className="text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const Legend = ({ color, label, className = "" }: { color: string; label: string; className?: string }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <span className={`h-2.5 w-2.5 rounded-[3px] ${color}`} />
    {label}
  </span>
);

type DateButtonProps = {
  item: AvailabilityItem;
  checkIn: string;
  checkOut: string;
  onClick: (item: AvailabilityItem) => void;
  copy: ListingCopy;
  locale: ListingLocale;
};

const DateButton = ({ item, checkIn, checkOut, onClick, copy, locale }: DateButtonProps) => {
  const isDisabled = item.isClosed || item.availableUnits <= 0;
  const inRange = checkIn && item.date >= checkIn && (!checkOut || item.date <= checkOut);
  const isEdge = checkIn === item.date || checkOut === item.date;
  const buttonClass = isDisabled ? "border-slate-200 bg-slate-100 text-slate-400" : isEdge ? "border-cyan-700 bg-cyan-700 text-white shadow-sm" : inRange ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300";
  const metaClass = isDisabled ? "text-slate-400" : isEdge ? "text-white/80" : inRange ? "text-cyan-700" : "text-slate-500";
  return (
    <button type="button" onClick={() => onClick(item)} disabled={isDisabled} className={`flex h-16 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition ${buttonClass}`}>
      <span className="text-base font-semibold leading-none">{item.date.split("-")[2]}</span>
      <span className={`text-[9px] font-medium ${metaClass}`}>{isDisabled ? copy.full : formatIDRPlain(item.finalPrice, locale)}</span>
    </button>
  );
};
