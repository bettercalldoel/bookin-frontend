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
  | "sales"
  | "property-report"
  | "orders"
  | "payments"
  | "reminders"
  | "categories"
  | "properties"
  | "rates";

const navItems: { key: NavKey; label: string; helper: string }[] = [
  { key: "sales", label: "Sales Report", helper: "Laporan penjualan" },
  {
    key: "property-report",
    label: "Property Report",
    helper: "Ketersediaan properti",
  },
  { key: "orders", label: "Order List", helper: "Daftar pemesanan" },
  {
    key: "payments",
    label: "Confirm Payment",
    helper: "Manual transfer",
  },
  {
    key: "reminders",
    label: "Order Reminder",
    helper: "Email otomatis",
  },
  {
    key: "categories",
    label: "Category Management",
    helper: "Kelola kategori",
  },
  {
    key: "properties",
    label: "Property & Room",
    helper: "Kelola properti dan room",
  },
  {
    key: "rates",
    label: "Peak Season Rate",
    helper: "Penyesuaian harga",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const getWeekdayLabel = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return weekdayLabels[date.getDay()] ?? "";
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchJson = async <T,>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
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

export default function TenantDashboardClient({ me }: { me: DashboardUser }) {
  const [active, setActive] = useState<NavKey>("sales");
  const [salesView, setSalesView] = useState<"property" | "transaction" | "user">(
    "transaction",
  );
  const [sortBy, setSortBy] = useState<"date" | "total">("date");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState("All");
  const [properties, setProperties] = useState<TenantProperty[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [availabilityQuery, setAvailabilityQuery] = useState({
    startDate: "",
    endDate: "",
  });
  const [availabilityMode, setAvailabilityMode] = useState<"range" | "dates">(
    "range",
  );
  const [availabilityForm, setAvailabilityForm] = useState({
    startDate: "",
    endDate: "",
    dates: "",
    isClosed: false,
    availableUnits: "",
  });
  const [availabilityData, setAvailabilityData] =
    useState<AvailabilityResponse | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [availabilitySuccess, setAvailabilitySuccess] = useState<string | null>(
    null,
  );
  const [availabilityView, setAvailabilityView] = useState<"table" | "grid">(
    "grid",
  );

  const [rateRules, setRateRules] = useState<RateRule[]>([]);
  const [rateRulesLoading, setRateRulesLoading] = useState(false);
  const [rateRulesError, setRateRulesError] = useState<string | null>(null);
  const [rateMode, setRateMode] = useState<"range" | "dates">("range");
  const [rateForm, setRateForm] = useState({
    name: "",
    scope: "ROOM_TYPE" as "ROOM_TYPE" | "PROPERTY",
    propertyId: "",
    roomTypeId: "",
    startDate: "",
    endDate: "",
    dates: "",
    adjustmentType: "NOMINAL" as "NOMINAL" | "PERCENT",
    adjustmentValue: "",
    isActive: true,
  });

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return mockOrders;
    return mockOrders.filter((order) => order.status === statusFilter);
  }, [statusFilter]);

  const selectedProperty = useMemo(
    () => properties.find((item) => item.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );

  const availableRooms = selectedProperty?.rooms ?? [];

  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === selectedRoomId) ?? null,
    [availableRooms, selectedRoomId],
  );

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
    } catch (err) {
      setAvailabilityData(null);
      setAvailabilityError(
        err instanceof Error ? err.message : "Gagal memuat kalender.",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleAvailabilitySave = async () => {
    if (!selectedRoomId) {
      setAvailabilityError("Pilih room terlebih dahulu.");
      return;
    }

    const payload: Record<string, any> = {
      isClosed: availabilityForm.isClosed,
    };

    if (availabilityMode === "dates") {
      const dates = availabilityForm.dates
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (dates.length === 0) {
        setAvailabilityError("Isi tanggal khusus atau ubah ke mode rentang.");
        return;
      }
      payload.dates = dates;
    } else {
      if (!availabilityForm.startDate || !availabilityForm.endDate) {
        setAvailabilityError("Tanggal mulai dan akhir wajib diisi.");
        return;
      }
      payload.startDate = availabilityForm.startDate;
      payload.endDate = availabilityForm.endDate;
    }

    if (!availabilityForm.isClosed && availabilityForm.availableUnits) {
      payload.availableUnits = Number(availabilityForm.availableUnits);
    }

    try {
      setAvailabilityLoading(true);
      setAvailabilityError(null);
      setAvailabilitySuccess(null);
      await fetchJson(`/availability/room-types/${selectedRoomId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setAvailabilitySuccess("Ketersediaan berhasil diperbarui.");
      await loadAvailability();
    } catch (err) {
      setAvailabilityError(
        err instanceof Error ? err.message : "Gagal menyimpan ketersediaan.",
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
      params.set("scope", rateForm.scope);
      if (rateForm.scope === "PROPERTY" && selectedPropertyId) {
        params.set("propertyId", selectedPropertyId);
      }
      if (rateForm.scope === "ROOM_TYPE" && selectedRoomId) {
        params.set("roomTypeId", selectedRoomId);
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

  const handleCreateRateRule = async () => {
    if (!rateForm.name.trim()) {
      setRateRulesError("Nama rule wajib diisi.");
      return;
    }
    if (rateForm.scope === "PROPERTY" && !selectedPropertyId) {
      setRateRulesError("Pilih properti terlebih dahulu.");
      return;
    }
    if (rateForm.scope === "ROOM_TYPE" && !selectedRoomId) {
      setRateRulesError("Pilih room terlebih dahulu.");
      return;
    }
    const payload: Record<string, any> = {
      name: rateForm.name.trim(),
      scope: rateForm.scope,
      adjustmentType: rateForm.adjustmentType,
      adjustmentValue: rateForm.adjustmentValue,
      isActive: rateForm.isActive,
    };

    if (rateForm.scope === "PROPERTY") {
      payload.propertyId = selectedPropertyId;
    } else {
      payload.roomTypeId = selectedRoomId;
    }

    if (rateMode === "dates") {
      const dates = rateForm.dates
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (dates.length === 0) {
        setRateRulesError("Isi tanggal khusus atau ubah ke mode rentang.");
        return;
      }
      payload.dates = dates;
    } else {
      if (!rateForm.startDate || !rateForm.endDate) {
        setRateRulesError("Tanggal mulai dan akhir wajib diisi.");
        return;
      }
      payload.startDate = rateForm.startDate;
      payload.endDate = rateForm.endDate;
    }

    try {
      setRateRulesLoading(true);
      setRateRulesError(null);
      await fetchJson("/availability/rate-rules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setRateForm((prev) => ({
        ...prev,
        name: "",
        adjustmentValue: "",
        startDate: "",
        endDate: "",
        dates: "",
      }));
      await loadRateRules();
    } catch (err) {
      setRateRulesError(
        err instanceof Error ? err.message : "Gagal menyimpan rule.",
      );
    } finally {
      setRateRulesLoading(false);
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

  useEffect(() => {
    if ((active === "property-report" || active === "rates") && properties.length === 0) {
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
    if (active === "rates") {
      loadRateRules();
    }
  }, [active, selectedPropertyId, selectedRoomId, rateForm.scope]);

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
          <nav className="mt-4 flex flex-col gap-2 text-sm font-semibold">
            {navItems.map((item) => (
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
          </nav>
        </aside>

        <section className="flex-1 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-8">
          {active === "sales" ? (
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
                  Room availability dan kalender harga
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
                {availabilitySuccess && (
                  <p className="mt-3 text-xs text-emerald-600">
                    {availabilitySuccess}
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

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                      Update availability
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Tutup atau buka room pada tanggal tertentu
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    {(["range", "dates"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAvailabilityMode(mode)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          availabilityMode === mode
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {mode === "range" ? "Rentang" : "Tanggal khusus"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {availabilityMode === "range" ? (
                    <>
                      <input
                        type="date"
                        value={availabilityForm.startDate}
                        onChange={(event) =>
                          setAvailabilityForm((prev) => ({
                            ...prev,
                            startDate: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                      />
                      <input
                        type="date"
                        value={availabilityForm.endDate}
                        onChange={(event) =>
                          setAvailabilityForm((prev) => ({
                            ...prev,
                            endDate: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                      />
                    </>
                  ) : (
                    <input
                      type="text"
                      value={availabilityForm.dates}
                      onChange={(event) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          dates: event.target.value,
                        }))
                      }
                      placeholder="2026-12-24, 2026-12-25"
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm md:col-span-2"
                    />
                  )}
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={availabilityForm.isClosed}
                      onChange={(event) =>
                        setAvailabilityForm((prev) => ({
                          ...prev,
                          isClosed: event.target.checked,
                        }))
                      }
                    />
                    Tutup room
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Available units"
                    value={availabilityForm.availableUnits}
                    onChange={(event) =>
                      setAvailabilityForm((prev) => ({
                        ...prev,
                        availableUnits: event.target.value,
                      }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                    disabled={availabilityForm.isClosed}
                  />
                  <button
                    type="button"
                    onClick={handleAvailabilitySave}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white md:col-span-2"
                    disabled={availabilityLoading}
                  >
                    {availabilityLoading ? "Menyimpan..." : "Simpan availability"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {active === "orders" ? (
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
            </div>
          ) : null}

          {active === "payments" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Confirm Payment
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Konfirmasi bukti pembayaran manual transfer
                </h2>
              </div>
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
                        <button className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                          Terima
                        </button>
                        <button className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
                          Tolak
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Jika ditolak → status kembali ke Menunggu Pembayaran. Jika
                      diterima → status menjadi Diproses.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {active === "reminders" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Order Reminder
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Automasi email setelah pembayaran & H-1 check-in
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Email setelah pembayaran terkonfirmasi",
                    desc: "Berisi detail pemesanan dan tata cara penggunaan properti.",
                  },
                  {
                    title: "Reminder H-1 sebelum check-in",
                    desc: "Email otomatis sebagai pengingat check-in.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
                    <button className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
                      Aktifkan otomatis
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Sistem akan mengirim notifikasi ke user saat pembayaran diterima.
              </p>
            </div>
          ) : null}

          {active === "categories" ? (
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

          {active === "properties" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Property & Room Management
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Daftar properti dan kelola room
                </h2>
              </div>
              <TenantPropertyForm showForm={false} showManagement showRoomManagement />
            </div>
          ) : null}

          {active === "rates" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
                  Peak Season Rate
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Penyesuaian harga tanggal tertentu
                </h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Nama aturan (contoh: Libur Panjang)"
                    value={rateForm.name}
                    onChange={(event) =>
                      setRateForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                  />
                  <select
                    value={rateForm.adjustmentType}
                    onChange={(event) =>
                      setRateForm((prev) => ({
                        ...prev,
                        adjustmentType: event.target.value as "NOMINAL" | "PERCENT",
                      }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                  >
                    <option value="NOMINAL">Nominal</option>
                    <option value="PERCENT">Persentase</option>
                  </select>
                  <select
                    value={rateForm.scope}
                    onChange={(event) =>
                      setRateForm((prev) => ({
                        ...prev,
                        scope: event.target.value as "ROOM_TYPE" | "PROPERTY",
                      }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                  >
                    <option value="ROOM_TYPE">Room type</option>
                    <option value="PROPERTY">Properti</option>
                  </select>
                  <div className="flex gap-2">
                    {(["range", "dates"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setRateMode(mode)}
                        className={`flex-1 rounded-2xl border px-3 py-2 text-xs font-semibold ${
                          rateMode === mode
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {mode === "range" ? "Rentang" : "Tanggal khusus"}
                      </button>
                    ))}
                  </div>
                  <select
                    value={selectedPropertyId}
                    onChange={(event) =>
                      setSelectedPropertyId(event.target.value)
                    }
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
                  <select
                    value={selectedRoomId}
                    onChange={(event) => setSelectedRoomId(event.target.value)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                    disabled={!selectedProperty || rateForm.scope === "PROPERTY"}
                  >
                    <option value="">Pilih room</option>
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                  {rateMode === "range" ? (
                    <>
                      <input
                        type="date"
                        value={rateForm.startDate}
                        onChange={(event) =>
                          setRateForm((prev) => ({
                            ...prev,
                            startDate: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                      />
                      <input
                        type="date"
                        value={rateForm.endDate}
                        onChange={(event) =>
                          setRateForm((prev) => ({
                            ...prev,
                            endDate: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                      />
                    </>
                  ) : (
                    <input
                      type="text"
                      value={rateForm.dates}
                      onChange={(event) =>
                        setRateForm((prev) => ({
                          ...prev,
                          dates: event.target.value,
                        }))
                      }
                      placeholder="2026-12-24, 2026-12-25"
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm md:col-span-2"
                    />
                  )}
                  <input
                    type="number"
                    placeholder="Nilai penyesuaian"
                    value={rateForm.adjustmentValue}
                    onChange={(event) =>
                      setRateForm((prev) => ({
                        ...prev,
                        adjustmentValue: event.target.value,
                      }))
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateRateRule}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    disabled={rateRulesLoading}
                  >
                    {rateRulesLoading ? "Menyimpan..." : "Simpan Rule"}
                  </button>
                </div>
                {rateRulesError && (
                  <p className="mt-3 text-xs text-rose-600">{rateRulesError}</p>
                )}
                <p className="mt-3 text-xs text-slate-500">
                  Penyesuaian dapat diterapkan untuk seluruh tanggal atau tanggal
                  tertentu dalam rentang.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Daftar rate rule
                  </p>
                  <button
                    type="button"
                    onClick={loadRateRules}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">Scope</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Penyesuaian</th>
                        <th className="px-4 py-3">Status</th>
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
                            {rule.scope === "ROOM_TYPE" ? "Room" : "Properti"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {rule.startDate} - {rule.endDate}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {rule.adjustmentType === "PERCENT"
                              ? `${rule.adjustmentValue}%`
                              : formatCurrency(Number(rule.adjustmentValue))}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                            {rule.isActive ? "Aktif" : "Nonaktif"}
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
                            colSpan={6}
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
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
