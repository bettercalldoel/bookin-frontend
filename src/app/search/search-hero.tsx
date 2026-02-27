"use client";

import Link from "next/link";
import type { SearchCopy } from "./search-copy";

type Props = {
  copy: SearchCopy;
  destinationLabel: string;
  headerTitle: string;
  stayDateSummary: string;
  guestSummary: string;
  nights: number;
  roomCount: number;
  getNightLabel: (value: number) => string;
  getRoomLabel: (value: number) => string;
};

export const SearchHero = ({
  copy,
  destinationLabel,
  headerTitle,
  stayDateSummary,
  guestSummary,
  nights,
  roomCount,
  getNightLabel,
  getRoomLabel,
}: Props) => (
  <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-teal-950 px-4 py-10 text-white sm:px-6 sm:py-12">
    <div className="mx-auto w-full max-w-6xl">
      <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/15">
        <span aria-hidden="true">{"<"}</span>
        {copy.backToHome}
      </Link>
      <div className="mt-4 rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">{copy.searchResults}</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{headerTitle}</h1>
        <p className="mt-2 text-sm text-slate-200">{stayDateSummary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip text={destinationLabel} />
          <Chip text={`${nights} ${getNightLabel(nights)}`} />
          <Chip text={guestSummary} />
          <Chip text={`${roomCount} ${getRoomLabel(roomCount)}`} />
        </div>
      </div>
    </div>
    <div className="pointer-events-none absolute -right-24 top-10 h-52 w-52 rounded-full bg-teal-400/30 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-12 left-12 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" />
  </section>
);

const Chip = ({ text }: { text: string }) => (
  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95">
    {text}
  </span>
);
