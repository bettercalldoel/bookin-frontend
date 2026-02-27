import type { TenantOrderRow } from "./tenant-dashboard-booking.types";
import type {
  SalesMeta,
  SalesPropertyRow,
  SalesUserRow,
} from "./tenant-dashboard-sales.types";
import type {
  DateRange,
  SalesFallbackSortParams,
  SalesSortBy,
  SalesSortOrder,
  SalesView,
  TrendBucket,
} from "./tenant-dashboard-sales-fallback.types";

type SalesMetaParams = {
  page: number;
  limit: number;
  total: number;
  view: SalesView;
  sortBy: SalesSortBy;
  sortOrder: SalesSortOrder;
  dateRange: DateRange;
  keyword: string;
};

export const buildSalesMeta = (params: SalesMetaParams): SalesMeta => {
  const totalPages = Math.max(1, Math.ceil(params.total / params.limit));
  const page = Math.min(Math.max(1, params.page), totalPages);

  return {
    page,
    limit: params.limit,
    total: params.total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    view: params.view,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    startDate: params.dateRange.from || null,
    endDate: params.dateRange.to || null,
    keyword: params.keyword || null,
  };
};

export const buildTrendBuckets = (dateRange: DateRange): TrendBucket[] => {
  const baseDate = dateRange.to ? new Date(`${dateRange.to}T00:00:00`) : new Date();
  const anchor = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), 1));
  const formatter = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });

  return Array.from({ length: 7 }, (_, index) => {
    const monthDate = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - (6 - index), 1),
    );
    const month = formatter.format(monthDate);
    const key = `${monthDate.getUTCFullYear()}-${`${monthDate.getUTCMonth() + 1}`.padStart(2, "0")}`;
    return { key, month, sales: 0, bookings: 0 };
  });
};

export const toPagedRows = <T>(rows: T[], page: number, limit: number) => {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { page: safePage, total, rows: rows.slice(start, start + limit) };
};

export const sortTransactionRows = (
  rows: TenantOrderRow[],
  params: SalesFallbackSortParams,
) => {
  const sortFactor = params.salesSortOrder === "asc" ? 1 : -1;
  const sortedRows = [...rows];

  sortedRows.sort((a, b) => {
    if (params.sortBy === "total") {
      if (a.grossTotal !== b.grossTotal) {
        return sortFactor * (a.grossTotal - b.grossTotal);
      }
      return sortFactor * (params.toTimestamp(a.submittedAt) - params.toTimestamp(b.submittedAt));
    }

    const dateDiff = params.toTimestamp(a.submittedAt) - params.toTimestamp(b.submittedAt);
    if (dateDiff !== 0) return sortFactor * dateDiff;
    return sortFactor * (a.grossTotal - b.grossTotal);
  });

  return sortedRows;
};

type PropertyAccumulator = SalesPropertyRow & { userSet: Set<string> };
type UserAccumulator = SalesUserRow & { propertySet: Set<string> };

export const mapPropertyRows = (
  transactionRows: TenantOrderRow[],
  toTimestamp: (value: string | null) => number,
): SalesPropertyRow[] => {
  const rowsMap = new Map<string, PropertyAccumulator>();

  transactionRows.forEach((row) => {
    const current = rowsMap.get(row.propertyId) ?? {
      propertyId: row.propertyId,
      propertyName: row.property,
      transactions: 0,
      users: 0,
      totalSales: 0,
      netPayout: 0,
      latestTransactionAt: null,
      userSet: new Set<string>(),
    };

    current.transactions += 1;
    current.userSet.add(row.userId);
    if (row.status !== "DIBATALKAN") {
      current.totalSales += row.grossTotal;
      current.netPayout += row.netPayout ?? 0;
    }
    if (toTimestamp(row.submittedAt) > toTimestamp(current.latestTransactionAt)) {
      current.latestTransactionAt = row.submittedAt;
    }

    rowsMap.set(row.propertyId, current);
  });

  return Array.from(rowsMap.values()).map((row) => ({
    propertyId: row.propertyId,
    propertyName: row.propertyName,
    transactions: row.transactions,
    users: row.userSet.size,
    totalSales: row.totalSales,
    netPayout: row.netPayout,
    latestTransactionAt: row.latestTransactionAt,
  }));
};

export const mapUserRows = (
  transactionRows: TenantOrderRow[],
  toTimestamp: (value: string | null) => number,
): SalesUserRow[] => {
  const rowsMap = new Map<string, UserAccumulator>();

  transactionRows.forEach((row) => {
    const current = rowsMap.get(row.userId) ?? {
      userId: row.userId,
      userName: row.user,
      transactions: 0,
      properties: 0,
      totalSales: 0,
      netPayout: 0,
      latestTransactionAt: null,
      propertySet: new Set<string>(),
    };

    current.transactions += 1;
    current.propertySet.add(row.propertyId);
    if (row.status !== "DIBATALKAN") {
      current.totalSales += row.grossTotal;
      current.netPayout += row.netPayout ?? 0;
    }
    if (toTimestamp(row.submittedAt) > toTimestamp(current.latestTransactionAt)) {
      current.latestTransactionAt = row.submittedAt;
    }

    rowsMap.set(row.userId, current);
  });

  return Array.from(rowsMap.values()).map((row) => ({
    userId: row.userId,
    userName: row.userName,
    transactions: row.transactions,
    properties: row.propertySet.size,
    totalSales: row.totalSales,
    netPayout: row.netPayout,
    latestTransactionAt: row.latestTransactionAt,
  }));
};

export const sortAggregateRows = <T extends { totalSales: number; latestTransactionAt: string | null }>(
  rows: T[],
  params: SalesFallbackSortParams,
) => {
  const sortFactor = params.salesSortOrder === "asc" ? 1 : -1;

  rows.sort((a, b) => {
    if (params.sortBy === "total" && a.totalSales !== b.totalSales) {
      return sortFactor * (a.totalSales - b.totalSales);
    }

    const dateDiff =
      params.toTimestamp(a.latestTransactionAt) - params.toTimestamp(b.latestTransactionAt);
    return sortFactor * dateDiff;
  });
};
