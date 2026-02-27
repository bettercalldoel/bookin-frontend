import { TenantRoomCalendarPanel } from "./tenant-dashboard-room-section-calendar";
import { TenantRoomControlsPanel } from "./tenant-dashboard-room-section-controls";
import { TenantRoomSectionHeader } from "./tenant-dashboard-room-section-header";
import { TenantRoomRateRules } from "./tenant-dashboard-room-section-rate-rules";
import type { RoomManagementSectionProps } from "./tenant-dashboard-room-section.types";

export function TenantRoomManagementSection({
  tenantCopy,
  selectedPropertyName,
  onBackToProperty,
  roomMonthLabel,
  onShiftMonth,
  selectedPropertyId,
  onSelectedPropertyIdChange,
  propertiesLoading,
  availabilityProperties,
  selectedRoomId,
  onSelectedRoomIdChange,
  hasSelectedProperty,
  availableRooms,
  propertiesError,
  availabilityError,
  roomWeekdayLabels,
  availabilityLoading,
  roomCalendarCells,
  selectedCalendarDates,
  selectedRoomTotalUnits,
  roomBasePrice,
  formatDateInput,
  formatCurrency,
  onToggleCalendarDate,
  roomAvailabilityMode,
  onRoomAvailabilityModeChange,
  roomAdjustmentType,
  onRoomAdjustmentTypeChange,
  roomAdjustmentValue,
  onRoomAdjustmentValueChange,
  roomActionError,
  roomActionSuccess,
  onApplyChanges,
  roomActionLoading,
  rateRulesError,
  rateRules,
  rateRulesLoading,
  onDeleteRateRule,
}: RoomManagementSectionProps) {
  return (
    <div className="space-y-6">
      <TenantRoomSectionHeader
        tenantCopy={tenantCopy}
        selectedPropertyName={selectedPropertyName}
        onBackToProperty={onBackToProperty}
        roomMonthLabel={roomMonthLabel}
        onShiftMonth={onShiftMonth}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <TenantRoomCalendarPanel
          tenantCopy={tenantCopy}
          selectedPropertyId={selectedPropertyId}
          onSelectedPropertyIdChange={onSelectedPropertyIdChange}
          propertiesLoading={propertiesLoading}
          availabilityProperties={availabilityProperties}
          selectedRoomId={selectedRoomId}
          onSelectedRoomIdChange={onSelectedRoomIdChange}
          hasSelectedProperty={hasSelectedProperty}
          availableRooms={availableRooms}
          propertiesError={propertiesError}
          availabilityError={availabilityError}
          roomWeekdayLabels={roomWeekdayLabels}
          availabilityLoading={availabilityLoading}
          roomCalendarCells={roomCalendarCells}
          selectedCalendarDates={selectedCalendarDates}
          selectedRoomTotalUnits={selectedRoomTotalUnits}
          roomBasePrice={roomBasePrice}
          formatDateInput={formatDateInput}
          formatCurrency={formatCurrency}
          onToggleCalendarDate={onToggleCalendarDate}
        />

        <TenantRoomControlsPanel
          tenantCopy={tenantCopy}
          selectedCalendarDates={selectedCalendarDates}
          roomAvailabilityMode={roomAvailabilityMode}
          onRoomAvailabilityModeChange={onRoomAvailabilityModeChange}
          roomAdjustmentType={roomAdjustmentType}
          onRoomAdjustmentTypeChange={onRoomAdjustmentTypeChange}
          roomAdjustmentValue={roomAdjustmentValue}
          onRoomAdjustmentValueChange={onRoomAdjustmentValueChange}
          roomBasePrice={roomBasePrice}
          formatCurrency={formatCurrency}
          roomActionError={roomActionError}
          roomActionSuccess={roomActionSuccess}
          onApplyChanges={onApplyChanges}
          roomActionLoading={roomActionLoading}
        />
      </div>

      <TenantRoomRateRules
        tenantCopy={tenantCopy}
        rateRulesError={rateRulesError}
        rateRules={rateRules}
        rateRulesLoading={rateRulesLoading}
        onDeleteRateRule={onDeleteRateRule}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
