import type { OverviewActivity } from "./tenant-dashboard-overview.types";

type Props = {
  overviewRecentActivity: OverviewActivity[];
  formatDateTime: (value: string | null) => string;
  onOpenOrders: () => void;
};

export function TenantDashboardOverviewActivity({
  overviewRecentActivity,
  formatDateTime,
  onOpenOrders,
}: Props) {
  return (
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
                  {formatDateTime(activity.submittedAt)} • {activity.booking.property.name}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={onOpenOrders}
        className="mt-4 text-sm font-semibold text-cyan-800 transition hover:text-cyan-900"
      >
        Lihat Semua Aktivitas
      </button>
    </div>
  );
}
