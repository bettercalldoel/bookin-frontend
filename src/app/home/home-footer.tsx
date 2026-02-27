"use client";

import type { HomeCopy } from "./home-copy";

type Props = {
  copy: HomeCopy;
  isTenant: boolean;
};

export const HomeFooter = ({ copy, isTenant }: Props) => (
  <footer id="support" className="border-t border-slate-200 bg-white/82 backdrop-blur">
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-3"><p className="font-display text-2xl text-slate-900">{copy.footerAboutTitle}</p><p className="text-sm text-slate-500">{copy.footerAboutDesc}</p></div>
      <div className="space-y-3 text-sm text-slate-600"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{copy.footerFeaturesTitle}</p><p>{copy.footerFeature1}</p><p>{copy.footerFeature2}</p><p>{copy.footerFeature3}</p></div>
      <div className="space-y-3 text-sm text-slate-600"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{copy.footerContactTitle}</p><p>{copy.footerContactHours}</p><p>Email: support@bookin.id</p><p>WhatsApp: +62 812-3456-7890</p></div>
      <div className="space-y-3 text-sm text-slate-600">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{copy.footerNavigationTitle}</p>
        <a className="block transition hover:text-slate-900" href="#hero">{copy.footerNavHome}</a>
        {!isTenant ? <><a className="block transition hover:text-slate-900" href="#search">{copy.footerNavSearch}</a><a className="block transition hover:text-slate-900" href="#properties">{copy.footerNavProperties}</a></> : <a className="block transition hover:text-slate-900" href="/tenant-property">{copy.navTenantProperty}</a>}
      </div>
    </div>
  </footer>
);
