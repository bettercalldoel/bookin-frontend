"use client";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";
import { BUTTON_THEME, INPUT_THEME } from "@/lib/button-theme";
import { formatDateDDMMYYYY } from "@/lib/date-format";
import { useAppLocaleValue } from "@/hooks/use-app-locale";
import ConfirmModal from "@/components/ui/confirm-modal";
import TenantProfileSettings from "@/components/tenant-dashboard/tenant-profile-settings";
import {
  TenantCustomerRelationsSection,
  TenantOrderManagementSection
} from "./tenant-dashboard-order-customer-sections";
import {
  TenantPropertyCategorySection
} from "./tenant-dashboard-property-category-section";
import { TenantPropertyManagementSection } from "./tenant-dashboard-property-management-section";
import { TenantRoomManagementSection } from "./tenant-dashboard-room-section";
import { TenantDashboardOverviewSection } from "./tenant-dashboard-overview-section";
import { mapTenantProperties } from "./tenant-dashboard-property-mapper";
import { buildSalesFallbackFromOverview } from "./tenant-dashboard-sales-fallback";
const buildNavGroups = (locale) => {
  const isEn = locale === "en";
  return [
    {
      title: isEn ? "Main" : "Utama",
      items: [
        {
          key: "dashboard-overview",
          label: isEn ? "Dashboard Overview" : "Ringkasan Dashboard",
          helper: isEn ? "Partner summary" : "Ringkasan mitra"
        }
      ]
    },
    {
      title: isEn ? "Tenant Account" : "Akun Tenant",
      items: [
        {
          key: "tenant-profile",
          label: isEn ? "Tenant Profile" : "Profil Tenant",
          helper: isEn ? "Partner account profile" : "Profil akun mitra"
        }
      ]
    },
    {
      title: isEn ? "Properties & Rooms" : "Properti & Kamar",
      items: [
        {
          key: "property-management",
          label: isEn ? "Properties & Rooms" : "Properti & Kamar",
          helper: isEn ? "Property list, rooms, and calendar" : "Daftar properti, kamar, dan kalender"
        }
      ]
    },
    {
      title: isEn ? "Transactions" : "Transaksi",
      items: [
        {
          key: "order-management",
          label: isEn ? "Manage Orders" : "Kelola Pesanan",
          helper: isEn ? "Order status and payment confirmation" : "Status pesanan & konfirmasi pembayaran"
        }
      ]
    },
    {
      title: isEn ? "Customer Relations" : "Relasi Pelanggan",
      items: [
        {
          key: "customer-relations",
          label: isEn ? "Reviews & Replies" : "Ulasan & Balasan",
          helper: isEn ? "Reply to user reviews" : "Balas ulasan pengguna"
        }
      ]
    },
    {
      title: isEn ? "Reports & Analytics" : "Laporan & Analisis",
      items: [
        {
          key: "sales-report",
          label: isEn ? "Reports & Analytics" : "Laporan & Analisis",
          helper: isEn ? "Sales report and property availability" : "Laporan penjualan dan ketersediaan properti"
        }
      ]
    }
  ];
};
const baseNavIconClass = "h-4 w-4";
const propertyNavIcon = /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: baseNavIconClass, fill: "none", stroke: "currentColor", children: [
  /* @__PURE__ */ jsx("path", { d: "M5 20V6.5C5 5.7 5.7 5 6.5 5H17.5C18.3 5 19 5.7 19 6.5V20", strokeWidth: "1.8" }),
  /* @__PURE__ */ jsx("path", { d: "M9 20V15H15V20M9 9H10M14 9H15M9 12H10M14 12H15", strokeWidth: "1.8", strokeLinecap: "round" })
] });
const NAV_ICON_MAP = {
  "dashboard-overview": /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: baseNavIconClass, fill: "none", stroke: "currentColor", children: [
    /* @__PURE__ */ jsx("rect", { x: "4", y: "4", width: "7", height: "7", rx: "1.5", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsx("rect", { x: "13", y: "4", width: "7", height: "7", rx: "1.5", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsx("rect", { x: "4", y: "13", width: "7", height: "7", rx: "1.5", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsx("rect", { x: "13", y: "13", width: "7", height: "7", rx: "1.5", strokeWidth: "1.8" })
  ] }),
  "tenant-profile": /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: baseNavIconClass, fill: "none", stroke: "currentColor", children: [
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "8", r: "3.5", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsx("path", { d: "M5 19.5C6.6 16.8 9 15.5 12 15.5C15 15.5 17.4 16.8 19 19.5", strokeWidth: "1.8", strokeLinecap: "round" })
  ] }),
  "property-category": propertyNavIcon,
  "property-management": propertyNavIcon,
  "room-management": /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: baseNavIconClass, fill: "none", stroke: "currentColor", children: [
    /* @__PURE__ */ jsx("rect", { x: "3.5", y: "5.5", width: "17", height: "15", rx: "2", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsx("path", { d: "M8 3V7M16 3V7M3.5 10.5H20.5", strokeWidth: "1.8", strokeLinecap: "round" })
  ] }),
  "order-management": /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: baseNavIconClass, fill: "none", stroke: "currentColor", children: [
    /* @__PURE__ */ jsx("rect", { x: "4", y: "6", width: "16", height: "12", rx: "2", strokeWidth: "1.8" }),
    /* @__PURE__ */ jsx("path", { d: "M4 10H20", strokeWidth: "1.8" })
  ] }),
  "customer-relations": /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: baseNavIconClass, fill: "none", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M5.5 18.5L6.5 15.5C5 14.2 4 12.5 4 10.5C4 6.9 7.6 4 12 4C16.4 4 20 6.9 20 10.5C20 14.1 16.4 17 12 17C10.8 17 9.7 16.8 8.7 16.4L5.5 18.5Z", strokeWidth: "1.8", strokeLinejoin: "round" }) }),
  "sales-report": /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: baseNavIconClass, fill: "none", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M4 20H20M7 16V11M12 16V7M17 16V13", strokeWidth: "1.8", strokeLinecap: "round" }) })
};
const renderNavIcon = (key) => NAV_ICON_MAP[key] ?? null;
const overviewMonthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const defaultSalesSummary = {
  totalSales: 0,
  totalNetPayout: 0,
  totalTransactions: 0,
  avgPerTransaction: 0
};
const defaultSalesMeta = {
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
  keyword: null
};
const defaultTenantPaymentProofMeta = {
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
  sortOrder: "desc"
};
const defaultPropertyListMeta = {
  page: 1,
  limit: 9,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
  search: null,
  sortBy: "createdAt",
  sortOrder: "desc"
};
const defaultTenantReviewMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  replied: null,
  keyword: null,
  rating: null,
  sortBy: "createdAt",
  sortOrder: "desc"
};
const formatCurrency = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(value);
const formatDateTime = (value) => {
  return formatDateDDMMYYYY(value);
};
const BOOKING_STATUS_LABEL = {
  MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
  MENUNGGU_KONFIRMASI_PEMBAYARAN: "Menunggu Konfirmasi Pembayaran",
  DIPROSES: "Diproses",
  DIBATALKAN: "Dibatalkan",
  SELESAI: "Selesai"
};
const formatBookingStatus = (status) => BOOKING_STATUS_LABEL[status] ?? status;
const formatPaymentProofStatus = (status) => {
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
const TRANSACTION_STATUS_META = {
  SELESAI: { label: "Selesai", className: "bg-emerald-100 text-emerald-700" },
  DIPROSES: { label: "Diproses", className: "bg-blue-100 text-blue-700" },
  DIBATALKAN: { label: "Dibatalkan", className: "bg-slate-200 text-slate-700" }
};
const getTransactionStatusMeta = (status) => TRANSACTION_STATUS_META[status] ?? {
  label: "Menunggu",
  className: "bg-amber-100 text-amber-700"
};
const countNights = (checkIn, checkOut) => {
  const start = /* @__PURE__ */ new Date(`${checkIn}T00:00:00`);
  const end = /* @__PURE__ */ new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = end.getTime() - start.getTime();
  if (diff <= 0) return 0;
  return Math.round(diff / (1e3 * 60 * 60 * 24));
};
const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const getWeekdayLabel = (dateValue) => {
  const date = /* @__PURE__ */ new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return weekdayLabels[date.getDay()] ?? "";
};
const parsePositiveIntInput = (value) => {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return Number.NaN;
  return parsed;
};
const toSafeAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};
const toTimestamp = (value) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};
const mapPaymentProofsToOrders = (proofs) => {
  const orderMap = /* @__PURE__ */ new Map();
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
      grossTotal: toSafeAmount(proof.booking.subtotalAmount),
      tenantFee: toSafeAmount(proof.booking.tenantFeeAmount),
      netPayout: toSafeAmount(proof.booking.tenantPayoutAmount),
      breakfastSelected: proof.booking.breakfastSelected,
      breakfastPax: proof.booking.breakfastPax,
      breakfastTotal: toSafeAmount(proof.booking.breakfastTotal),
      paymentProofId: proof.id,
      paymentProofStatus: proof.status,
      paymentProofImageUrl: proof.imageUrl
    });
  });
  return Array.from(orderMap.values());
};
const toTrendChart = (values, labels, width = 680, height = 260) => {
  const left = 52;
  const right = 24;
  const top = 18;
  const bottom = 38;
  const plotWidth = Math.max(width - left - right, 1);
  const plotHeight = Math.max(height - top - bottom, 1);
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? width / 2 : left + index * plotWidth / (values.length - 1);
    const y = top + (1 - value / maxValue) * plotHeight;
    return {
      x,
      y,
      value,
      label: labels[index] ?? ""
    };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1]?.x ?? 0} ${height - bottom} L ${points[0]?.x ?? 0} ${height - bottom} Z` : "";
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
    height
  };
};
const fetchJson = async (path, options = {}) => {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });
  const raw = await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }
  if (!response.ok) {
    const parsed = typeof data === "object" && data !== null ? data : {};
    const message = parsed.message || `Permintaan gagal (${response.status} ${response.statusText}).`;
    throw new Error(message);
  }
  return data;
};
const normalizeTenantActionError = (message) => {
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
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    type: "Villa",
    location: "Bali, Indonesia",
    status: "Active"
  },
  {
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    type: "Apartment",
    location: "Jakarta, Indonesia",
    status: "Active"
  },
  {
    image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1200&q=80",
    type: "Cabin",
    location: "Bandung, Indonesia",
    status: "Maintenance"
  }
];
const getReportWeekdayLabels = (locale) => locale === "en" ? ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] : ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];
const asErrorMessage = (error, fallback) => error instanceof Error ? error.message : fallback;
const toAsyncResult = async (promise) => {
  try {
    return { ok: true, data: await promise };
  } catch (error) {
    return { ok: false, error };
  }
};
const getPagedTotal = (value) => value.meta?.total ?? value.data?.length ?? 0;
const resolveRateRulesPath = (roomId, propertyId) => {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "50");
  params.set("sortBy", "startDate");
  params.set("sortOrder", "asc");
  if (roomId) params.set("scope", "ROOM_TYPE"), params.set("roomTypeId", roomId);
  else if (propertyId) params.set("scope", "PROPERTY"), params.set("propertyId", propertyId);
  return `/availability/rate-rules?${params.toString()}`;
};
function TenantDashboardClient({ me }) {
  const locale = useAppLocaleValue();
  const isEnglish = locale === "en";
  const navGroups = useMemo(() => buildNavGroups(locale), [locale]);
  const reportWeekdayLabels = useMemo(() => getReportWeekdayLabels(locale), [locale]);
  const roomWeekdayLabels = useMemo(
    () => isEnglish ? ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] : ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"],
    [isEnglish]
  );
  const tenantCopy = useMemo(
    () => ({
      failedLoadProperty: isEnglish ? "Failed to load properties." : "Gagal memuat properti.",
      failedLoadCalendar: isEnglish ? "Failed to load calendar." : "Gagal memuat kalender.",
      failedLoadRateRule: isEnglish ? "Failed to load pricing rules." : "Gagal memuat aturan harga.",
      selectRoomFirst: isEnglish ? "Please select a room first." : "Pilih kamar terlebih dahulu.",
      fillDateRange: isEnglish ? "Start and end date are required." : "Tanggal mulai dan akhir wajib diisi.",
      roomActionNotReady: isEnglish ? "Room action is not ready for confirmation." : "Aksi kamar belum siap dikonfirmasi.",
      applyRoomFailed: isEnglish ? "Failed to apply room availability updates." : "Gagal menerapkan perubahan kamar.",
      propertyReportTitle: isEnglish ? "Property Report" : "Laporan Properti",
      propertyReportSubtitle: isEnglish ? "Monitor room availability in calendar format." : "Monitor ketersediaan properti dan kamar dalam bentuk kalender.",
      reloadCalendar: isEnglish ? "Reload Calendar" : "Muat Ulang Kalender",
      loadingShort: isEnglish ? "Loading..." : "Memuat...",
      salesReportTab: isEnglish ? "Sales Report" : "Laporan Penjualan",
      propertyAvailabilityTab: isEnglish ? "Property Availability" : "Ketersediaan Properti",
      property: isEnglish ? "Property" : "Properti",
      room: isEnglish ? "Room" : "Kamar",
      selectProperty: isEnglish ? "Select property" : "Pilih properti",
      selectRoom: isEnglish ? "Select room" : "Pilih kamar",
      startDate: isEnglish ? "Start Date" : "Tanggal Mulai",
      endDate: isEnglish ? "End Date" : "Tanggal Akhir",
      currentMonth: isEnglish ? "Current Month" : "Bulan Ini",
      selectedPropertyFallback: isEnglish ? "No property selected" : "Belum pilih properti",
      selectedRoomFallback: isEnglish ? "No room selected" : "Belum memilih kamar",
      prevMonthAria: isEnglish ? "Previous month" : "Bulan sebelumnya",
      nextMonthAria: isEnglish ? "Next month" : "Bulan berikutnya",
      rows: isEnglish ? "Rows" : "Baris",
      previous: isEnglish ? "Previous" : "Sebelumnya",
      next: isEnglish ? "Next" : "Selanjutnya",
      availabilityCalendar: isEnglish ? "Availability Calendar" : "Kalender Ketersediaan",
      available: isEnglish ? "Available" : "Tersedia",
      booked: isEnglish ? "Booked" : "Terpesan",
      maintenance: isEnglish ? "Maintenance" : "Perawatan",
      dayLabel: isEnglish ? "day" : "hari",
      manageRoom: isEnglish ? "Manage Rooms" : "Kelola Kamar",
      managePriceFor: isEnglish ? "Manage pricing for" : "Kelola harga untuk",
      selectedProperty: isEnglish ? "Selected Property" : "Properti Terpilih",
      backToPropertyAria: isEnglish ? "Back to properties" : "Kembali ke properti",
      loadingCalendar: isEnglish ? "Loading calendar..." : "Memuat kalender...",
      peak: isEnglish ? "Peak" : "Puncak",
      closed: isEnglish ? "Closed" : "Ditutup",
      datesSelected: isEnglish ? "dates selected." : "tanggal dipilih.",
      selectDateHint: isEnglish ? "Select dates from the calendar to apply updates." : "Pilih tanggal pada kalender untuk menerapkan perubahan.",
      availability: isEnglish ? "Availability" : "Ketersediaan",
      priceAdjustment: isEnglish ? "Price Adjustment" : "Penyesuaian Harga",
      nominalLabel: isEnglish ? "Fixed (IDR)" : "Nominal (Rp)",
      percentageLabel: isEnglish ? "Percentage (%)" : "Persentase (%)",
      exampleNominal: isEnglish ? "Example: 200000" : "Contoh: 200000",
      examplePercent: isEnglish ? "Example: 10" : "Contoh: 10",
      basePriceNow: isEnglish ? "Current base price" : "Harga dasar saat ini",
      applying: isEnglish ? "Applying..." : "Menerapkan...",
      applyChanges: isEnglish ? "Apply Changes" : "Terapkan Perubahan",
      priceAdjustmentHistory: isEnglish ? "Price adjustment history" : "Riwayat penyesuaian harga",
      name: isEnglish ? "Name" : "Nama",
      date: isEnglish ? "Date" : "Tanggal",
      adjustment: isEnglish ? "Adjustment" : "Penyesuaian",
      action: isEnglish ? "Action" : "Aksi",
      propertiesNoun: isEnglish ? "properties" : "properti",
      propertyPageLabel: isEnglish ? "Property page" : "Halaman properti"
    }),
    [isEnglish]
  );
  const [active, setActive] = useState("dashboard-overview");
  const [tenantAccount, setTenantAccount] = useState(me);
  const [reportTab, setReportTab] = useState("sales");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [headerSearch, setHeaderSearch] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyListPage, setPropertyListPage] = useState(1);
  const [propertyListLimit, setPropertyListLimit] = useState(9);
  const [propertySortBy, setPropertySortBy] = useState("createdAt");
  const [propertySortOrder, setPropertySortOrder] = useState(
    "desc"
  );
  const [propertyListMeta, setPropertyListMeta] = useState(defaultPropertyListMeta);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [salesView, setSalesView] = useState(
    "transaction"
  );
  const [sortBy, setSortBy] = useState("date");
  const [salesSortOrder, setSalesSortOrder] = useState("desc");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [salesPage, setSalesPage] = useState(1);
  const [salesLimit, setSalesLimit] = useState(10);
  const [salesMeta, setSalesMeta] = useState(defaultSalesMeta);
  const [salesSummary, setSalesSummary] = useState(defaultSalesSummary);
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [salesTransactionRows, setSalesTransactionRows] = useState(
    []
  );
  const [salesPropertyRows, setSalesPropertyRows] = useState([]);
  const [salesUserRows, setSalesUserRows] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(
    "ALL"
  );
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLimit, setTransactionLimit] = useState(10);
  const [transactionSortBy, setTransactionSortBy] = useState("submittedAt");
  const [transactionSortOrder, setTransactionSortOrder] = useState(
    "desc"
  );
  const [tenantPaymentProofMeta, setTenantPaymentProofMeta] = useState(defaultTenantPaymentProofMeta);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [tenantReviews, setTenantReviews] = useState([]);
  const [tenantReviewsLoading, setTenantReviewsLoading] = useState(false);
  const [tenantReviewsError, setTenantReviewsError] = useState(null);
  const [tenantReviewsMeta, setTenantReviewsMeta] = useState(defaultTenantReviewMeta);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewLimit, setReviewLimit] = useState(10);
  const [reviewRepliedFilter, setReviewRepliedFilter] = useState("false");
  const [reviewSortBy, setReviewSortBy] = useState(
    "createdAt"
  );
  const [reviewSortOrder, setReviewSortOrder] = useState("desc");
  const [propertyRatingSummaryByPropertyId, setPropertyRatingSummaryByPropertyId] = useState({});
  const [reviewReplyLoadingId, setReviewReplyLoadingId] = useState(
    null
  );
  const [reviewReplyFeedback, setReviewReplyFeedback] = useState(
    null
  );
  const [paymentDecisionNotes, setPaymentDecisionNotes] = useState({});
  const [paymentActionLoadingId, setPaymentActionLoadingId] = useState(null);
  const [paymentActionError, setPaymentActionError] = useState(
    null
  );
  const [paymentActionFeedback, setPaymentActionFeedback] = useState(null);
  const [tenantPaymentProofs, setTenantPaymentProofs] = useState([]);
  const [tenantPaymentProofsLoading, setTenantPaymentProofsLoading] = useState(false);
  const [tenantPaymentProofsError, setTenantPaymentProofsError] = useState(null);
  const [overviewPaymentProofs, setOverviewPaymentProofs] = useState([]);
  const [overviewReviewsTotal, setOverviewReviewsTotal] = useState(0);
  const [overviewPendingReviews, setOverviewPendingReviews] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);
  const [overviewNotice, setOverviewNotice] = useState(null);
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState(null);
  const [propertyActionError, setPropertyActionError] = useState(
    null
  );
  const [propertyActionFeedback, setPropertyActionFeedback] = useState(null);
  const [propertyDeleteLoadingId, setPropertyDeleteLoadingId] = useState(null);
  const [propertyReportPage, setPropertyReportPage] = useState(1);
  const [propertyReportLimit, setPropertyReportLimit] = useState(10);
  const [propertyReportMeta, setPropertyReportMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryNameDrafts, setCategoryNameDrafts] = useState({});
  const [categoryCreateLoading, setCategoryCreateLoading] = useState(false);
  const [categoryCreateError, setCategoryCreateError] = useState(
    null
  );
  const [categoryCreateFeedback, setCategoryCreateFeedback] = useState(
    null
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [availabilityQuery, setAvailabilityQuery] = useState({
    startDate: "",
    endDate: ""
  });
  const [availabilityData, setAvailabilityData] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(
    null
  );
  const [availabilityView, setAvailabilityView] = useState(
    "grid"
  );
  const [selectedCalendarDates, setSelectedCalendarDates] = useState(
    []
  );
  const [roomActionType, setRoomActionType] = useState("close");
  const [roomAvailabilityMode, setRoomAvailabilityMode] = useState("available");
  const [roomActionUnits, setRoomActionUnits] = useState("");
  const [roomAdjustmentType, setRoomAdjustmentType] = useState("NOMINAL");
  const [roomAdjustmentValue, setRoomAdjustmentValue] = useState("");
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [roomActionError, setRoomActionError] = useState(null);
  const [roomActionSuccess, setRoomActionSuccess] = useState(
    null
  );
  const [roomActionConfirm, setRoomActionConfirm] = useState(null);
  const [tenantActionConfirm, setTenantActionConfirm] = useState(null);
  const [tenantActionConfirmLoading, setTenantActionConfirmLoading] = useState(false);
  const [rateRules, setRateRules] = useState([]);
  const [rateRulesLoading, setRateRulesLoading] = useState(false);
  const [rateRulesError, setRateRulesError] = useState(null);
  const [pendingTransactionNotifications, setPendingTransactionNotifications] = useState(0);
  const [pendingReviewNotifications, setPendingReviewNotifications] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const notificationPanelRef = useRef(null);
  const totalHeaderNotifications = pendingTransactionNotifications + pendingReviewNotifications;
  const hasHeaderNotifications = totalHeaderNotifications > 0;
  const tenantOrders = useMemo(
    () => mapPaymentProofsToOrders(tenantPaymentProofs),
    [tenantPaymentProofs]
  );
  const overviewOrders = useMemo(
    () => mapPaymentProofsToOrders(overviewPaymentProofs),
    [overviewPaymentProofs]
  );
  const overviewTrend = useMemo(() => {
    const today = /* @__PURE__ */ new Date();
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      const dateKey = formatDateInput(date);
      return {
        dateKey,
        weekday: getWeekdayLabel(dateKey),
        orders: 0,
        revenue: 0
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
        point.revenue += toSafeAmount(proof.booking.subtotalAmount);
      }
    });
    return points;
  }, [overviewPaymentProofs]);
  const overviewBreakdown = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    overviewPaymentProofs.forEach((proof) => {
      const propertyId = proof.booking.property.id;
      const current = map.get(propertyId) ?? {
        propertyId,
        propertyName: proof.booking.property.name,
        orders: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0,
        lastSubmittedAt: null
      };
      current.orders += 1;
      if (proof.booking.status === "MENUNGGU_PEMBAYARAN") current.pending += 1;
      if (proof.booking.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN") {
        current.pending += 1;
      }
      if (proof.booking.status === "DIPROSES") current.inProgress += 1;
      if (proof.booking.status === "SELESAI") current.completed += 1;
      if (proof.booking.status === "DIBATALKAN") current.cancelled += 1;
      if (proof.booking.status !== "DIBATALKAN") {
        current.revenue += toSafeAmount(proof.booking.subtotalAmount);
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
      0
    );
    const activeTenants = new Set(overviewPaymentProofs.map((proof) => proof.user.id)).size;
    const activeOrders = overviewOrders.filter(
      (order) => order.status === "DIPROSES"
    ).length;
    const pendingOrders = overviewOrders.filter(
      (order) => order.status === "MENUNGGU_PEMBAYARAN" || order.status === "MENUNGGU_KONFIRMASI_PEMBAYARAN"
    ).length;
    const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const monthlyRevenue = overviewPaymentProofs.reduce((sum, proof) => {
      const submittedAt = new Date(proof.submittedAt);
      if (Number.isNaN(submittedAt.getTime())) return sum;
      const isCurrentMonth = submittedAt.getMonth() === currentMonth && submittedAt.getFullYear() === currentYear;
      if (!isCurrentMonth || proof.booking.status === "DIBATALKAN") return sum;
      return sum + toSafeAmount(proof.booking.subtotalAmount);
    }, 0);
    const totalRevenue = overviewPaymentProofs.reduce((sum, proof) => {
      if (proof.booking.status === "DIBATALKAN") return sum;
      return sum + toSafeAmount(proof.booking.subtotalAmount);
    }, 0);
    const occupancyRate = totalRooms > 0 ? Math.min(100, Math.round(activeOrders / totalRooms * 100)) : 0;
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
      occupancyRate
    };
  }, [
    overviewOrders,
    overviewPaymentProofs,
    overviewPendingReviews,
    overviewReviewsTotal,
    properties
  ]);
  const overviewRevenueSeries = useMemo(
    () => overviewTrend.map((point) => point.revenue),
    [overviewTrend]
  );
  const overviewChart = useMemo(
    () => toTrendChart(overviewRevenueSeries, overviewMonthLabels),
    [overviewRevenueSeries]
  );
  const overviewRevenueGrowth = useMemo(() => {
    if (overviewRevenueSeries.length < 2) return 0;
    const first = overviewRevenueSeries[0] ?? 0;
    const last = overviewRevenueSeries[overviewRevenueSeries.length - 1] ?? 0;
    if (first <= 0) return last > 0 ? 100 : 0;
    return (last - first) / first * 100;
  }, [overviewRevenueSeries]);
  const overviewRevenueChangeLabel = useMemo(() => {
    const absolute = Math.abs(overviewRevenueGrowth).toFixed(1);
    return `${overviewRevenueGrowth >= 0 ? "+" : "-"}${absolute}%`;
  }, [overviewRevenueGrowth]);
  const overviewRecentActivity = useMemo(
    () => overviewPaymentProofs.slice(0, 5),
    [overviewPaymentProofs]
  );
  const filteredTransactionRows = useMemo(
    () => tenantOrders,
    [tenantOrders]
  );
  const salesDateRangeInvalid = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return false;
    return dateRange.from > dateRange.to;
  }, [dateRange.from, dateRange.to]);
  const propertyCards = useMemo(() => {
    return properties.map((property, index) => {
      const visual = propertyCardVisuals[index % propertyCardVisuals.length];
      const location = [property.cityName, property.province].filter((value) => Boolean(value && value.trim())).join(", ");
      const ratingSummary = propertyRatingSummaryByPropertyId[property.id];
      return {
        ...property,
        image: property.coverUrl || visual.image,
        type: property.categoryName || visual.type,
        location: location || visual.location,
        rating: ratingSummary ? ratingSummary.average.toFixed(1) : "-",
        ratingCount: ratingSummary?.count ?? 0,
        status: visual.status
      };
    });
  }, [properties, propertyRatingSummaryByPropertyId]);
  const filteredPropertyCards = useMemo(() => {
    return propertyCards;
  }, [propertyCards]);
  const categoryRows = useMemo(() => {
    const propertyCountByCategory = properties.reduce(
      (acc, property) => {
        const key = (property.categoryName || "").trim().toLowerCase();
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {}
    );
    const source = catalogCategories.length > 0 ? catalogCategories : Array.from(
      new Map(
        properties.map((property) => property.categoryName?.trim()).filter((value) => Boolean(value)).map((name) => [name.toLowerCase(), { id: name, name }])
      ).values()
    );
    return source.map((category) => ({
      ...category,
      propertiesCount: propertyCountByCategory[category.name.toLowerCase()] ?? 0
    }));
  }, [catalogCategories, properties]);
  const salesTrendSeries = useMemo(() => {
    if (salesTrendData.length > 0) return salesTrendData;
    return overviewMonthLabels.map((month) => ({
      month,
      sales: 0,
      bookings: 0
    }));
  }, [salesTrendData]);
  const salesTrendMax = useMemo(
    () => Math.max(...salesTrendSeries.map((item) => item.sales), 1),
    [salesTrendSeries]
  );
  const bookingsTrendMax = useMemo(
    () => Math.max(...salesTrendSeries.map((item) => item.bookings), 1),
    [salesTrendSeries]
  );
  const roomMonthLabel = useMemo(() => {
    const base = availabilityQuery.startDate ? /* @__PURE__ */ new Date(`${availabilityQuery.startDate}T00:00:00`) : /* @__PURE__ */ new Date();
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric"
    }).format(base);
  }, [availabilityQuery.startDate]);
  const roomCalendarCells = useMemo(() => {
    const base = availabilityQuery.startDate ? /* @__PURE__ */ new Date(`${availabilityQuery.startDate}T00:00:00`) : /* @__PURE__ */ new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const monthStart = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOffset = monthStart.getDay();
    const map = new Map((availabilityData?.items ?? []).map((item) => [item.date, item]));
    const cells = [];
    for (let index = 0; index < firstDayOffset; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = formatDateInput(date);
      cells.push({
        date: dateKey,
        day,
        item: map.get(dateKey) ?? null
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [availabilityData, availabilityQuery.startDate]);
  const reportAvailabilityWeeks = useMemo(() => {
    const base = availabilityQuery.startDate ? /* @__PURE__ */ new Date(`${availabilityQuery.startDate}T00:00:00`) : /* @__PURE__ */ new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const monthStart = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayOffset = (monthStart.getDay() + 6) % 7;
    const map = new Map((availabilityData?.items ?? []).map((item) => [item.date, item]));
    const cells = [];
    for (let index = 0; index < mondayOffset; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = formatDateInput(new Date(year, month, day));
      const item = map.get(date);
      let status = "Available";
      if (item) {
        status = item.isClosed ? "Maintenance" : item.availableUnits <= 0 ? "Booked" : "Available";
      }
      cells.push({ day, status });
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    const weeks = [];
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
      { available: 0, booked: 0, maintenance: 0 }
    );
  }, [availabilityData]);
  const overviewYAxisTicks = useMemo(() => {
    const maxValue = Math.max(overviewChart.maxValue, 1e3);
    const step = Math.max(1e3, Math.ceil(maxValue / 4 / 1e3) * 1e3);
    return [step * 4, step * 3, step * 2, step, 0];
  }, [overviewChart.maxValue]);
  const tenantInitials = useMemo(() => {
    const words = tenantAccount.name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "TN";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }, [tenantAccount.name]);
  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId]
  );
  const availabilityProperties = useMemo(() => {
    const byName = /* @__PURE__ */ new Map();
    const normalizeName = (value) => value.trim().toLowerCase();
    const scoreProperty = (item) => (item.rooms?.length ?? 0) * 100 + (item.cityName ? 10 : 0) + (item.province ? 10 : 0) + (item.address ? 1 : 0);
    for (const property of properties) {
      const nameKey = normalizeName(property.name ?? "");
      if (!nameKey) continue;
      const current = byName.get(nameKey);
      if (!current) {
        byName.set(nameKey, property);
        continue;
      }
      if (scoreProperty(property) > scoreProperty(current)) {
        byName.set(nameKey, property);
      }
    }
    return Array.from(byName.values()).sort(
      (a, b) => a.name.localeCompare(b.name, "id-ID")
    );
  }, [properties]);
  const availableRooms = selectedProperty?.rooms ?? [];
  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === selectedRoomId) ?? null,
    [availableRooms, selectedRoomId]
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
    const finalPrice = roomAdjustmentType === "PERCENT" ? basePrice + basePrice * adjustment / 100 : basePrice + adjustment;
    return {
      basePrice,
      finalPrice
    };
  }, [roomActionType, roomAdjustmentType, roomAdjustmentValue, selectedRoom]);
  const fetchProperties = async ({
    mode = "all",
    page = 1,
    limit = 50,
    search,
    sortBy: sortBy2 = "createdAt",
    sortOrder = "desc"
  } = {}) => {
    try {
      setPropertiesLoading(true);
      setPropertiesError(null);
      if (mode === "page") {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(limit)
        });
        const response = await fetchJson(
          `/properties?${query.toString()}`
        );
        setProperties(mapTenantProperties(response.data ?? []));
        setPropertyReportMeta({
          page: response.meta?.page ?? page,
          limit: response.meta?.limit ?? limit,
          total: response.meta?.total ?? 0,
          totalPages: Math.max(1, response.meta?.totalPages ?? 1),
          hasNext: Boolean(response.meta?.hasNext),
          hasPrev: Boolean(response.meta?.hasPrev)
        });
        return;
      }
      if (mode === "management") {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          sortBy: sortBy2,
          sortOrder
        });
        const keyword = search?.trim() ?? "";
        if (keyword) {
          query.set("search", keyword);
        }
        const response = await fetchJson(
          `/properties?${query.toString()}`
        );
        setProperties(mapTenantProperties(response.data ?? []));
        setPropertyListMeta({
          page: response.meta?.page ?? page,
          limit: response.meta?.limit ?? limit,
          total: response.meta?.total ?? 0,
          totalPages: Math.max(1, response.meta?.totalPages ?? 1),
          hasNext: Boolean(response.meta?.hasNext),
          hasPrev: Boolean(response.meta?.hasPrev),
          search: response.meta?.search ?? (keyword || null),
          sortBy: response.meta?.sortBy ?? sortBy2,
          sortOrder: response.meta?.sortOrder ?? sortOrder
        });
        return;
      }
      let currentPage = 1;
      let totalPages = 1;
      const aggregated = [];
      do {
        const query = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit)
        });
        const response = await fetchJson(
          `/properties?${query.toString()}`
        );
        aggregated.push(...response.data ?? []);
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
        hasPrev: false
      });
      setPropertyListMeta(defaultPropertyListMeta);
    } catch (err) {
      setPropertiesError(
        err instanceof Error ? err.message : tenantCopy.failedLoadProperty
      );
      setProperties([]);
      if (mode === "management") {
        setPropertyListMeta((prev) => ({
          ...prev,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }));
      } else {
        setPropertyReportMeta((prev) => ({
          ...prev,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }));
      }
    } finally {
      setPropertiesLoading(false);
    }
  };
  const loadCatalogCategories = async () => {
    try {
      setCategoriesLoading(true), setCategoriesError(null);
      const response = await fetchJson("/catalog/categories?limit=50&page=1&sortBy=name&sortOrder=asc");
      setCatalogCategories(Array.isArray(response) ? response : response.data ?? []);
    } catch (err) {
      setCategoriesError(asErrorMessage(err, "Gagal memuat kategori properti."));
      setCatalogCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };
  const handleCreateCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return setCategoryCreateError("Nama kategori wajib diisi.");
    setCategoryCreateError(null), setCategoryCreateFeedback(null);
    setTenantActionConfirm({ title: "Konfirmasi Tambah Kategori", description: `Tambah kategori baru "${name}" sekarang?`, confirmLabel: "Tambah", payload: { type: "create-category", name } });
  };
  const handleStartEditCategory = (category) => {
    setCategoryCreateError(null);
    setCategoryCreateFeedback(null);
    setEditingCategoryId(category.id);
    setCategoryNameDrafts((prev) => ({
      ...prev,
      [category.id]: prev[category.id] ?? category.name
    }));
  };
  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
  };
  const handleSubmitEditCategory = (category) => {
    const nextName = (categoryNameDrafts[category.id] ?? "").trim();
    if (!nextName) return setCategoryCreateError("Nama kategori wajib diisi.");
    setCategoryCreateError(null), setCategoryCreateFeedback(null);
    setTenantActionConfirm({ title: "Konfirmasi Perbarui Kategori", description: `Ubah nama kategori "${category.name}" menjadi "${nextName}"?`, confirmLabel: "Perbarui", payload: { type: "update-category", id: category.id, name: nextName } });
  };
  const handleDeleteCategory = (category) => {
    setCategoryCreateError(null);
    setCategoryCreateFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Hapus Kategori",
      description: `Hapus kategori "${category.name}"? Properti lama tetap aman, tapi kategori ini tidak bisa dipakai lagi.`,
      confirmLabel: "Hapus",
      payload: {
        type: "delete-category",
        id: category.id,
        name: category.name
      }
    });
  };
  const handleDeleteProperty = (propertyId, propertyName) => {
    setPropertyActionError(null);
    setPropertyActionFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Hapus Properti",
      description: `Hapus properti "${propertyName}"? Semua data kamar di properti ini akan ikut terhapus.`,
      confirmLabel: "Hapus Properti",
      payload: {
        type: "delete-property",
        id: propertyId,
        name: propertyName
      }
    });
  };
  const loadAvailability = async () => {
    if (!selectedRoomId) return setAvailabilityError(tenantCopy.selectRoomFirst);
    if (!availabilityQuery.startDate || !availabilityQuery.endDate) return setAvailabilityError(tenantCopy.fillDateRange);
    try {
      setAvailabilityLoading(true), setAvailabilityError(null);
      const query = new URLSearchParams({ startDate: availabilityQuery.startDate, endDate: availabilityQuery.endDate });
      const data = await fetchJson(`/availability/room-types/${selectedRoomId}?${query.toString()}`);
      setAvailabilityData(data);
      setSelectedCalendarDates((prev) => prev.filter((date) => data.items.some((item) => item.date === date)));
    } catch (err) {
      setAvailabilityData(null), setAvailabilityError(asErrorMessage(err, tenantCopy.failedLoadCalendar));
    } finally {
      setAvailabilityLoading(false);
    }
  };
  const loadRateRules = async () => {
    try {
      setRateRulesLoading(true), setRateRulesError(null);
      const response = await fetchJson(resolveRateRulesPath(selectedRoomId, selectedPropertyId));
      const rows = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
      setRateRules(rows);
    } catch (err) {
      setRateRulesError(asErrorMessage(err, tenantCopy.failedLoadRateRule));
      setRateRules([]);
    } finally {
      setRateRulesLoading(false);
    }
  };
  const toggleCalendarDate = (dateValue) => {
    setSelectedCalendarDates(
      (prev) => prev.includes(dateValue) ? prev.filter((item) => item !== dateValue) : [...prev, dateValue]
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
    if (!selectedRoomId || !roomActionConfirm) return setRoomActionError(tenantCopy.roomActionNotReady);
    try {
      setRoomActionLoading(true), setRoomActionError(null), setRoomActionSuccess(null);
      await fetchJson(`/availability/room-types/${selectedRoomId}`, { method: "PUT", body: JSON.stringify(roomActionConfirm.payload) });
      setRoomActionSuccess(roomActionConfirm.successMessage), setRoomActionConfirm(null);
      await Promise.all([loadAvailability(), loadRateRules()]);
    } catch (err) {
      const message = err instanceof Error ? normalizeTenantActionError(err.message) : tenantCopy.applyRoomFailed;
      setRoomActionError(message);
    } finally {
      setRoomActionLoading(false);
    }
  };
  const handleCancelRoomActionConfirm = () => {
    if (roomActionLoading) return;
    setRoomActionConfirm(null);
  };
  const resolveRoomActionBase = () => {
    if (!selectedRoomId) return setRoomActionError(tenantCopy.selectRoomFirst), null;
    if (selectedCalendarDates.length === 0) return setRoomActionError("Pilih minimal satu tanggal pada kalender."), null;
    const parsedUnits = parsePositiveIntInput(roomActionUnits);
    if (roomActionUnits.trim() && Number.isNaN(parsedUnits)) return setRoomActionError("Jumlah unit wajib angka bulat dan harus lebih dari 0."), null;
    return { sortedDates: [...selectedCalendarDates].sort(), parsedUnits };
  };
  const findInsufficientCloseDate = (dates, units) => {
    const selectedDatesSet = new Set(dates);
    return availabilityData?.items.find((item) => selectedDatesSet.has(item.date) && units > item.availableUnits) ?? null;
  };
  const resolveRoomActionUnitError = (dates, parsedUnits) => {
    if (parsedUnits === null) return null;
    if (selectedRoom && parsedUnits > selectedRoom.totalUnits) return `Jumlah unit melebihi total kamar (${selectedRoom.totalUnits} unit).`;
    const insufficientDate = roomActionType === "close" ? findInsufficientCloseDate(dates, parsedUnits) : null;
    return insufficientDate ? `Jumlah kamar yang ditutup (${parsedUnits} unit) melebihi stok tanggal ${insufficientDate.date} (${insufficientDate.availableUnits} unit).` : null;
  };
  const buildRoomActionConfirmState = (dates, parsedUnits) => {
    const payload = { dates, isClosed: roomActionType === "close" };
    if (roomActionType === "open" && parsedUnits !== null) payload.availableUnits = parsedUnits;
    if (roomActionType === "close" && parsedUnits !== null) payload.closeUnits = parsedUnits;
    const successMessage = roomActionType === "close" ? parsedUnits !== null ? `${parsedUnits} unit pada tanggal terpilih berhasil ditutup.` : "Tanggal terpilih berhasil ditutup." : parsedUnits !== null ? `Tanggal terpilih berhasil dibuka dengan ${parsedUnits} unit tersedia.` : "Tanggal terpilih berhasil dibuka.";
    const description = roomActionType === "close" ? parsedUnits !== null ? `Anda akan menutup ${parsedUnits} unit untuk ${dates.length} tanggal yang dipilih. Lanjutkan?` : `Anda akan menutup kamar untuk ${dates.length} tanggal yang dipilih. Lanjutkan?` : parsedUnits !== null ? `Anda akan membuka kamar dengan ${parsedUnits} unit tersedia untuk ${dates.length} tanggal yang dipilih. Lanjutkan?` : `Anda akan membuka kamar untuk ${dates.length} tanggal yang dipilih. Lanjutkan?`;
    return { title: roomActionType === "close" ? "Konfirmasi Tutup Kamar" : "Konfirmasi Buka Kamar", description, payload, successMessage };
  };
  const applyRoomRateAdjustment = async (dates) => {
    if (!roomAdjustmentValue.trim()) return "Nilai penyesuaian harga wajib diisi.";
    await fetchJson("/availability/rate-rules", { method: "POST", body: JSON.stringify({ name: `Rule ${dates[0]}${dates.length > 1 ? ` - ${dates[dates.length - 1]}` : ""}`, scope: "ROOM_TYPE", roomTypeId: selectedRoomId, adjustmentType: roomAdjustmentType, adjustmentValue: roomAdjustmentValue, isActive: true, dates }) });
    setRoomActionSuccess("Penyesuaian harga berhasil diterapkan.");
    return null;
  };
  const handleRoomActionApply = async () => {
    const base = resolveRoomActionBase();
    if (!base) return;
    try {
      setRoomActionLoading(true), setRoomActionError(null), setRoomActionSuccess(null);
      if (roomActionType === "close" || roomActionType === "open") {
        const unitError = resolveRoomActionUnitError(base.sortedDates, base.parsedUnits);
        if (unitError) return setRoomActionError(unitError);
        setRoomActionConfirm(buildRoomActionConfirmState(base.sortedDates, base.parsedUnits));
        return;
      }
      const rateError = await applyRoomRateAdjustment(base.sortedDates);
      if (rateError) return setRoomActionError(rateError);
      await Promise.all([loadAvailability(), loadRateRules()]);
    } catch (err) {
      setRoomActionError(err instanceof Error ? normalizeTenantActionError(err.message) : tenantCopy.applyRoomFailed);
    } finally {
      setRoomActionLoading(false);
    }
  };
  const applyRoomSidebarChanges = () => {
    if (!selectedRoomId) return setRoomActionError(tenantCopy.selectRoomFirst);
    if (selectedCalendarDates.length === 0) return setRoomActionError("Pilih minimal satu tanggal pada kalender.");
    const sortedDates = [...selectedCalendarDates].sort();
    const actionLabel = roomAvailabilityMode === "blocked" ? "menutup" : "membuka";
    const hasRateAdjustment = roomAdjustmentValue.trim().length > 0;
    setRoomActionError(null), setRoomActionSuccess(null);
    setTenantActionConfirm({ title: "Konfirmasi Perubahan Kamar", description: hasRateAdjustment ? `Anda akan ${actionLabel} kamar di ${sortedDates.length} tanggal sekaligus menerapkan penyesuaian harga. Lanjutkan?` : `Anda akan ${actionLabel} kamar di ${sortedDates.length} tanggal terpilih. Lanjutkan?`, confirmLabel: "Terapkan", payload: { type: "apply-room-sidebar", roomTypeId: selectedRoomId, dates: sortedDates, shouldBlock: roomAvailabilityMode === "blocked", adjustmentType: roomAdjustmentType, adjustmentValue: roomAdjustmentValue.trim() } });
  };
  const handleDeleteRateRule = (id) => {
    const rule = rateRules.find((item) => item.id === id);
    setRateRulesError(null);
    setTenantActionConfirm({
      title: "Konfirmasi Hapus Aturan Harga",
      description: `Hapus aturan harga "${rule?.name ?? id}"?`,
      confirmLabel: "Hapus",
      payload: {
        type: "delete-rate-rule",
        id
      }
    });
  };
  const shiftAvailabilityMonth = (delta) => {
    const base = availabilityQuery.startDate ? /* @__PURE__ */ new Date(`${availabilityQuery.startDate}T00:00:00`) : /* @__PURE__ */ new Date();
    const monthStart = new Date(base.getFullYear(), base.getMonth() + delta, 1);
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0
    );
    setAvailabilityQuery({
      startDate: formatDateInput(monthStart),
      endDate: formatDateInput(monthEnd)
    });
  };
  const fetchTenantPaymentProofs = async (params) => {
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
    return fetchJson(
      `/bookings/tenant/payment-proofs?${query.toString()}`
    );
  };
  const loadHeaderNotifications = async () => {
    try {
      setNotificationLoading(true), setNotificationError(null);
      const q = new URLSearchParams({ page: "1", limit: "1", replied: "false" }).toString();
      const [transactionResult, pendingReviewResult] = await Promise.all([toAsyncResult(fetchTenantPaymentProofs({ bookingStatus: "MENUNGGU_PEMBAYARAN", sortBy: "submittedAt", sortOrder: "desc", page: 1, limit: 1 })), toAsyncResult(fetchJson(`/bookings/tenant/reviews?${q}`))]);
      setPendingTransactionNotifications(transactionResult.ok ? getPagedTotal(transactionResult.data) : 0), setPendingReviewNotifications(pendingReviewResult.ok ? getPagedTotal(pendingReviewResult.data) : 0);
      if (!transactionResult.ok || !pendingReviewResult.ok) setNotificationError("Sebagian notifikasi belum lengkap. Coba muat ulang beberapa saat lagi.");
    } catch (err) {
      setNotificationError(asErrorMessage(err, "Gagal memuat notifikasi tenant."));
    } finally {
      setNotificationLoading(false);
    }
  };
  const openOrderNotifications = () => {
    setActive("order-management");
    setStatusFilter("MENUNGGU_PEMBAYARAN");
    setTransactionPage(1);
    setIsNotificationOpen(false);
  };
  const openReviewNotifications = () => {
    setActive("customer-relations");
    setReviewRepliedFilter("false");
    setReviewPage(1);
    setIsNotificationOpen(false);
  };
  const getDefaultTenantPaymentMeta = () => ({
    ...defaultTenantPaymentProofMeta,
    page: transactionPage,
    limit: transactionLimit,
    sortBy: transactionSortBy,
    sortOrder: transactionSortOrder
  });
  const loadTenantPaymentProofs = async () => {
    try {
      setTenantPaymentProofsLoading(true), setTenantPaymentProofsError(null);
      const response = await fetchTenantPaymentProofs({ bookingStatus: statusFilter === "ALL" ? void 0 : statusFilter, keyword: transactionSearch.trim() || void 0, sortBy: transactionSortBy, sortOrder: transactionSortOrder, page: transactionPage, limit: transactionLimit });
      setTenantPaymentProofs(response.data ?? []);
      setTenantPaymentProofMeta(response.meta ?? getDefaultTenantPaymentMeta());
    } catch (err) {
      setTenantPaymentProofsError(asErrorMessage(err, "Gagal memuat bukti pembayaran."));
      setTenantPaymentProofs([]), setTenantPaymentProofMeta(getDefaultTenantPaymentMeta());
    } finally {
      setTenantPaymentProofsLoading(false);
    }
  };
  const loadOverviewData = async () => {
    try {
      setOverviewLoading(true), setOverviewError(null), setOverviewNotice(null);
      const reviewQuery = new URLSearchParams({ page: "1", limit: "1" }).toString(), pendingQuery = new URLSearchParams({ page: "1", limit: "1", replied: "false" }).toString();
      const [proofResult, reviewResult, pendingReviewResult] = await Promise.all([toAsyncResult(fetchTenantPaymentProofs({ sortBy: "submittedAt", sortOrder: "desc", page: 1, limit: 100 })), toAsyncResult(fetchJson(`/bookings/tenant/reviews?${reviewQuery}`)), toAsyncResult(fetchJson(`/bookings/tenant/reviews?${pendingQuery}`))]);
      if (!proofResult.ok) throw proofResult.error instanceof Error ? proofResult.error : new Error("Data payment proof gagal dimuat.");
      setOverviewPaymentProofs(proofResult.data.data ?? []), setOverviewReviewsTotal(reviewResult.ok ? getPagedTotal(reviewResult.data) : 0), setOverviewPendingReviews(pendingReviewResult.ok ? getPagedTotal(pendingReviewResult.data) : 0);
      if (!reviewResult.ok || !pendingReviewResult.ok) setOverviewNotice("Sebagian data ringkasan belum lengkap. Coba muat ulang setelah backend siap.");
    } catch (err) {
      setOverviewError(asErrorMessage(err, "Gagal memuat ringkasan dashboard."));
      setOverviewPaymentProofs([]), setOverviewReviewsTotal(0), setOverviewPendingReviews(0), setOverviewNotice(null);
    } finally {
      setOverviewLoading(false);
    }
  };
  const applySalesFallbackFromOverview = () => {
    const result = buildSalesFallbackFromOverview({ overviewOrders, dateRange, transactionSearch, salesSortOrder, sortBy, salesView, salesLimit, salesPage, toTimestamp });
    if (!result) return false;
    setSalesMeta(result.salesMeta), setSalesTransactionRows(result.salesTransactionRows), setSalesPropertyRows(result.salesPropertyRows);
    setSalesUserRows(result.salesUserRows), setSalesSummary(result.salesSummary), setSalesTrendData(result.salesTrendData);
    return true;
  };
  const resetSalesRows = () => {
    setSalesTransactionRows([]), setSalesPropertyRows([]), setSalesUserRows([]);
    setSalesSummary(defaultSalesSummary), setSalesTrendData([]);
  };
  const buildSalesReportQuery = () => {
    const query = new URLSearchParams({ view: salesView, sortBy, sortOrder: salesSortOrder, page: String(salesPage), limit: String(salesLimit) });
    if (dateRange.from) query.set("startDate", dateRange.from);
    if (dateRange.to) query.set("endDate", dateRange.to);
    const keyword = transactionSearch.trim();
    if (keyword) query.set("keyword", keyword);
    return query.toString();
  };
  const normalizeNetPayoutRows = (rows) => rows.map((row) => ({ ...row, netPayout: Number.isFinite(row.netPayout) ? row.netPayout : 0 }));
  const applySalesRowsByView = (rows) => salesView === "transaction" ? (setSalesTransactionRows(rows), setSalesPropertyRows([]), setSalesUserRows([])) : salesView === "property" ? (setSalesPropertyRows(normalizeNetPayoutRows(rows)), setSalesTransactionRows([]), setSalesUserRows([])) : (setSalesUserRows(normalizeNetPayoutRows(rows)), setSalesTransactionRows([]), setSalesPropertyRows([]));
  const applySalesResponse = (response) => {
    setSalesSummary({ ...defaultSalesSummary, ...response.summary ?? {} });
    setSalesTrendData(Array.isArray(response.trend) ? response.trend : []);
    setSalesMeta({ ...defaultSalesMeta, ...response.meta ?? {} });
    applySalesRowsByView(response.data ?? []);
  };
  const loadSalesReport = async () => {
    if (salesDateRangeInvalid) return setSalesError("Rentang tanggal tidak valid. Tanggal mulai harus sebelum tanggal akhir."), resetSalesRows();
    try {
      setSalesLoading(true), setSalesError(null);
      applySalesResponse(await fetchJson(`/bookings/tenant/reports/sales?${buildSalesReportQuery()}`));
    } catch (err) {
      const message = asErrorMessage(err, "Gagal memuat laporan penjualan.");
      if (applySalesFallbackFromOverview()) setSalesError(`${message} Menampilkan data fallback dari payment proof.`);
      else setSalesError(message), resetSalesRows();
    } finally {
      setSalesLoading(false);
    }
  };
  const buildPropertyRatingSummary = (reviews) => {
    const summaryMap = /* @__PURE__ */ new Map();
    reviews.forEach((review) => {
      const propertyId = review.booking?.property?.id;
      if (!propertyId) return;
      const previous = summaryMap.get(propertyId) ?? { total: 0, count: 0 };
      summaryMap.set(propertyId, {
        total: previous.total + Number(review.rating || 0),
        count: previous.count + 1
      });
    });
    return Object.fromEntries(
      Array.from(summaryMap.entries()).map(([propertyId, value]) => [
        propertyId,
        {
          average: value.count > 0 ? Number((value.total / value.count).toFixed(1)) : 0,
          count: value.count
        }
      ])
    );
  };
  const fetchAllTenantReviews = async () => {
    const allRows = [];
    for (let page = 1, totalPages = 1; page <= totalPages; page += 1) {
      const query = new URLSearchParams({ page: String(page), limit: "100" });
      const response = await fetchJson(`/bookings/tenant/reviews?${query.toString()}`);
      allRows.push(...response.data ?? []);
      totalPages = Math.max(1, response.meta?.totalPages ?? 1);
    }
    return allRows;
  };
  const loadPropertyRatings = async () => {
    try {
      const allReviews = await fetchAllTenantReviews();
      setPropertyRatingSummaryByPropertyId(buildPropertyRatingSummary(allReviews));
    } catch {
      setPropertyRatingSummaryByPropertyId({});
    }
  };
  const buildTenantReviewQuery = () => {
    const query = new URLSearchParams({ page: String(reviewPage), limit: String(reviewLimit), sortBy: reviewSortBy, sortOrder: reviewSortOrder });
    if (reviewRepliedFilter !== "all") query.set("replied", reviewRepliedFilter);
    const keyword = reviewSearch.trim();
    if (keyword) query.set("keyword", keyword);
    return { query, keyword };
  };
  const loadTenantReviews = async () => {
    try {
      setTenantReviewsLoading(true), setTenantReviewsError(null);
      const { query, keyword } = buildTenantReviewQuery();
      const response = await fetchJson(`/bookings/tenant/reviews?${query.toString()}`);
      setTenantReviews(response.data ?? []);
      setTenantReviewsMeta({ page: response.meta?.page ?? reviewPage, limit: response.meta?.limit ?? reviewLimit, total: response.meta?.total ?? 0, totalPages: Math.max(1, response.meta?.totalPages ?? 1), replied: response.meta?.replied ?? null, keyword: response.meta?.keyword ?? (keyword || null), rating: response.meta?.rating ?? null, sortBy: response.meta?.sortBy ?? reviewSortBy, sortOrder: response.meta?.sortOrder ?? reviewSortOrder });
    } catch (err) {
      setTenantReviewsError(asErrorMessage(err, "Gagal memuat ulasan pengguna."));
      setTenantReviews([]), setTenantReviewsMeta((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    } finally {
      setTenantReviewsLoading(false);
    }
  };
  const handlePaymentProofReview = (paymentProofId, action) => {
    const actionLabel = action === "approve" ? "Setujui" : "Tolak";
    setPaymentActionError(null);
    setPaymentActionFeedback(null);
    setTenantActionConfirm({
      title: `Konfirmasi ${actionLabel} Pembayaran`,
      description: action === "approve" ? "Setujui bukti pembayaran ini dan lanjutkan proses pemesanan?" : "Tolak bukti pembayaran ini sekarang?",
      confirmLabel: actionLabel,
      payload: {
        type: "payment-proof-review",
        paymentProofId,
        action
      }
    });
  };
  const handleCancelOrderByTenant = (bookingId, orderNo) => {
    setPaymentActionError(null);
    setPaymentActionFeedback(null);
    setTenantActionConfirm({
      title: "Konfirmasi Batalkan Pesanan",
      description: `Batalkan pesanan ${orderNo}? Pesanan ini hanya bisa dibatalkan sebelum penyewa mengunggah bukti pembayaran.`,
      confirmLabel: "Batalkan",
      payload: {
        type: "cancel-order",
        bookingId,
        orderNo
      }
    });
  };
  const handleSubmitReply = (reviewId) => {
    const draft = reviewDrafts[reviewId]?.trim() ?? "";
    if (!draft) return setTenantReviewsError("Balasan ulasan tidak boleh kosong.");
    setTenantReviewsError(null), setReviewReplyFeedback(null);
    setTenantActionConfirm({ title: "Konfirmasi Kirim Balasan", description: "Kirim balasan ulasan ini sekarang?", confirmLabel: "Kirim", payload: { type: "submit-review-reply", reviewId, draft } });
  };
  const handleCancelTenantActionConfirm = () => {
    if (tenantActionConfirmLoading) return;
    setTenantActionConfirm(null);
  };
  const runTenantActionByPayload = async (payload, approvalHeaders) => {
    switch (payload.type) {
      case "create-category": {
        setCategoryCreateLoading(true);
        setCategoryCreateError(null);
        setCategoryCreateFeedback(null);
        const created = await fetchJson("/catalog/categories", {
          method: "POST",
          body: JSON.stringify({ name: payload.name })
        });
        setCatalogCategories((prev) => {
          const map = new Map(prev.map((item) => [item.id, item]));
          map.set(created.id, created);
          return Array.from(map.values()).sort(
            (a, b) => a.name.localeCompare(b.name, "id-ID")
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
        const updated = await fetchJson(`/catalog/categories/${payload.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: payload.name })
        });
        setCatalogCategories(
          (prev) => prev.map((item) => item.id === updated.id ? { ...item, name: updated.name } : item).sort((a, b) => a.name.localeCompare(b.name, "id-ID"))
        );
        setEditingCategoryId(null);
        setCategoryCreateFeedback("Kategori berhasil diperbarui.");
        break;
      }
      case "delete-category": {
        setCategoryCreateLoading(true);
        setCategoryCreateError(null);
        setCategoryCreateFeedback(null);
        await fetchJson(`/catalog/categories/${payload.id}`, {
          method: "DELETE",
          headers: approvalHeaders
        });
        setCatalogCategories((prev) => prev.filter((item) => item.id !== payload.id));
        setEditingCategoryId((prev) => prev === payload.id ? null : prev);
        setCategoryCreateFeedback("Kategori berhasil dihapus.");
        break;
      }
      case "delete-property": {
        setPropertyDeleteLoadingId(payload.id);
        setPropertyActionError(null);
        setPropertyActionFeedback(null);
        const result = await fetchJson(`/properties/${payload.id}`, {
          method: "DELETE",
          headers: approvalHeaders
        });
        if (active === "property-management") {
          await fetchProperties({
            mode: "management",
            page: propertyListPage,
            limit: propertyListLimit,
            search: propertySearch,
            sortBy: propertySortBy,
            sortOrder: propertySortOrder
          });
        } else {
          await fetchProperties({ mode: "all", limit: 50 });
        }
        await loadPropertyRatings();
        if (selectedPropertyId === payload.id) {
          setSelectedPropertyId("");
          setSelectedRoomId("");
        }
        setPropertyActionFeedback(result.message ?? `Properti "${payload.name}" berhasil dihapus.`);
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
            isClosed: payload.shouldBlock
          })
        });
        if (payload.adjustmentValue) {
          await fetchJson("/availability/rate-rules", {
            method: "POST",
            body: JSON.stringify({
              name: `Rule ${payload.dates[0]}${payload.dates.length > 1 ? ` - ${payload.dates[payload.dates.length - 1]}` : ""}`,
              scope: "ROOM_TYPE",
              roomTypeId: payload.roomTypeId,
              adjustmentType: payload.adjustmentType,
              adjustmentValue: payload.adjustmentValue,
              isActive: true,
              dates: payload.dates
            })
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
          headers: approvalHeaders
        });
        await loadRateRules();
        break;
      }
      case "payment-proof-review": {
        setPaymentActionLoadingId(payload.paymentProofId);
        setPaymentActionError(null);
        setPaymentActionFeedback(null);
        const notes = (paymentDecisionNotes[payload.paymentProofId] ?? "").trim();
        await fetchJson(`/bookings/tenant/payment-proofs/${payload.paymentProofId}/${payload.action}`, {
          method: "POST",
          headers: approvalHeaders,
          body: JSON.stringify(notes ? { notes } : {})
        });
        setPaymentActionFeedback(
          payload.action === "approve" ? "Bukti pembayaran berhasil disetujui." : "Bukti pembayaran berhasil ditolak."
        );
        setPaymentDecisionNotes((prev) => ({
          ...prev,
          [payload.paymentProofId]: ""
        }));
        await loadTenantPaymentProofs();
        await loadHeaderNotifications();
        break;
      }
      case "cancel-order": {
        setPaymentActionLoadingId(payload.bookingId);
        setPaymentActionError(null);
        setPaymentActionFeedback(null);
        const result = await fetchJson(`/bookings/tenant/${payload.bookingId}/cancel`, {
          method: "POST",
          headers: approvalHeaders
        });
        setPaymentActionFeedback(result.message ?? `Pesanan ${payload.orderNo} berhasil dibatalkan.`);
        await loadTenantPaymentProofs();
        await loadHeaderNotifications();
        break;
      }
      case "submit-review-reply": {
        setReviewReplyLoadingId(payload.reviewId);
        setTenantReviewsError(null);
        setReviewReplyFeedback(null);
        const result = await fetchJson(`/bookings/tenant/reviews/${payload.reviewId}/reply`, {
          method: "POST",
          body: JSON.stringify({ reply: payload.draft })
        });
        setReviewDrafts((prev) => ({
          ...prev,
          [payload.reviewId]: ""
        }));
        setReviewReplyFeedback(result.message ?? "Balasan ulasan berhasil dikirim.");
        await loadTenantReviews();
        await loadHeaderNotifications();
        break;
      }
      default:
        break;
    }
  };
  const setTenantActionErrorState = (payload, errorMessage) => {
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
      case "delete-property":
        setPropertyActionError(errorMessage ?? `Gagal menghapus properti "${payload.name}".`);
        break;
      case "apply-room-sidebar":
        setRoomActionError(errorMessage ?? tenantCopy.applyRoomFailed);
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
  };
  const finalizeTenantActionState = (payload) => {
    const handler = {
      "create-category": () => setCategoryCreateLoading(false),
      "update-category": () => setCategoryCreateLoading(false),
      "delete-category": () => setCategoryCreateLoading(false),
      "delete-property": () => setPropertyDeleteLoadingId(null),
      "apply-room-sidebar": () => setRoomActionLoading(false),
      "delete-rate-rule": () => setRateRulesLoading(false),
      "payment-proof-review": () => setPaymentActionLoadingId(null),
      "cancel-order": () => setPaymentActionLoadingId(null),
      "submit-review-reply": () => setReviewReplyLoadingId(null)
    };
    handler[payload.type]?.();
  };
  const handleConfirmTenantAction = async () => {
    if (!tenantActionConfirm) return;
    const { payload } = tenantActionConfirm;
    try {
      setTenantActionConfirmLoading(true);
      await runTenantActionByPayload(payload, { "x-user-approval": "true" });
      setTenantActionConfirm(null);
    } catch (err) {
      setTenantActionErrorState(payload, err instanceof Error ? normalizeTenantActionError(err.message) : null);
      setTenantActionConfirm(null);
    } finally {
      finalizeTenantActionState(payload);
      setTenantActionConfirmLoading(false);
    }
  };
  useEffect(() => {
    if (active === "sales-report" && reportTab === "property") {
      fetchProperties({
        mode: "page",
        page: propertyReportPage,
        limit: propertyReportLimit
      });
      return;
    }
    if (active === "property-management") {
      fetchProperties({
        mode: "management",
        page: propertyListPage,
        limit: propertyListLimit,
        search: propertySearch,
        sortBy: propertySortBy,
        sortOrder: propertySortOrder
      });
      return;
    }
    if (active === "room-management" || active === "property-category" || active === "dashboard-overview") {
      fetchProperties({ mode: "all", limit: 50 });
    }
  }, [
    active,
    propertyReportPage,
    propertyReportLimit,
    reportTab,
    propertyListPage,
    propertyListLimit,
    propertySearch,
    propertySortBy,
    propertySortOrder
  ]);
  useEffect(() => {
    setPropertyListPage(1);
  }, [propertySearch, propertyListLimit, propertySortBy, propertySortOrder]);
  useEffect(() => {
    if (active !== "property-management") return;
    if (properties.length === 0) return;
    void loadPropertyRatings();
  }, [active, properties]);
  useEffect(() => {
    if (availabilityProperties.length === 0) {
      setSelectedPropertyId("");
      setSelectedRoomId("");
      return;
    }
    const propertyExists = availabilityProperties.some(
      (property) => property.id === selectedPropertyId
    );
    if (!propertyExists) {
      setSelectedPropertyId(availabilityProperties[0].id);
    }
  }, [availabilityProperties, selectedPropertyId]);
  useEffect(() => {
    if (!selectedProperty) return;
    if (selectedProperty.rooms.length === 0) {
      setSelectedRoomId("");
      return;
    }
    const exists = selectedProperty.rooms.some(
      (room) => room.id === selectedRoomId
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
    transactionSortOrder
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
    transactionSortOrder
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
    salesLimit
  ]);
  useEffect(() => {
    setReviewPage(1);
  }, [
    reviewSearch,
    reviewRepliedFilter,
    reviewSortBy,
    reviewSortOrder,
    reviewLimit
  ]);
  useEffect(() => {
    if (active !== "customer-relations") return;
    loadTenantReviews();
  }, [
    active,
    reviewPage,
    reviewLimit,
    reviewSearch,
    reviewRepliedFilter,
    reviewSortBy,
    reviewSortOrder
  ]);
  useEffect(() => {
    void loadHeaderNotifications();
    const timerId = window.setInterval(() => {
      void loadHeaderNotifications();
    }, 45e3);
    return () => {
      window.clearInterval(timerId);
    };
  }, []);
  useEffect(() => {
    if (!isNotificationOpen) return;
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (notificationPanelRef.current?.contains(target)) return;
      setIsNotificationOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationOpen]);
  useEffect(() => {
    setPropertyReportPage(1);
  }, [propertyReportLimit]);
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsNotificationOpen(false);
    void loadHeaderNotifications();
  }, [active]);
  useEffect(() => {
    if (active !== "room-management" && !(active === "sales-report" && reportTab === "property")) {
      return;
    }
    if (availabilityQuery.startDate && availabilityQuery.endDate) return;
    const today = /* @__PURE__ */ new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setAvailabilityQuery({
      startDate: formatDateInput(monthStart),
      endDate: formatDateInput(monthEnd)
    });
  }, [active, availabilityQuery.startDate, availabilityQuery.endDate, reportTab]);
  useEffect(() => {
    if (active !== "room-management" && !(active === "sales-report" && reportTab === "property")) {
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
    reportTab
  ]);
  useEffect(() => {
    setSelectedCalendarDates([]);
    setRoomActionError(null);
    setRoomActionSuccess(null);
    setRoomActionConfirm(null);
  }, [selectedRoomId]);
  return /* @__PURE__ */ jsxs("div", { className: "tenant-dashboard-shell min-h-screen bg-transparent text-slate-900", children: [
    isSidebarOpen ? /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-30 bg-slate-900/45 lg:hidden",
        onClick: () => setIsSidebarOpen(false)
      }
    ) : null,
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: `fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white/90 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.55)] backdrop-blur transition-all duration-300 ${isSidebarCollapsed ? "w-64 lg:w-20" : "w-64"} ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex h-16 items-center justify-between border-b border-slate-200 px-4", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: `flex items-center gap-2 ${isSidebarCollapsed ? "lg:w-full lg:justify-center" : ""}`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-cyan-700 to-teal-700 text-xs font-bold text-white", children: "BI" }),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `font-display text-lg font-semibold text-slate-900 ${isSidebarCollapsed ? "lg:hidden" : ""}`,
                      children: "BookIn"
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsSidebarOpen(false),
                className: "flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-800 lg:hidden",
                "aria-label": "Tutup menu",
                children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M6 6L18 18M6 18L18 6", strokeWidth: "2", strokeLinecap: "round" }) })
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsSidebarCollapsed((prev) => !prev),
              className: "absolute -right-3 top-7 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-600 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-800 lg:flex",
              "aria-label": "Buka atau tutup sidebar",
              children: isSidebarCollapsed ? ">" : "<"
            }
          ),
          /* @__PURE__ */ jsx("nav", { className: "flex-1 overflow-y-auto px-3 py-4", children: navGroups.map((group) => /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
            !isSidebarCollapsed ? /* @__PURE__ */ jsx("p", { className: "mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400", children: group.title }) : null,
            /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: group.items.map((item) => {
              const isItemActive = active === item.key || active === "property-category" && item.key === "property-management" || active === "room-management" && item.key === "property-management";
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setActive(item.key);
                    if (item.key === "sales-report") {
                      setReportTab("sales");
                    }
                  },
                  className: `group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${isItemActive ? BUTTON_THEME.softActive : "text-slate-600 hover:bg-cyan-50 hover:text-cyan-900"} ${isSidebarCollapsed ? "justify-center lg:px-2" : ""}`,
                  title: isSidebarCollapsed ? item.label : void 0,
                  children: [
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${isItemActive ? BUTTON_THEME.softActiveEmphasis : "bg-slate-100 text-slate-500 group-hover:bg-cyan-100 group-hover:text-cyan-800"}`,
                        children: renderNavIcon(item.key)
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: isSidebarCollapsed ? "lg:hidden" : "", children: item.label })
                  ]
                },
                item.key
              );
            }) })
          ] }, group.title)) }),
          /* @__PURE__ */ jsx("div", { className: "border-t border-slate-200 p-3", children: /* @__PURE__ */ jsxs(
            "a",
            {
              href: "/",
              className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-900 ${isSidebarCollapsed ? "justify-center lg:px-2" : ""}`,
              children: [
                /* @__PURE__ */ jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500", children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", children: [
                  /* @__PURE__ */ jsx("path", { d: "M10 6H6.5C5.7 6 5 6.7 5 7.5V16.5C5 17.3 5.7 18 6.5 18H10", strokeWidth: "1.8" }),
                  /* @__PURE__ */ jsx("path", { d: "M14 8L18 12L14 16M18 12H9", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })
                ] }) }),
                /* @__PURE__ */ jsx("span", { className: isSidebarCollapsed ? "lg:hidden" : "", children: "Keluar" })
              ]
            }
          ) })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `min-h-screen transition-[padding] duration-300 ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`,
        children: [
          /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setIsSidebarOpen(true),
                  className: "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-900 lg:hidden",
                  "aria-label": "Buka menu",
                  children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M4 7H20M4 12H20M4 17H20", strokeWidth: "2", strokeLinecap: "round" }) })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "relative hidden sm:block", children: [
                /* @__PURE__ */ jsxs(
                  "svg",
                  {
                    viewBox: "0 0 24 24",
                    className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
                    fill: "none",
                    stroke: "currentColor",
                    children: [
                      /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "7", strokeWidth: "2" }),
                      /* @__PURE__ */ jsx("path", { d: "M20 20L17 17", strokeWidth: "2", strokeLinecap: "round" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: headerSearch,
                    onChange: (event) => setHeaderSearch(event.target.value),
                    placeholder: "Cari menu, properti, atau transaksi",
                    className: `h-10 w-[220px] rounded-lg border border-slate-200 bg-white/90 pl-10 pr-4 text-sm text-slate-600 md:w-[380px] ${INPUT_THEME.focus}`,
                    "aria-label": "Cari menu"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-l border-slate-200 pl-3 sm:gap-4 sm:pl-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative", ref: notificationPanelRef, children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setIsNotificationOpen((prev) => {
                        const next = !prev;
                        if (next) {
                          void loadHeaderNotifications();
                        }
                        return next;
                      });
                    },
                    className: "relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-900",
                    "aria-label": isEnglish ? "Notifications" : "Notifikasi",
                    "aria-expanded": isNotificationOpen,
                    "aria-haspopup": "menu",
                    children: [
                      /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", children: [
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            d: "M12 4a4 4 0 0 0-4 4v2.5c0 .7-.2 1.4-.6 2L6 15h12l-1.4-2.5a4 4 0 0 1-.6-2V8a4 4 0 0 0-4-4Z",
                            strokeWidth: "1.8",
                            strokeLinejoin: "round"
                          }
                        ),
                        /* @__PURE__ */ jsx("path", { d: "M10 18a2 2 0 0 0 4 0", strokeWidth: "1.8", strokeLinecap: "round" })
                      ] }),
                      hasHeaderNotifications ? /* @__PURE__ */ jsx("span", { className: "absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1.5 text-center text-[10px] font-semibold leading-[18px] text-white", children: totalHeaderNotifications > 99 ? "99+" : totalHeaderNotifications }) : null
                    ]
                  }
                ),
                isNotificationOpen ? /* @__PURE__ */ jsxs("div", { className: "absolute right-0 z-30 mt-2 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 px-4 py-3", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-900", children: isEnglish ? "Notifications" : "Notifikasi" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => void loadHeaderNotifications(),
                        className: "text-xs font-medium text-cyan-700 transition hover:text-cyan-900 disabled:opacity-60",
                        disabled: notificationLoading,
                        children: notificationLoading ? isEnglish ? "Refreshing..." : "Memuat..." : isEnglish ? "Refresh" : "Muat ulang"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3", children: [
                    notificationError ? /* @__PURE__ */ jsx("p", { className: "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700", children: notificationError }) : null,
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: openOrderNotifications,
                        className: "flex w-full items-start justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-cyan-300 hover:bg-cyan-50",
                        children: [
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-800", children: isEnglish ? "New transactions" : "Transaksi baru" }),
                            /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: isEnglish ? "Orders waiting for your action." : "Pesanan yang menunggu tindakan Anda." })
                          ] }),
                          /* @__PURE__ */ jsx(
                            "span",
                            {
                              className: `rounded-full px-2 py-0.5 text-xs font-semibold ${pendingTransactionNotifications > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`,
                              children: pendingTransactionNotifications
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: openReviewNotifications,
                        className: "flex w-full items-start justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-cyan-300 hover:bg-cyan-50",
                        children: [
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-800", children: isEnglish ? "Reviews need reply" : "Review perlu dibalas" }),
                            /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: isEnglish ? "User reviews that still need responses." : "Ulasan pengguna yang belum dibalas." })
                          ] }),
                          /* @__PURE__ */ jsx(
                            "span",
                            {
                              className: `rounded-full px-2 py-0.5 text-xs font-semibold ${pendingReviewNotifications > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`,
                              children: pendingReviewNotifications
                            }
                          )
                        ]
                      }
                    ),
                    !hasHeaderNotifications ? /* @__PURE__ */ jsx("p", { className: "px-1 text-xs text-slate-500", children: isEnglish ? "No new notifications at the moment." : "Belum ada notifikasi baru saat ini." }) : null
                  ] })
                ] }) : null
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "hidden text-right sm:block", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-900", children: tenantAccount.name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: tenantAccount.tenantProfile?.companyName ?? "Mitra BookIn" })
              ] }),
              tenantAccount.avatarUrl ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: tenantAccount.avatarUrl,
                  alt: "Tenant Avatar",
                  className: "h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
                }
              ) : /* @__PURE__ */ jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-cyan-700 to-teal-700 text-xs font-bold text-white sm:h-10 sm:w-10", children: tenantInitials })
            ] })
          ] }),
          /* @__PURE__ */ jsx("main", { className: "px-4 py-5 sm:px-6 sm:py-6", children: /* @__PURE__ */ jsxs("section", { className: "mx-auto w-full max-w-[1240px]", children: [
            active === "dashboard-overview" ? /* @__PURE__ */ jsx(
              TenantDashboardOverviewSection,
              {
                overviewLoading,
                onReload: loadOverviewData,
                overviewError,
                overviewNotice,
                overviewSummary,
                overviewRevenueChangeLabel,
                overviewRevenueGrowth,
                overviewChart,
                overviewYAxisTicks,
                overviewRecentActivity,
                onOpenOrders: () => setActive("order-management"),
                overviewBreakdown,
                formatDateTime,
                formatCurrency
              }
            ) : null,
            active === "tenant-profile" ? /* @__PURE__ */ jsx(
              TenantProfileSettings,
              {
                me: tenantAccount,
                onProfileUpdated: (next) => setTenantAccount((prev) => ({
                  ...prev,
                  ...next
                }))
              }
            ) : null,
            active === "sales-report" && reportTab === "sales" ? /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl text-slate-900 sm:text-3xl", children: "Laporan Penjualan" }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Laporan penjualan tenant berdasarkan transaksi, properti, dan user." })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: loadSalesReport,
                    disabled: salesLoading,
                    className: "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-70 sm:h-10 sm:w-auto",
                    children: [
                      /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", children: [
                        /* @__PURE__ */ jsx("path", { d: "M20 12a8 8 0 0 1-14.5 4.5M4 12A8 8 0 0 1 18.5 7.5", strokeWidth: "1.8", strokeLinecap: "round" }),
                        /* @__PURE__ */ jsx("path", { d: "M4 16v-3.5h3.5M20 8v3.5h-3.5", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })
                      ] }),
                      salesLoading ? "Memuat..." : "Muat Ulang"
                    ]
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:rounded-none sm:border-0 sm:border-b sm:bg-transparent sm:p-0", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-6", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setReportTab("sales"),
                    className: "rounded-lg bg-white px-3 py-2 text-xs font-semibold text-cyan-900 shadow-sm transition sm:rounded-none sm:border-b-2 sm:border-cyan-800 sm:bg-transparent sm:px-0 sm:pb-3 sm:pt-0 sm:text-sm sm:shadow-none",
                    children: "Laporan Penjualan"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setReportTab("property"),
                    className: "rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white/70 hover:text-cyan-800 sm:rounded-none sm:border-b-2 sm:border-transparent sm:px-0 sm:pb-3 sm:pt-0 sm:text-sm sm:hover:bg-transparent",
                    children: "Ketersediaan Properti"
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "surface-panel rounded-xl p-4 sm:p-5", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_0.9fr_1fr_1fr]", children: [
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: "Tampilan Laporan" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: salesView,
                        onChange: (event) => setSalesView(
                          event.target.value
                        ),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`,
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "transaction", children: "Transaksi" }),
                          /* @__PURE__ */ jsx("option", { value: "property", children: "Properti" }),
                          /* @__PURE__ */ jsx("option", { value: "user", children: "Pengguna" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: "Urutkan Berdasarkan" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: sortBy,
                        onChange: (event) => setSortBy(event.target.value),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`,
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "date", children: "Tanggal" }),
                          /* @__PURE__ */ jsx("option", { value: "total", children: "Total Penjualan" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: "Urutan" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: salesSortOrder,
                        onChange: (event) => setSalesSortOrder(event.target.value),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`,
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "desc", children: "Menurun" }),
                          /* @__PURE__ */ jsx("option", { value: "asc", children: "Menaik" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: "Dari" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "date",
                        value: dateRange.from,
                        onChange: (event) => setDateRange((prev) => ({ ...prev, from: event.target.value })),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: "Sampai" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "date",
                        value: dateRange.to,
                        onChange: (event) => setDateRange((prev) => ({ ...prev, to: event.target.value })),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]", children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative w-full min-w-0", children: [
                    /* @__PURE__ */ jsxs(
                      "svg",
                      {
                        viewBox: "0 0 24 24",
                        className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
                        fill: "none",
                        stroke: "currentColor",
                        children: [
                          /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "7", strokeWidth: "2" }),
                          /* @__PURE__ */ jsx("path", { d: "M20 20L17 17", strokeWidth: "2", strokeLinecap: "round" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: transactionSearch,
                        onChange: (event) => setTransactionSearch(event.target.value),
                        placeholder: salesView === "transaction" ? "Cari transaksi / properti / pengguna..." : salesView === "property" ? "Cari nama properti..." : "Cari nama pengguna...",
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setTransactionSearch("");
                        setDateRange({ from: "", to: "" });
                        setSortBy("date");
                        setSalesSortOrder("desc");
                        setSalesPage(1);
                      },
                      className: "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 sm:w-auto",
                      children: "Atur Ulang Pencarian"
                    }
                  )
                ] }),
                salesDateRangeInvalid ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-rose-600", children: "Rentang tanggal tidak valid. Tanggal mulai harus sebelum tanggal akhir." }) : null,
                salesError ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-rose-600", children: salesError }) : null
              ] }),
              /* @__PURE__ */ jsx("div", { className: "grid gap-4 lg:grid-cols-4", children: [
                {
                  label: "Gross Sales",
                  value: formatCurrency(salesSummary.totalSales),
                  change: `${salesSummary.totalTransactions} transaksi`,
                  positive: true
                },
                {
                  label: "Net Payout",
                  value: formatCurrency(salesSummary.totalNetPayout ?? 0),
                  change: "Setelah fee tenant 5%",
                  positive: true
                },
                {
                  label: "Total Transaksi",
                  value: `${salesSummary.totalTransactions}`,
                  change: salesView === "property" ? `${salesMeta.total} properti` : salesView === "user" ? `${salesMeta.total} pengguna` : `${salesMeta.total} transaksi`,
                  positive: true
                },
                {
                  label: "Rata-rata Gross / Transaksi",
                  value: formatCurrency(salesSummary.avgPerTransaction),
                  change: "Tidak termasuk transaksi dibatalkan",
                  positive: true
                }
              ].map((item) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "surface-panel rounded-xl px-6 py-6",
                  children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-500", children: item.label }),
                    /* @__PURE__ */ jsx("p", { className: "mt-2 text-3xl font-bold leading-none text-slate-900 sm:text-4xl", children: item.value }),
                    /* @__PURE__ */ jsx(
                      "p",
                      {
                        className: `mt-2 text-xs font-medium ${item.positive ? "text-emerald-600" : "text-rose-600"}`,
                        children: item.change
                      }
                    )
                  ]
                },
                item.label
              )) }),
              /* @__PURE__ */ jsxs("div", { className: "surface-panel rounded-xl p-6", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-900", children: "Tren Penjualan" }),
                /* @__PURE__ */ jsxs("div", { className: "relative mt-5", children: [
                  /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute left-0 right-0 top-0 z-0 grid h-64 grid-rows-4", children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ jsx("div", { className: "border-b border-dashed border-slate-200" }, index)) }),
                  /* @__PURE__ */ jsx("div", { className: "relative z-10 grid h-72 grid-cols-7 gap-3 pt-2", children: salesTrendSeries.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-end gap-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex h-60 items-end gap-1.5", children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: "w-6 rounded-t-md bg-slate-700 sm:w-8",
                          style: {
                            height: `${Math.max(6, item.sales / salesTrendMax * 100)}%`
                          },
                          title: `Penjualan ${formatCurrency(item.sales)}`
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: "w-6 rounded-t-md bg-emerald-500 sm:w-8",
                          style: {
                            height: `${Math.max(
                              6,
                              item.bookings / bookingsTrendMax * 100
                            )}%`
                          },
                          title: `Pesanan ${item.bookings}`
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-500", children: item.month })
                  ] }, item.month)) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-center gap-4 text-sm font-medium", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-emerald-600", children: [
                    /* @__PURE__ */ jsx("span", { className: "h-3 w-3 rounded-sm bg-emerald-500" }),
                    "Pesanan"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-800", children: [
                    /* @__PURE__ */ jsx("span", { className: "h-3 w-3 rounded-sm bg-slate-700" }),
                    "Penjualan (IDR)"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "surface-panel rounded-xl p-5", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-900", children: salesView === "transaction" ? "Laporan Transaksi" : salesView === "property" ? "Laporan Properti" : "Laporan Pengguna" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 overflow-x-auto rounded-lg border border-slate-200", children: [
                  salesView === "transaction" ? /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[860px] text-left text-sm", children: [
                    /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-slate-500", children: /* @__PURE__ */ jsxs("tr", { children: [
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Transaksi" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Tanggal" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Properti" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Pengguna" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Total Penjualan" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Net Payout" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" })
                    ] }) }),
                    /* @__PURE__ */ jsx("tbody", { children: salesTransactionRows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
                      "td",
                      {
                        colSpan: 7,
                        className: "px-4 py-6 text-center text-sm text-slate-500",
                        children: "Tidak ada data transaksi pada filter ini."
                      }
                    ) }) : salesTransactionRows.map((order) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-100", children: [
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-semibold text-slate-900", children: order.orderNo }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-600", children: formatDateTime(order.submittedAt) }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-700", children: order.property }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-700", children: order.user }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-slate-900", children: formatCurrency(order.total) }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-slate-900", children: formatCurrency(order.netPayout ?? order.total) }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-600", children: formatBookingStatus(order.status) })
                    ] }, order.id)) })
                  ] }) : null,
                  salesView === "property" ? /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[780px] text-left text-sm", children: [
                    /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-slate-500", children: /* @__PURE__ */ jsxs("tr", { children: [
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Properti" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Transaksi" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Pengguna" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Total Penjualan" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Net Payout" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Transaksi Terakhir" })
                    ] }) }),
                    /* @__PURE__ */ jsx("tbody", { children: salesPropertyRows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
                      "td",
                      {
                        colSpan: 6,
                        className: "px-4 py-6 text-center text-sm text-slate-500",
                        children: "Tidak ada data properti pada filter ini."
                      }
                    ) }) : salesPropertyRows.map((row) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-100", children: [
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-semibold text-slate-900", children: row.propertyName }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right text-slate-700", children: row.transactions }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right text-slate-700", children: row.users }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-slate-900", children: formatCurrency(row.totalSales) }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-slate-900", children: formatCurrency(row.netPayout ?? row.totalSales) }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-600", children: formatDateTime(row.latestTransactionAt) })
                    ] }, row.propertyId)) })
                  ] }) : null,
                  salesView === "user" ? /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[780px] text-left text-sm", children: [
                    /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-slate-500", children: /* @__PURE__ */ jsxs("tr", { children: [
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Pengguna" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Transaksi" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Properti" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Total Penjualan" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Net Payout" }),
                      /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Transaksi Terakhir" })
                    ] }) }),
                    /* @__PURE__ */ jsx("tbody", { children: salesUserRows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
                      "td",
                      {
                        colSpan: 6,
                        className: "px-4 py-6 text-center text-sm text-slate-500",
                        children: "Tidak ada data user pada filter ini."
                      }
                    ) }) : salesUserRows.map((row) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-100", children: [
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-semibold text-slate-900", children: row.userName }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right text-slate-700", children: row.transactions }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right text-slate-700", children: row.properties }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-slate-900", children: formatCurrency(row.totalSales) }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold text-slate-900", children: formatCurrency(row.netPayout ?? row.totalSales) }),
                      /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-600", children: formatDateTime(row.latestTransactionAt) })
                    ] }, row.userId)) })
                  ] }) : null
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-3", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
                    "Menampilkan halaman ",
                    salesMeta.page,
                    " dari ",
                    salesMeta.totalPages,
                    " (",
                    salesMeta.total,
                    " data)"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxs("label", { className: "text-xs font-medium text-slate-500", children: [
                      "Baris",
                      /* @__PURE__ */ jsxs(
                        "select",
                        {
                          value: salesLimit,
                          onChange: (event) => {
                            const nextLimit = Number(event.target.value);
                            setSalesLimit(Number.isFinite(nextLimit) ? nextLimit : 10);
                            setSalesPage(1);
                          },
                          className: `ml-2 h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 ${INPUT_THEME.focus}`,
                          children: [
                            /* @__PURE__ */ jsx("option", { value: 10, children: "10" }),
                            /* @__PURE__ */ jsx("option", { value: 20, children: "20" }),
                            /* @__PURE__ */ jsx("option", { value: 50, children: "50" })
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setSalesPage((prev) => Math.max(1, prev - 1)),
                        disabled: !salesMeta.hasPrev || salesLoading,
                        className: "h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50",
                        children: "Sebelumnya"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setSalesPage(
                          (prev) => salesMeta.hasNext ? prev + 1 : prev
                        ),
                        disabled: !salesMeta.hasNext || salesLoading,
                        className: "h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50",
                        children: "Selanjutnya"
                      }
                    )
                  ] })
                ] })
              ] })
            ] }) : null,
            active === "sales-report" && reportTab === "property" ? /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl text-slate-900 sm:text-3xl", children: tenantCopy.propertyReportTitle }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-500", children: tenantCopy.propertyReportSubtitle })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex w-full items-center gap-2 sm:w-auto sm:justify-end", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: loadAvailability,
                    disabled: availabilityLoading,
                    className: "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-70 sm:h-10 sm:w-auto",
                    children: [
                      /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", children: [
                        /* @__PURE__ */ jsx("path", { d: "M20 12a8 8 0 0 1-14.5 4.5M4 12A8 8 0 0 1 18.5 7.5", strokeWidth: "1.8", strokeLinecap: "round" }),
                        /* @__PURE__ */ jsx("path", { d: "M4 16v-3.5h3.5M20 8v3.5h-3.5", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })
                      ] }),
                      availabilityLoading ? tenantCopy.loadingShort : tenantCopy.reloadCalendar
                    ]
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-1.5 sm:rounded-none sm:border-0 sm:border-b sm:bg-transparent sm:p-0", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-6", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setReportTab("sales"),
                    className: "rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white/70 hover:text-cyan-800 sm:rounded-none sm:border-b-2 sm:border-transparent sm:px-0 sm:pb-3 sm:pt-0 sm:text-sm sm:hover:bg-transparent",
                    children: tenantCopy.salesReportTab
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setReportTab("property"),
                    className: "rounded-lg bg-white px-3 py-2 text-xs font-semibold text-cyan-900 shadow-sm transition sm:rounded-none sm:border-b-2 sm:border-cyan-800 sm:bg-transparent sm:px-0 sm:pb-3 sm:pt-0 sm:text-sm sm:shadow-none",
                    children: tenantCopy.propertyAvailabilityTab
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "surface-panel rounded-xl p-4 sm:p-5", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]", children: [
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: tenantCopy.property }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: selectedPropertyId,
                        onChange: (event) => setSelectedPropertyId(event.target.value),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`,
                        disabled: propertiesLoading,
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: tenantCopy.selectProperty }),
                          availabilityProperties.map((property) => /* @__PURE__ */ jsx("option", { value: property.id, children: property.name }, property.id))
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: tenantCopy.room }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: selectedRoomId,
                        onChange: (event) => setSelectedRoomId(event.target.value),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`,
                        disabled: !selectedProperty,
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: tenantCopy.selectRoom }),
                          availableRooms.map((room) => /* @__PURE__ */ jsx("option", { value: room.id, children: room.name }, room.id))
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: tenantCopy.startDate }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "date",
                        value: availabilityQuery.startDate,
                        onChange: (event) => setAvailabilityQuery((prev) => ({
                          ...prev,
                          startDate: event.target.value
                        })),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-500", children: [
                    /* @__PURE__ */ jsx("span", { className: "mb-1 block font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em]", children: tenantCopy.endDate }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "date",
                        value: availabilityQuery.endDate,
                        onChange: (event) => setAvailabilityQuery((prev) => ({
                          ...prev,
                          endDate: event.target.value
                        })),
                        className: `h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        const today = /* @__PURE__ */ new Date();
                        const monthStart = new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          1
                        );
                        const monthEnd = new Date(
                          today.getFullYear(),
                          today.getMonth() + 1,
                          0
                        );
                        setAvailabilityQuery({
                          startDate: formatDateInput(monthStart),
                          endDate: formatDateInput(monthEnd)
                        });
                      },
                      className: "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 sm:w-auto",
                      children: tenantCopy.currentMonth
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center justify-between gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-900", children: selectedProperty?.name ?? tenantCopy.selectedPropertyFallback }),
                    " \xB7 ",
                    /* @__PURE__ */ jsx("span", { children: selectedRoom?.name ?? tenantCopy.selectedRoomFallback })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => shiftAvailabilityMonth(-1),
                        className: "rounded-md p-2 text-slate-500 transition hover:bg-slate-50",
                        "aria-label": tenantCopy.prevMonthAria,
                        children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M15 6L9 12L15 18", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "px-2 text-sm font-semibold text-slate-900", children: roomMonthLabel }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => shiftAvailabilityMonth(1),
                        className: "rounded-md p-2 text-slate-500 transition hover:bg-slate-50",
                        "aria-label": tenantCopy.nextMonthAria,
                        children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", fill: "none", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M9 6L15 12L9 18", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })
                      }
                    )
                  ] })
                ] }),
                propertiesError ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-rose-600", children: propertiesError }) : null,
                availabilityError ? /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-600", children: availabilityError }) : null,
                /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2", children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-600", children: [
                    tenantCopy.propertyPageLabel,
                    " ",
                    propertyReportMeta.page,
                    " /",
                    " ",
                    propertyReportMeta.totalPages,
                    " (",
                    propertyReportMeta.total,
                    " ",
                    tenantCopy.propertiesNoun,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxs("label", { className: "text-xs font-medium text-slate-500", children: [
                      tenantCopy.rows,
                      /* @__PURE__ */ jsxs(
                        "select",
                        {
                          value: propertyReportLimit,
                          onChange: (event) => setPropertyReportLimit(Number(event.target.value) || 10),
                          className: `ml-2 h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 ${INPUT_THEME.focus}`,
                          children: [
                            /* @__PURE__ */ jsx("option", { value: 5, children: "5" }),
                            /* @__PURE__ */ jsx("option", { value: 10, children: "10" }),
                            /* @__PURE__ */ jsx("option", { value: 20, children: "20" })
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setPropertyReportPage((prev) => Math.max(1, prev - 1)),
                        disabled: !propertyReportMeta.hasPrev || propertiesLoading,
                        className: "h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50",
                        children: tenantCopy.previous
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setPropertyReportPage(
                          (prev) => propertyReportMeta.hasNext ? prev + 1 : prev
                        ),
                        disabled: !propertyReportMeta.hasNext || propertiesLoading,
                        className: "h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50",
                        children: tenantCopy.next
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "surface-panel rounded-xl p-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3", children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-900", children: tenantCopy.availabilityCalendar }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm text-slate-600", children: [
                    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "h-3 w-3 rounded-full bg-emerald-500" }),
                      tenantCopy.available
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "h-3 w-3 rounded-full bg-rose-500" }),
                      tenantCopy.booked
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "h-3 w-3 rounded-full bg-slate-400" }),
                      tenantCopy.maintenance
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mb-4 grid gap-3 sm:grid-cols-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700", children: [
                    tenantCopy.available,
                    ":",
                    " ",
                    /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                      availabilityStatusSummary.available,
                      " ",
                      tenantCopy.dayLabel
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700", children: [
                    tenantCopy.booked,
                    ":",
                    " ",
                    /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                      availabilityStatusSummary.booked,
                      " ",
                      tenantCopy.dayLabel
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700", children: [
                    tenantCopy.maintenance,
                    ":",
                    " ",
                    /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                      availabilityStatusSummary.maintenance,
                      " ",
                      tenantCopy.dayLabel
                    ] })
                  ] })
                ] }),
                availabilityError ? /* @__PURE__ */ jsx("p", { className: "mb-4 text-xs text-rose-600", children: availabilityError }) : null,
                /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-2xl border border-slate-200", children: /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[920px] table-fixed border-collapse", children: [
                  /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-slate-50 text-slate-500", children: reportWeekdayLabels.map((day) => /* @__PURE__ */ jsx(
                    "th",
                    {
                      className: "border-r border-slate-200 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] last:border-r-0",
                      children: day
                    },
                    day
                  )) }) }),
                  /* @__PURE__ */ jsx("tbody", { children: reportAvailabilityWeeks.map((week, weekIndex) => /* @__PURE__ */ jsx("tr", { children: week.map((cell, cellIndex) => /* @__PURE__ */ jsx(
                    "td",
                    {
                      className: "h-24 border-r border-t border-slate-200 px-2 py-2 align-top last:border-r-0",
                      children: cell ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-400", children: cell.day }),
                        /* @__PURE__ */ jsx(
                          "span",
                          {
                            className: `block rounded-md px-2 py-1 text-xs font-medium ${cell.status === "Available" ? "bg-emerald-100 text-emerald-700" : cell.status === "Booked" ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-600"}`,
                            children: cell.status === "Available" ? "Tersedia" : cell.status === "Booked" ? "Terpesan" : "Perawatan"
                          }
                        )
                      ] }) : null
                    },
                    `${weekIndex}-${cellIndex}`
                  )) }, weekIndex)) })
                ] }) })
              ] })
            ] }) : null,
            active === "order-management" ? /* @__PURE__ */ jsx(
              TenantOrderManagementSection,
              {
                statusFilter,
                onStatusFilterChange: setStatusFilter,
                transactionSearch,
                onTransactionSearchChange: setTransactionSearch,
                transactionSortBy,
                onTransactionSortByChange: setTransactionSortBy,
                transactionSortOrder,
                onTransactionSortOrderChange: setTransactionSortOrder,
                tenantPaymentProofsError,
                paymentActionError,
                paymentActionFeedback,
                filteredTransactionRows,
                getTransactionStatusMeta,
                formatDateTime,
                formatCurrency,
                onPaymentProofReview: handlePaymentProofReview,
                onCancelOrderByTenant: handleCancelOrderByTenant,
                paymentActionLoadingId,
                tenantPaymentProofMeta,
                tenantPaymentProofsLoading,
                transactionLimit,
                onTransactionLimitChange: setTransactionLimit,
                onPrevPage: () => setTransactionPage((prev) => Math.max(prev - 1, 1)),
                onNextPage: () => setTransactionPage((prev) => prev + 1)
              }
            ) : null,
            active === "customer-relations" ? /* @__PURE__ */ jsx(
              TenantCustomerRelationsSection,
              {
                reviewSearch,
                onReviewSearchChange: setReviewSearch,
                reviewRepliedFilter,
                onReviewRepliedFilterChange: setReviewRepliedFilter,
                reviewSortBy,
                onReviewSortByChange: setReviewSortBy,
                reviewSortOrder,
                onReviewSortOrderChange: setReviewSortOrder,
                tenantReviewsError,
                reviewReplyFeedback,
                tenantReviewsLoading,
                tenantReviews,
                reviewDrafts,
                onReviewDraftChange: (reviewId, value) => setReviewDrafts((prev) => ({
                  ...prev,
                  [reviewId]: value
                })),
                onSubmitReply: handleSubmitReply,
                reviewReplyLoadingId,
                formatDateTime,
                reviewLimit,
                onReviewLimitChange: setReviewLimit,
                reviewPage: tenantReviewsMeta.page,
                reviewTotalPages: tenantReviewsMeta.totalPages,
                onPrevPage: () => setReviewPage((prev) => Math.max(prev - 1, 1)),
                onNextPage: () => setReviewPage(
                  (prev) => tenantReviewsMeta.page < tenantReviewsMeta.totalPages ? prev + 1 : prev
                )
              }
            ) : null,
            active === "property-category" ? /* @__PURE__ */ jsx(
              TenantPropertyCategorySection,
              {
                onSwitchToPropertyManagement: () => setActive("property-management"),
                newCategoryName,
                onNewCategoryNameChange: setNewCategoryName,
                onCreateCategory: handleCreateCategory,
                categoryCreateLoading,
                categoriesError,
                categoryCreateError,
                categoryCreateFeedback,
                categoriesLoading,
                categoryRows,
                editingCategoryId,
                categoryNameDrafts,
                onCategoryDraftChange: (id, value) => setCategoryNameDrafts((prev) => ({
                  ...prev,
                  [id]: value
                })),
                onSubmitEditCategory: handleSubmitEditCategory,
                onCancelEditCategory: handleCancelEditCategory,
                onStartEditCategory: handleStartEditCategory,
                onDeleteCategory: handleDeleteCategory
              }
            ) : null,
            active === "property-management" ? /* @__PURE__ */ jsx(
              TenantPropertyManagementSection,
              {
                onSwitchToCategory: () => setActive("property-category"),
                propertySearch,
                onPropertySearchChange: setPropertySearch,
                propertySortBy,
                onPropertySortByChange: setPropertySortBy,
                propertySortOrder,
                onPropertySortOrderChange: setPropertySortOrder,
                propertiesError,
                propertyActionError,
                propertyActionFeedback,
                propertiesLoading,
                filteredPropertyCards,
                onManageRoom: (propertyId, firstRoomId) => {
                  setSelectedPropertyId(propertyId);
                  if (firstRoomId) {
                    setSelectedRoomId(firstRoomId);
                  }
                  setActive("room-management");
                },
                onDeleteProperty: handleDeleteProperty,
                propertyDeleteLoadingId,
                propertyListLimit,
                onPropertyListLimitChange: setPropertyListLimit,
                propertyListMeta,
                onPrevPage: () => setPropertyListPage((prev) => Math.max(prev - 1, 1)),
                onNextPage: () => setPropertyListPage((prev) => propertyListMeta.hasNext ? prev + 1 : prev)
              }
            ) : null,
            active === "room-management" ? /* @__PURE__ */ jsx(
              TenantRoomManagementSection,
              {
                tenantCopy,
                selectedPropertyName: selectedProperty?.name ?? null,
                onBackToProperty: () => setActive("property-management"),
                roomMonthLabel,
                onShiftMonth: shiftAvailabilityMonth,
                selectedPropertyId,
                onSelectedPropertyIdChange: setSelectedPropertyId,
                propertiesLoading,
                availabilityProperties,
                selectedRoomId,
                onSelectedRoomIdChange: setSelectedRoomId,
                hasSelectedProperty: Boolean(selectedProperty),
                availableRooms,
                propertiesError,
                availabilityError,
                roomWeekdayLabels,
                availabilityLoading,
                roomCalendarCells,
                selectedCalendarDates,
                selectedRoomTotalUnits: selectedRoom?.totalUnits ?? 0,
                roomBasePrice,
                formatDateInput,
                formatCurrency,
                onToggleCalendarDate: toggleCalendarDate,
                roomAvailabilityMode,
                onRoomAvailabilityModeChange: setRoomAvailabilityMode,
                roomAdjustmentType,
                onRoomAdjustmentTypeChange: setRoomAdjustmentType,
                roomAdjustmentValue,
                onRoomAdjustmentValueChange: setRoomAdjustmentValue,
                roomActionError,
                roomActionSuccess,
                onApplyChanges: applyRoomSidebarChanges,
                roomActionLoading,
                rateRulesError,
                rateRules,
                rateRulesLoading,
                onDeleteRateRule: handleDeleteRateRule
              }
            ) : null
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      ConfirmModal,
      {
        open: Boolean(tenantActionConfirm),
        title: tenantActionConfirm?.title ?? "",
        description: tenantActionConfirm?.description ?? "",
        eyebrow: "Konfirmasi Tenant",
        zIndexClassName: "z-[72]",
        loading: tenantActionConfirmLoading,
        confirmLabel: tenantActionConfirm?.confirmLabel ?? "Ya, lanjutkan",
        confirmTone: tenantActionConfirm?.payload.type === "delete-property" || tenantActionConfirm?.payload.type === "delete-rate-rule" || tenantActionConfirm?.payload.type === "cancel-order" || tenantActionConfirm?.payload.type === "payment-proof-review" && tenantActionConfirm.payload.action === "reject" ? "danger" : "default",
        onCancel: handleCancelTenantActionConfirm,
        onConfirm: handleConfirmTenantAction
      }
    ),
    /* @__PURE__ */ jsx(
      ConfirmModal,
      {
        open: Boolean(roomActionConfirm),
        title: roomActionConfirm?.title ?? "",
        description: roomActionConfirm?.description ?? "",
        eyebrow: "Konfirmasi Aksi",
        eyebrowClassName: "text-teal-600",
        zIndexClassName: "z-[70]",
        loading: roomActionLoading,
        confirmLabel: "Ya",
        onCancel: handleCancelRoomActionConfirm,
        onConfirm: handleConfirmRoomAction
      }
    )
  ] });
}
export {
  TenantDashboardClient as default
};
