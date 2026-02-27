import { INPUT_THEME } from "@/lib/button-theme";
import { TenantPropertyCardItem } from "./tenant-dashboard-property-card-item";
import type { PropertyCard } from "./tenant-dashboard-property-section.types";

type Props = {
  onSwitchToCategory: () => void;
  propertySearch: string;
  onPropertySearchChange: (value: string) => void;
  propertySortBy: "createdAt" | "name" | "cityName";
  onPropertySortByChange: (value: "createdAt" | "name" | "cityName") => void;
  propertySortOrder: "asc" | "desc";
  onPropertySortOrderChange: (value: "asc" | "desc") => void;
  propertiesError: string | null;
  propertyActionError: string | null;
  propertyActionFeedback: string | null;
  propertiesLoading: boolean;
  filteredPropertyCards: PropertyCard[];
  onManageRoom: (propertyId: string, firstRoomId?: string) => void;
  onDeleteProperty: (propertyId: string, propertyName: string) => void;
  propertyDeleteLoadingId: string | null;
  propertyListLimit: number;
  onPropertyListLimitChange: (value: number) => void;
  propertyListMeta: { page: number; totalPages: number; hasPrev: boolean; hasNext: boolean };
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function TenantPropertyManagementSection({
  onSwitchToCategory,
  propertySearch,
  onPropertySearchChange,
  propertySortBy,
  onPropertySortByChange,
  propertySortOrder,
  onPropertySortOrderChange,
  propertiesError,
  propertyActionError,
  propertyActionFeedback,
  propertiesLoading,
  filteredPropertyCards,
  onManageRoom,
  onDeleteProperty,
  propertyDeleteLoadingId,
  propertyListLimit,
  onPropertyListLimitChange,
  propertyListMeta,
  onPrevPage,
  onNextPage,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-slate-900">Properti & Kamar</h2>
          <p className="mt-1 text-sm text-slate-500">Kelola properti, kamar, dan kategori.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white/90 p-1 backdrop-blur">
            <button type="button" className="rounded-md px-4 py-1.5 text-sm font-medium shadow-sm text-slate-900">Properti</button>
            <button type="button" onClick={onSwitchToCategory} className="rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900">Kategori</button>
          </div>
          <a href="/tenant-property" className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium shadow-sm bg-slate-900 text-white">+ Tambah Properti</a>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="M20 20L17 17" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input type="text" value={propertySearch} onChange={(event) => onPropertySearchChange(event.target.value)} placeholder="Cari nama, lokasi, atau kategori properti" className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 ${INPUT_THEME.focus}`} />
        </div>
        <select value={propertySortBy} onChange={(event) => onPropertySortByChange(event.target.value as "createdAt" | "name" | "cityName")} className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}>
          <option value="createdAt">Urutkan: Terbaru</option>
          <option value="name">Urutkan: Nama properti</option>
          <option value="cityName">Urutkan: Kota</option>
        </select>
        <select value={propertySortOrder} onChange={(event) => onPropertySortOrderChange(event.target.value as "asc" | "desc")} className={`h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}>
          <option value="desc">Menurun</option>
          <option value="asc">Menaik</option>
        </select>
        {propertiesError ? <p className="text-xs text-rose-600 md:col-span-2 xl:col-span-4">{propertiesError}</p> : null}
        {propertyActionError ? <p className="text-xs text-rose-600 md:col-span-2 xl:col-span-4">{propertyActionError}</p> : null}
        {propertyActionFeedback ? <p className="text-xs text-emerald-700 md:col-span-2 xl:col-span-4">{propertyActionFeedback}</p> : null}
        {propertiesLoading ? <p className="text-xs text-slate-500 md:col-span-2 xl:col-span-4">Memuat properti...</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {filteredPropertyCards.map((property) => (
          <TenantPropertyCardItem
            key={property.id}
            property={property}
            onManageRoom={onManageRoom}
            onDeleteProperty={onDeleteProperty}
            propertyDeleteLoadingId={propertyDeleteLoadingId}
          />
        ))}
      </div>

      {!propertiesLoading && filteredPropertyCards.length === 0 ? (
        <div className="surface-panel rounded-xl px-4 py-6 text-sm text-slate-500">Tidak ada properti yang cocok dengan pencarian.</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="text-xs text-slate-500">Baris:
          <select value={propertyListLimit} onChange={(event) => onPropertyListLimitChange(Number(event.target.value) || 9)} className={`ml-2 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 ${INPUT_THEME.focus}`}>
            {[6, 9, 12, 18].map((option) => (<option key={option} value={option}>{option}</option>))}
          </select>
        </label>
        <button type="button" onClick={onPrevPage} disabled={propertiesLoading || !propertyListMeta.hasPrev} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Sebelumnya</button>
        <span className="text-xs font-semibold text-slate-600">{propertyListMeta.page} / {propertyListMeta.totalPages}</span>
        <button type="button" onClick={onNextPage} disabled={propertiesLoading || !propertyListMeta.hasNext} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Selanjutnya</button>
      </div>
    </div>
  );
}
