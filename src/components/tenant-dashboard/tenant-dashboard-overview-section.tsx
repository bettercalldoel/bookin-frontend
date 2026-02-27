import { TenantDashboardOverviewActivity } from "./tenant-dashboard-overview-activity";
import { TenantDashboardOverviewBreakdown } from "./tenant-dashboard-overview-breakdown";
import { TenantDashboardOverviewChart } from "./tenant-dashboard-overview-chart";
import { TenantDashboardOverviewMetrics } from "./tenant-dashboard-overview-metrics";
import type {
  OverviewActivity,
  OverviewBreakdownRow,
  OverviewChart,
  OverviewSummary,
} from "./tenant-dashboard-overview.types";

type OverviewSectionProps = {
  overviewLoading: boolean;
  onReload: () => void;
  overviewError: string | null;
  overviewNotice: string | null;
  overviewSummary: OverviewSummary;
  overviewRevenueChangeLabel: string;
  overviewRevenueGrowth: number;
  overviewChart: OverviewChart;
  overviewYAxisTicks: number[];
  overviewRecentActivity: OverviewActivity[];
  onOpenOrders: () => void;
  overviewBreakdown: OverviewBreakdownRow[];
  formatDateTime: (value: string | null) => string;
  formatCurrency: (value: number) => string;
};

export function TenantDashboardOverviewSection({
  overviewLoading,
  onReload,
  overviewError,
  overviewNotice,
  overviewSummary,
  overviewRevenueChangeLabel,
  overviewRevenueGrowth,
  overviewChart,
  overviewYAxisTicks,
  overviewRecentActivity,
  onOpenOrders,
  overviewBreakdown,
  formatDateTime,
  formatCurrency,
}: OverviewSectionProps) {
  return (
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
          onClick={onReload}
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

      <TenantDashboardOverviewMetrics
        overviewSummary={overviewSummary}
        overviewRevenueChangeLabel={overviewRevenueChangeLabel}
        overviewRevenueGrowth={overviewRevenueGrowth}
        formatCurrency={formatCurrency}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <TenantDashboardOverviewChart
          overviewChart={overviewChart}
          overviewYAxisTicks={overviewYAxisTicks}
        />
        <TenantDashboardOverviewActivity
          overviewRecentActivity={overviewRecentActivity}
          formatDateTime={formatDateTime}
          onOpenOrders={onOpenOrders}
        />
      </div>

      <TenantDashboardOverviewBreakdown
        overviewBreakdown={overviewBreakdown}
        formatDateTime={formatDateTime}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
