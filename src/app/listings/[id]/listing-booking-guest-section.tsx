"use client";

import type { ListingCopy } from "./listing-types";

type GuestState = {
  adults: number;
  children: number;
};

type Props = {
  copy: ListingCopy;
  guests: GuestState;
  totalGuests: number;
  onChangeGuest: (key: "adults" | "children", delta: number) => void;
};

export const ListingBookingGuestSection = ({
  copy,
  guests,
  totalGuests,
  onChangeGuest,
}: Props) => (
  <div className="rounded-2xl border border-slate-300 bg-white/90 p-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-800">3. {copy.guestsCount}</p>
      <span className="text-xs font-medium text-slate-500">{totalGuests} {copy.guestUnit}</span>
    </div>
    <div className="mt-3 grid gap-2">
      <GuestRow label={copy.adults} hint={copy.age13Plus} value={guests.adults} onChange={(delta) => onChangeGuest("adults", delta)} />
      <GuestRow label={copy.children} hint={copy.age0to12} value={guests.children} onChange={(delta) => onChangeGuest("children", delta)} />
    </div>
  </div>
);

type GuestRowProps = {
  label: string;
  hint: string;
  value: number;
  onChange: (delta: number) => void;
};

const GuestRow = ({ label, hint, value, onChange }: GuestRowProps) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
    <div>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-[11px] text-slate-500">{hint}</p>
    </div>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(-1)} className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500">-</button>
      <span className="w-6 text-center text-sm font-semibold text-slate-900">{value}</span>
      <button type="button" onClick={() => onChange(1)} className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-500">+</button>
    </div>
  </div>
);
