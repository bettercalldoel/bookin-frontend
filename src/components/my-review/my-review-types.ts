import type { AppLocale } from "@/lib/app-locale";
import type { PaymentMethod } from "@/components/my-transaction/my-transaction-shared";

export type BookingStatus =
  | "MENUNGGU_PEMBAYARAN"
  | "MENUNGGU_KONFIRMASI_PEMBAYARAN"
  | "DIPROSES"
  | "DIBATALKAN"
  | "SELESAI";

export type TransactionReview = {
  id: string;
  rating: number;
  comment: string;
  tenantReply: string | null;
  tenantRepliedAt: string | null;
  createdAt: string;
};

export type TransactionItem = {
  id: string;
  orderNo: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalAmount: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  review?: TransactionReview | null;
  roomType?: {
    id: string;
    name: string;
  } | null;
};

export type TransactionResponse = {
  data: TransactionItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ReviewDraft = {
  rating: string;
  comment: string;
};

export type SearchFilters = {
  orderNo: string;
  sortBy: "createdAt" | "checkIn" | "totalAmount" | "orderNo";
  sortOrder: "asc" | "desc";
};

export type ReviewView = "pending" | "history";

export type ReviewCopy = {
  loginAgain: string;
  failedLoad: string;
  failedReview: string;
  reviewSuccess: string;
  ratingRange: string;
  reviewRequired: string;
  pageEyebrow: string;
  pageTitle: string;
  pageSubtitle: string;
  backTransactions: string;
  backHome: string;
  refresh: string;
  refreshing: string;
  pendingTitle: string;
  pendingEmpty: string;
  historyTitle: string;
  historyEmpty: string;
  orderNoLabel: string;
  searchOrderPlaceholder: string;
  applySearch: string;
  resetSearch: string;
  pendingCount: string;
  reviewedCount: string;
  reviewSentAt: string;
  tenantReply: string;
  tenantRepliedAt: string;
  bookedAt: string;
  stayPeriod: string;
  duration: string;
  checkIn: string;
  checkOut: string;
  guestsRooms: string;
  paymentMethod: string;
  total: string;
  fallbackRoomName: string;
  writeReview: string;
  reviewPlaceholder: string;
  submitReview: string;
  submittingReview: string;
  highlightedBooking: string;
  highlightedNotFound: string;
  sortByLabel: string;
  sortOrderLabel: string;
  sortByCreatedAt: string;
  sortByCheckIn: string;
  sortByTotalAmount: string;
  sortByOrderNo: string;
  sortOrderAsc: string;
  sortOrderDesc: string;
  pageInfo: string;
  prevPage: string;
  nextPage: string;
  ratingOptions: Array<{ value: string; label: string }>;
};

export type ReviewCopyMap = Record<AppLocale, ReviewCopy>;
