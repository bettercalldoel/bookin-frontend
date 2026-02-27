"use client";

import type { AvailabilityItem, AvailabilityResponse, ListingCopy, ListingLocale, ListingRoom } from "./listing-types";
import { formatIDR } from "./listing-utils";
import { ListingBookingBreakfastSection } from "./listing-booking-breakfast-section";
import { ListingBookingDateSection } from "./listing-booking-date-section";
import { ListingBookingGuestSection } from "./listing-booking-guest-section";

type Props = {
  copy: ListingCopy;
  locale: ListingLocale;
  rooms: ListingRoom[];
  selectedRoomId: string;
  selectedRoom: ListingRoom | null;
  onSelectRoom: (roomId: string) => void;
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
  guests: { adults: number; children: number };
  totalGuests: number;
  onChangeGuest: (key: "adults" | "children", delta: number) => void;
  breakfastEnabled: boolean;
  breakfastSelected: boolean;
  breakfastPricePerPax: number;
  breakfastPax: number;
  onSelectBreakfast: (selected: boolean) => void;
  onChangeBreakfastPax: (delta: number) => void;
  guestExceedsCapacity: boolean;
  canBook: boolean;
  bookingHelperText: string;
  onBook: () => void;
};

export const ListingBookingPanel = ({
  copy,
  locale,
  rooms,
  selectedRoomId,
  selectedRoom,
  onSelectRoom,
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
  guests,
  totalGuests,
  onChangeGuest,
  breakfastEnabled,
  breakfastSelected,
  breakfastPricePerPax,
  breakfastPax,
  onSelectBreakfast,
  onChangeBreakfastPax,
  guestExceedsCapacity,
  canBook,
  bookingHelperText,
  onBook,
}: Props) => (
  <div className="surface-panel space-y-5 rounded-[28px] p-6">
    <div className="rounded-2xl border border-cyan-100/80 bg-linear-to-br from-cyan-50/80 via-white to-teal-50/80 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-600">{copy.bookingPriceFrom}</p>
          <p className="text-2xl font-semibold text-slate-900">{selectedRoom ? formatIDR(selectedRoom.basePrice, locale) : copy.chooseRoom}</p>
        </div>
        <p className="text-xs text-slate-500">{copy.perNight}</p>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{copy.finalPriceHint}</p>
    </div>
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-800">1. {copy.chooseRoom}</span>
      <select value={selectedRoomId} onChange={(event) => onSelectRoom(event.target.value)} className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 focus:border-cyan-500 focus:outline-hidden focus:ring-4 focus:ring-cyan-100">
        {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {formatIDR(room.basePrice, locale)}</option>)}
      </select>
    </label>
    <ListingBookingDateSection copy={copy} locale={locale} availability={availability} availabilityLoading={availabilityLoading} availabilityError={availabilityError} showCalendar={showCalendar} setShowCalendar={setShowCalendar} checkIn={checkIn} checkOut={checkOut} selectedNights={selectedNights} calendarMonthLabel={calendarMonthLabel} weekdayLabels={weekdayLabels} calendarStart={calendarStart} onDateClick={onDateClick} />
    <ListingBookingGuestSection copy={copy} guests={guests} totalGuests={totalGuests} onChangeGuest={onChangeGuest} />
    {guestExceedsCapacity && selectedRoom ? <p className="text-xs text-rose-600">{copy.maxCapacityPrefix} {selectedRoom.maxGuests} {copy.guestUnit}.</p> : null}
    <ListingBookingBreakfastSection copy={copy} locale={locale} breakfastEnabled={breakfastEnabled} breakfastSelected={breakfastSelected} breakfastPricePerPax={breakfastPricePerPax} breakfastPax={breakfastPax} totalGuests={totalGuests} onSelectBreakfast={onSelectBreakfast} onChangeBreakfastPax={onChangeBreakfastPax} />
    <button type="button" onClick={onBook} disabled={!canBook} className={`w-full rounded-xl border px-6 py-3 text-sm font-semibold transition ${canBook ? "border-transparent bg-linear-to-r from-teal-700 to-cyan-700 text-white shadow-[0_12px_24px_-16px_rgba(8,145,178,0.8)] hover:from-teal-600 hover:to-cyan-600" : "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500"}`}>
      {canBook ? copy.bookNow : copy.completeBookingData}
    </button>
    <p className={`text-xs ${canBook ? "text-cyan-700" : "text-slate-500"}`}>{bookingHelperText}</p>
  </div>
);
