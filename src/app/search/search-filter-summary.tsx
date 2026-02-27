"use client";

import type { SearchCopy } from "./search-copy";

type Props = {
  copy: SearchCopy;
  destinationLabel: string;
  stayDateSummary: string;
  nights: number;
  guestSummary: string;
  roomCount: number;
  category: string;
  amenitiesCount: number;
  loading: boolean;
  total: number;
  getNightLabel: (value: number) => string;
  getRoomLabel: (value: number) => string;
};

export const SearchFilterSummary = ({
  copy,
  destinationLabel,
  stayDateSummary,
  nights,
  guestSummary,
  roomCount,
  category,
  amenitiesCount,
  loading,
  total,
  getNightLabel,
  getRoomLabel,
}: Props) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 lg:hidden">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.filterSummary}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{destinationLabel}</p>
    <p className="mt-1 text-xs text-slate-500">{stayDateSummary}</p>
    <div className="mt-2 flex flex-wrap gap-1.5">
      <Pill text={`${nights} ${getNightLabel(nights)}`} />
      <Pill text={guestSummary} />
      <Pill text={`${roomCount} ${getRoomLabel(roomCount)}`} />
      {category ? <Pill text={category} /> : null}
      {amenitiesCount > 0 ? <Pill text={`${amenitiesCount} ${copy.amenities}`} /> : null}
    </div>
    <p className="mt-2 text-[11px] text-slate-500">{loading ? copy.loadingResults : `${total} ${copy.showingSuffix}`}</p>
  </div>
);

const Pill = ({ text }: { text: string }) => (
  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
    {text}
  </span>
);
