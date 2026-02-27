import { BUTTON_THEME, INPUT_THEME } from "@/lib/button-theme";
import type { RoomSectionCopy } from "./tenant-dashboard-room-section.types";

type TenantRoomControlsPanelProps = {
  tenantCopy: RoomSectionCopy;
  selectedCalendarDates: string[];
  roomAvailabilityMode: "available" | "blocked";
  onRoomAvailabilityModeChange: (value: "available" | "blocked") => void;
  roomAdjustmentType: "NOMINAL" | "PERCENT";
  onRoomAdjustmentTypeChange: (value: "NOMINAL" | "PERCENT") => void;
  roomAdjustmentValue: string;
  onRoomAdjustmentValueChange: (value: string) => void;
  roomBasePrice: number;
  formatCurrency: (value: number) => string;
  roomActionError: string | null;
  roomActionSuccess: string | null;
  onApplyChanges: () => void;
  roomActionLoading: boolean;
};

type ModeButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

const ModeButton = ({ active, label, onClick }: ModeButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
      active ? BUTTON_THEME.solid : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`}
  >
    {label}
  </button>
);

export const TenantRoomControlsPanel = ({
  tenantCopy,
  selectedCalendarDates,
  roomAvailabilityMode,
  onRoomAvailabilityModeChange,
  roomAdjustmentType,
  onRoomAdjustmentTypeChange,
  roomAdjustmentValue,
  onRoomAdjustmentValueChange,
  roomBasePrice,
  formatCurrency,
  roomActionError,
  roomActionSuccess,
  onApplyChanges,
  roomActionLoading,
}: TenantRoomControlsPanelProps) => (
  <div className="surface-panel rounded-xl p-6">
    <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-5 text-sm text-slate-700">
      {selectedCalendarDates.length > 0 ? (
        <span>
          <span className="font-semibold text-slate-900">{selectedCalendarDates.length}</span>{" "}
          {tenantCopy.datesSelected}
        </span>
      ) : (
        <span>{tenantCopy.selectDateHint}</span>
      )}
    </div>

    <div className="mt-6">
      <p className="mb-3 text-sm font-semibold text-slate-700">{tenantCopy.availability}</p>
      <div className="flex gap-2">
        <ModeButton
          active={roomAvailabilityMode === "available"}
          label={tenantCopy.available}
          onClick={() => onRoomAvailabilityModeChange("available")}
        />
        <ModeButton
          active={roomAvailabilityMode === "blocked"}
          label={tenantCopy.closed}
          onClick={() => onRoomAvailabilityModeChange("blocked")}
        />
      </div>
    </div>

    <div className="mt-6">
      <p className="mb-3 text-sm font-semibold text-slate-700">{tenantCopy.priceAdjustment}</p>
      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => onRoomAdjustmentTypeChange("NOMINAL")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            roomAdjustmentType === "NOMINAL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          {tenantCopy.nominalLabel}
        </button>
        <button
          type="button"
          onClick={() => onRoomAdjustmentTypeChange("PERCENT")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            roomAdjustmentType === "PERCENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          {tenantCopy.percentageLabel}
        </button>
      </div>
      <div className="relative mt-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {roomAdjustmentType === "NOMINAL" ? "Rp" : "%"}
        </span>
        <input
          type="number"
          value={roomAdjustmentValue}
          onChange={(event) => onRoomAdjustmentValueChange(event.target.value)}
          placeholder={roomAdjustmentType === "NOMINAL" ? tenantCopy.exampleNominal : tenantCopy.examplePercent}
          className={`h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`}
        />
      </div>
      <p className="mt-3 text-sm text-slate-500">
        {tenantCopy.basePriceNow} <span className="font-semibold text-slate-700">{formatCurrency(roomBasePrice)}</span>
      </p>
    </div>

    {roomActionError ? <p className="mt-4 text-xs font-semibold text-rose-600">{roomActionError}</p> : null}
    {roomActionSuccess ? <p className="mt-4 text-xs font-semibold text-emerald-700">{roomActionSuccess}</p> : null}

    <button
      type="button"
      onClick={onApplyChanges}
      disabled={selectedCalendarDates.length === 0 || roomActionLoading}
      className={`mt-8 flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium ${BUTTON_THEME.solid} ${BUTTON_THEME.solidDisabled}`}
    >
      {roomActionLoading ? tenantCopy.applying : tenantCopy.applyChanges}
    </button>
  </div>
);
