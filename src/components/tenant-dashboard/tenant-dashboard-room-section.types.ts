export type AvailabilityPropertyOption = {
  id: string;
  name: string;
};

export type RoomOption = {
  id: string;
  name: string;
};

export type RoomCalendarAvailability = {
  availableUnits?: number;
  isClosed?: boolean;
  finalPrice?: string;
  basePrice?: string;
};

export type RoomCalendarCell =
  | null
  | {
      date: string;
      day: number;
      item?: RoomCalendarAvailability | null;
    };

export type RateRuleRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  adjustmentType: "PERCENT" | "NOMINAL";
  adjustmentValue: string;
};

export type RoomSectionCopy = {
  backToPropertyAria: string;
  manageRoom: string;
  managePriceFor: string;
  selectedProperty: string;
  prevMonthAria: string;
  nextMonthAria: string;
  property: string;
  selectProperty: string;
  room: string;
  selectRoom: string;
  loadingCalendar: string;
  peak: string;
  available: string;
  booked: string;
  closed: string;
  datesSelected: string;
  selectDateHint: string;
  availability: string;
  priceAdjustment: string;
  nominalLabel: string;
  percentageLabel: string;
  exampleNominal: string;
  examplePercent: string;
  basePriceNow: string;
  applying: string;
  applyChanges: string;
  priceAdjustmentHistory: string;
  name: string;
  date: string;
  adjustment: string;
  action: string;
};

export type RoomManagementSectionProps = {
  tenantCopy: RoomSectionCopy;
  selectedPropertyName: string | null;
  onBackToProperty: () => void;
  roomMonthLabel: string;
  onShiftMonth: (delta: number) => void;
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
  roomAvailabilityMode: "available" | "blocked";
  onRoomAvailabilityModeChange: (value: "available" | "blocked") => void;
  roomAdjustmentType: "NOMINAL" | "PERCENT";
  onRoomAdjustmentTypeChange: (value: "NOMINAL" | "PERCENT") => void;
  roomAdjustmentValue: string;
  onRoomAdjustmentValueChange: (value: string) => void;
  roomActionError: string | null;
  roomActionSuccess: string | null;
  onApplyChanges: () => void;
  roomActionLoading: boolean;
  rateRulesError: string | null;
  rateRules: RateRuleRow[];
  rateRulesLoading: boolean;
  onDeleteRateRule: (id: string) => void;
};
