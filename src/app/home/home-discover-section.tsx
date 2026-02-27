"use client";

import type { HomeCopy } from "./home-copy";

type Props = {
  copy: HomeCopy;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  allCategoryKey: string;
};

export const HomeDiscoverSection = ({
  copy,
  categories,
  activeCategory,
  onSelectCategory,
  allCategoryKey,
}: Props) => (
    <section id="discover" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 md:text-xl">{copy.discoverTitle}</h2>
        <a href="#properties" className="text-sm font-semibold text-cyan-800 transition hover:text-cyan-900">{copy.seeListings}</a>
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button key={category} type="button" onClick={() => onSelectCategory(category)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeCategory === category ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-800"}`}>
            {category === allCategoryKey ? copy.allCategories : category}
          </button>
        ))}
      </div>
    </section>
  );
