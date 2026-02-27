"use client";

import { createPortal } from "react-dom";
import type { RefObject } from "react";
import { HomeLanguageToggle } from "./home-language-toggle";
import type { HomeCopy } from "./home-copy";
import type { HomeLocale } from "./home-types";

type MenuPosition = {
  top: number;
  right: number;
} | null;

type Props = {
  copy: HomeCopy;
  locale: HomeLocale;
  onChangeLocale: (next: HomeLocale) => void;
  isTenant: boolean;
  userName: string | null;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  menuPosition: MenuPosition;
  setSidebarOpen: (open: boolean) => void;
  userMenuRef: RefObject<HTMLDivElement | null>;
  userMenuButtonRef: RefObject<HTMLButtonElement | null>;
  onLogout: () => void;
};

export const HomeHeader = ({
  copy,
  locale,
  onChangeLocale,
  isTenant,
  userName,
  isUserMenuOpen,
  setIsUserMenuOpen,
  menuPosition,
  setSidebarOpen,
  userMenuRef,
  userMenuButtonRef,
  onLogout,
}: Props) => (
    <header className="sticky top-0 z-[200] border-b border-slate-200/85 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <a href="#hero" className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-800" /><p className="font-display text-xl font-semibold text-slate-900">BookIn</p></a>
        {!isTenant ? <a href="#search" className="hidden items-center gap-2 text-sm font-semibold text-cyan-800 transition hover:text-cyan-900 lg:inline-flex"><span>{copy.searchHeaderCta}</span><span className="text-cyan-700">{">"}</span></a> : null}
        <div className="flex items-center gap-3">
          <HomeLanguageToggle locale={locale} onChange={onChangeLocale} label={copy.languageLabel} />
          <button onClick={() => setSidebarOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900 md:hidden" aria-label={copy.menuOpenAria}>
            <span className="flex flex-col gap-1.5"><span className="h-0.5 w-5 rounded-full bg-cyan-900" /><span className="h-0.5 w-5 rounded-full bg-cyan-900" /><span className="h-0.5 w-5 rounded-full bg-cyan-900" /></span>
          </button>
          {userName ? (
            <div ref={userMenuRef} data-user-menu className="relative hidden items-center gap-2 md:flex">
              <span className="rounded-full bg-linear-to-r from-cyan-900 to-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-sm">{copy.greeting}, {userName}</span>
              <button type="button" ref={userMenuButtonRef} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-900">{copy.menuLabel}</button>
              {isUserMenuOpen && menuPosition ? createPortal(<UserMenu copy={copy} isTenant={isTenant} menuPosition={menuPosition} onLogout={onLogout} />, document.body) : null}
            </div>
          ) : (
            <a href="/login" className="hidden rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900 md:inline-flex">{copy.login}</a>
          )}
        </div>
      </nav>
    </header>
  );

const UserMenu = ({
  copy,
  isTenant,
  menuPosition,
  onLogout,
}: {
  copy: HomeCopy;
  isTenant: boolean;
  menuPosition: { top: number; right: number };
  onLogout: () => void;
}) => (
  <div data-user-menu className="fixed z-[1000] w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/15" style={{ top: menuPosition.top, right: menuPosition.right }}>
    {isTenant ? <a href="/tenant-dashboard" className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50">{copy.tenantDashboard}</a> : <><a href="/profile" className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50">{copy.myProfile}</a><a href="/my-transaction" className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50">{copy.myTransactions}</a><a href="/my-review" className="block px-4 py-3 text-xs font-semibold text-slate-700 transition hover:bg-cyan-50">{copy.myReviews}</a></>}
    <button type="button" onClick={onLogout} className="block w-full px-4 py-3 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50">{copy.logout}</button>
  </div>
);
