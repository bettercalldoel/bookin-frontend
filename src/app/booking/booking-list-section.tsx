import type { AppLocale } from "@/lib/app-locale";
import {
  formatBookingStatus,
  formatDateTime,
  formatIDR,
} from "./booking-helpers";
import type { Booking } from "./booking-types";

type BookingListSectionProps = {
  copy: Record<string, string>;
  locale: AppLocale;
  bookings: Booking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
  onRefresh: () => void;
};

export const BookingListSection = ({
  copy,
  locale,
  bookings,
  bookingsLoading,
  bookingsError,
  onRefresh,
}: BookingListSectionProps) => (
  <section className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-lg font-semibold text-slate-900">{copy.listTitle}</h2>
      <button
        type="button"
        onClick={onRefresh}
        disabled={bookingsLoading}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {bookingsLoading ? copy.refreshing : copy.refreshStatus}
      </button>
    </div>

    {bookingsError ? <p className="text-xs text-rose-600">{bookingsError}</p> : null}
    {!bookingsLoading && bookings.length === 0 ? (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {copy.noOrders}
      </p>
    ) : null}

    {bookings.map((booking) => (
      <div key={booking.id} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
        <p>
          <strong>{copy.orderNo}:</strong> {booking.orderNo}
        </p>
        <p>
          <strong>{copy.date}:</strong> {formatDateTime(booking.checkIn, locale)} → {formatDateTime(booking.checkOut, locale)}
        </p>
        <p>
          <strong>{copy.guests}:</strong> {booking.guests}
        </p>
        <p>
          <strong>{copy.rooms}:</strong> {booking.rooms}
        </p>
        <p>
          <strong>{copy.status}:</strong> {formatBookingStatus(booking.status, locale)}
        </p>
        <p>
          <strong>{copy.total}:</strong> {formatIDR(booking.totalAmount, locale)}
        </p>
      </div>
    ))}
  </section>
);
