export type OverviewSummary = {
  totalRevenue: number;
  activeTenants: number;
  activeOrders: number;
  occupancyRate: number;
  pendingOrders: number;
  pendingReviews: number;
};

export type OverviewChartPoint = {
  x: number;
  y: number;
  label: string;
};

export type OverviewChart = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  maxValue: number;
  areaPath: string;
  linePath: string;
  points: OverviewChartPoint[];
};

export type OverviewActivity = {
  id: string;
  submittedAt: string;
  booking: {
    property: {
      name: string;
    };
  };
  user: {
    email: string;
    fullName: string | null;
  };
};

export type OverviewBreakdownRow = {
  propertyId: string;
  propertyName: string;
  orders: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  revenue: number;
  lastSubmittedAt: string | null;
};
