"use client";

import type { SearchCopy } from "./search-copy";
import type { PublicCategory, SearchFormSetter, SearchFormState } from "./search-types";

type Props = {
  copy: SearchCopy;
  form: SearchFormState;
  categories: PublicCategory[];
  mobileAdvancedOpen: boolean;
  setMobileAdvancedOpen: (open: boolean) => void;
  setForm: SearchFormSetter;
};

export const SearchFilterLocationSection = ({
  copy,
  form,
  categories,
  mobileAdvancedOpen,
  setMobileAdvancedOpen,
  setForm,
}: Props) => (
  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.location}</p>
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
      {copy.destination}
      <input
        type="text"
        value={form.destination}
        onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value, page: 1 }))}
        placeholder={copy.destinationPlaceholder}
        className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
      />
    </label>
    <button type="button" onClick={() => setMobileAdvancedOpen(!mobileAdvancedOpen)} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 lg:hidden">
      {mobileAdvancedOpen ? copy.hideAdvancedFilters : copy.advancedFilters}
    </button>
    <div className={`${mobileAdvancedOpen ? "space-y-4" : "hidden"} lg:block`}>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
        {copy.propertyName}
        <input
          value={form.propertyName}
          onChange={(event) => setForm((prev) => ({ ...prev, propertyName: event.target.value, page: 1 }))}
          className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
          placeholder={copy.optional}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
        {copy.category}
        <select
          value={form.category}
          onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value, page: 1 }))}
          className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
        >
          <option value="">{copy.allCategories}</option>
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  </div>
);
