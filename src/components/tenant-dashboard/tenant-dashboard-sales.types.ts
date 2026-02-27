import type { BookingStatus } from "./tenant-dashboard-booking.types";

export type SalesTransactionRow = {
  id: string;
  orderNo: string;
  submittedAt: string | null;
  checkIn: string | null;
  propertyId: string;
  property: string;
  userId: string;
  user: string;
  status: BookingStatus;
  total: number;
  grossTotal?: number;
  netPayout?: number;
};

export type SalesPropertyRow = {
  propertyId: string;
  propertyName: string;
  transactions: number;
  users: number;
  totalSales: number;
  netPayout: number;
  latestTransactionAt: string | null;
};

export type SalesTrendRow = {
  month: string;
  sales: number;
  bookings: number;
};

export type SalesSummary = {
  totalSales: number;
  totalNetPayout?: number;
  totalTransactions: number;
  avgPerTransaction: number;
};

export type SalesMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  view: "transaction" | "property" | "user";
  sortBy: "date" | "total";
  sortOrder: "asc" | "desc";
  startDate: string | null;
  endDate: string | null;
  keyword: string | null;
};

export type SalesUserRow = {
  userId: string;
  userName: string;
  transactions: number;
  properties: number;
  totalSales: number;
  netPayout: number;
  latestTransactionAt: string | null;
};

export type SalesReportResponse = {
  data: Array<SalesTransactionRow | SalesPropertyRow | SalesUserRow>;
  summary: SalesSummary;
  trend: SalesTrendRow[];
  meta: SalesMeta;
};

export type OverviewTrendPoint = {
  dateKey: string;
  weekday: string;
  orders: number;
  revenue: number;
};

export type PropertyBreakdownRow = {
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

