import { INPUT_THEME } from "@/lib/button-theme";
import type {
  AvailabilityPropertyOption,
  RoomCalendarCell,
  RoomOption,
  RoomSectionCopy,
} from "./tenant-dashboard-room-section.types";

type TenantRoomCalendarPanelProps = {
  tenantCopy: RoomSectionCopy;
  selectedPropertyId: string;
  onSelectedPropertyIdChange: (value: string) => void;
  propertiesLoading: boolean;
  availabilityProperties: AvailabilityPropertyOption[];
  selectedRoomId: string;
  onSelectedRoomIdChange: (value: string) => void;
  hasSelectedProperty: boolean;
  availableRooms: RoomOption[];
  propertiesError: string | null;
  availabilityError: string | null;
  roomWeekdayLabels: string[];
  availabilityLoading: boolean;
  roomCalendarCells: RoomCalendarCell[];
  selectedCalendarDates: string[];
  selectedRoomTotalUnits: number;
  roomBasePrice: number;
  formatDateInput: (date: Date) => string;
  formatCurrency: (value: number) => string;
  onToggleCalendarDate: (dateValue: string) => void;
};

const renderCalendarCell = (
  cell: Exclude<RoomCalendarCell, null>,
  props: TenantRoomCalendarPanelProps,
) => {
  const isSelected = props.selectedCalendarDates.includes(cell.date);
  const isToday = cell.date === props.formatDateInput(new Date());
  const units = cell.item?.availableUnits ?? props.selectedRoomTotalUnits;
  const status = cell.item?.isClosed ? "Blocked" : units <= 0 ? "Booked" : "Available";
  const price = Number(cell.item?.finalPrice ?? props.roomBasePrice);
  const basePrice = Number(cell.item?.basePrice ?? props.roomBasePrice);
  const isPeak = Number.isFinite(price) && Number.isFinite(basePrice) && price > basePrice;

  return (
    <button
      key={cell.date}
      type="button"
      onClick={() => props.onToggleCalendarDate(cell.date)}
      className={`min-h-[120px] border-b border-r border-slate-100 p-2 text-left transition ${
        isSelected ? "bg-slate-100 ring-2 ring-inset ring-slate-900" : "bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
            isToday ? "bg-slate-900 text-white" : "text-slate-900"
          }`}
        >
          {cell.day}
        </span>
        {isPeak ? (
          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
            {props.tenantCopy.peak}
          </span>
        ) : null}
      </div>
      <div className="mt-5 space-y-1">
        <p
          className={`text-sm font-bold ${
            status === "Blocked" ? "text-slate-400 line-through" : "text-slate-900"
          }`}
        >
          {props.formatCurrency(Number.isFinite(price) ? price : 0)}
        </p>
        <span
          className={`inline-block w-full rounded px-2 py-1 text-xs font-semibold ${
            status === "Available"
              ? "bg-emerald-100 text-emerald-700"
              : status === "Booked"
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-200 text-slate-500"
          }`}
        >
          {status === "Available"
            ? props.tenantCopy.available
            : status === "Booked"
              ? props.tenantCopy.booked
              : props.tenantCopy.closed}
        </span>
      </div>
    </button>
  );
};

export const TenantRoomCalendarPanel = (props: TenantRoomCalendarPanelProps) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
    <div className="border-b border-slate-200 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {props.tenantCopy.property}
          </span>
          <select
            value={props.selectedPropertyId}
            onChange={(event) => props.onSelectedPropertyIdChange(event.target.value)}
            className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
            disabled={props.propertiesLoading}
          >
            <option value="">{props.tenantCopy.selectProperty}</option>
            {props.availabilityProperties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {props.tenantCopy.room}
          </span>
          <select
            value={props.selectedRoomId}
            onChange={(event) => props.onSelectedRoomIdChange(event.target.value)}
            className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
            disabled={!props.hasSelectedProperty}
          >
            <option value="">{props.tenantCopy.selectRoom}</option>
            {props.availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {props.propertiesError ? <p className="mt-2 text-xs text-rose-600">{props.propertiesError}</p> : null}
      {props.availabilityError ? <p className="mt-2 text-xs text-rose-600">{props.availabilityError}</p> : null}
    </div>

    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
      {props.roomWeekdayLabels.map((day) => (
        <div key={day} className="py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {day}
        </div>
      ))}
    </div>

    {props.availabilityLoading ? (
      <div className="px-4 py-6 text-sm text-slate-500">{props.tenantCopy.loadingCalendar}</div>
    ) : null}

    <div className="grid grid-cols-7">
      {props.roomCalendarCells.map((cell, index) =>
        cell ? (
          renderCalendarCell(cell, props)
        ) : (
          <div
            key={`empty-${index}`}
            className="min-h-[120px] border-b border-r border-slate-100 bg-slate-50/40"
          />
        ),
      )}
    </div>
  </div>
);
