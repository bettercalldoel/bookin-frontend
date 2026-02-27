import { API_BASE_URL } from "@/lib/api";
import type {
  ReviewCopy,
  ReviewDraft,
  ReviewView,
  SearchFilters,
  TransactionResponse,
} from "./my-review-types";

export const createDefaultFilters = (): SearchFilters => ({
  orderNo: "",
  sortBy: "createdAt",
  sortOrder: "desc",
});

export const buildDraftFromReview = (): ReviewDraft => ({ rating: "5", comment: "" });

export const parseReviewDraft = (draft: ReviewDraft) => ({
  rating: Number(draft.rating),
  comment: draft.comment.trim(),
});

export const validateReviewDraft = (draft: ReturnType<typeof parseReviewDraft>, copy: ReviewCopy) => {
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) return copy.ratingRange;
  if (!draft.comment) return copy.reviewRequired;
  return null;
};

export const buildReviewQuery = (
  page: number,
  limit: number,
  filters: SearchFilters,
  view: ReviewView,
) => {
  const params = new URLSearchParams({ status: "SELESAI", reviewed: view === "history" ? "true" : "false", page: String(page), limit: String(limit), sortBy: filters.sortBy, sortOrder: filters.sortOrder });
  if (filters.orderNo.trim()) params.set("orderNo", filters.orderNo.trim());
  return params.toString();
};

export const fetchReviewTransactions = async (
  token: string,
  query: string,
  fallback: string,
) => {
  const response = await fetch(`${API_BASE_URL}/bookings?${query}`, { headers: { Authorization: `Bearer ${token}` } });
  const payload = (await response.json().catch(() => ({}))) as (TransactionResponse & { message?: string }) | { message?: string };
  if (!response.ok) throw new Error(payload.message || fallback);
  return payload as TransactionResponse;
};

export const fetchReviewSummary = async (
  token: string,
  filters: SearchFilters,
  view: ReviewView,
) => {
  const oppositeView: ReviewView = view === "pending" ? "history" : "pending";
  const query = buildReviewQuery(1, 1, filters, oppositeView);
  const response = await fetch(`${API_BASE_URL}/bookings?${query}`, { headers: { Authorization: `Bearer ${token}` } });
  return ((await response.json().catch(() => ({}))) as TransactionResponse).meta?.total ?? 0;
};

export const submitBookingReview = async (
  bookingId: string,
  token: string,
  draft: ReturnType<typeof parseReviewDraft>,
  fallbackMessage: string,
) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(draft),
  });
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(payload.message || fallbackMessage);
  return payload.message;
};
