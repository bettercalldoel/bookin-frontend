"use client";

import type { HomeCopy } from "./home-copy";

type Props = {
  copy: HomeCopy;
  totalProperties: number;
  categoryCount: number;
  cityCount: number;
};

export const HomeStatsSection = ({ copy, totalProperties, categoryCount, cityCount }: Props) => (
    <section className="mt-12">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-linear-to-br from-cyan-100 via-white to-teal-100 p-5"><h3 className="text-base font-semibold text-slate-900">{copy.propertiesLabel}</h3><p className="mt-2 text-2xl font-semibold text-slate-900">{totalProperties}</p><p className="mt-1 text-sm text-slate-600">{copy.statsAvailableDesc}</p></article>
        <article className="rounded-3xl border border-slate-200 bg-linear-to-br from-teal-100 via-white to-emerald-100 p-5"><h3 className="text-base font-semibold text-slate-900">{copy.statsCategories}</h3><p className="mt-2 text-2xl font-semibold text-slate-900">{categoryCount}</p><p className="mt-1 text-sm text-slate-600">{copy.statsCategoriesDesc}</p></article>
        <article className="rounded-3xl border border-slate-200 bg-linear-to-br from-sky-100 via-white to-cyan-100 p-5"><h3 className="text-base font-semibold text-slate-900">{copy.statsCities}</h3><p className="mt-2 text-2xl font-semibold text-slate-900">{cityCount}</p><p className="mt-1 text-sm text-slate-600">{copy.statsCitiesDesc}</p></article>
      </div>
    </section>
  );
