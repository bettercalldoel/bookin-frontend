"use client";

import type { HomeCopy } from "./home-copy";
import type { HomeHeroSlide } from "./home-types";

type Props = {
  copy: HomeCopy;
  heroSlides: HomeHeroSlide[];
  activeSlide: number;
  setActiveSlide: (index: number | ((current: number) => number)) => void;
};

export const HomeHeroCarousel = ({ copy, heroSlides, activeSlide, setActiveSlide }: Props) => (
    <section id="hero" className="surface-panel animate-rise-in rounded-[34px] p-5 md:p-7">
      <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-white/35 md:min-h-[410px]">
        {heroSlides.map((slide, index) => (
          <article key={slide.id} className={`absolute inset-0 transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={index !== activeSlide}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})` }} />
            <div className="absolute inset-0 bg-linear-to-r from-slate-950/70 via-slate-900/40 to-slate-900/20" />
            <div className="relative z-10 flex min-h-[360px] flex-col justify-between p-6 text-white md:min-h-[410px] md:p-8">
              <div className="space-y-3"><span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">{slide.badge}</span><h1 className="font-display max-w-2xl text-4xl leading-tight md:text-5xl">{slide.title}</h1><p className="max-w-2xl text-base text-white/90">{slide.subtitle}</p><p className="max-w-2xl text-sm text-white/80">{slide.description}</p></div>
            </div>
          </article>
        ))}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-4 md:p-6">
          <div className="flex gap-2">{heroSlides.map((slide, index) => <button key={slide.id} type="button" onClick={() => setActiveSlide(index)} className={`h-2.5 rounded-full transition ${index === activeSlide ? "w-8 bg-white" : "w-3 bg-white/55 hover:bg-white/80"}`} aria-label={`Slide ${index + 1}`} />)}</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setActiveSlide((current) => (current === 0 ? heroSlides.length - 1 : current - 1))} disabled={heroSlides.length <= 1} className="h-9 w-9 rounded-full border border-white/60 bg-white/15 text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50" aria-label={copy.slidePrevAria}>{"<"}</button>
            <button type="button" onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)} disabled={heroSlides.length <= 1} className="h-9 w-9 rounded-full border border-white/60 bg-white/15 text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50" aria-label={copy.slideNextAria}>{">"}</button>
          </div>
        </div>
      </div>
    </section>
  );
