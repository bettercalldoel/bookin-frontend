"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { BUTTON_THEME, INPUT_THEME } from "@/lib/button-theme";
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

type TenantOrderRow = {
  id: string;
  orderNo: string;
  checkIn: string;
  property: string;
  user: string;
  nights: number;
  status: BookingStatus;
  total: number;
  paymentProofId: string;
  paymentProofStatus: PaymentProofStatus;
  paymentProofImageUrl: string;
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
  | "property-report"
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
    title: "Main",
    items: [
      {
        key: "dashboard-overview",
        label: "Dashboard Overview",
        helper: "Ringkasan tenant",
      },
    ],
  },
  {
    title: "Tenant",
    items: [
      {
        key: "tenant-profile",
        label: "Tenant Profile",
        helper: "Profil khusus tenant",
      },
    ],
  },
  {
    title: "Property & Room",
    items: [
      {
        key: "property-category",
        label: "Property Category",
        helper: "Tambah, lihat, hapus kategori",
      },
      {
        key: "property-management",
        label: "Property Management",
        helper: "Daftar properti & room",
      },
      {
        key: "room-management",
        label: "Room Management",
        helper: "Availability & dynamic pricing",
      },
    ],
  },
  {
    title: "Transaction",
    items: [
      {
        key: "order-management",
        label: "Order Management",
        helper: "Status order & konfirmasi bayar",
      },
    ],
  },
  {
    title: "Customer Relations",
    items: [
      {
        key: "customer-relations",
        label: "Reviews & Replies",
        helper: "Balas review user",
      },
    ],
  },
  {
    title: "Reports & Analysis",
    items: [
      {
        key: "sales-report",
        label: "Sales Report",
        helper: "Laporan berdasarkan transaksi",
      },
      {
        key: "property-report",
        label: "Property Report",
        helper: "Kalender ketersediaan properti",
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
    case "property-report":
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
      label: "Paid",
      className: "bg-emerald-100 text-emerald-700",
    };
  }
  if (status === "DIPROSES") {
    return {
      label: "Processed",
      className: "bg-blue-100 text-blue-700",
    };
  }
  if (status === "DIBATALKAN") {
    return {
      label: "Cancelled",
      className: "bg-slate-200 text-slate-700",
    };
  }
  return {
    label: "Pending",
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

const paymentProofStatuses: PaymentProofStatus[] = [
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
];

const toSafeAmount = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const toTimestamp = (value: string | null) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const dedupeLatestProofsByBooking = (proofs: TenantPaymentProof[]) => {
  const map = new Map<string, TenantPaymentProof>();

  proofs.forEach((proof) => {
    const existing = map.get(proof.booking.id);
    if (!existing) {
      map.set(proof.booking.id, proof);
      return;
    }
    if (toTimestamp(proof.submittedAt) > toTimestamp(existing.submittedAt)) {
      map.set(proof.booking.id, proof);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => toTimestamp(b.submittedAt) - toTimestamp(a.submittedAt),
  );
};

const mapPaymentProofsToOrders = (proofs: TenantPaymentProof[]): TenantOrderRow[] => {
  const orderMap = new Map<string, TenantOrderRow>();

  proofs.forEach((proof) => {
    if (orderMap.has(proof.booking.id)) return;
    orderMap.set(proof.booking.id, {
      id: proof.booking.id,
      orderNo: proof.booking.orderNo,
      checkIn: proof.booking.checkIn,
      property: proof.booking.property.name,
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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (data as { message?: string }).message || "Permintaan gagal.";
    throw new Error(message);
  }

  return data as T;
};

const normalizeTenantActionError = (message: string) => {
  if (message.includes("tidak bisa ditutup karena sudah ada transaksi terbayar")) {
    return `Aksi ditolak. ${message} Pilih tanggal lain atau biarkan tanggal tersebut tetap available.`;
  }

  if (message.includes("tidak boleh lebih kecil dari kamar terjual")) {
    return `Aksi ditolak. ${message} Naikkan jumlah unit tersedia atau ubah tanggal yang dipilih.`;
  }

  return message;
};

const mockSales = [
  {
    id: "TX-1024",
    property: "Serenity Villas",
    user: "Anisa Rahman",
    date: "2026-01-25",
    total: 1850000,
    status: "Diproses",
  },
  {
    id: "TX-1025",
    property: "Skyline Suites",
    user: "Kevin Hartono",
    date: "2026-01-26",
    total: 2450000,
    status: "Selesai",
  },
  {
    id: "TX-1026",
    property: "Garden Stay",
    user: "Raka Putra",
    date: "2026-01-27",
    total: 920000,
    status: "Menunggu Pembayaran",
  },
];

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

const reportWeekdayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function TenantDashboardClient({ me }: { me: DashboardUser }) {
  const [active, setActive] = useState<NavKey>("dashboard-overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [headerSearch, setHeaderSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [salesView, setSalesView] = useState<"property" | "transaction" | "user">(
    "transaction",
  );
  const [sortBy, setSortBy] = useState<"date" | "total">("date");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState<"ALL" | BookingStatus>(
    "ALL",
  );
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
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
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

  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return tenantOrders;
    if (statusFilter === "MENUNGGU_PEMBAYARAN") {
      return tenantOrders.filter(
        (order) =>
          order.status === "MENUNGGU_PEMBAYARAN" ||
          order.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN",
      );
    }
    return tenantOrders.filter((order) => order.status === statusFilter);
  }, [statusFilter, tenantOrders]);

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

  const filteredTransactionRows = useMemo(() => {
    const keyword = transactionSearch.trim().toLowerCase();
    if (!keyword) return filteredOrders;
    return filteredOrders.filter((order) =>
      [order.orderNo, order.property, order.user, order.checkIn]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [filteredOrders, transactionSearch]);

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

  const salesTrendData = useMemo(
    () =>
      overviewMonthLabels.map((month, index) => ({
        month,
        sales: overviewRevenueSeries[index] ?? 0,
        bookings: overviewTrend[index]?.orders ?? 0,
      })),
    [overviewRevenueSeries, overviewTrend],
  );

  const salesTrendMax = useMemo(
    () => Math.max(...salesTrendData.map((item) => item.sales), 1),
    [salesTrendData],
  );

  const bookingsTrendMax = useMemo(
    () => Math.max(...salesTrendData.map((item) => item.bookings), 1),
    [salesTrendData],
  );

  const roomMonthLabel = useMemo(() => {
    const base = availabilityQuery.startDate
      ? new Date(`${availabilityQuery.startDate}T00:00:00`)
      : new Date();
    return new Intl.DateTimeFormat("en-US", {
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
      } else {
        if (day % 6 === 0 || day % 7 === 0) status = "Booked";
        if (day % 9 === 0) status = "Maintenance";
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

  const fetchProperties = async () => {
    try {
      setPropertiesLoading(true);
      setPropertiesError(null);
      const data = await fetchJson<any[]>("/properties");
      const mapped = data.map((item) => ({
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
      setProperties(mapped);
    } catch (err) {
      setPropertiesError(
        err instanceof Error ? err.message : "Gagal memuat properti.",
      );
      setProperties([]);
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

  const loadAvailability = async () => {
    if (!selectedRoomId) {
      setAvailabilityError("Pilih room terlebih dahulu.");
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
        err instanceof Error ? err.message : "Gagal memuat rate rules.",
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
      setRoomActionError("Aksi room belum siap dikonfirmasi.");
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
          : "Gagal menerapkan perubahan room.",
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
      setRoomActionError("Pilih room terlebih dahulu.");
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
            `Jumlah unit melebihi total room (${selectedRoom.totalUnits} unit).`,
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
              `Jumlah room yang ditutup (${parsedUnits} unit) melebihi stok tanggal ${insufficientDate.date} (${insufficientDate.availableUnits} unit).`,
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
          roomActionType === "close" ? "Konfirmasi Tutup Room" : "Konfirmasi Buka Room";
        const actionDescription =
          roomActionType === "close"
            ? parsedUnits !== null
              ? `Kamu akan menutup ${parsedUnits} unit untuk ${sortedDates.length} tanggal yang dipilih. Lanjutkan?`
              : `Kamu akan menutup room untuk ${sortedDates.length} tanggal yang dipilih. Lanjutkan?`
            : parsedUnits !== null
              ? `Kamu akan membuka room dengan ${parsedUnits} unit tersedia untuk ${sortedDates.length} tanggal yang dipilih. Lanjutkan?`
              : `Kamu akan membuka room untuk ${sortedDates.length} tanggal yang dipilih. Lanjutkan?`;

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
          : "Gagal menerapkan perubahan room.",
      );
    } finally {
      setRoomActionLoading(false);
    }
  };

  const applyRoomSidebarChanges = () => {
    if (!selectedRoomId) {
      setRoomActionError("Pilih room terlebih dahulu.");
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
      title: "Konfirmasi Perubahan Room",
      description: hasRateAdjustment
        ? `Kamu akan ${actionLabel} room di ${sortedDates.length} tanggal sekaligus menerapkan penyesuaian harga. Lanjutkan?`
        : `Kamu akan ${actionLabel} room di ${sortedDates.length} tanggal terpilih. Lanjutkan?`,
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
      title: "Konfirmasi Hapus Rate Rule",
      description: `Hapus rate rule "${rule?.name ?? id}"?`,
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

  const fetchTenantPaymentProofsByStatus = async (status: PaymentProofStatus) => {
    const query = new URLSearchParams({ status });
    return fetchJson<TenantPaymentProof[]>(
      `/bookings/tenant/payment-proofs?${query.toString()}`,
    );
  };

  const loadTenantPaymentProofs = async () => {
    try {
      setTenantPaymentProofsLoading(true);
      setTenantPaymentProofsError(null);
      const results = await Promise.allSettled(
        paymentProofStatuses.map((status) => fetchTenantPaymentProofsByStatus(status)),
      );

      const successful = results
        .filter((result): result is PromiseFulfilledResult<TenantPaymentProof[]> =>
          result.status === "fulfilled",
        )
        .flatMap((result) => result.value);
      const failed = results.filter((result) => result.status === "rejected");

      if (failed.length === paymentProofStatuses.length) {
        const firstReason = failed[0]?.reason;
        throw firstReason instanceof Error
          ? firstReason
          : new Error("Semua data bukti pembayaran gagal dimuat.");
      }

      setTenantPaymentProofs(dedupeLatestProofsByBooking(successful));
      if (failed.length > 0) {
        setTenantPaymentProofsError(
          "Sebagian data bukti pembayaran belum berhasil dimuat.",
        );
      }
    } catch (err) {
      setTenantPaymentProofsError(
        err instanceof Error ? err.message : "Gagal memuat bukti pembayaran.",
      );
      setTenantPaymentProofs([]);
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

      const [proofResults, reviewResult, pendingReviewResult] = await Promise.all([
        Promise.allSettled(
          paymentProofStatuses.map((status) =>
            fetchTenantPaymentProofsByStatus(status),
          ),
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

      const successfulProofs = proofResults
        .filter((result): result is PromiseFulfilledResult<TenantPaymentProof[]> =>
          result.status === "fulfilled",
        )
        .flatMap((result) => result.value);
      const failedProofs = proofResults.filter(
        (result) => result.status === "rejected",
      );

      if (failedProofs.length === paymentProofStatuses.length) {
        const firstReason = failedProofs[0]?.reason;
        throw firstReason instanceof Error
          ? firstReason
          : new Error("Semua data payment proof gagal dimuat.");
      }

      const reviewTotal = reviewResult.ok
        ? (reviewResult.data.meta.total ?? reviewResult.data.data.length)
        : 0;
      const pendingReviewTotal = pendingReviewResult.ok
        ? (pendingReviewResult.data.meta.total ?? pendingReviewResult.data.data.length)
        : 0;

      if (failedProofs.length > 0 || !reviewResult.ok || !pendingReviewResult.ok) {
        setOverviewNotice(
          "Sebagian data overview tidak lengkap. Coba refresh setelah backend siap.",
        );
      }

      const allProofs = successfulProofs;
      setOverviewPaymentProofs(dedupeLatestProofsByBooking(allProofs));
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
        err instanceof Error ? err.message : "Gagal memuat review user.",
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
          ? "Setujui bukti pembayaran ini dan lanjutkan proses booking?"
          : "Tolak bukti pembayaran ini sekarang?",
      confirmLabel: actionLabel,
      payload: {
        type: "payment-proof-review",
        paymentProofId,
        action,
      },
    });
  };

  const handleSubmitReply = (reviewId: string) => {
    const draft = reviewDrafts[reviewId]?.trim() ?? "";
    if (!draft) {
      setTenantReviewsError("Balasan review tidak boleh kosong.");
      return;
    }

    setTenantReviewsError(null);
    setReviewReplyFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Kirim Balasan",
      description: "Kirim balasan review ini sekarang?",
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

          setRoomActionSuccess("Perubahan room berhasil diterapkan.");
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
          setReviewReplyFeedback(result.message ?? "Balasan review berhasil dikirim.");
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
        case "apply-room-sidebar":
          setRoomActionError(errorMessage ?? "Gagal menerapkan perubahan room.");
          break;
        case "delete-rate-rule":
          setRateRulesError(errorMessage ?? "Gagal menghapus rule.");
          break;
        case "payment-proof-review":
          setPaymentActionError(errorMessage ?? "Gagal memproses bukti pembayaran.");
          break;
        case "submit-review-reply":
          setTenantReviewsError(errorMessage ?? "Gagal mengirim balasan review.");
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
        case "apply-room-sidebar":
          setRoomActionLoading(false);
          break;
        case "delete-rate-rule":
          setRateRulesLoading(false);
          break;
        case "payment-proof-review":
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
    if (
      (active === "property-report" ||
        active === "room-management" ||
        active === "property-management" ||
        active === "property-category" ||
        active === "dashboard-overview") &&
      properties.length === 0
    ) {
      fetchProperties();
    }
  }, [active]);

  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
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
    if (active !== "order-management") return;
    loadTenantPaymentProofs();
  }, [active]);

  useEffect(() => {
    if (active !== "dashboard-overview") return;
    loadOverviewData();
  }, [active]);

  useEffect(() => {
    if (active !== "customer-relations") return;
    loadTenantReviews();
  }, [active]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [active]);

  useEffect(() => {
    if (active !== "room-management" && active !== "property-report") return;
    if (availabilityQuery.startDate && availabilityQuery.endDate) return;
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setAvailabilityQuery({
      startDate: formatDateInput(monthStart),
      endDate: formatDateInput(monthEnd),
    });
  }, [active, availabilityQuery.startDate, availabilityQuery.endDate]);

  useEffect(() => {
    if (active !== "room-management" && active !== "property-report") return;
    if (!selectedRoomId) return;
    if (!availabilityQuery.startDate || !availabilityQuery.endDate) return;
    loadAvailability();
  }, [
    active,
    selectedRoomId,
    availabilityQuery.startDate,
    availabilityQuery.endDate,
  ]);

  useEffect(() => {
    setSelectedCalendarDates([]);
    setRoomActionError(null);
    setRoomActionSuccess(null);
    setRoomActionConfirm(null);
  }, [selectedRoomId]);

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-900">
              BI
            </div>
            <span
              className={`text-sm font-bold text-slate-800 ${
                isSidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              BookIn
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path d="M6 6L18 18M6 18L18 6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="absolute -right-3 top-7 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-600 shadow-sm transition hover:bg-slate-50 lg:flex"
          aria-label="Toggle sidebar"
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
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActive(item.key)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                      active === item.key
                        ? BUTTON_THEME.softActive
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    } ${isSidebarCollapsed ? "justify-center lg:px-2" : ""}`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                        active === item.key
                          ? BUTTON_THEME.softActiveEmphasis
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {renderNavIcon(item.key)}
                    </span>
                    <span className={isSidebarCollapsed ? "lg:hidden" : ""}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <a
            href="/"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${
              isSidebarCollapsed ? "justify-center lg:px-2" : ""
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path d="M10 6H6.5C5.7 6 5 6.7 5 7.5V16.5C5 17.3 5.7 18 6.5 18H10" strokeWidth="1.8" />
                <path d="M14 8L18 12L14 16M18 12H9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={isSidebarCollapsed ? "lg:hidden" : ""}>Exit</span>
          </a>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
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
                placeholder="Search..."
                className="h-10 w-[220px] rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-600 md:w-[380px]"
                aria-label="Search"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:gap-4 sm:pl-5">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
              aria-label="Notifications"
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
                {me.tenantProfile?.companyName ?? "Premium Tenant"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-900 sm:h-10 sm:w-10">
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
                  <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Welcome back, here&apos;s what&apos;s happening with your properties today.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadOverviewData}
                  disabled={overviewLoading}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {overviewLoading ? "Refreshing..." : "Refresh Data"}
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
                    label: "Total Revenue",
                    value: formatCurrency(overviewSummary.totalRevenue),
                    change: overviewRevenueChangeLabel,
                    helper: "vs 7 hari terakhir",
                    positive: overviewRevenueGrowth >= 0,
                    iconLabel: "RP",
                    iconClass: "bg-slate-200 text-slate-800",
                  },
                  {
                    label: "Active Tenants",
                    value: overviewSummary.activeTenants.toString(),
                    change: `+${overviewSummary.activeOrders}`,
                    helper: "booking aktif",
                    positive: true,
                    iconLabel: "AT",
                    iconClass: "bg-emerald-100 text-emerald-600",
                  },
                  {
                    label: "Occupancy Rate",
                    value: `${overviewSummary.occupancyRate}%`,
                    change:
                      overviewSummary.pendingOrders > 0
                        ? `-${overviewSummary.pendingOrders}`
                        : "+0",
                    helper: "vs last month",
                    positive: overviewSummary.pendingOrders === 0,
                    iconLabel: "OC",
                    iconClass: "bg-blue-100 text-blue-600",
                  },
                  {
                    label: "Pending Reviews",
                    value: overviewSummary.pendingReviews.toString(),
                    change: `+${overviewSummary.pendingReviews}`,
                    helper: "vs last month",
                    positive: true,
                    iconLabel: "RV",
                    iconClass: "bg-orange-100 text-orange-600",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
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
                        {item.positive ? "up " : "down "}
                        {item.change}
                      </span>
                      <span className="text-slate-500">{item.helper}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                  <h3 className="text-2xl font-bold text-slate-900">Revenue Analytics</h3>
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <svg
                      viewBox={`0 0 ${overviewChart.width} ${overviewChart.height}`}
                      className="h-64 w-full"
                      role="img"
                      aria-label="Revenue analytics chart"
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

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900">Recent Activity</h3>
                  <div className="mt-5 space-y-4">
                    {overviewRecentActivity.length === 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                        Belum ada aktivitas booking.
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
                              New booking from {activity.user.fullName ?? activity.user.email}
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
                    className="mt-4 text-sm font-semibold text-slate-800 transition hover:text-slate-900"
                  >
                    View All Activity
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Property Breakdown</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Hierarki detail properti dari transaksi tenant.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Properti</th>
                        <th className="px-4 py-3 text-right">Order</th>
                        <th className="px-4 py-3 text-right">Pending</th>
                        <th className="px-4 py-3 text-right">Diproses</th>
                        <th className="px-4 py-3 text-right">Selesai</th>
                        <th className="px-4 py-3 text-right">Dibatalkan</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
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
                  Tenant Profile
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Profil akun tenant
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Profile Info
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
                      <p className="text-xs text-slate-500">Company</p>
                      <p className="font-semibold text-slate-900">
                        {me.tenantProfile?.companyName ?? "Tenant BookIn"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Account Status
                  </p>
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    <p>
                      Verifikasi email:{" "}
                      <span className="font-semibold text-emerald-700">
                        {me.emailVerifiedAt ? "Terverifikasi" : "Belum verifikasi"}
                      </span>
                    </p>
                    <p>Role: Tenant</p>
                    <p className="text-xs text-slate-500">
                      Untuk update data bisnis dan rekening payout, gunakan form profil
                      tenant saat endpoint backend tersedia.
                    </p>
                  </div>
                  <a
                    href="/profile"
                    className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Buka Profile Umum
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {active === "sales-report" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Reports & Analysis
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Track your performance and property availability.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <rect x="3.5" y="5.5" width="17" height="15" rx="2" strokeWidth="1.8" />
                      <path d="M8 3v4M16 3v4M3.5 10.5h17" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M4 5H20L13 13V19L11 20V13L4 5Z" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                    Filter
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M12 4V15M8 11L12 15L16 11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 19H20" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setActive("sales-report")}
                    className="border-b-2 border-slate-900 pb-3 text-sm font-medium text-slate-800"
                  >
                    Sales Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive("property-report")}
                    className="border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                  >
                    Property Availability
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  {
                    label: "Total Sales",
                    value: formatCurrency(overviewSummary.totalRevenue),
                    change: "+12.5% vs last period",
                    positive: true,
                  },
                  {
                    label: "Total Bookings",
                    value: `${overviewOrders.length}`,
                    change: "+8.2% vs last period",
                    positive: true,
                  },
                  {
                    label: "Avg. Daily Rate",
                    value: formatCurrency(
                      overviewOrders.length > 0
                        ? Math.round(overviewSummary.totalRevenue / overviewOrders.length)
                        : 0,
                    ),
                    change: "-2.1% vs last period",
                    positive: false,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
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

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Sales Trend</h3>
                <div className="relative mt-5">
                  <div className="pointer-events-none absolute left-0 right-0 top-0 z-0 grid h-64 grid-rows-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="border-b border-dashed border-slate-200" />
                    ))}
                  </div>
                  <div className="relative z-10 grid h-72 grid-cols-7 gap-3 pt-2">
                    {salesTrendData.map((item) => (
                      <div key={item.month} className="flex flex-col items-center justify-end gap-2">
                        <div className="flex h-60 items-end gap-1.5">
                          <div
                            className="w-6 rounded-t-md bg-slate-700 sm:w-8"
                            style={{
                              height: `${Math.max(6, (item.sales / salesTrendMax) * 100)}%`,
                            }}
                            title={`Sales ${formatCurrency(item.sales)}`}
                          />
                          <div
                            className="w-6 rounded-t-md bg-emerald-500 sm:w-8"
                            style={{
                              height: `${Math.max(
                                6,
                                (item.bookings / bookingsTrendMax) * 100,
                              )}%`,
                            }}
                            title={`Bookings ${item.bookings}`}
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
                    Bookings
                  </div>
                  <div className="flex items-center gap-2 text-slate-800">
                    <span className="h-3 w-3 rounded-sm bg-slate-700" />
                    Sales (IDR)
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {active === "property-report" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Reports & Analysis
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Track your performance and property availability.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <rect x="3.5" y="5.5" width="17" height="15" rx="2" strokeWidth="1.8" />
                      <path d="M8 3v4M16 3v4M3.5 10.5h17" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M4 5H20L13 13V19L11 20V13L4 5Z" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                    Filter
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M12 4V15M8 11L12 15L16 11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 19H20" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setActive("sales-report")}
                    className="border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                  >
                    Sales Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive("property-report")}
                    className="border-b-2 border-slate-900 pb-3 text-sm font-medium text-slate-800"
                  >
                    Property Availability
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">Occupancy Calendar</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      Available
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-500" />
                      Booked
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-slate-400" />
                      Maintenance
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
                                    {cell.status}
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
                <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage orders and confirm payments.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                      { value: "ALL" as const, label: "All" },
                      { value: "MENUNGGU_PEMBAYARAN" as const, label: "Pending" },
                      { value: "SELESAI" as const, label: "Paid" },
                      { value: "DIPROSES" as const, label: "Processed" },
                      { value: "DIBATALKAN" as const, label: "Cancelled" },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                          statusFilter === tab.value
                            ? "border border-slate-200 bg-white text-slate-800 shadow-sm"
                            : "border border-transparent text-slate-600 hover:bg-slate-100"
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
                        placeholder="Search..."
                        className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      />
                    </div>
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500"
                      aria-label="Filter"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                        <path d="M4 5H20L13 13V19L11 20V13L4 5Z" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </button>
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
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Guest</th>
                        <th className="px-6 py-4">Property</th>
                        <th className="px-6 py-4">Check-In</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
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
                          const canReview =
                            order.paymentProofStatus === "SUBMITTED" &&
                            (order.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN" ||
                              order.status === "MENUNGGU_PEMBAYARAN");
                          const hasProofLink = Boolean(order.paymentProofImageUrl);
                          return (
                            <tr key={order.id} className="hover:bg-slate-50/70">
                              <td className="px-6 py-4 font-semibold text-slate-800">
                                {order.orderNo}
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-900">
                                {order.user}
                              </td>
                              <td className="px-6 py-4 text-slate-500">{order.property}</td>
                              <td className="px-6 py-4 text-slate-500">{order.checkIn}</td>
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
                                        aria-label="Approve payment"
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
                                        aria-label="Reject payment"
                                      >
                                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                          <path d="M6 6L18 18M6 18L18 6" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                      </button>
                                    </>
                                  ) : null}
                                  {hasProofLink ? (
                                    <a
                                      href={order.paymentProofImageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                                      aria-label="View proof"
                                    >
                                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                        <path d="M2 12C4.8 7.8 8 5.7 12 5.7C16 5.7 19.2 7.8 22 12C19.2 16.2 16 18.3 12 18.3C8 18.3 4.8 16.2 2 12Z" strokeWidth="1.8" />
                                        <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
                                      </svg>
                                    </a>
                                  ) : (
                                    <span
                                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                                      aria-label="No proof link"
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
                      const canReview =
                        order.paymentProofStatus === "SUBMITTED" &&
                        (order.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN" ||
                          order.status === "MENUNGGU_PEMBAYARAN");
                      const hasProofLink = Boolean(order.paymentProofImageUrl);
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
                              <p className="text-xs text-slate-400">Guest</p>
                              <p>{order.user}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Check-In</p>
                              <p>{order.checkIn}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <div>
                              <p className="text-xs text-slate-400">Amount</p>
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
                                    aria-label="Approve payment"
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
                                    aria-label="Reject payment"
                                  >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                      <path d="M6 6L18 18M6 18L18 6" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                  </button>
                                </>
                              ) : null}
                              {hasProofLink ? (
                                <a
                                  href={order.paymentProofImageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                  aria-label="View proof"
                                >
                                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                                    <path d="M2 12C4.8 7.8 8 5.7 12 5.7C16 5.7 19.2 7.8 22 12C19.2 16.2 16 18.3 12 18.3C8 18.3 4.8 16.2 2 12Z" strokeWidth="1.8" />
                                    <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
                                  </svg>
                                </a>
                              ) : (
                                <span
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                                  aria-label="No proof link"
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
              </div>
            </div>
          ) : null}

          {active === "customer-relations" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Reviews & Replies
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Balas review yang disubmit user
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
                <p className="text-xs text-slate-500">Memuat review user...</p>
              ) : null}

              {!tenantReviewsLoading && tenantReviews.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  Belum ada review dari user.
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
                            placeholder="Tulis balasan tenant..."
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
                  <h2 className="text-2xl font-bold text-slate-900">Properties & Rooms</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your properties, rooms, and categories.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setActive("property-management")}
                      className="rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                    >
                      Properties
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-4 py-1.5 text-sm font-medium shadow-sm ${BUTTON_THEME.softActive}`}
                    >
                      Categories
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
                    placeholder="Category name..."
                    className={`h-11 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm ${INPUT_THEME.focus}`}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={categoryCreateLoading}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${BUTTON_THEME.solid} disabled:opacity-60`}
                  >
                    {categoryCreateLoading ? "Saving..." : "Add Category"}
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

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Category Name</th>
                        <th className="px-6 py-4">Properties Count</th>
                        <th className="px-6 py-4 text-right">Actions</th>
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
                              {category.name}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {category.propertiesCount} properties
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-xs text-slate-400">-</span>
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
                  <h2 className="text-2xl font-bold text-slate-900">Properties & Rooms</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your properties, rooms, and categories.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      className={`rounded-md px-4 py-1.5 text-sm font-medium shadow-sm ${BUTTON_THEME.softActive}`}
                    >
                      Properties
                    </button>
                    <button
                      type="button"
                      onClick={() => setActive("property-category")}
                      className="rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                    >
                      Categories
                    </button>
                  </div>
                  <a
                    href="/tenant-property"
                    className={`inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium shadow-sm ${BUTTON_THEME.solid}`}
                  >
                    + Add Property
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
                    placeholder="Search properties..."
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
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
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
                        {property.status}
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
                          {property.rooms.length} Rooms
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
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-slate-200 ${BUTTON_THEME.softActive}`}
                        >
                          Manage Rooms
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!propertiesLoading && filteredPropertyCards.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
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
                    aria-label="Back to properties"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                      <path d="M15 6L9 12L15 18" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Room Management</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage prices for{" "}
                      <span className="font-medium text-slate-900">
                        {selectedProperty?.name ?? "Selected Property"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex w-full max-w-[250px] items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => shiftAvailabilityMonth(-1)}
                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-50"
                    aria-label="Previous month"
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
                    aria-label="Next month"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M9 6L15 12L9 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm text-slate-600">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Property
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
                          Room
                        </span>
                        <select
                          value={selectedRoomId}
                          onChange={(event) => setSelectedRoomId(event.target.value)}
                          className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                          disabled={!selectedProperty}
                        >
                          <option value="">Pilih room</option>
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
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
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
                                High
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
                              {status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-5 text-sm text-slate-700">
                    {selectedCalendarDates.length > 0 ? (
                      <span>
                        <span className="font-semibold text-slate-900">
                          {selectedCalendarDates.length}
                        </span>{" "}
                        dates selected.
                      </span>
                    ) : (
                      <span>Select dates on the calendar to apply changes.</span>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Availability</p>
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
                        Available
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
                        Blocked
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Price Adjustment</p>
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
                        Rp Fixed
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
                        % Percentage
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
                        placeholder={roomAdjustmentType === "NOMINAL" ? "e.g. 200000" : "e.g. 10"}
                        className={`h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                      />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Base price is{" "}
                      <span className="font-semibold text-slate-700">
                        {formatCurrency(roomBasePrice)}
                      </span>
                      .
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
                    {roomActionLoading ? "Applying..." : "Apply Changes"}
                  </button>
                </div>
              </div>

              <details className="rounded-xl border border-slate-200 bg-white p-4">
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
                            Belum ada rate rule.
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
