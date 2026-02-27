import type { OverviewChart } from "./tenant-dashboard-overview.types";

type Props = {
  overviewChart: OverviewChart;
  overviewYAxisTicks: number[];
};

const resolveTickY = (chart: OverviewChart, tick: number) => {
  const ratio = chart.maxValue > 0 ? Math.min(1, Math.max(0, tick / chart.maxValue)) : 0;
  return chart.top + (1 - ratio) * (chart.height - chart.top - chart.bottom);
};

const OverviewChartGradient = () => (
  <defs>
    <linearGradient id="overviewRevenueFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.16" />
      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
    </linearGradient>
  </defs>
);

const OverviewChartYAxis = ({ chart, ticks }: { chart: OverviewChart; ticks: number[] }) => (
  <>
    {ticks.map((tick) => (
      <g key={`y-${tick}`}>
        <line x1={chart.left} y1={resolveTickY(chart, tick)} x2={chart.width - chart.right} y2={resolveTickY(chart, tick)} stroke="#e2e8f0" strokeDasharray="4 6" />
        <text x={chart.left - 10} y={resolveTickY(chart, tick) + 4} textAnchor="end" fontSize="11" fill="#64748b">{tick}</text>
      </g>
    ))}
  </>
);

const OverviewChartSeries = ({ chart }: { chart: OverviewChart }) => (
  <>
    {chart.areaPath ? <path d={chart.areaPath} fill="url(#overviewRevenueFill)" /> : null}
    {chart.linePath ? <path d={chart.linePath} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
  </>
);

const OverviewChartPoints = ({ chart }: { chart: OverviewChart }) => (
  <>
    {chart.points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r={3.5} fill="#4f46e5" />)}
    {chart.points.map((point) => (
      <text key={`x-${point.label}`} x={point.x} y={chart.height - 10} textAnchor="middle" fontSize="11" fill="#64748b">{point.label}</text>
    ))}
  </>
);

const OverviewChartSvg = ({ chart, ticks }: { chart: OverviewChart; ticks: number[] }) => (
  <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-64 w-full" role="img" aria-label="Grafik analisis pendapatan">
    <OverviewChartGradient />
    <OverviewChartYAxis chart={chart} ticks={ticks} />
    <OverviewChartSeries chart={chart} />
    <OverviewChartPoints chart={chart} />
  </svg>
);

export function TenantDashboardOverviewChart({ overviewChart, overviewYAxisTicks }: Props) {
  return (
    <div className="surface-panel rounded-xl p-5 xl:col-span-2">
      <h3 className="font-display text-3xl text-slate-900">Analisis Pendapatan</h3>
      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <OverviewChartSvg chart={overviewChart} ticks={overviewYAxisTicks} />
      </div>
    </div>
  );
}
