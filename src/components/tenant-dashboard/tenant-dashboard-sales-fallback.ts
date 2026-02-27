import type { SalesSummary, SalesTrendRow } from "./tenant-dashboard-sales.types";
import {
  buildSalesMeta,
  buildTrendBuckets,
  mapPropertyRows,
  mapUserRows,
  sortAggregateRows,
  sortTransactionRows,
  toPagedRows,
} from "./tenant-dashboard-sales-fallback-utils";
import type {
  BuildSalesFallbackParams,
  BuildSalesFallbackResult,
} from "./tenant-dashboard-sales-fallback.types";

const buildDateBoundaries = (params: BuildSalesFallbackParams) => {
  const fromTs = params.dateRange.from ? new Date(`${params.dateRange.from}T00:00:00`).getTime() : null;
  const toTs = params.dateRange.to ? new Date(`${params.dateRange.to}T23:59:59`).getTime() : null;
  return { fromTs, toTs };
};

const buildSummary = (orders: BuildSalesFallbackParams["overviewOrders"]): SalesSummary => {
  const totalSales = orders.reduce((sum, row) => (row.status === "DIBATALKAN" ? sum : sum + row.grossTotal), 0);
  const totalNetPayout = orders.reduce((sum, row) => (row.status === "DIBATALKAN" ? sum : sum + row.netPayout), 0);
  const totalTransactions = orders.length;
  const avgPerTransaction = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;
  return { totalSales, totalNetPayout, totalTransactions, avgPerTransaction };
};

const buildTrendData = (
  rows: BuildSalesFallbackParams["overviewOrders"],
  params: BuildSalesFallbackParams,
): SalesTrendRow[] => {
  const buckets = buildTrendBuckets(params.dateRange);
  const map = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  rows.forEach((row) => {
    const ts = params.toTimestamp(row.submittedAt);
    if (!ts) return;
    const date = new Date(ts);
    const key = `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, "0")}`;
    const bucket = map.get(key);
    if (!bucket) return;
    bucket.bookings += 1;
    if (row.status !== "DIBATALKAN") bucket.sales += row.grossTotal;
  });

  return buckets.map((bucket) => ({
    month: bucket.month,
    sales: bucket.sales,
    bookings: bucket.bookings,
  }));
};

const filterByDateRange = (params: BuildSalesFallbackParams) => {
  const { fromTs, toTs } = buildDateBoundaries(params);
  return params.overviewOrders.filter((row) => {
    const ts = params.toTimestamp(row.submittedAt);
    if (fromTs !== null && ts < fromTs) return false;
    if (toTs !== null && ts > toTs) return false;
    return true;
  });
};

const buildBaseResult = (rows: BuildSalesFallbackParams["overviewOrders"], params: BuildSalesFallbackParams) => ({
  keyword: params.transactionSearch.trim().toLowerCase(),
  summary: buildSummary(rows),
  trendData: buildTrendData(rows, params),
  sortedTransactions: sortTransactionRows(rows, params),
});

const buildMeta = (params: BuildSalesFallbackParams, page: number, total: number) =>
  buildSalesMeta({
    page,
    total,
    limit: params.salesLimit,
    view: params.salesView,
    sortBy: params.sortBy,
    sortOrder: params.salesSortOrder,
    dateRange: params.dateRange,
    keyword: params.transactionSearch.trim(),
  });

const toTransactionResult = (
  rows: ReturnType<typeof sortTransactionRows>,
  params: BuildSalesFallbackParams,
  keyword: string,
) => {
  const searched = keyword
    ? rows.filter((row) => [row.orderNo, row.property, row.user, row.submittedAt].join(" ").toLowerCase().includes(keyword))
    : rows;
  const paged = toPagedRows(searched, params.salesPage, params.salesLimit);
  return { paged, rows: paged.rows.map((row) => ({ ...row, total: row.total })) };
};

export const buildSalesFallbackFromOverview = (
  params: BuildSalesFallbackParams,
): BuildSalesFallbackResult | null => {
  if (params.overviewOrders.length === 0) return null;

  const filteredRows = filterByDateRange(params);
  const base = buildBaseResult(filteredRows, params);

  if (params.salesView === "transaction") {
    const result = toTransactionResult(base.sortedTransactions, params, base.keyword);
    return {
      salesMeta: buildMeta(params, result.paged.page, result.paged.total),
      salesSummary: base.summary,
      salesTrendData: base.trendData,
      salesTransactionRows: result.rows,
      salesPropertyRows: [],
      salesUserRows: [],
    };
  }

  if (params.salesView === "property") {
    const rows = mapPropertyRows(base.sortedTransactions, params.toTimestamp);
    const searched = base.keyword ? rows.filter((row) => row.propertyName.toLowerCase().includes(base.keyword)) : rows;
    sortAggregateRows(searched, params);
    const paged = toPagedRows(searched, params.salesPage, params.salesLimit);
    return {
      salesMeta: buildMeta(params, paged.page, paged.total),
      salesSummary: base.summary,
      salesTrendData: base.trendData,
      salesTransactionRows: [],
      salesPropertyRows: paged.rows,
      salesUserRows: [],
    };
  }

  const rows = mapUserRows(base.sortedTransactions, params.toTimestamp);
  const searched = base.keyword ? rows.filter((row) => row.userName.toLowerCase().includes(base.keyword)) : rows;
  sortAggregateRows(searched, params);
  const paged = toPagedRows(searched, params.salesPage, params.salesLimit);

  return {
    salesMeta: buildMeta(params, paged.page, paged.total),
    salesSummary: base.summary,
    salesTrendData: base.trendData,
    salesTransactionRows: [],
    salesPropertyRows: [],
    salesUserRows: paged.rows,
  };
};
