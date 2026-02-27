import type { TenantOrderRow } from "./tenant-dashboard-booking.types";
import type {
  SalesMeta,
  SalesPropertyRow,
  SalesSummary,
  SalesTransactionRow,
  SalesTrendRow,
  SalesUserRow,
} from "./tenant-dashboard-sales.types";

export type DateRange = {
  from: string;
  to: string;
};

export type SalesView = "transaction" | "property" | "user";

export type SalesSortBy = "date" | "total";

export type SalesSortOrder = "asc" | "desc";

export type BuildSalesFallbackParams = {
  overviewOrders: TenantOrderRow[];
  dateRange: DateRange;
  transactionSearch: string;
  salesSortOrder: SalesSortOrder;
  sortBy: SalesSortBy;
  salesView: SalesView;
  salesLimit: number;
  salesPage: number;
  toTimestamp: (value: string | null) => number;
};

export type BuildSalesFallbackResult = {
  salesMeta: SalesMeta;
  salesSummary: SalesSummary;
  salesTrendData: SalesTrendRow[];
  salesTransactionRows: SalesTransactionRow[];
  salesPropertyRows: SalesPropertyRow[];
  salesUserRows: SalesUserRow[];
};

export type SalesFallbackSortParams = Pick<
  BuildSalesFallbackParams,
  "salesSortOrder" | "sortBy" | "toTimestamp"
>;

export type TrendBucket = {
  key: string;
  month: string;
  sales: number;
  bookings: number;
};
