"use client";

import type { ListingCopy } from "./listing-types";

type SideImage = {
  image: string;
  index: number;
};

type Props = {
  copy: ListingCopy;
  activeImage: string | null;
  gallery: string[];
  sideGalleryImages: SideImage[];
  activeGalleryIndex: number;
  onSelect: (index: number) => void;
  onNavigate: (direction: 1 | -1) => void;
};

export const ListingGallerySection = ({
  copy,
  activeImage,
  gallery,
  sideGalleryImages,
  activeGalleryIndex,
  onSelect,
  onNavigate,
}: Props) => {
  const imageCount = gallery.length;
  const activeDisplay = imageCount > 0 ? Math.min(activeGalleryIndex + 1, imageCount) : 0;
  return (
    <section className="surface-panel space-y-3 rounded-[30px] p-3 sm:p-4">
      <div className="grid gap-2 lg:grid-cols-[2fr_1fr]">
        <div className="relative h-[20rem] overflow-hidden rounded-2xl sm:h-[25rem] lg:h-[28rem] lg:rounded-r-none">
          <div className="absolute inset-0 bg-cover bg-center transition duration-500" style={{ backgroundImage: `url(${activeImage ?? gallery[0]})` }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, slot) => {
            const item = sideGalleryImages[slot];
            if (!item) return <div key={`photo-empty-${slot}`} className="h-[9.7rem] rounded-xl bg-linear-to-br from-slate-100 to-slate-200 sm:h-[13.8rem]" />;
            return (
              <button key={`${item.image}-${item.index}`} type="button" onClick={() => onSelect(item.index)} className="relative h-[9.7rem] overflow-hidden rounded-xl border border-slate-200/80 shadow-[0_12px_22px_-18px_rgba(15,23,42,0.45)] transition hover:scale-[1.01] hover:shadow-[0_18px_28px_-18px_rgba(14,116,144,0.5)] sm:h-[13.8rem]">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{copy.photoOf} {activeDisplay} {copy.from} {imageCount}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onNavigate(-1)} className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">{copy.previous}</button>
          <button type="button" onClick={() => onNavigate(1)} className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-900">{copy.next}</button>
        </div>
      </div>
    </section>
  );
};
