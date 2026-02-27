import type { RateRuleRow, RoomSectionCopy } from "./tenant-dashboard-room-section.types";

type TenantRoomRateRulesProps = {
  tenantCopy: RoomSectionCopy;
  rateRulesError: string | null;
  rateRules: RateRuleRow[];
  rateRulesLoading: boolean;
  onDeleteRateRule: (id: string) => void;
  formatCurrency: (value: number) => string;
};

const renderRateRuleAdjustment = (
  rule: RateRuleRow,
  formatCurrency: (value: number) => string,
) => {
  if (rule.adjustmentType === "PERCENT") return `${rule.adjustmentValue}%`;
  return formatCurrency(Number(rule.adjustmentValue));
};

export const TenantRoomRateRules = ({
  tenantCopy,
  rateRulesError,
  rateRules,
  rateRulesLoading,
  onDeleteRateRule,
  formatCurrency,
}: TenantRoomRateRulesProps) => (
  <details className="surface-panel rounded-xl p-4">
    <summary className="cursor-pointer text-sm font-semibold text-slate-900">
      {tenantCopy.priceAdjustmentHistory}
    </summary>
    {rateRulesError ? <p className="mt-3 text-xs text-rose-600">{rateRulesError}</p> : null}
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-4 py-3">{tenantCopy.name}</th>
            <th className="px-4 py-3">{tenantCopy.date}</th>
            <th className="px-4 py-3">{tenantCopy.adjustment}</th>
            <th className="px-4 py-3 text-right">{tenantCopy.action}</th>
          </tr>
        </thead>
        <tbody>
          {rateRules.map((rule) => (
            <tr key={rule.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-900">{rule.name}</td>
              <td className="px-4 py-3 text-slate-600">{rule.startDate} - {rule.endDate}</td>
              <td className="px-4 py-3 text-slate-600">{renderRateRuleAdjustment(rule, formatCurrency)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onDeleteRateRule(rule.id)}
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
                Belum ada aturan harga.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  </details>
);
