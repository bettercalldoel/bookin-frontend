import type { OverviewSummary } from "./tenant-dashboard-overview.types";

type Props = {
  overviewSummary: OverviewSummary;
  overviewRevenueChangeLabel: string;
  overviewRevenueGrowth: number;
  formatCurrency: (value: number) => string;
};

export function TenantDashboardOverviewMetrics({
  overviewSummary,
  overviewRevenueChangeLabel,
  overviewRevenueGrowth,
  formatCurrency,
}: Props) {
  return (
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
          change: overviewSummary.pendingOrders > 0 ? `-${overviewSummary.pendingOrders}` : "+0",
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
        <div key={item.label} className="surface-panel rounded-xl px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-2 truncate text-3xl font-bold leading-none text-slate-900">{item.value}</p>
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
                item.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
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
  );
}
