"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { TRANSACTION_COPY } from "./my-transaction-copy";
import { MyTransactionCard } from "./my-transaction-card";
import { MyTransactionFilterPanel } from "./my-transaction-filter-panel";
import { MyTransactionHeader } from "./my-transaction-header";
import { MyTransactionPagination } from "./my-transaction-pagination";
import { countTransactionsByStatus } from "./my-transaction-status";
import { MyTransactionStatusOverview } from "./my-transaction-status-overview";
import type {
  SearchFilters,
  TransactionItem,
  TransactionResponse,
} from "./my-transaction-types";

const createDefaultFilters = (): SearchFilters => ({
  orderNo: "",
  startDate: "",
  endDate: "",
  sortBy: "createdAt",
  sortOrder: "desc",
});

const buildQueryString = (page: number, limit: number, targetFilters: SearchFilters) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (targetFilters.orderNo.trim()) params.set("orderNo", targetFilters.orderNo.trim());
  if (targetFilters.startDate) params.set("startDate", targetFilters.startDate);
  if (targetFilters.endDate) params.set("endDate", targetFilters.endDate);
  params.set("sortBy", targetFilters.sortBy); params.set("sortOrder", targetFilters.sortOrder);
  return params.toString();
};

const fetchTransactionsPage = async (
  token: string,
  page: number,
  limit: number,
  targetFilters: SearchFilters,
  fallback: string,
) => {
  const query = buildQueryString(page, limit, targetFilters);
  const response = await fetch(`${API_BASE_URL}/bookings?${query}`, { headers: { Authorization: `Bearer ${token}` } });
  const payload = (await response.json().catch(() => ({}))) as (TransactionResponse & { message?: string }) | { message?: string };
  if (!response.ok) throw new Error(payload.message || fallback);
  return payload as TransactionResponse;
};

export default function MyTransactionClient() {
  const locale = useAppLocaleValue();
  const copy = TRANSACTION_COPY[locale];
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(createDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(createDefaultFilters);

  const fetchTransactions = useCallback(async (silent = false, targetFilters = appliedFilters, targetPage = currentPage) => {
    const token = getAuthToken();
    if (!token) return setError(copy.loginAgain), setTransactions([]), setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    if (!silent) setLoading(true); setError(null);
    try {
      const parsed = await fetchTransactionsPage(token, targetPage, pagination.limit, targetFilters, copy.failedLoad);
      setTransactions(parsed.data ?? []); setPagination({ page: parsed.meta?.page ?? targetPage, limit: parsed.meta?.limit ?? pagination.limit, total: parsed.meta?.total ?? 0, totalPages: Math.max(1, parsed.meta?.totalPages ?? 1) });
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failedLoad); setTransactions([]); setPagination((prev) => ({ ...prev, total: 0, totalPages: 1, page: targetPage }));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [appliedFilters, copy.failedLoad, copy.loginAgain, currentPage, pagination.limit]);

  useEffect(() => { void fetchTransactions(false, appliedFilters, currentPage); }, [fetchTransactions, appliedFilters, currentPage]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) void fetchTransactions(true, appliedFilters, currentPage); }, 15000);
    return () => window.clearInterval(timer);
  }, [appliedFilters, currentPage, fetchTransactions]);

  const groupedStatus = useMemo(() => countTransactionsByStatus(transactions), [transactions]);

  const handleApplySearch = () => {
    setFeedback(null); setCurrentPage(1);
    setAppliedFilters({ orderNo: filters.orderNo.trim(), startDate: filters.startDate, endDate: filters.endDate, sortBy: filters.sortBy, sortOrder: filters.sortOrder });
  };

  const handleResetSearch = () => {
    const reset = createDefaultFilters();
    setFeedback(null); setCurrentPage(1); setFilters(reset); setAppliedFilters(reset);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 py-10 text-slate-900 sm:py-16">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-10">
          <MyTransactionHeader copy={copy} loading={loading} onRefresh={() => void fetchTransactions(false, appliedFilters)} />
          <MyTransactionFilterPanel copy={copy} filters={filters} onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))} onApplySearch={handleApplySearch} onResetSearch={handleResetSearch} />
          <MyTransactionStatusOverview locale={locale} groupedStatus={groupedStatus} />

          {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          {feedback ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}

          <div className="mt-6 space-y-3">
            {!loading && transactions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{copy.emptyState}</div>
            ) : null}
            {transactions.map((trx) => <MyTransactionCard key={trx.id} trx={trx} copy={copy} locale={locale} />)}
            <MyTransactionPagination
              copy={copy}
              loading={loading}
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
