"use client";

import type { ListingCopy, ListingRoom, ListingLocale } from "./listing-types";
import { formatIDR } from "./listing-utils";

type Props = {
  copy: ListingCopy;
  locale: ListingLocale;
  rooms: ListingRoom[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
};

export const ListingRoomOptionsSection = ({
  copy,
  locale,
  rooms,
  selectedRoomId,
  onSelectRoom,
}: Props) => (
  <section className="surface-panel rounded-3xl p-6 sm:p-7">
    <h3 className="text-xl font-semibold text-slate-900">{copy.roomOptions}</h3>
    <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white/90">
      {rooms.map((room) => (
        <div key={room.id} className="flex flex-col gap-3 p-4 transition hover:bg-cyan-50/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">{room.name}</p>
            <p className="text-sm text-slate-600">{room.description}</p>
            <p className="mt-1 text-xs text-slate-500">{copy.capacity} {room.maxGuests} {copy.guestUnit} · {room.totalUnits} {copy.unit}</p>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <p className="text-sm font-semibold text-slate-900">{formatIDR(room.basePrice, locale)}</p>
            <button type="button" onClick={() => onSelectRoom(room.id)} className={`rounded-lg border px-4 py-1.5 text-xs font-semibold transition ${selectedRoomId === room.id ? "border-cyan-700 bg-cyan-700 text-white shadow-sm" : "border-slate-300 text-slate-700 hover:border-cyan-300 hover:text-cyan-900"}`}>
              {selectedRoomId === room.id ? copy.selectedLabel : copy.selectRoom}
            </button>
          </div>
        </div>
      ))}
    </div>
  </section>
);
