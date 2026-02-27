"use client";

import type { SearchCopy } from "./search-copy";
import type { SearchFormSetter, SearchFormState } from "./search-types";

type Props = {
  copy: SearchCopy;
  form: SearchFormState;
  setForm: SearchFormSetter;
  getNightLabel: (value: number) => string;
  getRoomLabel: (value: number) => string;
};

export const SearchFilterStaySection = ({
  copy,
  form,
  setForm,
  getNightLabel,
  getRoomLabel,
}: Props) => (
  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.stay}</p>
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
      {copy.travelDate}
      <input
        type="date"
        value={form.startDate}
        onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value, page: 1 }))}
        className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
      />
    </label>
    <div className="grid gap-2 sm:grid-cols-2">
      <CounterCard label={copy.stayDuration} value={Math.max(1, form.nights)} valueText={`${Math.max(1, form.nights)} ${getNightLabel(Math.max(1, form.nights))}`} min={1} max={30} onChange={(delta) => updateCounter(setForm, "nights", delta, 1, 30)} minusLabel={copy.decreaseStayAria} plusLabel={copy.increaseStayAria} />
      <CounterCard label={copy.totalRooms} value={Math.max(1, form.rooms)} valueText={`${Math.max(1, form.rooms)} ${getRoomLabel(Math.max(1, form.rooms))}`} min={1} max={8} onChange={(delta) => updateCounter(setForm, "rooms", delta, 1, 8)} minusLabel={copy.decreaseRoomsAria} plusLabel={copy.increaseRoomsAria} />
      <CounterCard label={copy.adults} value={form.adults} valueText={`${form.adults} ${copy.peopleUnit}`} min={0} max={10} onChange={(delta) => updateCounter(setForm, "adults", delta, 0, 10)} minusLabel={copy.decreaseAdultsAria} plusLabel={copy.increaseAdultsAria} />
      <CounterCard label={copy.children} value={form.children} valueText={`${form.children} ${copy.peopleUnit}`} min={0} max={10} onChange={(delta) => updateCounter(setForm, "children", delta, 0, 10)} minusLabel={copy.decreaseChildrenAria} plusLabel={copy.increaseChildrenAria} />
    </div>
  </div>
);

const updateCounter = (
  setForm: SearchFormSetter,
  field: "nights" | "adults" | "children" | "rooms",
  delta: number,
  min: number,
  max: number,
) => setForm((prev) => ({ ...prev, [field]: Math.max(min, Math.min(max, prev[field] + delta)), page: 1 }));

type CounterProps = {
  label: string;
  value: number;
  valueText: string;
  min: number;
  max: number;
  onChange: (delta: number) => void;
  minusLabel: string;
  plusLabel: string;
};

const CounterCard = ({
  label,
  value,
  valueText,
  min,
  max,
  onChange,
  minusLabel,
  plusLabel,
}: CounterProps) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-slate-600">{label}</p>
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-sm font-semibold text-slate-700">{valueText}</p>
      <div className="inline-flex items-center gap-2">
        <button type="button" onClick={() => onChange(-1)} disabled={value <= min} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300" aria-label={minusLabel}>-</button>
        <span className="min-w-6 text-center text-sm font-semibold text-slate-900">{value}</span>
        <button type="button" onClick={() => onChange(1)} disabled={value >= max} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300" aria-label={plusLabel}>+</button>
      </div>
    </div>
  </div>
);
