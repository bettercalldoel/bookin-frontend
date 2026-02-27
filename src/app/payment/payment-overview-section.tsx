import type { AppLocale } from "@/lib/app-locale";
import { formatIDR, formatPaymentDateTime } from "./payment-helpers";
import type { PaymentCopy, PaymentQueryData } from "./payment-types";

type PaymentOverviewSectionProps = {
  copy: PaymentCopy;
  locale: AppLocale;
  query: PaymentQueryData;
  isManualTransfer: boolean;
};

const BreakdownLine = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between">
    <span>{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

export const PaymentOverviewSection = ({
  copy,
  locale,
  query,
  isManualTransfer,
}: PaymentOverviewSectionProps) => (
  <>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">{query.propertyName}</p>
      <p>{query.roomName}</p>
      <p>
        {formatPaymentDateTime(query.checkIn)} {copy.checkInOutArrow} {formatPaymentDateTime(query.checkOut)}
      </p>
    </div>

    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <BreakdownLine label={copy.orderNo} value={query.orderNo} />
      <BreakdownLine label={copy.total} value={query.total ? formatIDR(query.total, locale) : "-"} />
      <BreakdownLine
        label={copy.method}
        value={isManualTransfer ? copy.manualTransfer : copy.paymentGateway}
      />
      <BreakdownLine
        label={copy.paymentLimit}
        value={query.paymentDueAt ? formatPaymentDateTime(query.paymentDueAt) : "-"}
      />
    </div>

    {query.subtotalAmount || query.appFeeAmount || query.taxAmount || query.breakfastTotal ? (
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <BreakdownLine
          label={copy.roomSubtotal}
          value={query.roomSubtotal ? formatIDR(query.roomSubtotal, locale) : "-"}
        />
        <BreakdownLine
          label={
            query.breakfastSelected && query.breakfastPax !== "0" && query.breakfastUnitPrice
              ? `${copy.breakfast} (${query.breakfastPax} pax × ${formatIDR(query.breakfastUnitPrice, locale)}/${locale === "en" ? "night" : "malam"})`
              : copy.breakfast
          }
          value={query.breakfastTotal ? formatIDR(query.breakfastTotal, locale) : formatIDR("0", locale)}
        />
        <BreakdownLine label={copy.subtotal} value={query.subtotalAmount ? formatIDR(query.subtotalAmount, locale) : "-"} />
        <BreakdownLine label={copy.appServiceFee} value={query.appFeeAmount ? formatIDR(query.appFeeAmount, locale) : "-"} />
        <BreakdownLine label={copy.tax} value={query.taxAmount ? formatIDR(query.taxAmount, locale) : "-"} />
      </div>
    ) : null}

    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">{copy.paymentInstructions}</p>
      <ul className="mt-2 list-disc pl-4 text-sm text-slate-600">
        {isManualTransfer ? (
          <>
            <li>{copy.transferInstruction1}</li>
            <li>{copy.transferInstruction2}</li>
            <li>{copy.transferInstruction3}</li>
          </>
        ) : (
          <>
            <li>{copy.gatewayInstruction1}</li>
            <li>{copy.gatewayInstruction2}</li>
            <li>{copy.gatewayInstruction3}</li>
          </>
        )}
      </ul>
    </div>
  </>
);
