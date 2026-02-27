import type { AppLocale } from "@/lib/app-locale";
import type { PaymentMethod } from "./my-transaction-shared";

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
  roomSubtotal?: string;
  subtotalAmount?: string;
  appFeeAmount?: string;
  taxAmount?: string;
  breakfastSelected?: boolean;
  breakfastPax?: number;
  breakfastUnitPrice?: string;
  breakfastTotal?: string;
  currency?: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  xenditInvoiceUrl?: string | null;
  createdAt: string;
  review?: TransactionReview | null;
  roomType?: { id: string; name: string } | null;
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

export type SearchFilters = {
  orderNo: string;
  startDate: string;
  endDate: string;
  sortBy: "createdAt" | "checkIn" | "totalAmount" | "orderNo";
  sortOrder: "asc" | "desc";
};

export type TransactionCopy = {
  loginAgain: string;
  failedLoad: string;
  failedReview: string;
  reviewSuccess: string;
  ratingRange: string;
  reviewRequired: string;
  historyEyebrow: string;
  historyTitle: string;
  historySubtitle: string;
  backHome: string;
  myReviews: string;
  refresh: string;
  refreshing: string;
  searchOrderPlaceholder: string;
  applySearch: string;
  resetSearch: string;
  emptyState: string;
  fallbackRoomName: string;
  bookedAt: string;
  stayPeriod: string;
  duration: string;
  checkIn: string;
  checkOut: string;
  guestsRooms: string;
  paymentMethod: string;
  total: string;
  roomSubtotal: string;
  breakfast: string;
  subtotal: string;
  appFee: string;
  tax: string;
  payNow: string;
  reviewStatus: string;
  reviewNeeded: string;
  reviewCompleted: string;
  openReviewCenter: string;
  yourReview: string;
  reviewSentAt: string;
  tenantReply: string;
  tenantRepliedAt: string;
  writeReview: string;
  reviewPlaceholder: string;
  submitReview: string;
  submittingReview: string;
  searchStartDate: string;
  searchEndDate: string;
  searchOrderLabel: string;
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

export type TransactionCopyMap = Record<AppLocale, TransactionCopy>;
