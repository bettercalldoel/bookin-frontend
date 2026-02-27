import type {
  BookingStatus,
  TenantOrderRow,
  TenantPaymentProofMeta,
  TenantReview,
} from "./tenant-dashboard-booking.types";

export type StatusFilter = "ALL" | BookingStatus;

export type TransactionStatusMeta = {
  label: string;
  className: string;
};

export type OrderSectionProps = {
  statusFilter: StatusFilter;
  onStatusFilterChange: (next: StatusFilter) => void;
  transactionSearch: string;
  onTransactionSearchChange: (next: string) => void;
  transactionSortBy: "submittedAt" | "total" | "checkIn" | "orderNo";
  onTransactionSortByChange: (next: "submittedAt" | "total" | "checkIn" | "orderNo") => void;
  transactionSortOrder: "asc" | "desc";
  onTransactionSortOrderChange: (next: "asc" | "desc") => void;
  tenantPaymentProofsError: string | null;
  paymentActionError: string | null;
  paymentActionFeedback: string | null;
  filteredTransactionRows: TenantOrderRow[];
  getTransactionStatusMeta: (status: BookingStatus) => TransactionStatusMeta;
  formatDateTime: (value: string | null) => string;
  formatCurrency: (value: number) => string;
  onPaymentProofReview: (paymentProofId: string, action: "approve" | "reject") => void;
  onCancelOrderByTenant: (bookingId: string, orderNo: string) => void;
  paymentActionLoadingId: string | null;
  tenantPaymentProofMeta: TenantPaymentProofMeta;
  tenantPaymentProofsLoading: boolean;
  transactionLimit: number;
  onTransactionLimitChange: (next: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export type CustomerSectionProps = {
  reviewSearch: string;
  onReviewSearchChange: (next: string) => void;
  reviewRepliedFilter: "all" | "true" | "false";
  onReviewRepliedFilterChange: (next: "all" | "true" | "false") => void;
  reviewSortBy: "createdAt" | "rating";
  onReviewSortByChange: (next: "createdAt" | "rating") => void;
  reviewSortOrder: "asc" | "desc";
  onReviewSortOrderChange: (next: "asc" | "desc") => void;
  tenantReviewsError: string | null;
  reviewReplyFeedback: string | null;
  tenantReviewsLoading: boolean;
  tenantReviews: TenantReview[];
  reviewDrafts: Record<string, string>;
  onReviewDraftChange: (reviewId: string, value: string) => void;
  onSubmitReply: (reviewId: string) => void;
  reviewReplyLoadingId: string | null;
  formatDateTime: (value: string | null) => string;
  reviewLimit: number;
  onReviewLimitChange: (next: number) => void;
  reviewPage: number;
  reviewTotalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};
