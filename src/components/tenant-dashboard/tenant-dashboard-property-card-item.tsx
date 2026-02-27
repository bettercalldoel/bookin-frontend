import { BUTTON_THEME } from "@/lib/button-theme";
import type { PropertyCard } from "./tenant-dashboard-property-section.types";

type Props = {
  property: PropertyCard;
  onManageRoom: (propertyId: string, firstRoomId?: string) => void;
  onDeleteProperty: (propertyId: string, propertyName: string) => void;
  propertyDeleteLoadingId: string | null;
};

export function TenantPropertyCardItem({
  property,
  onManageRoom,
  onDeleteProperty,
  propertyDeleteLoadingId,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
      <div className="relative h-64 overflow-hidden">
        <img src={property.image} alt={property.name} className="h-full w-full object-cover" />
        <span
          className={`absolute left-3 top-3 rounded-md px-2 py-1 text-xs font-semibold text-white ${
            property.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
          }`}
        >
          {property.status === "Active" ? "Aktif" : "Perawatan"}
        </span>
        <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700">
          {property.type}
        </span>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-2xl font-bold leading-tight text-slate-900">{property.name}</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600">
            ★ {property.rating}
            {property.ratingCount > 0 ? ` (${property.ratingCount})` : ""}
          </span>
        </div>

        <p className="text-sm text-slate-500">{property.location}</p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-base font-medium text-slate-700">{property.rooms.length} Kamar</p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a
              href={`/tenant-property?edit=${encodeURIComponent(property.id)}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900"
            >
              Edit Properti
            </a>
            <button
              type="button"
              onClick={() => onManageRoom(property.id, property.rooms[0]?.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition hover:bg-cyan-100 ${BUTTON_THEME.softActive}`}
            >
              Kelola Kamar
            </button>
            <button
              type="button"
              onClick={() => onDeleteProperty(property.id, property.name)}
              disabled={propertyDeleteLoadingId === property.id}
              className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {propertyDeleteLoadingId === property.id ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
