"use client";

import type { ListingCopy, ListingLocale } from "./listing-types";
import { formatIDR } from "./listing-utils";

type Props = {
  copy: ListingCopy;
  locale: ListingLocale;
  breakfastEnabled: boolean;
  breakfastSelected: boolean;
  breakfastPricePerPax: number;
  breakfastPax: number;
  totalGuests: number;
  onSelectBreakfast: (selected: boolean) => void;
  onChangeBreakfastPax: (delta: number) => void;
};

export const ListingBookingBreakfastSection = ({
  copy,
  locale,
  breakfastEnabled,
  breakfastSelected,
  breakfastPricePerPax,
  breakfastPax,
  totalGuests,
  onSelectBreakfast,
  onChangeBreakfastPax,
}: Props) => (
  <div className="rounded-2xl border border-slate-300 bg-white/90 p-4">
    <p className="text-sm font-semibold text-slate-800">4. {copy.breakfastOption}</p>
    {!breakfastEnabled ? (
      <p className="mt-2 text-sm text-slate-500">{copy.noBreakfastOption}</p>
    ) : (
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton text={copy.withoutBreakfast} selected={!breakfastSelected} onClick={() => onSelectBreakfast(false)} selectedClassName="border-slate-900 bg-slate-900 text-white" />
          <ChoiceButton text={copy.withBreakfast} selected={breakfastSelected} onClick={() => onSelectBreakfast(true)} selectedClassName="border-cyan-700 bg-cyan-700 text-white" />
        </div>
        <p className="text-xs text-cyan-800/90">+ {formatIDR(breakfastPricePerPax, locale)} {copy.perPaxPerNight}</p>
        {breakfastSelected ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{copy.breakfastPax}</p>
              <p className="text-[11px] text-slate-500">{copy.maxPaxPrefix} {Math.max(1, totalGuests)} pax</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onChangeBreakfastPax(-1)} className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500">-</button>
              <span className="w-7 text-center text-sm font-semibold text-slate-900">{breakfastPax}</span>
              <button type="button" onClick={() => onChangeBreakfastPax(1)} className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500">+</button>
            </div>
          </div>
        ) : null}
      </div>
    )}
  </div>
);

type ChoiceProps = {
  text: string;
  selected: boolean;
  onClick: () => void;
  selectedClassName: string;
};

const ChoiceButton = ({ text, selected, onClick, selectedClassName }: ChoiceProps) => (
  <button type="button" onClick={onClick} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${selected ? selectedClassName : "border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700"}`}>
    {text}
  </button>
);
