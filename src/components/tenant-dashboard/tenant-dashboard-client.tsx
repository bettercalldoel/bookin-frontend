"use client";

import { useMemo, useState } from "react";
import TenantPropertyForm from "@/components/tenant-property-form";

type DashboardUser = {
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  tenantProfile?: { companyName?: string | null } | null;
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

const calendarDays = Array.from({ length: 30 }).map((_, index) => ({
  day: index + 1,
  status: index % 7 === 0 ? "Booked" : "Available",
}));

export default function TenantDashboardClient({ me }: { me: DashboardUser }) {
  const [active, setActive] = useState<NavKey>("sales");
  const [salesView, setSalesView] = useState<"property" | "transaction" | "user">(
    "transaction",
  );
  const [sortBy, setSortBy] = useState<"date" | "total">("date");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return mockOrders;
    return mockOrders.filter((order) => order.status === statusFilter);
  }, [statusFilter]);

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
                  Ketersediaan properti & kamar (calendar view)
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {["Available", "Booked", "Closed"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {calendarDays.map((item) => (
                    <div
                      key={item.day}
                      className={`rounded-xl border px-2 py-3 text-center text-xs font-semibold ${
                        item.status === "Booked"
                          ? "border-rose-200 bg-rose-50 text-rose-600"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <p className="text-sm">{item.day}</p>
                      <p>{item.status}</p>
                    </div>
                  ))}
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
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                  />
                  <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm">
                    <option>Nominal</option>
                    <option>Persentase</option>
                  </select>
                  <input
                    type="date"
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                  />
                  <input
                    type="date"
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Nilai penyesuaian"
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                  />
                  <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    Simpan Rule
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Penyesuaian dapat diterapkan untuk seluruh tanggal atau tanggal
                  tertentu dalam rentang.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
