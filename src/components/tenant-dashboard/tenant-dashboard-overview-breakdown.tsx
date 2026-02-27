import type { OverviewBreakdownRow } from "./tenant-dashboard-overview.types";

type Props = {
  overviewBreakdown: OverviewBreakdownRow[];
  formatDateTime: (value: string | null) => string;
  formatCurrency: (value: number) => string;
};

export function TenantDashboardOverviewBreakdown({
  overviewBreakdown,
  formatDateTime,
  formatCurrency,
}: Props) {
  return (
    <div className="surface-panel rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Rincian Properti</h3>
        <p className="mt-1 text-xs text-slate-500">Hierarki detail properti dari transaksi tenant.</p>
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
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                  Belum ada data transaksi untuk ditampilkan.
                </td>
              </tr>
            ) : (
              overviewBreakdown.map((row) => (
                <tr key={row.propertyId} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.propertyName}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.orders}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.pending}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.inProgress}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.completed}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{row.cancelled}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(row.lastSubmittedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
