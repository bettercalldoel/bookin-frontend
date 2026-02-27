import type { AppLocale } from "@/lib/app-locale";
import { formatIDR } from "./booking-helpers";
import type {
  BookingForm,
  BookingPreview,
  PropertyOption,
  RoomTypeOption,
} from "./booking-types";

type BookingCreateSectionProps = {
  copy: Record<string, string>;
  locale: AppLocale;
  form: BookingForm;
  properties: PropertyOption[];
  availableRooms: RoomTypeOption[];
  selectedProperty: PropertyOption | null;
  optionsLoading: boolean;
  optionsError: string | null;
  previewLoading: boolean;
  loading: boolean;
  previewError: string | null;
  preview: BookingPreview | null;
  onPropertyChange: (propertyId: string) => void;
  onRoomTypeChange: (value: string) => void;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  onGuestsChange: (value: number) => void;
  onRoomsChange: (value: number) => void;
  onPreviewBooking: () => void;
  onCreateBooking: () => void;
};

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none";

const BookingPreviewCard = ({
  copy,
  locale,
  preview,
}: {
  copy: Record<string, string>;
  locale: AppLocale;
  preview: BookingPreview;
}) => (
  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <h3 className="text-base font-semibold text-slate-900">{copy.previewTitle}</h3>
    <p className="mt-2 text-sm text-slate-700">
      <strong>{copy.total}:</strong> {formatIDR(preview.totalAmount, locale)}
    </p>
    <p className="text-sm text-slate-700">
      <strong>{copy.totalNights}:</strong> {preview.totalNights}
    </p>
    <div className="mt-3 space-y-2">
      {preview.nights.map((night) => (
        <div key={night.date} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <p>
            <strong>{night.date}</strong>
          </p>
          <p>{copy.basePrice}: {formatIDR(night.basePrice, locale)}</p>
          <p>{copy.adjustment}: {formatIDR(night.adjustment, locale)}</p>
          <p>{copy.finalPrice}: {formatIDR(night.finalPrice, locale)}</p>
          <p>{copy.stock}: {night.availableUnits}</p>
        </div>
      ))}
    </div>
  </div>
);

export const BookingCreateSection = ({
  copy,
  locale,
  form,
  properties,
  availableRooms,
  selectedProperty,
  optionsLoading,
  optionsError,
  previewLoading,
  loading,
  previewError,
  preview,
  onPropertyChange,
  onRoomTypeChange,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onRoomsChange,
  onPreviewBooking,
  onCreateBooking,
}: BookingCreateSectionProps) => (
  <section className="mb-8 mt-4">
    <h2 className="text-lg font-semibold text-slate-900">{copy.createTitle}</h2>
    <div className="mt-3 grid max-w-xl gap-3">
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        {copy.property}
        <select value={form.propertyId} onChange={(e) => onPropertyChange(e.target.value)} className={INPUT_CLASS}>
          <option value="">{copy.selectProperty}</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
              {property.city ? ` · ${property.city}` : ""}
            </option>
          ))}
        </select>
      </label>

      {optionsLoading ? <span className="text-xs text-slate-500">{copy.loadingPropertyList}</span> : null}
      {optionsError ? <span className="text-xs text-rose-600">{optionsError}</span> : null}

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        {copy.roomType}
        <select
          value={form.roomTypeId}
          onChange={(e) => onRoomTypeChange(e.target.value)}
          disabled={!form.propertyId}
          className={`${INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-slate-100`}
        >
          <option value="">{copy.selectRoom}</option>
          {availableRooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} · {formatIDR(room.basePrice, locale)}
            </option>
          ))}
        </select>
      </label>

      {selectedProperty ? (
        <div className="text-xs text-slate-600">
          {selectedProperty.address ?? ""}
          {selectedProperty.address && selectedProperty.city ? ", " : ""}
          {selectedProperty.city ?? ""}
          {selectedProperty.province ? `, ${selectedProperty.province}` : ""}
        </div>
      ) : null}

      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        {copy.checkIn}
        <input type="date" value={form.checkIn} onChange={(e) => onCheckInChange(e.target.value)} className={INPUT_CLASS} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        {copy.checkOut}
        <input type="date" value={form.checkOut} onChange={(e) => onCheckOutChange(e.target.value)} className={INPUT_CLASS} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        {copy.guests}
        <input type="number" min={1} value={form.guests} onChange={(e) => onGuestsChange(Number(e.target.value))} className={INPUT_CLASS} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        {copy.rooms}
        <input type="number" min={1} value={form.rooms} onChange={(e) => onRoomsChange(Number(e.target.value))} className={INPUT_CLASS} />
      </label>

      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        <button
          disabled={previewLoading}
          onClick={onPreviewBooking}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {previewLoading ? copy.previewing : copy.previewPrice}
        </button>
        <button
          disabled={loading}
          onClick={onCreateBooking}
          className="h-11 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? copy.creating : copy.createBooking}
        </button>
      </div>
    </div>

    {previewError ? <p className="mt-3 text-sm text-rose-600">{previewError}</p> : null}
    {preview ? <BookingPreviewCard copy={copy} locale={locale} preview={preview} /> : null}
  </section>
);
