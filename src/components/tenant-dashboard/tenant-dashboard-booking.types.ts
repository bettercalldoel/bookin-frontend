export type BookingStatus =
  | "MENUNGGU_PEMBAYARAN"
  | "MENUNGGU_KONFIRMASI_PEMBAYARAN"
  | "DIPROSES"
  | "DIBATALKAN"
  | "SELESAI";

export type PaymentProofStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export type TenantPaymentProof = {
  id: string;
  bookingId: string;
  method: "MANUAL_TRANSFER" | "XENDIT";
  status: PaymentProofStatus;
  imageUrl: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  booking: {
    id: string;
    orderNo: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
    totalAmount: string;
    subtotalAmount: string;
    appFeeAmount: string;
    taxAmount: string;
    tenantFeeAmount: string;
    tenantPayoutAmount: string;
    breakfastSelected: boolean;
    breakfastPax: number;
    breakfastUnitPrice: string;
    breakfastTotal: string;
    currency: string;
    status: BookingStatus;
    property: {
      id: string;
      name: string;
    };
    roomType: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
  };
};

export type TenantPaymentProofMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  status: PaymentProofStatus | null;
  bookingStatus: BookingStatus | null;
  keyword: string | null;
  startDate: string | null;
  endDate: string | null;
  sortBy: "submittedAt" | "total" | "checkIn" | "orderNo";
  sortOrder: "asc" | "desc";
};

export type TenantPaymentProofResponse = {
  data: TenantPaymentProof[];
  meta: TenantPaymentProofMeta;
};

export type TenantOrderRow = {
  id: string;
  orderNo: string;
  submittedAt: string;
  checkIn: string;
  propertyId: string;
  property: string;
  userId: string;
  user: string;
  nights: number;
  status: BookingStatus;
  total: number;
  grossTotal: number;
  tenantFee: number;
  netPayout: number;
  breakfastSelected: boolean;
  breakfastPax: number;
  breakfastTotal: number;
  paymentProofId: string;
  paymentProofStatus: PaymentProofStatus;
  paymentProofImageUrl: string;
};

export type TenantReview = {
  id: string;
  bookingId: string;
  rating: number;
  comment: string;
  tenantReply: string | null;
  tenantRepliedAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    orderNo: string;
    checkIn: string;
    checkOut: string;
    property: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
};

export type TenantReviewResponse = {
  data: TenantReview[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    replied?: "true" | "false" | null;
    keyword?: string | null;
    rating?: number | null;
    sortBy?: "createdAt" | "rating";
    sortOrder?: "asc" | "desc";
  };
};

