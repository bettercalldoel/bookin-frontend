"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { BUTTON_THEME, INPUT_THEME } from "@/lib/button-theme";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import ConfirmModal from "@/components/ui/confirm-modal";

type DashboardUser = {
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  tenantProfile?: { companyName?: string | null } | null;
};

type TenantRoom = {
  id: string;
  name: string;
  price: string;
  totalUnits: number;
  maxGuests: number;
};

type TenantProperty = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  cityName?: string | null;
  province?: string | null;
  coverUrl?: string | null;
  galleryUrls?: string[];
  rooms: TenantRoom[];
};

type TenantPropertyListResponse = {
  data: TenantProperty[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
};

type AvailabilityItem = {
  date: string;
  availableUnits: number;
  isClosed: boolean;
  basePrice: string;
  adjustment: string;
  finalPrice: string;
};

type AvailabilityResponse = {
  roomTypeId: string;
  propertyId: string;
  totalUnits: number;
  items: AvailabilityItem[];
};

type RateRule = {
  id: string;
  name: string;
  scope: "PROPERTY" | "ROOM_TYPE";
  propertyId: string | null;
  roomTypeId: string | null;
  startDate: string;
  endDate: string;
  adjustmentType: "PERCENT" | "NOMINAL";
  adjustmentValue: string;
  isActive: boolean;
};

type BookingStatus =
  | "MENUNGGU_PEMBAYARAN"
  | "MENUNGGU_KONFIRMASI_PEMBAYARAN"
  | "DIPROSES"
  | "DIBATALKAN"
  | "SELESAI";

type PaymentProofStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

type TenantPaymentProof = {
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

type TenantPaymentProofMeta = {
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

type TenantPaymentProofResponse = {
  data: TenantPaymentProof[];
  meta: TenantPaymentProofMeta;
};

type TenantOrderRow = {
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
  paymentProofId: string;
  paymentProofStatus: PaymentProofStatus;
  paymentProofImageUrl: string;
};

type SalesTransactionRow = {
  id: string;
  orderNo: string;
  submittedAt: string | null;
  checkIn: string | null;
  propertyId: string;
  property: string;
  userId: string;
  user: string;
  status: BookingStatus;
  total: number;
};

type SalesPropertyRow = {
  propertyId: string;
  propertyName: string;
  transactions: number;
  users: number;
  totalSales: number;
  latestTransactionAt: string | null;
};

type SalesTrendRow = {
  month: string;
  sales: number;
  bookings: number;
};

type SalesSummary = {
  totalSales: number;
  totalTransactions: number;
  avgPerTransaction: number;
};

type SalesMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  view: "transaction" | "property" | "user";
  sortBy: "date" | "total";
  sortOrder: "asc" | "desc";
  startDate: string | null;
  endDate: string | null;
  keyword: string | null;
};

type SalesReportResponse = {
  data: Array<SalesTransactionRow | SalesPropertyRow | SalesUserRow>;
  summary: SalesSummary;
  trend: SalesTrendRow[];
  meta: SalesMeta;
};

type SalesUserRow = {
  userId: string;
  userName: string;
  transactions: number;
  properties: number;
  totalSales: number;
  latestTransactionAt: string | null;
};

type TenantReview = {
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

type TenantReviewResponse = {
  data: TenantReview[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type NavKey =
  | "tenant-profile"
  | "property-category"
  | "property-management"
  | "room-management"
  | "order-management"
  | "customer-relations"
  | "sales-report"
  | "dashboard-overview";

type NavItem = {
  key: NavKey;
  label: string;
  helper: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type RoomActionConfirmState = {
  title: string;
  description: string;
  payload: Record<string, unknown>;
  successMessage: string;
};

type TenantActionConfirmPayload =
  | {
      type: "create-category";
      name: string;
    }
  | {
      type: "update-category";
      id: string;
      name: string;
    }
  | {
      type: "delete-category";
      id: string;
      name: string;
    }
  | {
      type: "apply-room-sidebar";
      roomTypeId: string;
      dates: string[];
      shouldBlock: boolean;
      adjustmentType: "NOMINAL" | "PERCENT";
      adjustmentValue: string;
    }
  | {
      type: "delete-rate-rule";
      id: string;
    }
  | {
      type: "payment-proof-review";
      paymentProofId: string;
      action: "approve" | "reject";
    }
  | {
      type: "cancel-order";
      bookingId: string;
      orderNo: string;
    }
  | {
      type: "submit-review-reply";
      reviewId: string;
      draft: string;
    };

type TenantActionConfirmState = {
  title: string;
  description: string;
  confirmLabel?: string;
  payload: TenantActionConfirmPayload;
};

type OverviewTrendPoint = {
  dateKey: string;
  weekday: string;
  orders: number;
  revenue: number;
};

type PropertyBreakdownRow = {
  propertyId: string;
  propertyName: string;
  orders: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  revenue: number;
  lastSubmittedAt: string | null;
};

type CatalogCategory = {
  id: string;
  name: string;
};

const navGroups: NavGroup[] = [
  {
    title: "Utama",
    items: [
      {
        key: "dashboard-overview",
        label: "Ringkasan Dashboard",
        helper: "Ringkasan mitra",
      },
    ],
  },
  {
    title: "Akun Tenant",
    items: [
      {
        key: "tenant-profile",
        label: "Profil Tenant",
        helper: "Profil akun mitra",
      },
    ],
  },
  {
    title: "Properti & Kamar",
    items: [
      {
        key: "property-management",
        label: "Properti & Kamar",
        helper: "Daftar properti, kamar, dan kalender",
      },
    ],
  },
  {
    title: "Transaksi",
    items: [
      {
        key: "order-management",
        label: "Kelola Pesanan",
        helper: "Status pesanan & konfirmasi pembayaran",
      },
    ],
  },
  {
    title: "Relasi Pelanggan",
    items: [
      {
        key: "customer-relations",
        label: "Ulasan & Balasan",
        helper: "Balas ulasan pengguna",
      },
    ],
  },
  {
    title: "Laporan & Analisis",
    items: [
      {
        key: "sales-report",
        label: "Laporan & Analisis",
        helper: "Laporan penjualan dan ketersediaan properti",
      },
    ],
  },
];

const renderNavIcon = (key: NavKey) => {
  const baseClass = "h-4 w-4";
  switch (key) {
    case "dashboard-overview":
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor">
          <rect x="4" y="4" width="7" height="7" rx="1.5" strokeWidth="1.8" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" strokeWidth="1.8" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" strokeWidth="1.8" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" strokeWidth="1.8" />
        </svg>
      );
    case "tenant-profile":
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor">
          <circle cx="12" cy="8" r="3.5" strokeWidth="1.8" />
          <path d="M5 19.5C6.6 16.8 9 15.5 12 15.5C15 15.5 17.4 16.8 19 19.5" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "property-category":
    case "property-management":
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor">
          <path d="M5 20V6.5C5 5.7 5.7 5 6.5 5H17.5C18.3 5 19 5.7 19 6.5V20" strokeWidth="1.8" />
          <path d="M9 20V15H15V20M9 9H10M14 9H15M9 12H10M14 12H15" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "room-management":
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor">
          <rect x="3.5" y="5.5" width="17" height="15" rx="2" strokeWidth="1.8" />
          <path d="M8 3V7M16 3V7M3.5 10.5H20.5" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "order-management":
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor">
          <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth="1.8" />
          <path d="M4 10H20" strokeWidth="1.8" />
        </svg>
      );
    case "customer-relations":
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor">
          <path d="M5.5 18.5L6.5 15.5C5 14.2 4 12.5 4 10.5C4 6.9 7.6 4 12 4C16.4 4 20 6.9 20 10.5C20 14.1 16.4 17 12 17C10.8 17 9.7 16.8 8.7 16.4L5.5 18.5Z" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case "sales-report":
      return (
        <svg viewBox="0 0 24 24" className={baseClass} fill="none" stroke="currentColor">
          <path d="M4 20H20M7 16V11M12 16V7M17 16V13" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

const overviewMonthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const defaultSalesSummary: SalesSummary = {
  totalSales: 0,
  totalTransactions: 0,
  avgPerTransaction: 0,
};

const defaultSalesMeta: SalesMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
  view: "transaction",
  sortBy: "date",
  sortOrder: "desc",
  startDate: null,
  endDate: null,
  keyword: null,
};

const defaultTenantPaymentProofMeta: TenantPaymentProofMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
  status: null,
  bookingStatus: null,
  keyword: null,
  startDate: null,
  endDate: null,
  sortBy: "submittedAt",
  sortOrder: "desc",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value: string | null) => {
  return formatDateDDMMYYYY(value);
};

const formatBookingStatus = (status: BookingStatus) => {
  switch (status) {
    case "MENUNGGU_PEMBAYARAN":
      return "Menunggu Pembayaran";
    case "MENUNGGU_KONFIRMASI_PEMBAYARAN":
      return "Menunggu Konfirmasi Pembayaran";
    case "DIPROSES":
      return "Diproses";
    case "DIBATALKAN":
      return "Dibatalkan";
    case "SELESAI":
      return "Selesai";
    default:
      return status;
  }
};

const formatPaymentProofStatus = (status: PaymentProofStatus) => {
  switch (status) {
    case "SUBMITTED":
      return "Menunggu Review";
    case "APPROVED":
      return "Disetujui";
    case "REJECTED":
      return "Ditolak";
    default:
      return status;
  }
};

const getTransactionStatusMeta = (status: BookingStatus) => {
  if (status === "SELESAI") {
    return {
      label: "Selesai",
      className: "bg-emerald-100 text-emerald-700",
    };
  }
  if (status === "DIPROSES") {
    return {
      label: "Diproses",
      className: "bg-blue-100 text-blue-700",
    };
  }
  if (status === "DIBATALKAN") {
    return {
      label: "Dibatalkan",
      className: "bg-slate-200 text-slate-700",
    };
  }
  return {
    label: "Menunggu",
    className: "bg-amber-100 text-amber-700",
  };
};

const countNights = (checkIn: string, checkOut: string) => {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = end.getTime() - start.getTime();
  if (diff <= 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const getWeekdayLabel = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return weekdayLabels[date.getDay()] ?? "";
};

const parsePositiveIntInput = (value: string): number | null => {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return Number.NaN;
  return parsed;
};

const toSafeAmount = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const toTimestamp = (value: string | null) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const mapPaymentProofsToOrders = (proofs: TenantPaymentProof[]): TenantOrderRow[] => {
  const orderMap = new Map<string, TenantOrderRow>();

  proofs.forEach((proof) => {
    if (orderMap.has(proof.booking.id)) return;
    orderMap.set(proof.booking.id, {
      id: proof.booking.id,
      orderNo: proof.booking.orderNo,
      submittedAt: proof.submittedAt,
      checkIn: proof.booking.checkIn,
      propertyId: proof.booking.property.id,
      property: proof.booking.property.name,
      userId: proof.user.id,
      user: proof.user.fullName ?? proof.user.email,
      nights: countNights(proof.booking.checkIn, proof.booking.checkOut),
      status: proof.booking.status,
      total: toSafeAmount(proof.booking.totalAmount),
      paymentProofId: proof.id,
      paymentProofStatus: proof.status,
      paymentProofImageUrl: proof.imageUrl,
    });
  });

  return Array.from(orderMap.values());
};

const toTrendChart = (
  values: number[],
  labels: string[],
  width = 680,
  height = 260,
) => {
  const left = 52;
  const right = 24;
  const top = 18;
  const bottom = 38;
  const plotWidth = Math.max(width - left - right, 1);
  const plotHeight = Math.max(height - top - bottom, 1);
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x =
      values.length <= 1
        ? width / 2
        : left + (index * plotWidth) / (values.length - 1);
    const y = top + (1 - value / maxValue) * plotHeight;
    return {
      x,
      y,
      value,
      label: labels[index] ?? "",
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1]?.x ?? 0} ${height - bottom} L ${
        points[0]?.x ?? 0
      } ${height - bottom} Z`
    : "";

  return {
    points,
    linePath,
    areaPath,
    maxValue,
    left,
    right,
    top,
    bottom,
    width,
    height,
  };
};

const fetchJson = async <T,>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  let data: unknown = {};
  if (raw) {
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      data = { message: raw };
    }
  }

  if (!response.ok) {
    const parsed =
      typeof data === "object" && data !== null
        ? (data as { message?: string })
        : {};
    const message =
      parsed.message ||
      `Permintaan gagal (${response.status} ${response.statusText}).`;
    throw new Error(message);
  }

  return data as T;
};

const normalizeTenantActionError = (message: string) => {
  if (message.includes("tidak bisa ditutup karena sudah ada transaksi terbayar")) {
    return `Aksi ditolak. ${message} Pilih tanggal lain atau biarkan tanggal tersebut tetap tersedia.`;
  }

  if (message.includes("tidak boleh lebih kecil dari kamar terjual")) {
    return `Aksi ditolak. ${message} Naikkan jumlah unit tersedia atau ubah tanggal yang dipilih.`;
  }

  return message;
};

const propertyCardVisuals = [
  {
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    type: "Villa",
    location: "Bali, Indonesia",
    rating: "4.8",
    status: "Active",
  },
  {
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    type: "Apartment",
    location: "Jakarta, Indonesia",
    rating: "4.5",
    status: "Active",
  },
  {
    image:
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80",
    type: "Cabin",
    location: "Bandung, Indonesia",
    rating: "4.9",
    status: "Maintenance",
  },
];

const reportWeekdayLabels = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

export default function TenantDashboardClient({ me }: { me: DashboardUser }) {
  const [active, setActive] = useState<NavKey>("dashboard-overview");
  const [reportTab, setReportTab] = useState<"sales" | "property">("sales");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [headerSearch, setHeaderSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [salesView, setSalesView] = useState<"property" | "transaction" | "user">(
    "transaction",
  );
  const [sortBy, setSortBy] = useState<"date" | "total">("date");
  const [salesSortOrder, setSalesSortOrder] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [salesPage, setSalesPage] = useState(1);
  const [salesLimit, setSalesLimit] = useState(10);
  const [salesMeta, setSalesMeta] = useState<SalesMeta>(defaultSalesMeta);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>(defaultSalesSummary);
  const [salesTrendData, setSalesTrendData] = useState<SalesTrendRow[]>([]);
  const [salesTransactionRows, setSalesTransactionRows] = useState<SalesTransactionRow[]>(
    [],
  );
  const [salesPropertyRows, setSalesPropertyRows] = useState<SalesPropertyRow[]>([]);
  const [salesUserRows, setSalesUserRows] = useState<SalesUserRow[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>(
    "ALL",
  );
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLimit, setTransactionLimit] = useState(10);
  const [transactionSortBy, setTransactionSortBy] = useState<
    "submittedAt" | "total" | "checkIn" | "orderNo"
  >("submittedAt");
  const [transactionSortOrder, setTransactionSortOrder] = useState<"asc" | "desc">(
    "desc",
  );
  const [tenantPaymentProofMeta, setTenantPaymentProofMeta] =
    useState<TenantPaymentProofMeta>(defaultTenantPaymentProofMeta);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [tenantReviews, setTenantReviews] = useState<TenantReview[]>([]);
  const [tenantReviewsLoading, setTenantReviewsLoading] = useState(false);
  const [tenantReviewsError, setTenantReviewsError] = useState<string | null>(null);
  const [reviewReplyLoadingId, setReviewReplyLoadingId] = useState<string | null>(
    null,
  );
  const [reviewReplyFeedback, setReviewReplyFeedback] = useState<string | null>(
    null,
  );
  const [paymentDecisionNotes, setPaymentDecisionNotes] = useState<
    Record<string, string>
  >({});
  const [paymentActionLoadingId, setPaymentActionLoadingId] = useState<
    string | null
  >(null);
  const [paymentActionError, setPaymentActionError] = useState<string | null>(
    null,
  );
  const [paymentActionFeedback, setPaymentActionFeedback] = useState<
    string | null
  >(null);
  const [tenantPaymentProofs, setTenantPaymentProofs] = useState<
    TenantPaymentProof[]
  >([]);
  const [tenantPaymentProofsLoading, setTenantPaymentProofsLoading] =
    useState(false);
  const [tenantPaymentProofsError, setTenantPaymentProofsError] = useState<
    string | null
  >(null);
  const [overviewPaymentProofs, setOverviewPaymentProofs] = useState<
    TenantPaymentProof[]
  >([]);
  const [overviewReviewsTotal, setOverviewReviewsTotal] = useState(0);
  const [overviewPendingReviews, setOverviewPendingReviews] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewNotice, setOverviewNotice] = useState<string | null>(null);
  const [properties, setProperties] = useState<TenantProperty[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [propertyReportPage, setPropertyReportPage] = useState(1);
  const [propertyReportLimit, setPropertyReportLimit] = useState(10);
  const [propertyReportMeta, setPropertyReportMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryNameDrafts, setCategoryNameDrafts] = useState<
    Record<string, string>
  >({});
  const [categoryCreateLoading, setCategoryCreateLoading] = useState(false);
  const [categoryCreateError, setCategoryCreateError] = useState<string | null>(
    null,
  );
  const [categoryCreateFeedback, setCategoryCreateFeedback] = useState<string | null>(
    null,
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [availabilityQuery, setAvailabilityQuery] = useState({
    startDate: "",
    endDate: "",
  });
  const [availabilityData, setAvailabilityData] =
    useState<AvailabilityResponse | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [availabilityView, setAvailabilityView] = useState<"table" | "grid">(
    "grid",
  );
  const [selectedCalendarDates, setSelectedCalendarDates] = useState<string[]>(
    [],
  );
  const [roomActionType, setRoomActionType] = useState<
    "close" | "open" | "adjust"
  >("close");
  const [roomAvailabilityMode, setRoomAvailabilityMode] = useState<
    "available" | "blocked"
  >("available");
  const [roomActionUnits, setRoomActionUnits] = useState("");
  const [roomAdjustmentType, setRoomAdjustmentType] = useState<
    "NOMINAL" | "PERCENT"
  >("NOMINAL");
  const [roomAdjustmentValue, setRoomAdjustmentValue] = useState("");
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [roomActionError, setRoomActionError] = useState<string | null>(null);
  const [roomActionSuccess, setRoomActionSuccess] = useState<string | null>(
    null,
  );
  const [roomActionConfirm, setRoomActionConfirm] =
    useState<RoomActionConfirmState | null>(null);
  const [tenantActionConfirm, setTenantActionConfirm] =
    useState<TenantActionConfirmState | null>(null);
  const [tenantActionConfirmLoading, setTenantActionConfirmLoading] =
    useState(false);

  const [rateRules, setRateRules] = useState<RateRule[]>([]);
  const [rateRulesLoading, setRateRulesLoading] = useState(false);
  const [rateRulesError, setRateRulesError] = useState<string | null>(null);

  const tenantOrders = useMemo<TenantOrderRow[]>(
    () => mapPaymentProofsToOrders(tenantPaymentProofs),
    [tenantPaymentProofs],
  );

  const overviewOrders = useMemo<TenantOrderRow[]>(
    () => mapPaymentProofsToOrders(overviewPaymentProofs),
    [overviewPaymentProofs],
  );

  const overviewTrend = useMemo<OverviewTrendPoint[]>(() => {
    const today = new Date();
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      const dateKey = formatDateInput(date);
      return {
        dateKey,
        weekday: getWeekdayLabel(dateKey),
        orders: 0,
        revenue: 0,
      };
    });

    const pointMap = new Map(points.map((point) => [point.dateKey, point]));
    overviewPaymentProofs.forEach((proof) => {
      const submittedAt = new Date(proof.submittedAt);
      if (Number.isNaN(submittedAt.getTime())) return;
      const key = formatDateInput(submittedAt);
      const point = pointMap.get(key);
      if (!point) return;
      point.orders += 1;
      if (proof.booking.status !== "DIBATALKAN") {
        point.revenue += toSafeAmount(proof.booking.totalAmount);
      }
    });

    return points;
  }, [overviewPaymentProofs]);

  const overviewBreakdown = useMemo<PropertyBreakdownRow[]>(() => {
    const map = new Map<string, PropertyBreakdownRow>();

    overviewPaymentProofs.forEach((proof) => {
      const propertyId = proof.booking.property.id;
      const current =
        map.get(propertyId) ??
        ({
          propertyId,
          propertyName: proof.booking.property.name,
          orders: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0,
          lastSubmittedAt: null,
        } satisfies PropertyBreakdownRow);

      current.orders += 1;
      if (proof.booking.status === "MENUNGGU_PEMBAYARAN") current.pending += 1;
      if (proof.booking.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN") {
        current.pending += 1;
      }
      if (proof.booking.status === "DIPROSES") current.inProgress += 1;
      if (proof.booking.status === "SELESAI") current.completed += 1;
      if (proof.booking.status === "DIBATALKAN") current.cancelled += 1;

      if (proof.booking.status !== "DIBATALKAN") {
        current.revenue += toSafeAmount(proof.booking.totalAmount);
      }

      if (toTimestamp(proof.submittedAt) > toTimestamp(current.lastSubmittedAt)) {
        current.lastSubmittedAt = proof.submittedAt;
      }

      map.set(propertyId, current);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return b.orders - a.orders;
    });
  }, [overviewPaymentProofs]);

  const overviewSummary = useMemo(() => {
    const totalRooms = properties.reduce(
      (sum, property) => sum + property.rooms.length,
      0,
    );
    const activeTenants = new Set(overviewPaymentProofs.map((proof) => proof.user.id))
      .size;
    const activeOrders = overviewOrders.filter(
      (order) => order.status === "DIPROSES",
    ).length;
    const pendingOrders = overviewOrders.filter(
      (order) =>
        order.status === "MENUNGGU_PEMBAYARAN" ||
        order.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN",
    ).length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = overviewPaymentProofs.reduce((sum, proof) => {
      const submittedAt = new Date(proof.submittedAt);
      if (Number.isNaN(submittedAt.getTime())) return sum;
      const isCurrentMonth =
        submittedAt.getMonth() === currentMonth &&
        submittedAt.getFullYear() === currentYear;
      if (!isCurrentMonth || proof.booking.status === "DIBATALKAN") return sum;
      return sum + toSafeAmount(proof.booking.totalAmount);
    }, 0);
    const totalRevenue = overviewPaymentProofs.reduce((sum, proof) => {
      if (proof.booking.status === "DIBATALKAN") return sum;
      return sum + toSafeAmount(proof.booking.totalAmount);
    }, 0);
    const occupancyRate =
      totalRooms > 0 ? Math.min(100, Math.round((activeOrders / totalRooms) * 100)) : 0;

    return {
      properties: properties.length,
      totalRooms,
      activeTenants,
      activeOrders,
      pendingOrders,
      monthlyRevenue,
      totalRevenue,
      reviewsTotal: overviewReviewsTotal,
      pendingReviews: overviewPendingReviews,
      occupancyRate,
    };
  }, [
    overviewOrders,
    overviewPaymentProofs,
    overviewPendingReviews,
    overviewReviewsTotal,
    properties,
  ]);

  const overviewRevenueSeries = useMemo(
    () => overviewTrend.map((point) => point.revenue),
    [overviewTrend],
  );

  const overviewChart = useMemo(
    () => toTrendChart(overviewRevenueSeries, overviewMonthLabels),
    [overviewRevenueSeries],
  );

  const overviewRevenueGrowth = useMemo(() => {
    if (overviewRevenueSeries.length < 2) return 0;
    const first = overviewRevenueSeries[0] ?? 0;
    const last = overviewRevenueSeries[overviewRevenueSeries.length - 1] ?? 0;
    if (first <= 0) return last > 0 ? 100 : 0;
    return ((last - first) / first) * 100;
  }, [overviewRevenueSeries]);

  const overviewRevenueChangeLabel = useMemo(() => {
    const absolute = Math.abs(overviewRevenueGrowth).toFixed(1);
    return `${overviewRevenueGrowth >= 0 ? "+" : "-"}${absolute}%`;
  }, [overviewRevenueGrowth]);

  const overviewRecentActivity = useMemo(
    () => overviewPaymentProofs.slice(0, 5),
    [overviewPaymentProofs],
  );

  const filteredTransactionRows = useMemo(
    () => tenantOrders,
    [tenantOrders],
  );

  const salesDateRangeInvalid = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return false;
    return dateRange.from > dateRange.to;
  }, [dateRange.from, dateRange.to]);

  const propertyCards = useMemo(() => {
    return properties.map((property, index) => {
      const visual = propertyCardVisuals[index % propertyCardVisuals.length];
      const location = [property.cityName, property.province]
        .filter((value): value is string => Boolean(value && value.trim()))
        .join(", ");
      return {
        ...property,
        image: property.coverUrl || visual.image,
        type: property.categoryName || visual.type,
        location: location || visual.location,
        rating: visual.rating,
        status: visual.status,
      };
    });
  }, [properties]);

  const filteredPropertyCards = useMemo(() => {
    const keyword = propertySearch.trim().toLowerCase();
    if (!keyword) return propertyCards;
    return propertyCards.filter((property) =>
      [property.name, property.location, property.type]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [propertyCards, propertySearch]);

  const categoryRows = useMemo(() => {
    const propertyCountByCategory = properties.reduce<Record<string, number>>(
      (acc, property) => {
        const key = (property.categoryName || "").trim().toLowerCase();
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    );

    const source =
      catalogCategories.length > 0
        ? catalogCategories
        : Array.from(
            new Map(
              properties
                .map((property) => property.categoryName?.trim())
                .filter((value): value is string => Boolean(value))
                .map((name) => [name.toLowerCase(), { id: name, name }]),
            ).values(),
          );

    return source.map((category) => ({
      ...category,
      propertiesCount: propertyCountByCategory[category.name.toLowerCase()] ?? 0,
    }));
  }, [catalogCategories, properties]);

  const salesTrendSeries = useMemo(() => {
    if (salesTrendData.length > 0) return salesTrendData;
    return overviewMonthLabels.map((month) => ({
      month,
      sales: 0,
      bookings: 0,
    }));
  }, [salesTrendData]);

  const salesTrendMax = useMemo(
    () => Math.max(...salesTrendSeries.map((item) => item.sales), 1),
    [salesTrendSeries],
  );

  const bookingsTrendMax = useMemo(
    () => Math.max(...salesTrendSeries.map((item) => item.bookings), 1),
    [salesTrendSeries],
  );

  const roomMonthLabel = useMemo(() => {
    const base = availabilityQuery.startDate
      ? new Date(`${availabilityQuery.startDate}T00:00:00`)
      : new Date();
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(base);
  }, [availabilityQuery.startDate]);

  const roomCalendarCells = useMemo(() => {
    const base = availabilityQuery.startDate
      ? new Date(`${availabilityQuery.startDate}T00:00:00`)
      : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const monthStart = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOffset = monthStart.getDay();
    const map = new Map((availabilityData?.items ?? []).map((item) => [item.date, item]));
    const cells: Array<
      | null
      | {
          date: string;
          day: number;
          item: AvailabilityItem | null;
        }
    > = [];

    for (let index = 0; index < firstDayOffset; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = formatDateInput(date);
      cells.push({
        date: dateKey,
        day,
        item: map.get(dateKey) ?? null,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [availabilityData, availabilityQuery.startDate]);

  const reportAvailabilityWeeks = useMemo(() => {
    const base = availabilityQuery.startDate
      ? new Date(`${availabilityQuery.startDate}T00:00:00`)
      : new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const monthStart = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayOffset = (monthStart.getDay() + 6) % 7;
    const map = new Map((availabilityData?.items ?? []).map((item) => [item.date, item]));
    const cells: Array<
      | null
      | {
          day: number;
          status: "Available" | "Booked" | "Maintenance";
        }
    > = [];

    for (let index = 0; index < mondayOffset; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = formatDateInput(new Date(year, month, day));
      const item = map.get(date);
      let status: "Available" | "Booked" | "Maintenance" = "Available";
      if (item) {
        status = item.isClosed
          ? "Maintenance"
          : item.availableUnits <= 0
            ? "Booked"
            : "Available";
      }
      cells.push({ day, status });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: Array<typeof cells> = [];
    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7));
    }
    return weeks;
  }, [availabilityData, availabilityQuery.startDate]);

  const availabilityStatusSummary = useMemo(() => {
    const items = availabilityData?.items ?? [];
    return items.reduce(
      (acc, item) => {
        if (item.isClosed) {
          acc.maintenance += 1;
          return acc;
        }
        if (item.availableUnits <= 0) {
          acc.booked += 1;
          return acc;
        }
        acc.available += 1;
        return acc;
      },
      { available: 0, booked: 0, maintenance: 0 },
    );
  }, [availabilityData]);

  const overviewYAxisTicks = useMemo(() => {
    const maxValue = Math.max(overviewChart.maxValue, 1_000);
    const step = Math.max(1_000, Math.ceil(maxValue / 4 / 1_000) * 1_000);
    return [step * 4, step * 3, step * 2, step, 0];
  }, [overviewChart.maxValue]);

  const tenantInitials = useMemo(() => {
    const words = me.name
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return "TN";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }, [me.name]);

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );

  const availableRooms = selectedProperty?.rooms ?? [];

  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === selectedRoomId) ?? null,
    [availableRooms, selectedRoomId],
  );

  const roomBasePrice = useMemo(() => {
    const amount = Number(selectedRoom?.price ?? "0");
    return Number.isFinite(amount) ? amount : 0;
  }, [selectedRoom]);

  const roomAdjustmentPreview = useMemo(() => {
    if (roomActionType !== "adjust" || !selectedRoom) return null;
    const basePrice = Number(selectedRoom.price);
    const adjustment = Number(roomAdjustmentValue);
    if (!Number.isFinite(basePrice) || !Number.isFinite(adjustment)) return null;

    const finalPrice =
      roomAdjustmentType === "PERCENT"
        ? basePrice + (basePrice * adjustment) / 100
        : basePrice + adjustment;

    return {
      basePrice,
      finalPrice,
    };
  }, [roomActionType, roomAdjustmentType, roomAdjustmentValue, selectedRoom]);

  const mapTenantProperties = (items: TenantProperty[]) =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? null,
      address: item.address ?? null,
      categoryId: item.categoryId ?? null,
      categoryName: item.categoryName ?? null,
      cityName: item.cityName ?? null,
      province: item.province ?? null,
      coverUrl: item.coverUrl ?? null,
      galleryUrls: Array.isArray(item.galleryUrls) ? item.galleryUrls : [],
      rooms: (item.rooms ?? []).map((room: any) => ({
        id: room.id,
        name: room.name,
        price: room.price,
        totalUnits: room.totalUnits,
        maxGuests: room.maxGuests,
      })),
    })) as TenantProperty[];

  const fetchProperties = async ({
    mode = "all",
    page = 1,
    limit = 50,
  }: {
    mode?: "all" | "page";
    page?: number;
    limit?: number;
  } = {}) => {
    try {
      setPropertiesLoading(true);
      setPropertiesError(null);

      if (mode === "page") {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const response = await fetchJson<TenantPropertyListResponse>(
          `/properties?${query.toString()}`,
        );
        setProperties(mapTenantProperties(response.data ?? []));
        setPropertyReportMeta({
          page: response.meta?.page ?? page,
          limit: response.meta?.limit ?? limit,
          total: response.meta?.total ?? 0,
          totalPages: Math.max(1, response.meta?.totalPages ?? 1),
          hasNext: Boolean(response.meta?.hasNext),
          hasPrev: Boolean(response.meta?.hasPrev),
        });
        return;
      }

      let currentPage = 1;
      let totalPages = 1;
      const aggregated: TenantProperty[] = [];
      do {
        const query = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
        });
        const response = await fetchJson<TenantPropertyListResponse>(
          `/properties?${query.toString()}`,
        );
        aggregated.push(...(response.data ?? []));
        totalPages = Math.max(1, response.meta?.totalPages ?? 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const mapped = mapTenantProperties(aggregated);
      setProperties(mapped);
      setPropertyReportMeta({
        page: 1,
        limit,
        total: mapped.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    } catch (err) {
      setPropertiesError(
        err instanceof Error ? err.message : "Gagal memuat properti.",
      );
      setProperties([]);
      setPropertyReportMeta((prev) => ({
        ...prev,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }));
    } finally {
      setPropertiesLoading(false);
    }
  };

  const loadCatalogCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const data = await fetchJson<CatalogCategory[]>("/catalog/categories?limit=50");
      setCatalogCategories(data);
    } catch (err) {
      setCategoriesError(
        err instanceof Error ? err.message : "Gagal memuat kategori properti.",
      );
      setCatalogCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCreateCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryCreateError("Nama kategori wajib diisi.");
      return;
    }

    setCategoryCreateError(null);
    setCategoryCreateFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Tambah Kategori",
      description: `Tambah kategori baru "${name}" sekarang?`,
      confirmLabel: "Tambah",
      payload: {
        type: "create-category",
        name,
      },
    });
  };

  const handleStartEditCategory = (category: CatalogCategory) => {
    setCategoryCreateError(null);
    setCategoryCreateFeedback(null);
    setEditingCategoryId(category.id);
    setCategoryNameDrafts((prev) => ({
      ...prev,
      [category.id]: prev[category.id] ?? category.name,
    }));
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
  };

  const handleSubmitEditCategory = (category: CatalogCategory) => {
    const nextName = (categoryNameDrafts[category.id] ?? "").trim();
    if (!nextName) {
      setCategoryCreateError("Nama kategori wajib diisi.");
      return;
    }

    setCategoryCreateError(null);
    setCategoryCreateFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Perbarui Kategori",
      description: `Ubah nama kategori "${category.name}" menjadi "${nextName}"?`,
      confirmLabel: "Perbarui",
      payload: {
        type: "update-category",
        id: category.id,
        name: nextName,
      },
    });
  };

  const handleDeleteCategory = (category: CatalogCategory) => {
    setCategoryCreateError(null);
    setCategoryCreateFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Hapus Kategori",
      description: `Hapus kategori "${category.name}"? Properti lama tetap aman, tapi kategori ini tidak bisa dipakai lagi.`,
      confirmLabel: "Hapus",
      payload: {
        type: "delete-category",
        id: category.id,
        name: category.name,
      },
    });
  };

  const loadAvailability = async () => {
    if (!selectedRoomId) {
      setAvailabilityError("Pilih kamar terlebih dahulu.");
      return;
    }
    if (!availabilityQuery.startDate || !availabilityQuery.endDate) {
      setAvailabilityError("Tanggal mulai dan akhir wajib diisi.");
      return;
    }

    try {
      setAvailabilityLoading(true);
      setAvailabilityError(null);
      const query = new URLSearchParams({
        startDate: availabilityQuery.startDate,
        endDate: availabilityQuery.endDate,
      });
      const data = await fetchJson<AvailabilityResponse>(
        `/availability/room-types/${selectedRoomId}?${query.toString()}`,
      );
      setAvailabilityData(data);
      setSelectedCalendarDates((prev) =>
        prev.filter((date) => data.items.some((item) => item.date === date)),
      );
    } catch (err) {
      setAvailabilityData(null);
      setAvailabilityError(
        err instanceof Error ? err.message : "Gagal memuat kalender.",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadRateRules = async () => {
    try {
      setRateRulesLoading(true);
      setRateRulesError(null);
      const params = new URLSearchParams();
      if (selectedRoomId) {
        params.set("scope", "ROOM_TYPE");
        params.set("roomTypeId", selectedRoomId);
      } else if (selectedPropertyId) {
        params.set("scope", "PROPERTY");
        params.set("propertyId", selectedPropertyId);
      }
      const path = params.toString()
        ? `/availability/rate-rules?${params.toString()}`
        : "/availability/rate-rules";
      const data = await fetchJson<RateRule[]>(path);
      setRateRules(data);
    } catch (err) {
      setRateRulesError(
        err instanceof Error ? err.message : "Gagal memuat aturan harga.",
      );
      setRateRules([]);
    } finally {
      setRateRulesLoading(false);
    }
  };

  const toggleCalendarDate = (dateValue: string) => {
    setSelectedCalendarDates((prev) =>
      prev.includes(dateValue)
        ? prev.filter((item) => item !== dateValue)
        : [...prev, dateValue],
    );
    setRoomActionError(null);
    setRoomActionSuccess(null);
  };

  const handleSelectAllVisibleDates = () => {
    if (!availabilityData) return;
    setSelectedCalendarDates(availabilityData.items.map((item) => item.date));
    setRoomActionError(null);
    setRoomActionSuccess(null);
  };

  const handleClearSelectedDates = () => {
    setSelectedCalendarDates([]);
    setRoomActionError(null);
    setRoomActionSuccess(null);
  };

  const handleConfirmRoomAction = async () => {
    if (!selectedRoomId || !roomActionConfirm) {
      setRoomActionError("Aksi kamar belum siap dikonfirmasi.");
      return;
    }

    try {
      setRoomActionLoading(true);
      setRoomActionError(null);
      setRoomActionSuccess(null);

      await fetchJson(`/availability/room-types/${selectedRoomId}`, {
        method: "PUT",
        body: JSON.stringify(roomActionConfirm.payload),
      });

      setRoomActionSuccess(roomActionConfirm.successMessage);
      setRoomActionConfirm(null);
      await Promise.all([loadAvailability(), loadRateRules()]);
    } catch (err) {
      setRoomActionError(
        err instanceof Error
          ? normalizeTenantActionError(err.message)
          : "Gagal menerapkan perubahan kamar.",
      );
    } finally {
      setRoomActionLoading(false);
    }
  };

  const handleCancelRoomActionConfirm = () => {
    if (roomActionLoading) return;
    setRoomActionConfirm(null);
  };

  const handleRoomActionApply = async () => {
    if (!selectedRoomId) {
      setRoomActionError("Pilih kamar terlebih dahulu.");
      return;
    }
    if (selectedCalendarDates.length === 0) {
      setRoomActionError("Pilih minimal satu tanggal pada kalender.");
      return;
    }

    const sortedDates = [...selectedCalendarDates].sort();
    const parsedUnits = parsePositiveIntInput(roomActionUnits);

    if (roomActionUnits.trim() && Number.isNaN(parsedUnits)) {
      setRoomActionError("Jumlah unit wajib angka bulat dan harus lebih dari 0.");
      return;
    }

    try {
      setRoomActionLoading(true);
      setRoomActionError(null);
      setRoomActionSuccess(null);

      if (roomActionType === "close" || roomActionType === "open") {
        const payload: Record<string, unknown> = {
          dates: sortedDates,
          isClosed: roomActionType === "close",
        };

        if (parsedUnits !== null && selectedRoom && parsedUnits > selectedRoom.totalUnits) {
          setRoomActionError(
            `Jumlah unit melebihi total kamar (${selectedRoom.totalUnits} unit).`,
          );
          return;
        }

        if (roomActionType === "open" && parsedUnits !== null) {
          payload.availableUnits = parsedUnits;
        }

        if (roomActionType === "close" && parsedUnits !== null) {
          const selectedDatesSet = new Set(sortedDates);
          const insufficientDate = availabilityData?.items.find(
            (item) =>
              selectedDatesSet.has(item.date) && parsedUnits > item.availableUnits,
          );
          if (insufficientDate) {
            setRoomActionError(
              `Jumlah kamar yang ditutup (${parsedUnits} unit) melebihi stok tanggal ${insufficientDate.date} (${insufficientDate.availableUnits} unit).`,
            );
            return;
          }
          payload.closeUnits = parsedUnits;
        }

        const successMessage =
          roomActionType === "close"
            ? parsedUnits !== null
              ? `${parsedUnits} unit pada tanggal terpilih berhasil ditutup.`
              : "Tanggal terpilih berhasil ditutup."
            : parsedUnits !== null
              ? `Tanggal terpilih berhasil dibuka dengan ${parsedUnits} unit tersedia.`
              : "Tanggal terpilih berhasil dibuka.";

        const actionTitle =
          roomActionType === "close" ? "Konfirmasi Tutup Kamar" : "Konfirmasi Buka Kamar";
        const actionDescription =
          roomActionType === "close"
            ? parsedUnits !== null
              ? `Kamu akan menutup ${parsedUnits} unit untuk ${sortedDates.length} tanggal yang dipilih. Lanjutkan?`
              : `Kamu akan menutup kamar untuk ${sortedDates.length} tanggal yang dipilih. Lanjutkan?`
            : parsedUnits !== null
              ? `Kamu akan membuka kamar dengan ${parsedUnits} unit tersedia untuk ${sortedDates.length} tanggal yang dipilih. Lanjutkan?`
              : `Kamu akan membuka kamar untuk ${sortedDates.length} tanggal yang dipilih. Lanjutkan?`;

        setRoomActionConfirm({
          title: actionTitle,
          description: actionDescription,
          payload,
          successMessage,
        });
        return;
      } else {
        if (!roomAdjustmentValue.trim()) {
          setRoomActionError("Nilai penyesuaian harga wajib diisi.");
          return;
        }
        await fetchJson("/availability/rate-rules", {
          method: "POST",
          body: JSON.stringify({
            name: `Rule ${sortedDates[0]}${sortedDates.length > 1 ? ` - ${sortedDates[sortedDates.length - 1]}` : ""}`,
            scope: "ROOM_TYPE",
            roomTypeId: selectedRoomId,
            adjustmentType: roomAdjustmentType,
            adjustmentValue: roomAdjustmentValue,
            isActive: true,
            dates: sortedDates,
          }),
        });
        setRoomActionSuccess("Penyesuaian harga berhasil diterapkan.");
      }

      await Promise.all([loadAvailability(), loadRateRules()]);
    } catch (err) {
      setRoomActionError(
        err instanceof Error
          ? normalizeTenantActionError(err.message)
          : "Gagal menerapkan perubahan kamar.",
      );
    } finally {
      setRoomActionLoading(false);
    }
  };

  const applyRoomSidebarChanges = () => {
    if (!selectedRoomId) {
      setRoomActionError("Pilih kamar terlebih dahulu.");
      return;
    }
    if (selectedCalendarDates.length === 0) {
      setRoomActionError("Pilih minimal satu tanggal pada kalender.");
      return;
    }

    const sortedDates = [...selectedCalendarDates].sort();
    const actionLabel =
      roomAvailabilityMode === "blocked"
        ? "menutup"
        : "membuka";
    const hasRateAdjustment = roomAdjustmentValue.trim().length > 0;

    setRoomActionError(null);
    setRoomActionSuccess(null);
    setTenantActionConfirm({
      title: "Konfirmasi Perubahan Kamar",
      description: hasRateAdjustment
        ? `Kamu akan ${actionLabel} kamar di ${sortedDates.length} tanggal sekaligus menerapkan penyesuaian harga. Lanjutkan?`
        : `Kamu akan ${actionLabel} kamar di ${sortedDates.length} tanggal terpilih. Lanjutkan?`,
      confirmLabel: "Terapkan",
      payload: {
        type: "apply-room-sidebar",
        roomTypeId: selectedRoomId,
        dates: sortedDates,
        shouldBlock: roomAvailabilityMode === "blocked",
        adjustmentType: roomAdjustmentType,
        adjustmentValue: roomAdjustmentValue.trim(),
      },
    });
  };

  const handleDeleteRateRule = (id: string) => {
    const rule = rateRules.find((item) => item.id === id);
    setRateRulesError(null);
    setTenantActionConfirm({
      title: "Konfirmasi Hapus Aturan Harga",
      description: `Hapus aturan harga "${rule?.name ?? id}"?`,
      confirmLabel: "Hapus",
      payload: {
        type: "delete-rate-rule",
        id,
      },
    });
  };

  const shiftAvailabilityMonth = (delta: number) => {
    const base = availabilityQuery.startDate
      ? new Date(`${availabilityQuery.startDate}T00:00:00`)
      : new Date();
    const monthStart = new Date(base.getFullYear(), base.getMonth() + delta, 1);
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    );
    setAvailabilityQuery({
      startDate: formatDateInput(monthStart),
      endDate: formatDateInput(monthEnd),
    });
  };

  const fetchTenantPaymentProofs = async (params: {
    status?: PaymentProofStatus;
    bookingStatus?: BookingStatus;
    keyword?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: "submittedAt" | "total" | "checkIn" | "orderNo";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.bookingStatus) query.set("bookingStatus", params.bookingStatus);
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.sortOrder) query.set("sortOrder", params.sortOrder);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    return fetchJson<TenantPaymentProofResponse>(
      `/bookings/tenant/payment-proofs?${query.toString()}`,
    );
  };

  const loadTenantPaymentProofs = async () => {
    try {
      setTenantPaymentProofsLoading(true);
      setTenantPaymentProofsError(null);
      const response = await fetchTenantPaymentProofs({
        bookingStatus: statusFilter === "ALL" ? undefined : statusFilter,
        keyword: transactionSearch.trim() || undefined,
        sortBy: transactionSortBy,
        sortOrder: transactionSortOrder,
        page: transactionPage,
        limit: transactionLimit,
      });

      setTenantPaymentProofs(response.data ?? []);
      setTenantPaymentProofMeta(
        response.meta ?? {
          ...defaultTenantPaymentProofMeta,
          page: transactionPage,
          limit: transactionLimit,
          sortBy: transactionSortBy,
          sortOrder: transactionSortOrder,
        },
      );
    } catch (err) {
      setTenantPaymentProofsError(
        err instanceof Error ? err.message : "Gagal memuat bukti pembayaran.",
      );
      setTenantPaymentProofs([]);
      setTenantPaymentProofMeta({
        ...defaultTenantPaymentProofMeta,
        page: transactionPage,
        limit: transactionLimit,
        sortBy: transactionSortBy,
        sortOrder: transactionSortOrder,
      });
    } finally {
      setTenantPaymentProofsLoading(false);
    }
  };

  const loadOverviewData = async () => {
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      setOverviewNotice(null);

      const reviewQuery = new URLSearchParams({
        page: "1",
        limit: "1",
      });
      const pendingReviewQuery = new URLSearchParams({
        page: "1",
        limit: "1",
        replied: "false",
      });

      const [proofResult, reviewResult, pendingReviewResult] = await Promise.all([
        fetchTenantPaymentProofs({
          sortBy: "submittedAt",
          sortOrder: "desc",
          page: 1,
          limit: 100,
        }).then(
          (data) => ({ ok: true as const, data }),
          (error) => ({ ok: false as const, error }),
        ),
        fetchJson<TenantReviewResponse>(
          `/bookings/tenant/reviews?${reviewQuery.toString()}`,
        ).then(
          (data) => ({ ok: true as const, data }),
          (error) => ({ ok: false as const, error }),
        ),
        fetchJson<TenantReviewResponse>(
          `/bookings/tenant/reviews?${pendingReviewQuery.toString()}`,
        ).then(
          (data) => ({ ok: true as const, data }),
          (error) => ({ ok: false as const, error }),
        ),
      ]);

      if (!proofResult.ok) {
        throw proofResult.error instanceof Error
          ? proofResult.error
          : new Error("Data payment proof gagal dimuat.");
      }

      const reviewTotal = reviewResult.ok
        ? (reviewResult.data.meta.total ?? reviewResult.data.data.length)
        : 0;
      const pendingReviewTotal = pendingReviewResult.ok
        ? (pendingReviewResult.data.meta.total ?? pendingReviewResult.data.data.length)
        : 0;

      if (!reviewResult.ok || !pendingReviewResult.ok) {
        setOverviewNotice(
          "Sebagian data ringkasan belum lengkap. Coba muat ulang setelah backend siap.",
        );
      }

      setOverviewPaymentProofs(proofResult.data.data ?? []);
      setOverviewReviewsTotal(reviewTotal);
      setOverviewPendingReviews(pendingReviewTotal);
    } catch (err) {
      setOverviewError(
        err instanceof Error ? err.message : "Gagal memuat ringkasan dashboard.",
      );
      setOverviewPaymentProofs([]);
      setOverviewReviewsTotal(0);
      setOverviewPendingReviews(0);
      setOverviewNotice(null);
    } finally {
      setOverviewLoading(false);
    }
  };

  const applySalesFallbackFromOverview = () => {
    if (overviewOrders.length === 0) return false;

    const fromTs = dateRange.from
      ? new Date(`${dateRange.from}T00:00:00`).getTime()
      : null;
    const toTs = dateRange.to
      ? new Date(`${dateRange.to}T23:59:59`).getTime()
      : null;
    const keyword = transactionSearch.trim().toLowerCase();

    const filteredRows = overviewOrders.filter((row) => {
      const ts = toTimestamp(row.submittedAt);
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });

    const totalSales = filteredRows.reduce((sum, row) => {
      if (row.status === "DIBATALKAN") return sum;
      return sum + row.total;
    }, 0);
    const totalTransactions = filteredRows.length;

    const anchorBase = dateRange.to
      ? new Date(`${dateRange.to}T00:00:00`)
      : new Date();
    const anchor = new Date(
      Date.UTC(anchorBase.getFullYear(), anchorBase.getMonth(), 1),
    );
    const monthFormatter = new Intl.DateTimeFormat("id-ID", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });

    const trendBuckets = Array.from({ length: 7 }, (_, index) => {
      const monthDate = new Date(
        Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - (6 - index), 1),
      );
      const key = `${monthDate.getUTCFullYear()}-${`${monthDate.getUTCMonth() + 1}`.padStart(2, "0")}`;
      return {
        key,
        month: monthFormatter.format(monthDate),
        sales: 0,
        bookings: 0,
      };
    });
    const trendMap = new Map(trendBuckets.map((bucket) => [bucket.key, bucket]));

    filteredRows.forEach((row) => {
      const ts = toTimestamp(row.submittedAt);
      if (!ts) return;
      const date = new Date(ts);
      const key = `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, "0")}`;
      const bucket = trendMap.get(key);
      if (!bucket) return;
      bucket.bookings += 1;
      if (row.status !== "DIBATALKAN") {
        bucket.sales += row.total;
      }
    });

    const sortFactor = salesSortOrder === "asc" ? 1 : -1;
    const transactionRows = [...filteredRows];
    transactionRows.sort((a, b) => {
      if (sortBy === "total") {
        if (a.total !== b.total) return sortFactor * (a.total - b.total);
        return sortFactor * (toTimestamp(a.submittedAt) - toTimestamp(b.submittedAt));
      }
      const dateDiff = toTimestamp(a.submittedAt) - toTimestamp(b.submittedAt);
      if (dateDiff !== 0) return sortFactor * dateDiff;
      return sortFactor * (a.total - b.total);
    });

    let total = 0;
    let pagedTransactionRows: SalesTransactionRow[] = [];
    let pagedPropertyRows: SalesPropertyRow[] = [];
    let pagedUserRows: SalesUserRow[] = [];

    if (salesView === "transaction") {
      const searched = keyword
        ? transactionRows.filter((row) =>
            [row.orderNo, row.property, row.user, row.submittedAt]
              .join(" ")
              .toLowerCase()
              .includes(keyword),
          )
        : transactionRows;
      total = searched.length;
      const totalPages = Math.max(1, Math.ceil(total / salesLimit));
      const page = Math.min(Math.max(1, salesPage), totalPages);
      const start = (page - 1) * salesLimit;
      const end = start + salesLimit;
      pagedTransactionRows = searched.slice(start, end).map((row) => ({
        id: row.id,
        orderNo: row.orderNo,
        submittedAt: row.submittedAt,
        checkIn: row.checkIn,
        propertyId: row.propertyId,
        property: row.property,
        userId: row.userId,
        user: row.user,
        status: row.status,
        total: row.total,
      }));

      setSalesMeta({
        page,
        limit: salesLimit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        view: salesView,
        sortBy,
        sortOrder: salesSortOrder,
        startDate: dateRange.from || null,
        endDate: dateRange.to || null,
        keyword: transactionSearch.trim() || null,
      });
    }

    if (salesView === "property") {
      const map = new Map<string, SalesPropertyRow & { userSet: Set<string> }>();
      transactionRows.forEach((row) => {
        const current =
          map.get(row.propertyId) ??
          {
            propertyId: row.propertyId,
            propertyName: row.property,
            transactions: 0,
            users: 0,
            totalSales: 0,
            latestTransactionAt: null,
            userSet: new Set<string>(),
          };
        current.transactions += 1;
        current.userSet.add(row.userId);
        if (row.status !== "DIBATALKAN") {
          current.totalSales += row.total;
        }
        if (toTimestamp(row.submittedAt) > toTimestamp(current.latestTransactionAt)) {
          current.latestTransactionAt = row.submittedAt;
        }
        map.set(row.propertyId, current);
      });

      const rows = Array.from(map.values()).map((row) => ({
        propertyId: row.propertyId,
        propertyName: row.propertyName,
        transactions: row.transactions,
        users: row.userSet.size,
        totalSales: row.totalSales,
        latestTransactionAt: row.latestTransactionAt,
      }));

      const searched = keyword
        ? rows.filter((row) => row.propertyName.toLowerCase().includes(keyword))
        : rows;
      searched.sort((a, b) => {
        if (sortBy === "total") {
          if (a.totalSales !== b.totalSales) {
            return sortFactor * (a.totalSales - b.totalSales);
          }
        } else {
          const dateDiff = toTimestamp(a.latestTransactionAt) - toTimestamp(b.latestTransactionAt);
          if (dateDiff !== 0) return sortFactor * dateDiff;
        }
        return sortFactor * (toTimestamp(a.latestTransactionAt) - toTimestamp(b.latestTransactionAt));
      });

      total = searched.length;
      const totalPages = Math.max(1, Math.ceil(total / salesLimit));
      const page = Math.min(Math.max(1, salesPage), totalPages);
      const start = (page - 1) * salesLimit;
      const end = start + salesLimit;
      pagedPropertyRows = searched.slice(start, end);

      setSalesMeta({
        page,
        limit: salesLimit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        view: salesView,
        sortBy,
        sortOrder: salesSortOrder,
        startDate: dateRange.from || null,
        endDate: dateRange.to || null,
        keyword: transactionSearch.trim() || null,
      });
    }

    if (salesView === "user") {
      const map = new Map<string, SalesUserRow & { propertySet: Set<string> }>();
      transactionRows.forEach((row) => {
        const current =
          map.get(row.userId) ??
          {
            userId: row.userId,
            userName: row.user,
            transactions: 0,
            properties: 0,
            totalSales: 0,
            latestTransactionAt: null,
            propertySet: new Set<string>(),
          };
        current.transactions += 1;
        current.propertySet.add(row.propertyId);
        if (row.status !== "DIBATALKAN") {
          current.totalSales += row.total;
        }
        if (toTimestamp(row.submittedAt) > toTimestamp(current.latestTransactionAt)) {
          current.latestTransactionAt = row.submittedAt;
        }
        map.set(row.userId, current);
      });

      const rows = Array.from(map.values()).map((row) => ({
        userId: row.userId,
        userName: row.userName,
        transactions: row.transactions,
        properties: row.propertySet.size,
        totalSales: row.totalSales,
        latestTransactionAt: row.latestTransactionAt,
      }));

      const searched = keyword
        ? rows.filter((row) => row.userName.toLowerCase().includes(keyword))
        : rows;
      searched.sort((a, b) => {
        if (sortBy === "total") {
          if (a.totalSales !== b.totalSales) {
            return sortFactor * (a.totalSales - b.totalSales);
          }
        } else {
          const dateDiff = toTimestamp(a.latestTransactionAt) - toTimestamp(b.latestTransactionAt);
          if (dateDiff !== 0) return sortFactor * dateDiff;
        }
        return sortFactor * (toTimestamp(a.latestTransactionAt) - toTimestamp(b.latestTransactionAt));
      });

      total = searched.length;
      const totalPages = Math.max(1, Math.ceil(total / salesLimit));
      const page = Math.min(Math.max(1, salesPage), totalPages);
      const start = (page - 1) * salesLimit;
      const end = start + salesLimit;
      pagedUserRows = searched.slice(start, end);

      setSalesMeta({
        page,
        limit: salesLimit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        view: salesView,
        sortBy,
        sortOrder: salesSortOrder,
        startDate: dateRange.from || null,
        endDate: dateRange.to || null,
        keyword: transactionSearch.trim() || null,
      });
    }

    setSalesTransactionRows(pagedTransactionRows);
    setSalesPropertyRows(pagedPropertyRows);
    setSalesUserRows(pagedUserRows);
    setSalesSummary({
      totalSales,
      totalTransactions,
      avgPerTransaction:
        totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0,
    });
    setSalesTrendData(
      trendBuckets.map((bucket) => ({
        month: bucket.month,
        sales: bucket.sales,
        bookings: bucket.bookings,
      })),
    );

    return true;
  };

  const loadSalesReport = async () => {
    if (salesDateRangeInvalid) {
      setSalesError(
        "Rentang tanggal tidak valid. Tanggal mulai harus sebelum tanggal akhir.",
      );
      setSalesTransactionRows([]);
      setSalesPropertyRows([]);
      setSalesUserRows([]);
      setSalesSummary(defaultSalesSummary);
      setSalesTrendData([]);
      return;
    }

    try {
      setSalesLoading(true);
      setSalesError(null);

      const query = new URLSearchParams({
        view: salesView,
        sortBy,
        sortOrder: salesSortOrder,
        page: String(salesPage),
        limit: String(salesLimit),
      });

      if (dateRange.from) query.set("startDate", dateRange.from);
      if (dateRange.to) query.set("endDate", dateRange.to);
      const keyword = transactionSearch.trim();
      if (keyword) query.set("keyword", keyword);

      const response = await fetchJson<SalesReportResponse>(
        `/bookings/tenant/reports/sales?${query.toString()}`,
      );

      setSalesSummary(response.summary ?? defaultSalesSummary);
      setSalesTrendData(Array.isArray(response.trend) ? response.trend : []);
      setSalesMeta({
        ...defaultSalesMeta,
        ...(response.meta ?? {}),
      });

      if (salesView === "transaction") {
        setSalesTransactionRows((response.data ?? []) as SalesTransactionRow[]);
        setSalesPropertyRows([]);
        setSalesUserRows([]);
      } else if (salesView === "property") {
        setSalesPropertyRows((response.data ?? []) as SalesPropertyRow[]);
        setSalesTransactionRows([]);
        setSalesUserRows([]);
      } else {
        setSalesUserRows((response.data ?? []) as SalesUserRow[]);
        setSalesTransactionRows([]);
        setSalesPropertyRows([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat laporan penjualan.";
      const hasFallback = applySalesFallbackFromOverview();
      if (hasFallback) {
        setSalesError(`${message} Menampilkan data fallback dari payment proof.`);
      } else {
        setSalesError(message);
        setSalesTransactionRows([]);
        setSalesPropertyRows([]);
        setSalesUserRows([]);
        setSalesSummary(defaultSalesSummary);
        setSalesTrendData([]);
      }
    } finally {
      setSalesLoading(false);
    }
  };

  const loadTenantReviews = async () => {
    try {
      setTenantReviewsLoading(true);
      setTenantReviewsError(null);
      const query = new URLSearchParams({
        page: "1",
        limit: "50",
      });
      const data = await fetchJson<TenantReviewResponse>(
        `/bookings/tenant/reviews?${query.toString()}`,
      );
      setTenantReviews(data.data ?? []);
    } catch (err) {
      setTenantReviewsError(
        err instanceof Error ? err.message : "Gagal memuat ulasan pengguna.",
      );
      setTenantReviews([]);
    } finally {
      setTenantReviewsLoading(false);
    }
  };

  const handlePaymentProofReview = (
    paymentProofId: string,
    action: "approve" | "reject",
  ) => {
    const actionLabel = action === "approve" ? "Setujui" : "Tolak";
    setPaymentActionError(null);
    setPaymentActionFeedback(null);
    setTenantActionConfirm({
      title: `Konfirmasi ${actionLabel} Pembayaran`,
      description:
        action === "approve"
          ? "Setujui bukti pembayaran ini dan lanjutkan proses pemesanan?"
          : "Tolak bukti pembayaran ini sekarang?",
      confirmLabel: actionLabel,
      payload: {
        type: "payment-proof-review",
        paymentProofId,
        action,
      },
    });
  };

  const handleCancelOrderByTenant = (bookingId: string, orderNo: string) => {
    setPaymentActionError(null);
    setPaymentActionFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Batalkan Pesanan",
      description: `Batalkan pesanan ${orderNo}? Pesanan ini hanya bisa dibatalkan sebelum penyewa mengunggah bukti pembayaran.`,
      confirmLabel: "Batalkan",
      payload: {
        type: "cancel-order",
        bookingId,
        orderNo,
      },
    });
  };

  const handleSubmitReply = (reviewId: string) => {
    const draft = reviewDrafts[reviewId]?.trim() ?? "";
    if (!draft) {
      setTenantReviewsError("Balasan ulasan tidak boleh kosong.");
      return;
    }

    setTenantReviewsError(null);
    setReviewReplyFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Kirim Balasan",
      description: "Kirim balasan ulasan ini sekarang?",
      confirmLabel: "Kirim",
      payload: {
        type: "submit-review-reply",
        reviewId,
        draft,
      },
    });
  };

  const handleCancelTenantActionConfirm = () => {
    if (tenantActionConfirmLoading) return;
    setTenantActionConfirm(null);
  };

  const handleConfirmTenantAction = async () => {
    if (!tenantActionConfirm) return;

    const { payload } = tenantActionConfirm;

    try {
      setTenantActionConfirmLoading(true);

      switch (payload.type) {
        case "create-category": {
          setCategoryCreateLoading(true);
          setCategoryCreateError(null);
          setCategoryCreateFeedback(null);

          const created = await fetchJson<CatalogCategory>("/catalog/categories", {
            method: "POST",
            body: JSON.stringify({ name: payload.name }),
          });
          setCatalogCategories((prev) => {
            const map = new Map(prev.map((item) => [item.id, item]));
            map.set(created.id, created);
            return Array.from(map.values()).sort((a, b) =>
              a.name.localeCompare(b.name, "id-ID"),
            );
          });
          setNewCategoryName("");
          setCategoryCreateFeedback("Kategori berhasil disimpan.");
          break;
        }
        case "update-category": {
          setCategoryCreateLoading(true);
          setCategoryCreateError(null);
          setCategoryCreateFeedback(null);

          const updated = await fetchJson<CatalogCategory>(
            `/catalog/categories/${payload.id}`,
            {
              method: "PATCH",
              body: JSON.stringify({ name: payload.name }),
            },
          );

          setCatalogCategories((prev) =>
            prev
              .map((item) =>
                item.id === updated.id ? { ...item, name: updated.name } : item,
              )
              .sort((a, b) => a.name.localeCompare(b.name, "id-ID")),
          );
          setEditingCategoryId(null);
          setCategoryCreateFeedback("Kategori berhasil diperbarui.");
          break;
        }
        case "delete-category": {
          setCategoryCreateLoading(true);
          setCategoryCreateError(null);
          setCategoryCreateFeedback(null);

          await fetchJson<{ message: string; id: string }>(
            `/catalog/categories/${payload.id}`,
            {
              method: "DELETE",
            },
          );

          setCatalogCategories((prev) =>
            prev.filter((item) => item.id !== payload.id),
          );
          setEditingCategoryId((prev) => (prev === payload.id ? null : prev));
          setCategoryCreateFeedback("Kategori berhasil dihapus.");
          break;
        }
        case "apply-room-sidebar": {
          setRoomActionLoading(true);
          setRoomActionError(null);
          setRoomActionSuccess(null);

          await fetchJson(`/availability/room-types/${payload.roomTypeId}`, {
            method: "PUT",
            body: JSON.stringify({
              dates: payload.dates,
              isClosed: payload.shouldBlock,
            }),
          });

          if (payload.adjustmentValue) {
            await fetchJson("/availability/rate-rules", {
              method: "POST",
              body: JSON.stringify({
                name: `Rule ${payload.dates[0]}${
                  payload.dates.length > 1
                    ? ` - ${payload.dates[payload.dates.length - 1]}`
                    : ""
                }`,
                scope: "ROOM_TYPE",
                roomTypeId: payload.roomTypeId,
                adjustmentType: payload.adjustmentType,
                adjustmentValue: payload.adjustmentValue,
                isActive: true,
                dates: payload.dates,
              }),
            });
          }

          setRoomActionSuccess("Perubahan kamar berhasil diterapkan.");
          setSelectedCalendarDates([]);
          setRoomAdjustmentValue("");
          await Promise.all([loadAvailability(), loadRateRules()]);
          break;
        }
        case "delete-rate-rule": {
          setRateRulesLoading(true);
          setRateRulesError(null);
          await fetchJson(`/availability/rate-rules/${payload.id}`, {
            method: "DELETE",
          });
          await loadRateRules();
          break;
        }
        case "payment-proof-review": {
          setPaymentActionLoadingId(payload.paymentProofId);
          setPaymentActionError(null);
          setPaymentActionFeedback(null);

          const notes = (paymentDecisionNotes[payload.paymentProofId] ?? "").trim();
          await fetchJson(
            `/bookings/tenant/payment-proofs/${payload.paymentProofId}/${payload.action}`,
            {
              method: "POST",
              body: JSON.stringify(notes ? { notes } : {}),
            },
          );

          setPaymentActionFeedback(
            payload.action === "approve"
              ? "Bukti pembayaran berhasil disetujui."
              : "Bukti pembayaran berhasil ditolak.",
          );
          setPaymentDecisionNotes((prev) => ({
            ...prev,
            [payload.paymentProofId]: "",
          }));
          await loadTenantPaymentProofs();
          break;
        }
        case "cancel-order": {
          setPaymentActionLoadingId(payload.bookingId);
          setPaymentActionError(null);
          setPaymentActionFeedback(null);

          const result = await fetchJson<{ message?: string }>(
            `/bookings/tenant/${payload.bookingId}/cancel`,
            {
              method: "POST",
            },
          );

          setPaymentActionFeedback(
            result.message ?? `Pesanan ${payload.orderNo} berhasil dibatalkan.`,
          );
          await loadTenantPaymentProofs();
          break;
        }
        case "submit-review-reply": {
          setReviewReplyLoadingId(payload.reviewId);
          setTenantReviewsError(null);
          setReviewReplyFeedback(null);

          const result = await fetchJson<{ message?: string }>(
            `/bookings/tenant/reviews/${payload.reviewId}/reply`,
            {
              method: "POST",
              body: JSON.stringify({ reply: payload.draft }),
            },
          );

          setReviewDrafts((prev) => ({
            ...prev,
            [payload.reviewId]: "",
          }));
          setReviewReplyFeedback(result.message ?? "Balasan ulasan berhasil dikirim.");
          await loadTenantReviews();
          break;
        }
        default:
          break;
      }

      setTenantActionConfirm(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? normalizeTenantActionError(err.message) : null;

      switch (payload.type) {
        case "create-category":
          setCategoryCreateError(errorMessage ?? "Gagal menyimpan kategori.");
          break;
        case "update-category":
          setCategoryCreateError(errorMessage ?? "Gagal memperbarui kategori.");
          break;
        case "delete-category":
          setCategoryCreateError(errorMessage ?? "Gagal menghapus kategori.");
          break;
        case "apply-room-sidebar":
          setRoomActionError(errorMessage ?? "Gagal menerapkan perubahan kamar.");
          break;
        case "delete-rate-rule":
          setRateRulesError(errorMessage ?? "Gagal menghapus aturan harga.");
          break;
        case "payment-proof-review":
          setPaymentActionError(errorMessage ?? "Gagal memproses bukti pembayaran.");
          break;
        case "cancel-order":
          setPaymentActionError(errorMessage ?? "Gagal membatalkan pesanan.");
          break;
        case "submit-review-reply":
          setTenantReviewsError(errorMessage ?? "Gagal mengirim balasan ulasan.");
          break;
        default:
          break;
      }

      setTenantActionConfirm(null);
    } finally {
      switch (payload.type) {
        case "create-category":
          setCategoryCreateLoading(false);
          break;
        case "update-category":
          setCategoryCreateLoading(false);
          break;
        case "delete-category":
          setCategoryCreateLoading(false);
          break;
        case "apply-room-sidebar":
          setRoomActionLoading(false);
          break;
        case "delete-rate-rule":
          setRateRulesLoading(false);
          break;
        case "payment-proof-review":
          setPaymentActionLoadingId(null);
          break;
        case "cancel-order":
          setPaymentActionLoadingId(null);
          break;
        case "submit-review-reply":
          setReviewReplyLoadingId(null);
          break;
        default:
          break;
      }

      setTenantActionConfirmLoading(false);
    }
  };

  useEffect(() => {
    if (active === "sales-report" && reportTab === "property") {
      fetchProperties({
        mode: "page",
        page: propertyReportPage,
        limit: propertyReportLimit,
      });
      return;
    }

    if (
      active === "room-management" ||
      active === "property-management" ||
      active === "property-category" ||
      active === "dashboard-overview"
    ) {
      fetchProperties({ mode: "all", limit: 50 });
    }
  }, [active, propertyReportPage, propertyReportLimit, reportTab]);

  useEffect(() => {
    if (properties.length === 0) {
      setSelectedPropertyId("");
      setSelectedRoomId("");
      return;
    }

    const propertyExists = properties.some(
      (property) => property.id === selectedPropertyId,
    );
    if (!propertyExists) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  useEffect(() => {
    if (!selectedProperty) return;
    if (selectedProperty.rooms.length === 0) {
      setSelectedRoomId("");
      return;
    }
    const exists = selectedProperty.rooms.some(
      (room) => room.id === selectedRoomId,
    );
    if (!exists) {
      setSelectedRoomId(selectedProperty.rooms[0].id);
    }
  }, [selectedProperty, selectedRoomId]);

  useEffect(() => {
    if (active === "room-management") {
      loadRateRules();
    }
  }, [active, selectedPropertyId, selectedRoomId]);

  useEffect(() => {
    if (active !== "property-management" && active !== "property-category") return;
    if (catalogCategories.length > 0) return;
    loadCatalogCategories();
  }, [active, catalogCategories.length]);

  useEffect(() => {
    setTransactionPage(1);
  }, [
    statusFilter,
    transactionSearch,
    transactionLimit,
    transactionSortBy,
    transactionSortOrder,
  ]);

  useEffect(() => {
    if (active !== "order-management") return;
    loadTenantPaymentProofs();
  }, [
    active,
    statusFilter,
    transactionSearch,
    transactionPage,
    transactionLimit,
    transactionSortBy,
    transactionSortOrder,
  ]);

  useEffect(() => {
    if (active !== "dashboard-overview" && active !== "sales-report") return;
    loadOverviewData();
  }, [active]);

  useEffect(() => {
    setSalesPage(1);
  }, [salesView, sortBy, salesSortOrder, dateRange.from, dateRange.to, transactionSearch]);

  useEffect(() => {
    if (active !== "sales-report" || reportTab !== "sales") return;
    loadSalesReport();
  }, [
    active,
    reportTab,
    salesView,
    sortBy,
    salesSortOrder,
    dateRange.from,
    dateRange.to,
    transactionSearch,
    salesPage,
    salesLimit,
  ]);

  useEffect(() => {
    if (active !== "customer-relations") return;
    loadTenantReviews();
  }, [active]);

  useEffect(() => {
    setPropertyReportPage(1);
  }, [propertyReportLimit]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [active]);

  useEffect(() => {
    if (
      active !== "room-management" &&
      !(active === "sales-report" && reportTab === "property")
    ) {
      return;
    }
    if (availabilityQuery.startDate && availabilityQuery.endDate) return;
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setAvailabilityQuery({
      startDate: formatDateInput(monthStart),
      endDate: formatDateInput(monthEnd),
    });
  }, [active, availabilityQuery.startDate, availabilityQuery.endDate, reportTab]);

  useEffect(() => {
    if (
      active !== "room-management" &&
      !(active === "sales-report" && reportTab === "property")
    ) {
      return;
    }
    if (!selectedRoomId) return;
    if (!availabilityQuery.startDate || !availabilityQuery.endDate) return;
    loadAvailability();
  }, [
    active,
    selectedRoomId,
    availabilityQuery.startDate,
    availabilityQuery.endDate,
    reportTab,
  ]);

  useEffect(() => {
    setSelectedCalendarDates([]);
    setRoomActionError(null);
    setRoomActionSuccess(null);
    setRoomActionConfirm(null);
  }, [selectedRoomId]);

  return (
    <div className="tenant-dashboard-shell min-h-screen bg-transparent text-slate-900">
      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white/90 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.55)] backdrop-blur transition-all duration-300 ${
          isSidebarCollapsed ? "w-64 lg:w-20" : "w-64"
        } ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div
            className={`flex items-center gap-2 ${
              isSidebarCollapsed ? "lg:w-full lg:justify-center" : ""
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-cyan-700 to-teal-700 text-xs font-bold text-white">
              BI
            </div>
            <span
              className={`font-display text-lg font-semibold text-slate-900 ${
                isSidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              BookIn
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-800 lg:hidden"
            aria-label="Tutup menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path d="M6 6L18 18M6 18L18 6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="absolute -right-3 top-7 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-600 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-800 lg:flex"
          aria-label="Buka atau tutup sidebar"
        >
          {isSidebarCollapsed ? ">" : "<"}
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-5">
              {!isSidebarCollapsed ? (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {group.title}
                </p>
              ) : null}
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const isItemActive =
                    active === item.key ||
                    (active === "property-category" &&
                      item.key === "property-management") ||
                    (active === "room-management" &&
                      item.key === "property-management");

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActive(item.key);
                        if (item.key === "sales-report") {
                          setReportTab("sales");
                        }
                      }}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                        isItemActive
                          ? BUTTON_THEME.softActive
                          : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-900"
                      } ${isSidebarCollapsed ? "justify-center lg:px-2" : ""}`}
                      title={isSidebarCollapsed ? item.label : undefined}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                          isItemActive
                            ? BUTTON_THEME.softActiveEmphasis
                            : "bg-slate-100 text-slate-500 group-hover:bg-cyan-100 group-hover:text-cyan-800"
                        }`}
                      >
                        {renderNavIcon(item.key)}
                      </span>
                      <span className={isSidebarCollapsed ? "lg:hidden" : ""}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <a
            href="/"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-900 ${
              isSidebarCollapsed ? "justify-center lg:px-2" : ""
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path d="M10 6H6.5C5.7 6 5 6.7 5 7.5V16.5C5 17.3 5.7 18 6.5 18H10" strokeWidth="1.8" />
                <path d="M14 8L18 12L14 16M18 12H9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={isSidebarCollapsed ? "lg:hidden" : ""}>Keluar</span>
          </a>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-900 lg:hidden"
              aria-label="Buka menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                <path d="M4 7H20M4 12H20M4 17H20" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="relative hidden sm:block">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <path d="M20 20L17 17" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={headerSearch}
                onChange={(event) => setHeaderSearch(event.target.value)}
                placeholder="Cari menu, properti, atau transaksi"
                className={`h-10 w-[220px] rounded-lg border border-slate-200 bg-white/90 pl-10 pr-4 text-sm text-slate-600 md:w-[380px] ${INPUT_THEME.focus}`}
                aria-label="Cari menu"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:gap-4 sm:pl-5">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-900"
              aria-label="Notifikasi"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                <path
                  d="M12 4a4 4 0 0 0-4 4v2.5c0 .7-.2 1.4-.6 2L6 15h12l-1.4-2.5a4 4 0 0 1-.6-2V8a4 4 0 0 0-4-4Z"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M10 18a2 2 0 0 0 4 0" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{me.name}</p>
              <p className="text-xs text-slate-500">
                {me.tenantProfile?.companyName ?? "Mitra BookIn"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-cyan-700 to-teal-700 text-xs font-bold text-white sm:h-10 sm:w-10">
              {tenantInitials}
            </div>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 sm:py-6">
          <section className="mx-auto w-full max-w-[1240px]">

          {active === "dashboard-overview" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-4xl text-slate-900">Ringkasan Dashboard</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ringkasan performa properti dan transaksi terbaru hari ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadOverviewData}
                  disabled={overviewLoading}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-60"
                >
                  {overviewLoading ? "Memuat ulang..." : "Muat Ulang Data"}
                </button>
              </div>

              {overviewError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {overviewError}
                </div>
              ) : null}
              {overviewNotice ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {overviewNotice}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Total Pendapatan",
                    value: formatCurrency(overviewSummary.totalRevenue),
                    change: overviewRevenueChangeLabel,
                    helper: "vs 7 hari terakhir",
                    positive: overviewRevenueGrowth >= 0,
                    iconLabel: "RP",
                    iconClass: "bg-slate-200 text-slate-800",
                  },
                  {
                    label: "Penyewa Aktif",
                    value: overviewSummary.activeTenants.toString(),
                    change: `+${overviewSummary.activeOrders}`,
                    helper: "pemesanan aktif",
                    positive: true,
                    iconLabel: "AT",
                    iconClass: "bg-emerald-100 text-emerald-600",
                  },
                  {
                    label: "Tingkat Okupansi",
                    value: `${overviewSummary.occupancyRate}%`,
                    change:
                      overviewSummary.pendingOrders > 0
                        ? `-${overviewSummary.pendingOrders}`
                        : "+0",
                    helper: "dibanding bulan lalu",
                    positive: overviewSummary.pendingOrders === 0,
                    iconLabel: "OC",
                    iconClass: "bg-blue-100 text-blue-600",
                  },
                  {
                    label: "Ulasan Belum Dibalas",
                    value: overviewSummary.pendingReviews.toString(),
                    change: `+${overviewSummary.pendingReviews}`,
                    helper: "dibanding bulan lalu",
                    positive: true,
                    iconLabel: "RV",
                    iconClass: "bg-orange-100 text-orange-600",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="surface-panel rounded-xl px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                        <p className="mt-2 truncate text-3xl font-bold leading-none text-slate-900">
                          {item.value}
                        </p>
                      </div>
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${item.iconClass}`}
                      >
                        {item.iconLabel}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          item.positive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {item.positive ? "naik " : "turun "}
                        {item.change}
                      </span>
                      <span className="text-slate-500">{item.helper}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="surface-panel rounded-xl p-5 xl:col-span-2">
                  <h3 className="font-display text-3xl text-slate-900">Analisis Pendapatan</h3>
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <svg
                      viewBox={`0 0 ${overviewChart.width} ${overviewChart.height}`}
                      className="h-64 w-full"
                      role="img"
                      aria-label="Grafik analisis pendapatan"
                    >
                      <defs>
                        <linearGradient id="overviewRevenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.16" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {overviewYAxisTicks.map((tick) => {
                        const ratio =
                          overviewChart.maxValue > 0
                            ? Math.min(1, Math.max(0, tick / overviewChart.maxValue))
                            : 0;
                        const y =
                          overviewChart.top +
                          (1 - ratio) *
                            (overviewChart.height -
                              overviewChart.top -
                              overviewChart.bottom);
                        return (
                          <g key={`y-${tick}`}>
                            <line
                              x1={overviewChart.left}
                              y1={y}
                              x2={overviewChart.width - overviewChart.right}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeDasharray="4 6"
                            />
                            <text
                              x={overviewChart.left - 10}
                              y={y + 4}
                              textAnchor="end"
                              fontSize="11"
                              fill="#64748b"
                            >
                              {tick}
                            </text>
                          </g>
                        );
                      })}

                      {overviewChart.areaPath ? (
                        <path d={overviewChart.areaPath} fill="url(#overviewRevenueFill)" />
                      ) : null}
                      {overviewChart.linePath ? (
                        <path
                          d={overviewChart.linePath}
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ) : null}
                      {overviewChart.points.map((point) => (
                        <circle key={point.label} cx={point.x} cy={point.y} r={3.5} fill="#4f46e5" />
                      ))}
                      {overviewChart.points.map((point) => (
                        <text
                          key={`x-${point.label}`}
                          x={point.x}
                          y={overviewChart.height - 10}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#64748b"
                        >
                          {point.label}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>

                <div className="surface-panel rounded-xl p-5">
                  <h3 className="font-display text-3xl text-slate-900">Aktivitas Terbaru</h3>
                  <div className="mt-5 space-y-4">
                    {overviewRecentActivity.length === 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                        Belum ada aktivitas pemesanan.
                      </div>
                    ) : (
                      overviewRecentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                            BK
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              Booking baru dari {activity.user.fullName ?? activity.user.email}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {formatDateTime(activity.submittedAt)} •{" "}
                              {activity.booking.property.name}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive("order-management")}
                    className="mt-4 text-sm font-semibold text-cyan-800 transition hover:text-cyan-900"
                  >
                    Lihat Semua Aktivitas
                  </button>
                </div>
              </div>

              <div className="surface-panel rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Rincian Properti</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Hierarki detail properti dari transaksi tenant.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Properti</th>
                        <th className="px-4 py-3 text-right">Pesanan</th>
                        <th className="px-4 py-3 text-right">Menunggu</th>
                        <th className="px-4 py-3 text-right">Diproses</th>
                        <th className="px-4 py-3 text-right">Selesai</th>
                        <th className="px-4 py-3 text-right">Dibatalkan</th>
                        <th className="px-4 py-3 text-right">Pendapatan</th>
                        <th className="px-4 py-3">Aktivitas Terakhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewBreakdown.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-6 text-center text-sm text-slate-500"
                          >
                            Belum ada data transaksi untuk ditampilkan.
                          </td>
                        </tr>
                      ) : (
                        overviewBreakdown.map((row) => (
                          <tr key={row.propertyId} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {row.propertyName}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.orders}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.pending}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.inProgress}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.completed}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {row.cancelled}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {formatCurrency(row.revenue)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatDateTime(row.lastSubmittedAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {active === "tenant-profile" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Profil Tenant
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Profil akun tenant
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Informasi Profil
                  </p>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Nama Tenant</p>
                      <p className="font-semibold text-slate-900">{me.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{me.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Perusahaan</p>
                      <p className="font-semibold text-slate-900">
                        {me.tenantProfile?.companyName ?? "Mitra BookIn"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Status Akun
                  </p>
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    <p>
                      Verifikasi email:{" "}
                      <span className="font-semibold text-emerald-700">
                        {me.emailVerifiedAt ? "Terverifikasi" : "Belum verifikasi"}
                      </span>
                    </p>
                    <p>Peran: Tenant</p>
                    <p className="text-xs text-slate-500">
                      Untuk update data bisnis dan rekening payout, gunakan form profil
                      tenant saat endpoint backend tersedia.
                    </p>
                  </div>
                  <a
                    href="/profile"
                    className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Buka Profil Umum
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {active === "sales-report" && reportTab === "sales" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl text-slate-900">
                    Laporan Penjualan
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Laporan penjualan tenant berdasarkan transaksi, properti, dan user.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={loadSalesReport}
                    disabled={salesLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-70"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M20 12a8 8 0 0 1-14.5 4.5M4 12A8 8 0 0 1 18.5 7.5" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M4 16v-3.5h3.5M20 8v3.5h-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {salesLoading ? "Memuat..." : "Muat Ulang"}
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setReportTab("sales")}
                    className="border-b-2 border-cyan-800 pb-3 text-sm font-medium text-cyan-900"
                  >
                    Laporan Penjualan
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTab("property")}
                    className="border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 transition hover:text-cyan-800"
                  >
                    Ketersediaan Properti
                  </button>
                </div>
              </div>

              <div className="surface-panel rounded-xl p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Tampilan Laporan
                    </span>
                    <select
                      value={salesView}
                      onChange={(event) =>
                        setSalesView(
                          event.target.value as "transaction" | "property" | "user",
                        )
                      }
                      className={`h-10 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                    >
                      <option value="transaction">Transaksi</option>
                      <option value="property">Properti</option>
                      <option value="user">Pengguna</option>
                    </select>
                  </label>

                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Urutkan Berdasarkan
                    </span>
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(event.target.value as "date" | "total")
                      }
                      className={`h-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                    >
                      <option value="date">Tanggal</option>
                      <option value="total">Total Penjualan</option>
                    </select>
                  </label>

                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Urutan
                    </span>
                    <select
                      value={salesSortOrder}
                      onChange={(event) =>
                        setSalesSortOrder(event.target.value as "asc" | "desc")
                      }
                      className={`h-10 min-w-[130px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                    >
                      <option value="desc">Menurun</option>
                      <option value="asc">Menaik</option>
                    </select>
                  </label>

                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Dari
                    </span>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(event) =>
                        setDateRange((prev) => ({ ...prev, from: event.target.value }))
                      }
                      className={`h-10 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                    />
                  </label>

                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Sampai
                    </span>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(event) =>
                        setDateRange((prev) => ({ ...prev, to: event.target.value }))
                      }
                      className={`h-10 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[260px] flex-1">
                    <svg
                      viewBox="0 0 24 24"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="11" cy="11" r="7" strokeWidth="2" />
                      <path d="M20 20L17 17" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                      type="text"
                      value={transactionSearch}
                      onChange={(event) => setTransactionSearch(event.target.value)}
                      placeholder={
                        salesView === "transaction"
                          ? "Cari transaksi / properti / pengguna..."
                          : salesView === "property"
                            ? "Cari nama properti..."
                            : "Cari nama pengguna..."
                      }
                      className={`h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionSearch("");
                      setDateRange({ from: "", to: "" });
                      setSortBy("date");
                      setSalesSortOrder("desc");
                      setSalesPage(1);
                    }}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
                  >
                    Atur Ulang Pencarian
                  </button>
                </div>

                {salesDateRangeInvalid ? (
                  <p className="mt-3 text-xs text-rose-600">
                    Rentang tanggal tidak valid. Tanggal mulai harus sebelum tanggal akhir.
                  </p>
                ) : null}
                {salesError ? <p className="mt-2 text-xs text-rose-600">{salesError}</p> : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  {
                    label: "Total Penjualan",
                    value: formatCurrency(salesSummary.totalSales),
                    change: `${salesSummary.totalTransactions} transaksi`,
                    positive: true,
                  },
                  {
                    label: "Total Transaksi",
                    value: `${salesSummary.totalTransactions}`,
                    change:
                      salesView === "property"
                        ? `${salesMeta.total} properti`
                        : salesView === "user"
                          ? `${salesMeta.total} pengguna`
                          : `${salesMeta.total} transaksi`,
                    positive: true,
                  },
                  {
                    label: "Rata-rata Nilai Transaksi",
                    value: formatCurrency(salesSummary.avgPerTransaction),
                    change: "Tidak termasuk transaksi dibatalkan",
                    positive: true,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="surface-panel rounded-xl px-6 py-6"
                  >
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-2 text-[40px] font-bold leading-none text-slate-900 sm:text-4xl">
                      {item.value}
                    </p>
                    <p
                      className={`mt-2 text-xs font-medium ${
                        item.positive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {item.change}
                    </p>
                  </div>
                ))}
              </div>

              <div className="surface-panel rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900">Tren Penjualan</h3>
                <div className="relative mt-5">
                  <div className="pointer-events-none absolute left-0 right-0 top-0 z-0 grid h-64 grid-rows-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="border-b border-dashed border-slate-200" />
                    ))}
                  </div>
                  <div className="relative z-10 grid h-72 grid-cols-7 gap-3 pt-2">
                    {salesTrendSeries.map((item) => (
                      <div key={item.month} className="flex flex-col items-center justify-end gap-2">
                        <div className="flex h-60 items-end gap-1.5">
                          <div
                            className="w-6 rounded-t-md bg-slate-700 sm:w-8"
                            style={{
                              height: `${Math.max(6, (item.sales / salesTrendMax) * 100)}%`,
                            }}
                            title={`Penjualan ${formatCurrency(item.sales)}`}
                          />
                          <div
                            className="w-6 rounded-t-md bg-emerald-500 sm:w-8"
                            style={{
                              height: `${Math.max(
                                6,
                                (item.bookings / bookingsTrendMax) * 100,
                              )}%`,
                            }}
                            title={`Pesanan ${item.bookings}`}
                          />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">{item.month}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                    Pesanan
                  </div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <span className="h-3 w-3 rounded-sm bg-slate-700" />
                    Penjualan (IDR)
                  </div>
                </div>
              </div>

              <div className="surface-panel rounded-xl p-5">
                <h3 className="text-lg font-semibold text-slate-900">
                  {salesView === "transaction"
                    ? "Laporan Transaksi"
                    : salesView === "property"
                      ? "Laporan Properti"
                      : "Laporan Pengguna"}
                </h3>

                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                  {salesView === "transaction" ? (
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Transaksi</th>
                          <th className="px-4 py-3">Tanggal</th>
                          <th className="px-4 py-3">Properti</th>
                          <th className="px-4 py-3">Pengguna</th>
                          <th className="px-4 py-3 text-right">Total Penjualan</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesTransactionRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-6 text-center text-sm text-slate-500"
                            >
                              Tidak ada data transaksi pada filter ini.
                            </td>
                          </tr>
                        ) : (
                          salesTransactionRows.map((order) => (
                            <tr key={order.id} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {order.orderNo}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatDateTime(order.submittedAt)}
                              </td>
                              <td className="px-4 py-3 text-slate-700">{order.property}</td>
                              <td className="px-4 py-3 text-slate-700">{order.user}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {formatCurrency(order.total)}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatBookingStatus(order.status)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : null}

                  {salesView === "property" ? (
                    <table className="w-full min-w-[780px] text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Properti</th>
                          <th className="px-4 py-3 text-right">Transaksi</th>
                          <th className="px-4 py-3 text-right">Pengguna</th>
                          <th className="px-4 py-3 text-right">Total Penjualan</th>
                          <th className="px-4 py-3">Transaksi Terakhir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesPropertyRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-6 text-center text-sm text-slate-500"
                            >
                              Tidak ada data properti pada filter ini.
                            </td>
                          </tr>
                        ) : (
                          salesPropertyRows.map((row) => (
                            <tr key={row.propertyId} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {row.propertyName}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.transactions}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.users}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {formatCurrency(row.totalSales)}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatDateTime(row.latestTransactionAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : null}

                  {salesView === "user" ? (
                    <table className="w-full min-w-[780px] text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Pengguna</th>
                          <th className="px-4 py-3 text-right">Transaksi</th>
                          <th className="px-4 py-3 text-right">Properti</th>
                          <th className="px-4 py-3 text-right">Total Penjualan</th>
                          <th className="px-4 py-3">Transaksi Terakhir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesUserRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-6 text-center text-sm text-slate-500"
                            >
                              Tidak ada data user pada filter ini.
                            </td>
                          </tr>
                        ) : (
                          salesUserRows.map((row) => (
                            <tr key={row.userId} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {row.userName}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.transactions}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {row.properties}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {formatCurrency(row.totalSales)}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatDateTime(row.latestTransactionAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Menampilkan halaman {salesMeta.page} dari {salesMeta.totalPages} (
                    {salesMeta.total} data)
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-500">
                      Baris
                      <select
                        value={salesLimit}
                        onChange={(event) => {
                          const nextLimit = Number(event.target.value);
                          setSalesLimit(Number.isFinite(nextLimit) ? nextLimit : 10);
                          setSalesPage(1);
                        }}
                        className={`ml-2 h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSalesPage((prev) => Math.max(1, prev - 1))}
                      disabled={!salesMeta.hasPrev || salesLoading}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSalesPage((prev) =>
                          salesMeta.hasNext ? prev + 1 : prev,
                        )
                      }
                      disabled={!salesMeta.hasNext || salesLoading}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {active === "sales-report" && reportTab === "property" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl text-slate-900">
                    Laporan Properti
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Monitor ketersediaan properti dan kamar dalam bentuk kalender.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadAvailability}
                    disabled={availabilityLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-70"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M20 12a8 8 0 0 1-14.5 4.5M4 12A8 8 0 0 1 18.5 7.5" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M4 16v-3.5h3.5M20 8v3.5h-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {availabilityLoading ? "Memuat..." : "Muat Ulang Kalender"}
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setReportTab("sales")}
                    className="border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 transition hover:text-cyan-800"
                  >
                    Laporan Penjualan
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTab("property")}
                    className="border-b-2 border-cyan-800 pb-3 text-sm font-medium text-cyan-900"
                  >
                    Ketersediaan Properti
                  </button>
                </div>
              </div>

              <div className="surface-panel rounded-xl p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Properti
                    </span>
                    <select
                      value={selectedPropertyId}
                      onChange={(event) => setSelectedPropertyId(event.target.value)}
                      className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      disabled={propertiesLoading}
                    >
                      <option value="">Pilih properti</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Kamar
                    </span>
                    <select
                      value={selectedRoomId}
                      onChange={(event) => setSelectedRoomId(event.target.value)}
                      className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      disabled={!selectedProperty}
                    >
                      <option value="">Pilih kamar</option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Tanggal Mulai
                    </span>
                    <input
                      type="date"
                      value={availabilityQuery.startDate}
                      onChange={(event) =>
                        setAvailabilityQuery((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                      className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                    />
                  </label>

                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block font-semibold uppercase tracking-[0.16em]">
                      Tanggal Akhir
                    </span>
                    <input
                      type="date"
                      value={availabilityQuery.endDate}
                      onChange={(event) =>
                        setAvailabilityQuery((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                      className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                    />
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const monthStart = new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          1,
                        );
                        const monthEnd = new Date(
                          today.getFullYear(),
                          today.getMonth() + 1,
                          0,
                        );
                        setAvailabilityQuery({
                          startDate: formatDateInput(monthStart),
                          endDate: formatDateInput(monthEnd),
                        });
                      }}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
                    >
                      Bulan Ini
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {selectedProperty?.name ?? "Belum pilih properti"}
                    </span>
                    {" · "}
                    <span>{selectedRoom?.name ?? "Belum memilih kamar"}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
                    <button
                      type="button"
                      onClick={() => shiftAvailabilityMonth(-1)}
                      className="rounded-md p-2 text-slate-500 transition hover:bg-slate-50"
                      aria-label="Bulan sebelumnya"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M15 6L9 12L15 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span className="px-2 text-sm font-semibold text-slate-900">
                      {roomMonthLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => shiftAvailabilityMonth(1)}
                      className="rounded-md p-2 text-slate-500 transition hover:bg-slate-50"
                      aria-label="Bulan berikutnya"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M9 6L15 12L9 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                {propertiesError ? (
                  <p className="mt-3 text-xs text-rose-600">{propertiesError}</p>
                ) : null}
                {availabilityError ? (
                  <p className="mt-1 text-xs text-rose-600">{availabilityError}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-600">
                    Halaman properti {propertyReportMeta.page} dari{" "}
                    {propertyReportMeta.totalPages} ({propertyReportMeta.total} properti)
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-500">
                      Baris
                      <select
                        value={propertyReportLimit}
                        onChange={(event) =>
                          setPropertyReportLimit(Number(event.target.value) || 10)
                        }
                        className={`ml-2 h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPropertyReportPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={!propertyReportMeta.hasPrev || propertiesLoading}
                      className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPropertyReportPage((prev) =>
                          propertyReportMeta.hasNext ? prev + 1 : prev,
                        )
                      }
                      disabled={!propertyReportMeta.hasNext || propertiesLoading}
                      className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>

                <div className="surface-panel rounded-xl p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">Kalender Ketersediaan</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      Tersedia
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-500" />
                      Terpesan
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-slate-400" />
                      Perawatan
                    </span>
                  </div>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Tersedia:{" "}
                    <span className="font-semibold">
                      {availabilityStatusSummary.available} hari
                    </span>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    Terpesan:{" "}
                    <span className="font-semibold">
                      {availabilityStatusSummary.booked} hari
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                    Perawatan:{" "}
                    <span className="font-semibold">
                      {availabilityStatusSummary.maintenance} hari
                    </span>
                  </div>
                </div>

                {availabilityError ? (
                  <p className="mb-4 text-xs text-rose-600">{availabilityError}</p>
                ) : null}

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[920px] table-fixed border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500">
                        {reportWeekdayLabels.map((day) => (
                          <th
                            key={day}
                            className="border-r border-slate-200 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] last:border-r-0"
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportAvailabilityWeeks.map((week, weekIndex) => (
                        <tr key={weekIndex}>
                          {week.map((cell, cellIndex) => (
                            <td
                              key={`${weekIndex}-${cellIndex}`}
                              className="h-24 border-r border-t border-slate-200 px-2 py-2 align-top last:border-r-0"
                            >
                              {cell ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-slate-400">{cell.day}</p>
                                  <span
                                    className={`block rounded-md px-2 py-1 text-xs font-medium ${
                                      cell.status === "Available"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : cell.status === "Booked"
                                          ? "bg-rose-100 text-rose-700"
                                          : "bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {cell.status === "Available"
                                      ? "Tersedia"
                                      : cell.status === "Booked"
                                        ? "Terpesan"
                                        : "Perawatan"}
                                  </span>
                                </div>
                              ) : null}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {active === "order-management" ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-3xl text-slate-900">Transaksi</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Kelola pesanan dan konfirmasi pembayaran.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/88 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
                <div className="border-b border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                      { value: "ALL" as const, label: "Semua" },
                      { value: "MENUNGGU_PEMBAYARAN" as const, label: "Menunggu" },
                      { value: "SELESAI" as const, label: "Selesai" },
                      { value: "DIPROSES" as const, label: "Diproses" },
                      { value: "DIBATALKAN" as const, label: "Dibatalkan" },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                          statusFilter === tab.value
                            ? "border border-cyan-200 bg-white text-cyan-900 shadow-sm"
                            : "border border-transparent text-slate-600 hover:bg-cyan-50 hover:text-cyan-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                      <svg
                        viewBox="0 0 24 24"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                      >
                        <circle cx="11" cy="11" r="7" strokeWidth="2" />
                        <path d="M20 20L17 17" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <input
                        type="text"
                        value={transactionSearch}
                        onChange={(event) => setTransactionSearch(event.target.value)}
                        placeholder="Cari nomor pesanan atau nama tamu"
                        className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      />
                    </div>
                    <select
                      value={transactionSortBy}
                      onChange={(event) =>
                        setTransactionSortBy(
                          event.target.value as
                            | "submittedAt"
                            | "total"
                            | "checkIn"
                            | "orderNo",
                        )
                      }
                      className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      aria-label="Urutkan berdasarkan"
                    >
                      <option value="submittedAt">Urutkan: Waktu Pengajuan</option>
                      <option value="checkIn">Urutkan: Check-in</option>
                      <option value="total">Urutkan: Total</option>
                      <option value="orderNo">Urutkan: No. Pesanan</option>
                    </select>
                    <select
                      value={transactionSortOrder}
                      onChange={(event) =>
                        setTransactionSortOrder(event.target.value as "asc" | "desc")
                      }
                      className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      aria-label="Urutan"
                    >
                      <option value="desc">Terbaru</option>
                      <option value="asc">Terlama</option>
                    </select>
                  </div>

                  {tenantPaymentProofsError ? (
                    <p className="mt-3 text-xs text-rose-600">{tenantPaymentProofsError}</p>
                  ) : null}
                  {paymentActionError ? (
                    <p className="mt-3 text-xs text-rose-600">{paymentActionError}</p>
                  ) : null}
                  {paymentActionFeedback ? (
                    <p className="mt-3 text-xs text-emerald-700">{paymentActionFeedback}</p>
                  ) : null}
                </div>

                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
                      <tr>
                        <th className="px-6 py-4">No. Pesanan</th>
                        <th className="px-6 py-4">Tamu</th>
                        <th className="px-6 py-4">Properti</th>
                        <th className="px-6 py-4">Check-in</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactionRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-6 text-center text-sm text-slate-500"
                          >
                            Tidak ada transaksi untuk filter ini.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactionRows.map((order) => {
                          const statusMeta = getTransactionStatusMeta(order.status);
                          const hasProofLink = Boolean(order.paymentProofImageUrl);
                          const canReview =
                            hasProofLink &&
                            order.paymentProofStatus === "SUBMITTED" &&
                            (order.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN" ||
                              order.status === "MENUNGGU_PEMBAYARAN");
                          const canCancelByTenant =
                            order.status === "MENUNGGU_PEMBAYARAN" && !hasProofLink;
                          return (
                            <tr key={order.id} className="hover:bg-slate-50/70">
                              <td className="px-6 py-4 font-semibold text-slate-800">
                                {order.orderNo}
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-900">
                                {order.user}
                              </td>
                              <td className="px-6 py-4 text-slate-500">{order.property}</td>
                              <td className="px-6 py-4 text-slate-500">
                                {formatDateTime(order.checkIn)}
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-900">
                                {formatCurrency(order.total)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                                >
                                  {statusMeta.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  {canReview ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handlePaymentProofReview(
                                            order.paymentProofId,
                                            "approve",
                                          )
                                        }
                                        disabled={paymentActionLoadingId === order.paymentProofId}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-60"
                                        aria-label="Setujui pembayaran"
                                      >
                                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                          <path d="M5 12L10 17L19 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handlePaymentProofReview(
                                            order.paymentProofId,
                                            "reject",
                                          )
                                        }
                                        disabled={paymentActionLoadingId === order.paymentProofId}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                                        aria-label="Tolak pembayaran"
                                      >
                                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                          <path d="M6 6L18 18M6 18L18 6" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                      </button>
                                    </>
                                  ) : null}
                                  {canCancelByTenant ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCancelOrderByTenant(order.id, order.orderNo)
                                      }
                                      disabled={paymentActionLoadingId === order.id}
                                      className="flex h-9 items-center justify-center rounded-lg border border-amber-200 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                                    >
                                      Batalkan
                                    </button>
                                  ) : null}
                                  {hasProofLink ? (
                                    <a
                                      href={order.paymentProofImageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                                      aria-label="Lihat bukti"
                                    >
                                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                        <path d="M2 12C4.8 7.8 8 5.7 12 5.7C16 5.7 19.2 7.8 22 12C19.2 16.2 16 18.3 12 18.3C8 18.3 4.8 16.2 2 12Z" strokeWidth="1.8" />
                                        <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
                                      </svg>
                                    </a>
                                  ) : (
                                    <span
                                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                                      aria-label="Bukti belum tersedia"
                                    >
                                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                        <path d="M2 12C4.8 7.8 8 5.7 12 5.7C16 5.7 19.2 7.8 22 12C19.2 16.2 16 18.3 12 18.3C8 18.3 4.8 16.2 2 12Z" strokeWidth="1.8" />
                                        <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 sm:hidden">
                  {filteredTransactionRows.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                      Tidak ada transaksi untuk filter ini.
                    </div>
                  ) : (
                    filteredTransactionRows.map((order) => {
                      const statusMeta = getTransactionStatusMeta(order.status);
                      const hasProofLink = Boolean(order.paymentProofImageUrl);
                      const canReview =
                        hasProofLink &&
                        order.paymentProofStatus === "SUBMITTED" &&
                        (order.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN" ||
                          order.status === "MENUNGGU_PEMBAYARAN");
                      const canCancelByTenant =
                        order.status === "MENUNGGU_PEMBAYARAN" && !hasProofLink;
                      return (
                        <div key={order.id} className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {order.orderNo}
                              </p>
                              <p className="mt-0.5 text-sm font-medium text-slate-900">
                                {order.property}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
                            <div>
                              <p className="text-xs text-slate-400">Tamu</p>
                              <p>{order.user}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Check-in</p>
                              <p>{formatDateTime(order.checkIn)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <div>
                              <p className="text-xs text-slate-400">Total</p>
                              <p className="font-semibold text-slate-900">
                                {formatCurrency(order.total)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {canReview ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePaymentProofReview(order.paymentProofId, "approve")
                                    }
                                    disabled={paymentActionLoadingId === order.paymentProofId}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600"
                                    aria-label="Setujui pembayaran"
                                  >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                      <path d="M5 12L10 17L19 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePaymentProofReview(order.paymentProofId, "reject")
                                    }
                                    disabled={paymentActionLoadingId === order.paymentProofId}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600"
                                    aria-label="Tolak pembayaran"
                                  >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                      <path d="M6 6L18 18M6 18L18 6" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                  </button>
                                </>
                              ) : null}
                              {canCancelByTenant ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancelOrderByTenant(order.id, order.orderNo)
                                  }
                                  disabled={paymentActionLoadingId === order.id}
                                  className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700"
                                >
                                  Batalkan
                                </button>
                              ) : null}
                              {hasProofLink ? (
                                <a
                                  href={order.paymentProofImageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                  aria-label="Lihat bukti"
                                >
                                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                    <path d="M2 12C4.8 7.8 8 5.7 12 5.7C16 5.7 19.2 7.8 22 12C19.2 16.2 16 18.3 12 18.3C8 18.3 4.8 16.2 2 12Z" strokeWidth="1.8" />
                                    <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
                                  </svg>
                                </a>
                              ) : (
                                <span
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                                  aria-label="Bukti belum tersedia"
                                >
                                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                    <path d="M2 12C4.8 7.8 8 5.7 12 5.7C16 5.7 19.2 7.8 22 12C19.2 16.2 16 18.3 12 18.3C8 18.3 4.8 16.2 2 12Z" strokeWidth="1.8" />
                                    <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Menampilkan {filteredTransactionRows.length} dari{" "}
                    {tenantPaymentProofMeta.total} transaksi.
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500" htmlFor="transaction-limit">
                      Baris
                    </label>
                    <select
                      id="transaction-limit"
                      value={transactionLimit}
                      onChange={(event) =>
                        setTransactionLimit(Number(event.target.value) || 10)
                      }
                      className={`h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 ${INPUT_THEME.focus}`}
                    >
                      {[5, 10, 20, 50].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setTransactionPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={
                        tenantPaymentProofsLoading || !tenantPaymentProofMeta.hasPrev
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs font-semibold text-slate-600">
                      {tenantPaymentProofMeta.page} / {tenantPaymentProofMeta.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTransactionPage((prev) => prev + 1)}
                      disabled={
                        tenantPaymentProofsLoading || !tenantPaymentProofMeta.hasNext
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {active === "customer-relations" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Ulasan & Balasan
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Balas ulasan pengguna
                </h2>
              </div>

              {tenantReviewsError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {tenantReviewsError}
                </div>
              ) : null}

              {reviewReplyFeedback ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {reviewReplyFeedback}
                </div>
              ) : null}

              {tenantReviewsLoading ? (
                <p className="text-xs text-slate-500">Memuat ulasan pengguna...</p>
              ) : null}

              {!tenantReviewsLoading && tenantReviews.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  Belum ada ulasan dari pengguna.
                </div>
              ) : null}

              <div className="grid gap-4">
                {tenantReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {review.booking.property.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {review.user.fullName ?? review.user.email}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(review.createdAt)}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          {"★".repeat(review.rating)}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {review.id}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
                    <div className="mt-4 space-y-2">
                      {review.tenantReply ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <p className="text-xs font-semibold text-emerald-700">
                            Balasan Tenant
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {review.tenantReply}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Dibalas pada: {formatDateTime(review.tenantRepliedAt)}
                          </p>
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={reviewDrafts[review.id] ?? ""}
                            onChange={(event) =>
                              setReviewDrafts((prev) => ({
                                ...prev,
                                [review.id]: event.target.value,
                              }))
                            }
                            rows={3}
                            placeholder="Tulis balasan untuk ulasan..."
                            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSubmitReply(review.id)}
                            disabled={reviewReplyLoadingId === review.id}
                            className={`rounded-full px-4 py-2 text-xs font-semibold ${BUTTON_THEME.solid} disabled:opacity-60`}
                          >
                            {reviewReplyLoadingId === review.id
                              ? "Mengirim..."
                              : "Kirim Balasan"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {active === "property-category" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-3xl text-slate-900">Properti & Kamar</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Kelola properti, kamar, dan kategori.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-lg border border-slate-200 bg-white/90 p-1 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => setActive("property-management")}
                      className="rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                    >
                      Properti
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-4 py-1.5 text-sm font-medium shadow-sm ${BUTTON_THEME.softActive}`}
                    >
                      Kategori
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-w-3xl space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="Masukkan nama kategori"
                    className={`h-11 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm ${INPUT_THEME.focus}`}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={categoryCreateLoading}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${BUTTON_THEME.solid} disabled:opacity-60`}
                  >
                    {categoryCreateLoading ? "Menyimpan..." : "Tambah Kategori"}
                  </button>
                </div>

                {categoriesError ? (
                  <p className="text-xs text-rose-600">{categoriesError}</p>
                ) : null}
                {categoryCreateError ? (
                  <p className="text-xs text-rose-600">{categoryCreateError}</p>
                ) : null}
                {categoryCreateFeedback ? (
                  <p className="text-xs text-emerald-700">{categoryCreateFeedback}</p>
                ) : null}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/88 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Nama Kategori</th>
                        <th className="px-6 py-4">Jumlah Properti</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoriesLoading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-6 text-center text-slate-500">
                            Memuat kategori...
                          </td>
                        </tr>
                      ) : categoryRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-6 text-center text-slate-500">
                            Belum ada kategori.
                          </td>
                        </tr>
                      ) : (
                        categoryRows.map((category) => (
                          <tr key={category.id}>
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {editingCategoryId === category.id ? (
                                <input
                                  type="text"
                                  value={categoryNameDrafts[category.id] ?? category.name}
                                  onChange={(event) =>
                                    setCategoryNameDrafts((prev) => ({
                                      ...prev,
                                      [category.id]: event.target.value,
                                    }))
                                  }
                                  className={`h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                                />
                              ) : (
                                category.name
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {category.propertiesCount} properti
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {editingCategoryId === category.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSubmitEditCategory(category)}
                                      disabled={categoryCreateLoading}
                                      className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditCategory}
                                      disabled={categoryCreateLoading}
                                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                      Batal
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditCategory(category)}
                                      disabled={categoryCreateLoading}
                                      className="rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60"
                                    >
                                      Ubah
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(category)}
                                      disabled={categoryCreateLoading}
                                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                                    >
                                      Hapus
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {active === "property-management" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-3xl text-slate-900">Properti & Kamar</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Kelola properti, kamar, dan kategori.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-lg border border-slate-200 bg-white/90 p-1 backdrop-blur">
                    <button
                      type="button"
                      className={`rounded-md px-4 py-1.5 text-sm font-medium shadow-sm ${BUTTON_THEME.softActive}`}
                    >
                      Properti
                    </button>
                    <button
                      type="button"
                      onClick={() => setActive("property-category")}
                      className="rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                    >
                      Kategori
                    </button>
                  </div>
                  <a
                    href="/tenant-property"
                    className={`inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium shadow-sm ${BUTTON_THEME.solid}`}
                  >
                    + Tambah Properti
                  </a>
                </div>
              </div>

              <div className="max-w-md">
                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="11" cy="11" r="7" strokeWidth="2" />
                    <path d="M20 20L17 17" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    value={propertySearch}
                    onChange={(event) => setPropertySearch(event.target.value)}
                    placeholder="Cari nama properti"
                    className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                  />
                </div>
                {propertiesError ? (
                  <p className="mt-2 text-xs text-rose-600">{propertiesError}</p>
                ) : null}
                {propertiesLoading ? (
                  <p className="mt-2 text-xs text-slate-500">Memuat properti...</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {filteredPropertyCards.map((property) => (
                  <div
                    key={property.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.5)] backdrop-blur"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={property.image}
                        alt={property.name}
                        className="h-full w-full object-cover"
                      />
                      <span
                        className={`absolute left-3 top-3 rounded-md px-2 py-1 text-xs font-semibold text-white ${
                          property.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      >
                        {property.status === "Active" ? "Aktif" : "Perawatan"}
                      </span>
                      <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700">
                        {property.type}
                      </span>
                    </div>
                    <div className="space-y-4 px-5 py-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-2xl font-bold leading-tight text-slate-900">
                          {property.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600">
                          ★ {property.rating}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500">{property.location}</p>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <p className="text-base font-medium text-slate-700">
                          {property.rooms.length} Kamar
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPropertyId(property.id);
                            if (property.rooms[0]) {
                              setSelectedRoomId(property.rooms[0].id);
                            }
                            setActive("room-management");
                          }}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-cyan-100 ${BUTTON_THEME.softActive}`}
                        >
                          Kelola Kamar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!propertiesLoading && filteredPropertyCards.length === 0 ? (
                <div className="surface-panel rounded-xl px-4 py-6 text-sm text-slate-500">
                  Tidak ada properti yang cocok dengan pencarian.
                </div>
              ) : null}
            </div>
          ) : null}

          {active === "room-management" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActive("property-management")}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                    aria-label="Kembali ke properti"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                      <path d="M15 6L9 12L15 18" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="font-display text-3xl text-slate-900">Kelola Kamar</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Kelola harga untuk{" "}
                      <span className="font-medium text-slate-900">
                        {selectedProperty?.name ?? "Properti Terpilih"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex w-full max-w-[250px] items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() => shiftAvailabilityMonth(-1)}
                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Bulan sebelumnya"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M15 6L9 12L15 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="px-2 text-sm font-semibold text-slate-900">{roomMonthLabel}</span>
                  <button
                    type="button"
                    onClick={() => shiftAvailabilityMonth(1)}
                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Bulan berikutnya"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M9 6L15 12L9 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
                  <div className="border-b border-slate-200 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm text-slate-600">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Properti
                        </span>
                        <select
                          value={selectedPropertyId}
                          onChange={(event) => setSelectedPropertyId(event.target.value)}
                          className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                          disabled={propertiesLoading}
                        >
                          <option value="">Pilih properti</option>
                          {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                              {property.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm text-slate-600">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Kamar
                        </span>
                        <select
                          value={selectedRoomId}
                          onChange={(event) => setSelectedRoomId(event.target.value)}
                          className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                          disabled={!selectedProperty}
                        >
                          <option value="">Pilih kamar</option>
                          {availableRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {propertiesError ? (
                      <p className="mt-2 text-xs text-rose-600">{propertiesError}</p>
                    ) : null}
                    {availabilityError ? (
                      <p className="mt-2 text-xs text-rose-600">{availabilityError}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"].map((day) => (
                      <div
                        key={day}
                        className="py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {availabilityLoading ? (
                    <div className="px-4 py-6 text-sm text-slate-500">Memuat kalender...</div>
                  ) : null}

                  <div className="grid grid-cols-7">
                    {roomCalendarCells.map((cell, index) => {
                      if (!cell) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="min-h-[120px] border-b border-r border-slate-100 bg-slate-50/40"
                          />
                        );
                      }

                      const isSelected = selectedCalendarDates.includes(cell.date);
                      const isToday = cell.date === formatDateInput(new Date());
                      const units = cell.item?.availableUnits ?? selectedRoom?.totalUnits ?? 0;
                      const status = cell.item?.isClosed
                        ? "Blocked"
                        : units <= 0
                          ? "Booked"
                          : "Available";
                      const price = Number(cell.item?.finalPrice ?? roomBasePrice);
                      const basePrice = Number(cell.item?.basePrice ?? roomBasePrice);
                      const isPeak =
                        Number.isFinite(price) &&
                        Number.isFinite(basePrice) &&
                        price > basePrice;

                      return (
                        <button
                          key={cell.date}
                          type="button"
                          onClick={() => toggleCalendarDate(cell.date)}
                          className={`min-h-[120px] border-b border-r border-slate-100 p-2 text-left transition ${
                            isSelected
                              ? "bg-slate-100 ring-2 ring-inset ring-slate-900"
                              : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                                isToday ? "bg-slate-900 text-white" : "text-slate-900"
                              }`}
                            >
                              {cell.day}
                            </span>
                            {isPeak ? (
                              <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                                Puncak
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-5 space-y-1">
                            <p
                              className={`text-sm font-bold ${
                                status === "Blocked"
                                  ? "text-slate-400 line-through"
                                  : "text-slate-900"
                              }`}
                            >
                              {formatCurrency(Number.isFinite(price) ? price : 0)}
                            </p>
                            <span
                              className={`inline-block w-full rounded px-2 py-1 text-xs font-semibold ${
                                status === "Available"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : status === "Booked"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {status === "Available"
                                ? "Tersedia"
                                : status === "Booked"
                                  ? "Terpesan"
                                  : "Ditutup"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="surface-panel rounded-xl p-6">
                  <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-5 text-sm text-slate-700">
                    {selectedCalendarDates.length > 0 ? (
                      <span>
                        <span className="font-semibold text-slate-900">
                          {selectedCalendarDates.length}
                        </span>{" "}
                        tanggal dipilih.
                      </span>
                    ) : (
                      <span>Pilih tanggal pada kalender untuk menerapkan perubahan.</span>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Ketersediaan</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRoomAvailabilityMode("available")}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                          roomAvailabilityMode === "available"
                            ? BUTTON_THEME.solid
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Tersedia
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomAvailabilityMode("blocked")}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                          roomAvailabilityMode === "blocked"
                            ? BUTTON_THEME.solid
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Ditutup
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Penyesuaian Harga</p>
                    <div className="flex rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setRoomAdjustmentType("NOMINAL")}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          roomAdjustmentType === "NOMINAL"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Nominal (Rp)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomAdjustmentType("PERCENT")}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          roomAdjustmentType === "PERCENT"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Persentase (%)
                      </button>
                    </div>

                    <div className="relative mt-3">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {roomAdjustmentType === "NOMINAL" ? "Rp" : "%"}
                      </span>
                      <input
                        type="number"
                        value={roomAdjustmentValue}
                        onChange={(event) => setRoomAdjustmentValue(event.target.value)}
                        placeholder={roomAdjustmentType === "NOMINAL" ? "Contoh: 200000" : "Contoh: 10"}
                        className={`h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Harga dasar saat ini{" "}
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(roomBasePrice)}
                      </span>
                    </p>
                  </div>

                  {roomActionError ? (
                    <p className="mt-4 text-xs font-semibold text-rose-600">{roomActionError}</p>
                  ) : null}
                  {roomActionSuccess ? (
                    <p className="mt-4 text-xs font-semibold text-emerald-700">
                      {roomActionSuccess}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={applyRoomSidebarChanges}
                    disabled={selectedCalendarDates.length === 0 || roomActionLoading}
                    className={`mt-8 flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium ${BUTTON_THEME.solid} ${BUTTON_THEME.solidDisabled}`}
                  >
                    {roomActionLoading ? "Menerapkan..." : "Terapkan Perubahan"}
                  </button>
                </div>
              </div>

              <details className="surface-panel rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  Riwayat penyesuaian harga
                </summary>
                {rateRulesError ? (
                  <p className="mt-3 text-xs text-rose-600">{rateRulesError}</p>
                ) : null}
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Penyesuaian</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rateRules.map((rule) => (
                        <tr key={rule.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-semibold text-slate-900">{rule.name}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {rule.startDate} - {rule.endDate}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {rule.adjustmentType === "PERCENT"
                              ? `${rule.adjustmentValue}%`
                              : formatCurrency(Number(rule.adjustmentValue))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteRateRule(rule.id)}
                              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!rateRulesLoading && rateRules.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                            Belum ada aturan harga.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          ) : null}
        </section>
      </main>
      </div>

      <ConfirmModal
        open={Boolean(tenantActionConfirm)}
        title={tenantActionConfirm?.title ?? ""}
        description={tenantActionConfirm?.description ?? ""}
        eyebrow="Konfirmasi Tenant"
        zIndexClassName="z-[72]"
        loading={tenantActionConfirmLoading}
        confirmLabel={tenantActionConfirm?.confirmLabel ?? "Ya, lanjutkan"}
        confirmTone={
          tenantActionConfirm?.payload.type === "delete-rate-rule" ||
          tenantActionConfirm?.payload.type === "cancel-order" ||
          (tenantActionConfirm?.payload.type === "payment-proof-review" &&
            tenantActionConfirm.payload.action === "reject")
            ? "danger"
            : "default"
        }
        onCancel={handleCancelTenantActionConfirm}
        onConfirm={handleConfirmTenantAction}
      />

      <ConfirmModal
        open={Boolean(roomActionConfirm)}
        title={roomActionConfirm?.title ?? ""}
        description={roomActionConfirm?.description ?? ""}
        eyebrow="Konfirmasi Aksi"
        eyebrowClassName="text-teal-600"
        zIndexClassName="z-[70]"
        loading={roomActionLoading}
        confirmLabel="Ya"
        onCancel={handleCancelRoomActionConfirm}
        onConfirm={handleConfirmRoomAction}
      />
    </div>
  );
}
