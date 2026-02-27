"use client";

import type { HomeLocale } from "./home-types";

type Props = {
  locale: HomeLocale;
  onChange: (next: HomeLocale) => void;
  label: string;
  compact?: boolean;
};

export const HomeLanguageToggle = ({ locale, onChange, label, compact = false }: Props) => (
    <div className={`inline-flex items-center gap-2 ${compact ? "w-full justify-between" : "justify-end"}`}>
      <span className={`text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ${compact ? "" : "hidden lg:inline"}`}>{label}</span>
      <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
        <button type="button" onClick={() => onChange("id")} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${locale === "id" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`} aria-pressed={locale === "id"}>ID</button>
        <button type="button" onClick={() => onChange("en")} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`} aria-pressed={locale === "en"}>EN</button>
      </div>
    </div>
  );
