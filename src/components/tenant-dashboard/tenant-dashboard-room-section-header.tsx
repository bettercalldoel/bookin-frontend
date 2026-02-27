import type { RoomSectionCopy } from "./tenant-dashboard-room-section.types";

type RoomSectionHeaderProps = {
  tenantCopy: RoomSectionCopy;
  selectedPropertyName: string | null;
  onBackToProperty: () => void;
  roomMonthLabel: string;
  onShiftMonth: (delta: number) => void;
};

export const TenantRoomSectionHeader = ({
  tenantCopy,
  selectedPropertyName,
  onBackToProperty,
  roomMonthLabel,
  onShiftMonth,
}: RoomSectionHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBackToProperty}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
        aria-label={tenantCopy.backToPropertyAria}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <path d="M15 6L9 12L15 18" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div>
        <h2 className="font-display text-3xl text-slate-900">{tenantCopy.manageRoom}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {tenantCopy.managePriceFor}{" "}
          <span className="font-medium text-slate-900">{selectedPropertyName ?? tenantCopy.selectedProperty}</span>
        </p>
      </div>
    </div>

    <div className="flex w-full max-w-[250px] items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => onShiftMonth(-1)}
        className="rounded-md p-2 text-slate-500 transition hover:bg-slate-50"
        aria-label={tenantCopy.prevMonthAria}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
          <path d="M15 6L9 12L15 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="px-2 text-sm font-semibold text-slate-900">{roomMonthLabel}</span>
      <button
        type="button"
        onClick={() => onShiftMonth(1)}
        className="rounded-md p-2 text-slate-500 transition hover:bg-slate-50"
        aria-label={tenantCopy.nextMonthAria}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
          <path d="M9 6L15 12L9 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  </div>
);
