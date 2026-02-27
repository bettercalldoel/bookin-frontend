"use client";

import { ALL_AMENITY_KEYS, QUICK_FILTER_AMENITY_KEYS, getAmenityLabelByLocale, type AmenityKey } from "@/lib/amenities";
import type { AppLocale } from "@/lib/app-locale";
import type { SearchCopy } from "./search-copy";
import type { SearchFormSetter, SearchFormState } from "./search-types";
import { toggleAmenitySelection } from "./search-utils";

type Props = {
  copy: SearchCopy;
  locale: AppLocale;
  form: SearchFormState;
  setForm: SearchFormSetter;
  showAllAmenitiesFilter: boolean;
  setShowAllAmenitiesFilter: (open: boolean) => void;
  mobileAdvancedOpen: boolean;
};

export const SearchFilterAmenitiesSection = ({
  copy,
  locale,
  form,
  setForm,
  showAllAmenitiesFilter,
  setShowAllAmenitiesFilter,
  mobileAdvancedOpen,
}: Props) => (
  <div className={`${mobileAdvancedOpen ? "space-y-3" : "hidden"} rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:block`}>
    <div>
      <p className="text-sm font-semibold text-slate-700">{copy.amenities}</p>
      <p className="text-xs text-slate-500">{copy.amenitiesHint}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTER_AMENITY_KEYS.map((key) => (
        <AmenityChip key={key} label={getAmenityLabelByLocale(key, locale)} selected={form.amenities.includes(key)} onClick={() => onAmenityToggle(setForm, key)} selectedClassName="border-teal-300 bg-teal-100 text-teal-700" />
      ))}
    </div>
    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
      {copy.filterMode}
      <select
        value={form.amenitiesMode}
        onChange={(event) => setForm((prev) => ({ ...prev, amenitiesMode: event.target.value as "all" | "any", page: 1 }))}
        className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold tracking-normal text-slate-700 focus:border-teal-500 focus:outline-none"
      >
        <option value="any">{copy.filterAny}</option>
        <option value="all">{copy.filterAll}</option>
      </select>
    </label>
    <button type="button" onClick={() => setShowAllAmenitiesFilter(!showAllAmenitiesFilter)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
      {showAllAmenitiesFilter ? copy.hide : copy.otherAmenities}
    </button>
    {showAllAmenitiesFilter ? (
      <div className="flex flex-wrap gap-2">
        {ALL_AMENITY_KEYS.filter((key) => !QUICK_FILTER_AMENITY_KEYS.includes(key)).map((key) => (
          <AmenityChip key={key} label={getAmenityLabelByLocale(key, locale)} selected={form.amenities.includes(key)} onClick={() => onAmenityToggle(setForm, key)} selectedClassName="border-sky-300 bg-sky-100 text-sky-700" />
        ))}
      </div>
    ) : null}
  </div>
);

const onAmenityToggle = (setForm: SearchFormSetter, key: AmenityKey) =>
  setForm((prev) => ({ ...prev, amenities: toggleAmenitySelection(prev.amenities, key), page: 1 }));

type AmenityChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  selectedClassName: string;
};

const AmenityChip = ({ label, selected, onClick, selectedClassName }: AmenityChipProps) => (
  <button type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? selectedClassName : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
    {label}
  </button>
);
