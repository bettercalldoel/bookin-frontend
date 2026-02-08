"use client";

import { useEffect, useMemo, useState } from "react";
import TenantPropertyForm from "@/components/tenant-property-form";
import { API_BASE_URL } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-client";

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

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

const mockOrders = [
  {
    id: "ORD-2001",
    property: "Serenity Villas",
    user: "Anisa Rahman",
    nights: 2,
    status: "Menunggu Pembayaran",
    total: 1850000,
  },
  {
    id: "ORD-2002",
    property: "Skyline Suites",
    user: "Kevin Hartono",
    nights: 3,
    status: "Menunggu Konfirmasi Pembayaran",
    total: 2450000,
  },
  {
    id: "ORD-2003",
    property: "Garden Stay",
    user: "Raka Putra",
    nights: 1,
    status: "Diproses",
    total: 920000,
  },
];

const mockPayments = [
  {
    id: "PAY-001",
    orderId: "ORD-2002",
    user: "Kevin Hartono",
    amount: 2450000,
    proof: "Bukti_Transfer_2002.jpg",
  },
];

const mockCategories = [
  { id: "CAT-01", name: "Villa" },
  { id: "CAT-02", name: "Hotel" },
  { id: "CAT-03", name: "Resort" },
];

const mockReviews = [
  {
    id: "REV-101",
    property: "Serenity Villas",
    user: "Mira Putri",
    rating: 5,
    date: "2026-01-28",
    comment:
      "Kamar bersih dan staff responsif. Check-in cepat dan proses pembayaran jelas.",
  },
  {
    id: "REV-102",
    property: "Skyline Suites",
    user: "Dimas Pratama",
    rating: 4,
    date: "2026-01-31",
    comment:
      "Lokasi strategis, fasilitas lengkap. Akan lebih baik jika ada panduan parkir lebih detail.",
  },
];

export default function TenantDashboardClient({ me }: { me: DashboardUser }) {
  const [active, setActive] = useState<NavKey>("dashboard-overview");
  const [salesView, setSalesView] = useState<"property" | "transaction" | "user">(
    "transaction",
  );
  const [sortBy, setSortBy] = useState<"date" | "total">("date");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState("All");
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [reviewReplies, setReviewReplies] = useState<Record<string, string>>({});
  const [paymentDecisions, setPaymentDecisions] = useState<
    Record<string, "accepted" | "rejected">
  >({});
  const [properties, setProperties] = useState<TenantProperty[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
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

  const [rateRules, setRateRules] = useState<RateRule[]>([]);
  const [rateRulesLoading, setRateRulesLoading] = useState(false);
  const [rateRulesError, setRateRulesError] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return mockOrders;
    return mockOrders.filter((order) => order.status === statusFilter);
  }, [statusFilter]);

  const activeNavItem = useMemo(() => {
    return navGroups
      .flatMap((group) => group.items)
      .find((item) => item.key === active);
  }, [active]);

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );

  const availableRooms = selectedProperty?.rooms ?? [];

  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === selectedRoomId) ?? null,
    [availableRooms, selectedRoomId],
  );

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

    try {
      setRoomActionLoading(true);
      setRoomActionError(null);
      setRoomActionSuccess(null);

      if (roomActionType === "close" || roomActionType === "open") {
        const payload: Record<string, unknown> = {
          dates: sortedDates,
          isClosed: roomActionType === "close",
        };
        if (roomActionType === "open" && roomActionUnits) {
          payload.availableUnits = Number(roomActionUnits);
        }
        await fetchJson(`/availability/room-types/${selectedRoomId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setRoomActionSuccess(
          roomActionType === "close"
            ? "Tanggal terpilih berhasil ditutup."
            : "Tanggal terpilih berhasil dibuka.",
        );
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
        err instanceof Error ? err.message : "Gagal menerapkan perubahan room.",
      );
    } finally {
      setRoomActionLoading(false);
    }
  };

  const handleDeleteRateRule = async (id: string) => {
    try {
      setRateRulesLoading(true);
      setRateRulesError(null);
      await fetchJson(`/availability/rate-rules/${id}`, { method: "DELETE" });
      await loadRateRules();
    } catch (err) {
      setRateRulesError(
        err instanceof Error ? err.message : "Gagal menghapus rule.",
      );
    } finally {
      setRateRulesLoading(false);
    }
  };

  const handleSubmitReply = (reviewId: string) => {
    const draft = reviewDrafts[reviewId]?.trim() ?? "";
    if (!draft) return;
    setReviewReplies((prev) => ({
      ...prev,
      [reviewId]: draft,
    }));
    setReviewDrafts((prev) => ({
      ...prev,
      [reviewId]: "",
    }));
  };

  useEffect(() => {
    if (
      (active === "property-report" ||
        active === "room-management" ||
        active === "property-management" ||
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
    if (active !== "room-management") return;
    if (availabilityQuery.startDate && availabilityQuery.endDate) return;
    const today = new Date();
    setAvailabilityQuery({
      startDate: formatDateInput(today),
      endDate: formatDateInput(addDays(today, 13)),
    });
  }, [active, availabilityQuery.startDate, availabilityQuery.endDate]);

  useEffect(() => {
    if (active !== "room-management") return;
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
  }, [selectedRoomId]);

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-200/70 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-sky-200/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid-slate" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row">
        <aside className="w-full rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/70 backdrop-blur lg:w-72">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Tenant Area
            </p>
            <h1 className="text-xl font-semibold text-slate-900">{me.name}</h1>
            <p className="text-xs text-slate-500">{me.email}</p>
            <p className="text-xs text-slate-500">
              {me.tenantProfile?.companyName ?? "Tenant BookIn"}
            </p>
            <a
              href="/"
              className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Back Home
            </a>
          </div>
          <nav className="mt-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {group.title}
                </p>
                <div className="flex flex-col gap-2 text-sm font-semibold">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActive(item.key)}
                      className={`flex flex-col items-start rounded-2xl border px-4 py-2 text-left transition ${
                        active === item.key
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs font-medium opacity-70">
                        {item.helper}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <section className="flex-1 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Dashboard Tenant
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {activeNavItem?.label ?? "Tenant Dashboard"}
              </p>
              <p className="text-xs text-slate-500">
                {activeNavItem?.helper ?? "Kelola operasional properti tenant."}
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {me.tenantProfile?.companyName ?? "Tenant BookIn"}
            </div>
          </div>

          {active === "dashboard-overview" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Properti Aktif", value: properties.length || "-" },
                  { label: "Order Menunggu", value: "8 order" },
                  { label: "Pendapatan Bulan Ini", value: formatCurrency(5220000) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-slate-100/80 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Prioritas hari ini
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>Verifikasi bukti pembayaran yang baru masuk.</li>
                    <li>Perbarui availability room untuk minggu ini.</li>
                    <li>Balas review terbaru dari user.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Navigasi cepat
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { key: "property-management" as NavKey, label: "Kelola Properti" },
                      { key: "room-management" as NavKey, label: "Atur Room" },
                      { key: "order-management" as NavKey, label: "Cek Order" },
                      { key: "sales-report" as NavKey, label: "Laporan Penjualan" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActive(item.key)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Sales Report
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Laporan penjualan berdasarkan transaksi, properti, atau user
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["transaction", "property", "user"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSalesView(item)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        salesView === item
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {item === "transaction"
                        ? "Transaction"
                        : item === "property"
                          ? "Property"
                          : "User"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Total Penjualan", value: formatCurrency(5220000) },
                  { label: "Total Transaksi", value: "38 transaksi" },
                  { label: "Order Aktif", value: "12 order" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-slate-100/80 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {card.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(event.target.value as "date" | "total")
                      }
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    >
                      <option value="date">Tanggal</option>
                      <option value="total">Total penjualan</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Filter tanggal</span>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(event) =>
                        setDateRange((prev) => ({
                          ...prev,
                          from: event.target.value,
                        }))
                      }
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    />
                    <span className="text-xs text-slate-400">hingga</span>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(event) =>
                        setDateRange((prev) => ({
                          ...prev,
                          to: event.target.value,
                        }))
                      }
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Transaksi</th>
                        <th className="px-4 py-3">Properti</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockSales.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.id}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.property}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.user}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.date}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {active === "property-report" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Property Report
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Kalender ketersediaan properti dan room
                </h2>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Properti
                    <select
                      value={selectedPropertyId}
                      onChange={(event) =>
                        setSelectedPropertyId(event.target.value)
                      }
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                    >
                      <option value="">Pilih properti</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Room
                    <select
                      value={selectedRoomId}
                      onChange={(event) =>
                        setSelectedRoomId(event.target.value)
                      }
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                      disabled={!selectedProperty}
                    >
                      <option value="">Pilih room</option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {formatCurrency(Number(room.price))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      Harga dasar room
                    </p>
                    <p>
                      {selectedRoom
                        ? formatCurrency(Number(selectedRoom.price))
                        : "Pilih room"}
                    </p>
                  </div>
                </div>

                {propertiesLoading && (
                  <p className="mt-3 text-xs text-slate-500">
                    Memuat properti...
                  </p>
                )}
                {propertiesError && (
                  <p className="mt-3 text-xs text-rose-600">
                    {propertiesError}
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                      Tanggal mulai
                      <input
                        type="date"
                        value={availabilityQuery.startDate}
                        onChange={(event) =>
                          setAvailabilityQuery((prev) => ({
                            ...prev,
                            startDate: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                      Tanggal akhir
                      <input
                        type="date"
                        value={availabilityQuery.endDate}
                        onChange={(event) =>
                          setAvailabilityQuery((prev) => ({
                            ...prev,
                            endDate: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={loadAvailability}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    disabled={availabilityLoading}
                  >
                    {availabilityLoading ? "Memuat..." : "Muat kalender"}
                  </button>
                </div>

                {availabilityError && (
                  <p className="mt-3 text-xs text-rose-600">
                    {availabilityError}
                  </p>
                )}

                {availabilityData && (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {(["grid", "table"] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setAvailabilityView(view)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            availabilityView === view
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          {view === "grid" ? "Calendar" : "Table"}
                        </button>
                      ))}
                    </div>

                    {availabilityView === "grid" ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {availabilityData.items.map((item) => (
                          <div
                            key={item.date}
                            className={`rounded-2xl border p-4 ${
                              item.isClosed
                                ? "border-rose-200 bg-rose-50"
                                : "border-emerald-200 bg-emerald-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  {getWeekdayLabel(item.date)}
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.date}
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                                {item.isClosed ? "Closed" : "Available"}
                              </span>
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-slate-600">
                              <p>Stok: {item.availableUnits}</p>
                              <p>Harga dasar: {formatCurrency(Number(item.basePrice))}</p>
                              <p>Penyesuaian: {formatCurrency(Number(item.adjustment))}</p>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">
                              {formatCurrency(Number(item.finalPrice))}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400">
                            <tr>
                              <th className="px-4 py-3">Tanggal</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Stok</th>
                              <th className="px-4 py-3 text-right">Harga final</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availabilityData.items.map((item) => (
                              <tr key={item.date} className="border-t border-slate-100">
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                  {item.date}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {item.isClosed ? "Closed" : "Available"}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {item.availableUnits}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                  {formatCurrency(Number(item.finalPrice))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {active === "order-management" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Order List
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Daftar pesanan berdasarkan status
                  </h2>
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  <option value="All">Semua Status</option>
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                  <option value="Menunggu Konfirmasi Pembayaran">
                    Menunggu Konfirmasi Pembayaran
                  </option>
                  <option value="Diproses">Diproses</option>
                </select>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Properti</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Malam</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {order.id}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {order.property}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {order.user}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {order.nights}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                          {order.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                Tenant hanya dapat membatalkan pesanan saat bukti pembayaran
                belum diunggah.
              </p>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Konfirmasi Bukti Pembayaran
                </p>
                <div className="grid gap-4">
                  {mockPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                            {payment.id}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {payment.orderId} • {payment.user}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-slate-400">
                            Bukti: {payment.proof}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentDecisions((prev) => ({
                                ...prev,
                                [payment.id]: "accepted",
                              }))
                            }
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
                          >
                            Terima
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentDecisions((prev) => ({
                                ...prev,
                                [payment.id]: "rejected",
                              }))
                            }
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Jika ditolak → status kembali ke Menunggu Pembayaran.
                        Jika diterima → status menjadi Diproses.
                      </p>
                      {paymentDecisions[payment.id] ? (
                        <p
                          className={`mt-2 text-xs font-semibold ${
                            paymentDecisions[payment.id] === "accepted"
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {paymentDecisions[payment.id] === "accepted"
                            ? "Pembayaran diterima. Notifikasi dikirim ke user."
                            : "Pembayaran ditolak. Status order kembali ke menunggu pembayaran."}
                        </p>
                      ) : null}
                    </div>
                  ))}
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
              <div className="grid gap-4">
                {mockReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {review.property}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {review.user}
                        </p>
                        <p className="text-xs text-slate-500">{review.date}</p>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitReply(review.id)}
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Kirim Balasan
                      </button>
                    </div>
                    {reviewReplies[review.id] ? (
                      <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <p className="text-xs font-semibold text-emerald-700">
                          Balasan terkirim
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {reviewReplies[review.id]}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {active === "property-category" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Property Category Management
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Kelola kategori properti
                </h2>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Nama kategori baru"
                    className="h-10 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm"
                  />
                  <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                    Tambah
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {mockCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-slate-700">
                        {category.name}
                      </span>
                      <div className="flex gap-2 text-xs">
                        <button className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                          Edit
                        </button>
                        <button className="rounded-full border border-rose-200 px-3 py-1 text-rose-600">
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {active === "property-management" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                    Property & Room Management
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Daftar properti dan kelola room
                  </h2>
                </div>
                <a
                  href="/tenant-property"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Tambah properti
                </a>
              </div>
              <TenantPropertyForm
                showForm={false}
                showManagement
                showRoomManagement={false}
              />
            </div>
          ) : null}

          {active === "room-management" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Room Management
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Satu alur: pilih tanggal di kalender lalu terapkan aksi
                </h2>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Properti
                    <select
                      value={selectedPropertyId}
                      onChange={(event) => setSelectedPropertyId(event.target.value)}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
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
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Room
                    <select
                      value={selectedRoomId}
                      onChange={(event) => setSelectedRoomId(event.target.value)}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
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
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Dari tanggal
                    <input
                      type="date"
                      value={availabilityQuery.startDate}
                      onChange={(event) =>
                        setAvailabilityQuery((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Sampai tanggal
                    <input
                      type="date"
                      value={availabilityQuery.endDate}
                      onChange={(event) =>
                        setAvailabilityQuery((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={loadAvailability}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    disabled={availabilityLoading}
                  >
                    {availabilityLoading ? "Memuat..." : "Refresh Kalender"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllVisibleDates}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    disabled={!availabilityData}
                  >
                    Pilih Semua Tanggal
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelectedDates}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    disabled={selectedCalendarDates.length === 0}
                  >
                    Reset Pilihan
                  </button>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {selectedCalendarDates.length} tanggal dipilih
                  </span>
                </div>

                {propertiesLoading && (
                  <p className="mt-3 text-xs text-slate-500">Memuat properti...</p>
                )}
                {propertiesError && (
                  <p className="mt-3 text-xs text-rose-600">{propertiesError}</p>
                )}
                {availabilityError && (
                  <p className="mt-3 text-xs text-rose-600">{availabilityError}</p>
                )}
              </div>

              {availabilityData ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                        Availability Calendar
                      </p>
                      <p className="text-xs text-slate-500">
                        Klik tanggal untuk memilih, lalu terapkan aksi.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(["grid", "table"] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setAvailabilityView(view)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            availabilityView === view
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          {view === "grid" ? "Calendar" : "Table"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {availabilityView === "grid" ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {availabilityData.items.map((item) => {
                        const isSelected = selectedCalendarDates.includes(item.date);
                        return (
                          <button
                            key={item.date}
                            type="button"
                            onClick={() => toggleCalendarDate(item.date)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              isSelected
                                ? "border-slate-900 bg-white ring-2 ring-slate-200"
                                : item.isClosed
                                  ? "border-rose-200 bg-rose-50"
                                  : "border-emerald-200 bg-emerald-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  {getWeekdayLabel(item.date)}
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.date}
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                                {isSelected
                                  ? "Selected"
                                  : item.isClosed
                                    ? "Closed"
                                    : "Available"}
                              </span>
                            </div>
                            <div className="mt-3 space-y-1 text-xs text-slate-600">
                              <p>Stok: {item.availableUnits}</p>
                              <p>Harga final: {formatCurrency(Number(item.finalPrice))}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Pilih</th>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Stok</th>
                            <th className="px-4 py-3 text-right">Harga Final</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availabilityData.items.map((item) => {
                            const isSelected = selectedCalendarDates.includes(item.date);
                            return (
                              <tr key={item.date} className="border-t border-slate-100">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleCalendarDate(item.date)}
                                  />
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                  {item.date}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {item.isClosed ? "Closed" : "Available"}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {item.availableUnits}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                  {formatCurrency(Number(item.finalPrice))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Kalender belum dimuat. Pilih properti, room, periode tanggal lalu klik
                  <span className="font-semibold text-slate-700"> Refresh Kalender</span>.
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Aksi Cepat
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Terapkan aksi ke tanggal yang sudah dipilih
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { key: "close" as const, label: "Tutup Room" },
                    { key: "open" as const, label: "Buka Room" },
                    { key: "adjust" as const, label: "Ubah Harga" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setRoomActionType(item.key)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                        roomActionType === item.key
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {roomActionType === "open" ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="Jumlah unit available (opsional)"
                      value={roomActionUnits}
                      onChange={(event) => setRoomActionUnits(event.target.value)}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                    />
                  </div>
                ) : null}

                {roomActionType === "adjust" ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <select
                      value={roomAdjustmentType}
                      onChange={(event) =>
                        setRoomAdjustmentType(
                          event.target.value as "NOMINAL" | "PERCENT",
                        )
                      }
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                    >
                      <option value="NOMINAL">Nominal</option>
                      <option value="PERCENT">Persentase</option>
                    </select>
                    <input
                      type="number"
                      placeholder={
                        roomAdjustmentType === "PERCENT"
                          ? "Contoh: 15"
                          : "Contoh: 100000"
                      }
                      value={roomAdjustmentValue}
                      onChange={(event) => setRoomAdjustmentValue(event.target.value)}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                    />
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-slate-500">Preset cepat</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRoomAdjustmentType("PERCENT");
                            setRoomAdjustmentValue("10");
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          +10% Long Weekend
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRoomAdjustmentType("PERCENT");
                            setRoomAdjustmentValue("20");
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          +20% High Season
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRoomAdjustmentType("NOMINAL");
                            setRoomAdjustmentValue("100000");
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          +Rp100.000
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {roomAdjustmentPreview ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p>
                      Preview harga dasar:{" "}
                      <span className="font-semibold">
                        {formatCurrency(roomAdjustmentPreview.basePrice)}
                      </span>
                    </p>
                    <p>
                      Harga setelah penyesuaian:{" "}
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(roomAdjustmentPreview.finalPrice)}
                      </span>
                    </p>
                  </div>
                ) : null}

                {roomActionError ? (
                  <p className="mt-3 text-xs font-semibold text-rose-600">
                    {roomActionError}
                  </p>
                ) : null}
                {roomActionSuccess ? (
                  <p className="mt-3 text-xs font-semibold text-emerald-700">
                    {roomActionSuccess}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={handleRoomActionApply}
                  className="mt-4 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  disabled={roomActionLoading}
                >
                  {roomActionLoading ? "Menerapkan..." : "Terapkan Aksi"}
                </button>
              </div>

              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  Riwayat penyesuaian harga (opsional)
                </summary>
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Daftar Rate Rule
                    </p>
                    <button
                      type="button"
                      onClick={loadRateRules}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      Refresh
                    </button>
                  </div>
                  {rateRulesError && (
                    <p className="mb-3 text-xs text-rose-600">{rateRulesError}</p>
                  )}
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
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
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {rule.name}
                            </td>
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
                        {!rateRulesLoading && rateRules.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-6 text-center text-sm text-slate-500"
                            >
                              Belum ada rate rule.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
