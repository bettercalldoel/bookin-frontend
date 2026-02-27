"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthToken } from "@/lib/auth-client";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import { REVIEW_COPY } from "./my-review-copy";
import { MyReviewFilterPanel } from "./my-review-filter-panel";
import { MyReviewHeader } from "./my-review-header";
import { MyReviewHistoryCard } from "./my-review-history-card";
import {
  buildDraftFromReview,
  buildReviewQuery,
  createDefaultFilters,
  fetchReviewSummary,
  fetchReviewTransactions,
  parseReviewDraft,
  submitBookingReview,
  validateReviewDraft,
} from "./my-review-helpers";
import { MyReviewPagination } from "./my-review-pagination";
import { MyReviewPendingCard } from "./my-review-pending-card";
import type { ReviewDraft, ReviewView, SearchFilters, TransactionItem } from "./my-review-types";
import { MyReviewViewToggle } from "./my-review-view-toggle";

const clearReviewDraft = (prev: Record<string, ReviewDraft>, bookingId: string) => {
  const next = { ...prev };
  delete next[bookingId];
  return next;
};

export default function MyReviewClient() {
  const locale = useAppLocaleValue();
  const copy = REVIEW_COPY[locale];
  const searchParams = useSearchParams();
  const highlightedBookingId = (searchParams.get("bookingId") ?? "").trim();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewSummary, setReviewSummary] = useState({ pending: 0, history: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reviewSubmittingId, setReviewSubmittingId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [filters, setFilters] = useState<SearchFilters>(createDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(createDefaultFilters);
  const [reviewView, setReviewView] = useState<ReviewView>("pending");

  const fetchTransactions = useCallback(async (silent = false, targetFilters = appliedFilters, targetView = reviewView, targetPage = currentPage) => {
    const token = getAuthToken();
    if (!token) return setError(copy.loginAgain), setTransactions([]), setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    if (!silent) setLoading(true); setError(null);
    try {
      const query = buildReviewQuery(targetPage, pagination.limit, targetFilters, targetView);
      const parsed = await fetchReviewTransactions(token, query, copy.failedLoad);
      const oppositeTotal = await fetchReviewSummary(token, targetFilters, targetView);
      const currentTotal = parsed.meta?.total ?? 0;
      setTransactions(parsed.data ?? []); setPagination({ page: parsed.meta?.page ?? targetPage, limit: parsed.meta?.limit ?? pagination.limit, total: currentTotal, totalPages: Math.max(1, parsed.meta?.totalPages ?? 1) }); setReviewSummary({ pending: targetView === "pending" ? currentTotal : oppositeTotal, history: targetView === "history" ? currentTotal : oppositeTotal });
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failedLoad); setTransactions([]); setPagination((prev) => ({ ...prev, total: 0, totalPages: 1, page: targetPage }));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [appliedFilters, copy.failedLoad, copy.loginAgain, currentPage, pagination.limit, reviewView]);

  useEffect(() => { void fetchTransactions(false, appliedFilters, reviewView, currentPage); }, [appliedFilters, currentPage, fetchTransactions, reviewView]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) void fetchTransactions(true, appliedFilters, reviewView, currentPage); }, 15000);
    return () => window.clearInterval(timer);
  }, [appliedFilters, currentPage, fetchTransactions, reviewView]);

  const pendingReviews = useMemo(() => (reviewView === "pending" ? transactions.filter((trx) => !trx.review) : []), [reviewView, transactions]);
  const reviewHistory = useMemo(() => (reviewView === "history" ? transactions.filter((trx) => Boolean(trx.review)) : []), [reviewView, transactions]);
  const highlightedPendingExists = useMemo(() => highlightedBookingId ? pendingReviews.some((trx) => trx.id === highlightedBookingId) : false, [highlightedBookingId, pendingReviews]);

  useEffect(() => {
    if (highlightedBookingId && highlightedPendingExists) return setReviewView("pending");
    if (!highlightedBookingId && reviewView === "pending" && reviewSummary.pending === 0 && reviewSummary.history > 0) return setReviewView("history"), setCurrentPage(1);
  }, [highlightedBookingId, highlightedPendingExists, reviewSummary.history, reviewSummary.pending, reviewView]);

  const handleSubmitReview = async (bookingId: string) => {
    const token = getAuthToken(); if (!token) return setError(copy.loginAgain);
    const parsedDraft = parseReviewDraft(reviewDrafts[bookingId] ?? buildDraftFromReview());
    const validationError = validateReviewDraft(parsedDraft, copy); if (validationError) return setError(validationError);
    try {
      setReviewSubmittingId(bookingId); setError(null); setFeedback(null);
      const message = await submitBookingReview(bookingId, token, parsedDraft, copy.failedReview);
      setFeedback(message ?? copy.reviewSuccess); setReviewDrafts((prev) => clearReviewDraft(prev, bookingId));
      await fetchTransactions(true, appliedFilters, reviewView, currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failedReview);
    } finally {
      setReviewSubmittingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 py-10 text-slate-900 sm:py-16">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-10">
          <MyReviewHeader copy={copy} loading={loading} onRefresh={() => void fetchTransactions(false, appliedFilters, reviewView)} />
          <MyReviewFilterPanel copy={copy} filters={filters} onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))} onApplySearch={() => (setFeedback(null), setCurrentPage(1), setAppliedFilters({ orderNo: filters.orderNo.trim(), sortBy: filters.sortBy, sortOrder: filters.sortOrder }))} onResetSearch={() => { const reset = createDefaultFilters(); setFeedback(null); setCurrentPage(1); setFilters(reset); setAppliedFilters(reset); }} />
          <MyReviewViewToggle copy={copy} reviewView={reviewView} pendingCount={reviewSummary.pending} historyCount={reviewSummary.history} onChange={(next) => (setReviewView(next), setCurrentPage(1))} />

          {highlightedBookingId ? (
            <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${highlightedPendingExists ? "border border-cyan-200 bg-cyan-50 text-cyan-800" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
              {highlightedPendingExists ? copy.highlightedBooking : copy.highlightedNotFound}
            </div>
          ) : null}
          {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          {feedback ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}

          <section className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{reviewView === "pending" ? copy.pendingTitle : copy.historyTitle}</h2>
            {reviewView === "pending" ? (
              <>
                {!loading && pendingReviews.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{copy.pendingEmpty}</div> : null}
                {pendingReviews.map((trx) => (
                  <MyReviewPendingCard
                    key={trx.id}
                    copy={copy}
                    trx={trx}
                    locale={locale}
                    draft={reviewDrafts[trx.id] ?? buildDraftFromReview()}
                    highlighted={highlightedBookingId === trx.id}
                    reviewSubmittingId={reviewSubmittingId}
                    onDraftChange={(patch) => setReviewDrafts((prev) => ({ ...prev, [trx.id]: { ...(prev[trx.id] ?? buildDraftFromReview()), ...patch } }))}
                    onSubmit={() => void handleSubmitReview(trx.id)}
                  />
                ))}
              </>
            ) : (
              <>
                {!loading && reviewHistory.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">{copy.historyEmpty}</div> : null}
                {reviewHistory.map((trx) => <MyReviewHistoryCard key={trx.id} copy={copy} trx={trx} locale={locale} />)}
              </>
            )}
            <MyReviewPagination copy={copy} loading={loading} page={pagination.page} totalPages={pagination.totalPages} onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))} onNext={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))} />
          </section>
        </div>
      </main>
    </div>
  );
}
