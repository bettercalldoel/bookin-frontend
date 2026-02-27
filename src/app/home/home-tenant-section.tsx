"use client";

import { BUTTON_THEME, HOMEPAGE_PRIMARY_BUTTON } from "@/lib/button-theme";
import type { HomeCopy } from "./home-copy";
import type { HomeLocale } from "./home-types";

type Props = {
  copy: HomeCopy;
  locale: HomeLocale;
};

const TENANT_CARDS = {
  id: [
    { title: "Lengkapi Profil Properti", desc: "Isi kategori, alamat, deskripsi, dan nilai tambah properti Anda." },
    { title: "Kelola Kalender & Harga", desc: "Atur ketersediaan kamar dan harga musiman dengan cepat." },
    { title: "Siap Terima Reservasi", desc: "Terhubung langsung dengan calon tamu yang sudah melakukan pencarian." },
  ],
  en: [
    { title: "Complete Property Profile", desc: "Fill category, address, description, and key highlights." },
    { title: "Manage Calendar & Pricing", desc: "Set room availability and seasonal pricing quickly." },
    { title: "Ready for Reservations", desc: "Connect with guests actively searching for stays." },
  ],
} as const;

export const HomeTenantSection = ({ copy, locale }: Props) => {
  const cards = locale === "id" ? TENANT_CARDS.id : TENANT_CARDS.en;
  return (
    <section id="hero" className="surface-panel animate-rise-in rounded-[34px] p-6 md:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-4"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600">{copy.tenantModeLabel}</p><h1 className="font-display text-4xl leading-tight text-slate-900 md:text-5xl">{copy.tenantHeroTitle}</h1><p className="text-sm text-slate-600 md:text-base">{copy.tenantHeroDesc}</p></div>
        <a href="/tenant-property" className={`inline-flex items-center justify-center ${HOMEPAGE_PRIMARY_BUTTON} ${BUTTON_THEME.solid}`}>{copy.tenantPrimaryCta}</a>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((item) => <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/88 px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-2 text-sm text-slate-500">{item.desc}</p></div>)}
      </div>
    </section>
  );
};
