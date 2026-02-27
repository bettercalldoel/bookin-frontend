"use client";

import { BUTTON_THEME, INPUT_THEME } from "@/lib/button-theme";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { HomeCopy } from "./home-copy";
import type { HomeSearchForm } from "./home-types";

type Panel = "when" | "who" | null;

type Props = {
  copy: HomeCopy;
  searchForm: HomeSearchForm;
  setSearchForm: Dispatch<SetStateAction<HomeSearchForm>>;
  openSearchPanel: Panel;
  setOpenSearchPanel: (panel: Panel) => void;
  searchPanelRef: RefObject<HTMLDivElement | null>;
  whenSummary: string;
  whoSummary: string;
  onSubmit: () => void;
  onUpdateNights: (delta: number) => void;
  onUpdateAdults: (delta: number) => void;
  onUpdateChildren: (delta: number) => void;
};

export const HomeSearchSection = ({
  copy,
  searchForm,
  setSearchForm,
  openSearchPanel,
  setOpenSearchPanel,
  searchPanelRef,
  whenSummary,
  whoSummary,
  onSubmit,
  onUpdateNights,
  onUpdateAdults,
  onUpdateChildren,
}: Props) => {
  return (
    <section id="search" className="animate-rise-in mt-8 w-full">
      <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.38)] sm:px-5 sm:py-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">{copy.searchFormLabel}</p><h2 className="mt-1 text-base font-semibold text-slate-900 md:text-lg">{copy.searchFormTitle}</h2></div>
        <div ref={searchPanelRef} className="relative mt-4">
          <form className="rounded-3xl border border-slate-200 bg-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.28)] md:overflow-hidden md:rounded-full" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
            <div className="flex flex-col md:flex-row md:items-stretch">
              <div className="border-b border-slate-200 px-4 py-2.5 md:flex-1 md:border-b-0 md:border-r">
                <label className="text-[11px] font-semibold text-slate-700">{copy.searchWhereLabel}</label>
                <input type="text" value={searchForm.destination} onChange={(event) => setSearchForm((prev) => ({ ...prev, destination: event.target.value }))} placeholder={copy.searchWherePlaceholder} className={`mt-0.5 h-6 w-full rounded-md border border-transparent bg-white px-0 text-sm font-medium text-slate-800 ${INPUT_THEME.focus}`} />
              </div>
              <button type="button" onClick={() => setOpenSearchPanel(openSearchPanel === "when" ? null : "when")} className={`border-b border-slate-200 px-4 py-2.5 text-left transition md:flex-1 md:border-b-0 md:border-r ${openSearchPanel === "when" ? "bg-cyan-50/60" : "hover:bg-slate-50"}`}><p className="text-[11px] font-semibold text-slate-700">{copy.searchWhenLabel}</p><p className="mt-0.5 text-sm font-medium text-slate-800">{whenSummary}</p></button>
              <button type="button" onClick={() => setOpenSearchPanel(openSearchPanel === "who" ? null : "who")} className={`border-b border-slate-200 px-4 py-2.5 text-left transition md:w-52 md:border-b-0 md:border-r ${openSearchPanel === "who" ? "bg-cyan-50/60" : "hover:bg-slate-50"}`}><p className="text-[11px] font-semibold text-slate-700">{copy.searchWhoLabel}</p><p className="mt-0.5 text-sm font-medium text-slate-800">{whoSummary}</p></button>
              <div className="px-3 py-3 md:flex md:items-center md:justify-center md:px-2.5 md:py-2"><button type="submit" className={`inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold md:h-10 md:w-10 md:rounded-full md:text-xs ${BUTTON_THEME.solid}`} aria-label={copy.searchSubmitAria}>{copy.searchSubmitText}</button></div>
            </div>
          </form>
          {openSearchPanel === "when" ? <WhenPanel copy={copy} searchForm={searchForm} setSearchForm={setSearchForm} onUpdateNights={onUpdateNights} /> : null}
          {openSearchPanel === "who" ? <WhoPanel copy={copy} searchForm={searchForm} onUpdateAdults={onUpdateAdults} onUpdateChildren={onUpdateChildren} /> : null}
        </div>
      </div>
    </section>
  );
};

const WhenPanel = ({ copy, searchForm, setSearchForm, onUpdateNights }: { copy: HomeCopy; searchForm: HomeSearchForm; setSearchForm: Dispatch<SetStateAction<HomeSearchForm>>; onUpdateNights: (delta: number) => void; }) => (
  <div className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_24px_38px_-24px_rgba(15,23,42,0.55)] md:absolute md:left-1/2 md:top-full md:z-20 md:mt-3 md:w-[420px] md:-translate-x-1/2">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.whenPanelTitle}</p>
    <label className="mt-3 block text-xs font-semibold text-slate-600">{copy.checkInLabel}</label>
    <input type="date" value={searchForm.startDate} onChange={(event) => setSearchForm((prev) => ({ ...prev, startDate: event.target.value }))} className={`mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 ${INPUT_THEME.focus}`} />
    <div className="mt-3 rounded-lg border border-slate-200 px-3 py-2"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-700">{copy.stayDuration}</p><div className="inline-flex items-center gap-2"><button type="button" onClick={() => onUpdateNights(-1)} disabled={searchForm.nights <= 1} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300">-</button><span className="min-w-6 text-center text-sm font-semibold text-slate-900">{searchForm.nights}</span><button type="button" onClick={() => onUpdateNights(1)} disabled={searchForm.nights >= 30} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300">+</button></div></div></div>
  </div>
);

const WhoPanel = ({ copy, searchForm, onUpdateAdults, onUpdateChildren }: { copy: HomeCopy; searchForm: HomeSearchForm; onUpdateAdults: (delta: number) => void; onUpdateChildren: (delta: number) => void; }) => (
  <div className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_24px_38px_-24px_rgba(15,23,42,0.55)] md:absolute md:left-1/2 md:top-full md:z-20 md:mt-3 md:w-[420px] md:-translate-x-1/2">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{copy.whoPanelTitle}</p>
    <div className="mt-3 space-y-2"><GuestRow label={copy.adultsLabel} hint={copy.adultsHint} value={searchForm.adults} onChange={onUpdateAdults} min={1} max={10} /><GuestRow label={copy.childrenLabel} hint={copy.childrenHint} value={searchForm.children} onChange={onUpdateChildren} min={0} max={10} /></div>
  </div>
);

const GuestRow = ({ label, hint, value, onChange, min, max }: { label: string; hint: string; value: number; onChange: (delta: number) => void; min: number; max: number; }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
    <div><p className="text-sm font-semibold text-slate-800">{label}</p><p className="text-xs text-slate-500">{hint}</p></div>
    <div className="inline-flex items-center gap-2"><button type="button" onClick={() => onChange(-1)} disabled={value <= min} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300">-</button><span className="min-w-4 text-center text-sm font-semibold text-slate-900">{value}</span><button type="button" onClick={() => onChange(1)} disabled={value >= max} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300">+</button></div>
  </div>
);
