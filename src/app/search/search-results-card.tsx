"use client";

import Link from "next/link";
import { getAmenityLabelByLocale } from "@/lib/amenities";
import type { AppLocale } from "@/lib/app-locale";
import type { SearchCopy } from "./search-copy";
import type { DisplayResult, SearchFormState } from "./search-types";

type Props = {
  item: DisplayResult;
  copy: SearchCopy;
  locale: AppLocale;
  form: SearchFormState;
  nights: number;
  formatCurrency: (value: number) => string;
  getNightLabel: (value: number) => string;
  getRoomLabel: (value: number) => string;
};

export const SearchResultsCard = ({
  item,
  copy,
  locale,
  form,
  nights,
  formatCurrency,
  getNightLabel,
  getRoomLabel,
}: Props) => (
  <Link key={item.id} href={`/listings/${item.id}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-100 transition hover:-translate-y-1">
    <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
    <div className="space-y-4 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">
        <span>{item.tag}</span>
        <span>{copy.rating} {item.rating}</span>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-slate-900">{item.name}</h4>
        <p className="text-sm text-slate-500">{item.location}</p>
      </div>
      <p className="text-sm text-slate-600">{item.highlight}</p>
      {item.breakfastEnabled ? (
        <p className="text-xs font-semibold text-teal-700">{copy.breakfastAvailable} · +{formatCurrency(item.breakfastPricePerPax)}/pax{copy.perNight}</p>
      ) : (
        <p className="text-xs text-slate-500">{copy.noBreakfast}</p>
      )}
      {item.amenityKeys.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {item.amenityKeys.slice(0, 4).map((key) => (
            <span key={`${item.id}-${key}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {getAmenityLabelByLocale(key, locale)}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-900">{item.price > 0 ? formatCurrency(item.price) : copy.priceUnavailable}<span className="text-xs font-normal text-slate-500"> {copy.perNight}</span></p>
          {item.price > 0 && form.startDate && nights > 0 ? (
            <p className="text-xs text-slate-500">{copy.totalLabel} {formatCurrency(item.price * nights * Math.max(form.rooms, 1))} · {nights} {getNightLabel(nights)} × {Math.max(form.rooms, 1)} {getRoomLabel(Math.max(form.rooms, 1))}</p>
          ) : null}
          <p className="text-[11px] text-slate-500">{copy.notIncludeFees}</p>
        </div>
        <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
          {copy.viewDetails}
        </span>
      </div>
    </div>
  </Link>
);
