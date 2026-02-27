"use client";

import { HomeLanguageToggle } from "./home-language-toggle";
import type { HomeCopy } from "./home-copy";
import type { HomeLocale } from "./home-types";

type NavItem = {
  label: string;
  href: string;
};

type Props = {
  copy: HomeCopy;
  locale: HomeLocale;
  onChangeLocale: (next: HomeLocale) => void;
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
  userName: string | null;
  isTenant: boolean;
  onLogout: () => void;
};

export const HomeSidebar = ({
  copy,
  locale,
  onChangeLocale,
  navItems,
  isOpen,
  onClose,
  userName,
  isTenant,
  onLogout,
}: Props) => (
    <>
      <div className={`fixed inset-0 z-20 bg-slate-900/40 transition ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} aria-hidden={!isOpen} />
      <aside className={`fixed right-0 top-0 z-30 h-full w-72 border-l border-slate-200 bg-white/95 px-5 py-6 shadow-xl backdrop-blur transition-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`} aria-hidden={!isOpen}>
        <div className="flex items-center justify-end"><button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900" aria-label={copy.menuCloseAria}>✕</button></div>
        <div className="mt-4"><HomeLanguageToggle locale={locale} onChange={onChangeLocale} label={copy.languageLabel} compact /></div>
        <nav className="mt-5 flex flex-col gap-2 text-sm font-semibold text-slate-700">{navItems.map((item) => <a key={item.label} href={item.href} onClick={onClose} className="rounded-2xl border border-transparent px-3 py-2 transition hover:border-cyan-200 hover:bg-cyan-50">{item.label}</a>)}</nav>
        <div className="mt-6">
          {userName ? (
            <div className="space-y-2">
              <div className="rounded-full bg-linear-to-r from-cyan-900 to-teal-800 px-4 py-2 text-center text-sm font-semibold text-white">{copy.greeting}, {userName}</div>
              {isTenant ? <a href="/tenant-dashboard" onClick={onClose} className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">{copy.tenantDashboard}</a> : <><a href="/profile" onClick={onClose} className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">{copy.myProfile}</a><a href="/my-transaction" onClick={onClose} className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">{copy.myTransactions}</a><a href="/my-review" onClick={onClose} className="block rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">{copy.myReviews}</a></>}
              <button type="button" onClick={() => { onClose(); onLogout(); }} className="w-full rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900">{copy.logout}</button>
            </div>
          ) : (
            <a href="/login" className="block w-full rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">{copy.login}</a>
          )}
        </div>
      </aside>
    </>
  );
