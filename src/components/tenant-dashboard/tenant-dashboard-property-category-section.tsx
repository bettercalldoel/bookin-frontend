import { BUTTON_THEME, INPUT_THEME } from "@/lib/button-theme";
import type { CategoryRow } from "./tenant-dashboard-property-section.types";

type Props = {
  onSwitchToPropertyManagement: () => void;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  onCreateCategory: () => void;
  categoryCreateLoading: boolean;
  categoriesError: string | null;
  categoryCreateError: string | null;
  categoryCreateFeedback: string | null;
  categoriesLoading: boolean;
  categoryRows: CategoryRow[];
  editingCategoryId: string | null;
  categoryNameDrafts: Record<string, string>;
  onCategoryDraftChange: (id: string, value: string) => void;
  onSubmitEditCategory: (category: CategoryRow) => void;
  onCancelEditCategory: () => void;
  onStartEditCategory: (category: CategoryRow) => void;
  onDeleteCategory: (category: CategoryRow) => void;
};

export function TenantPropertyCategorySection({
  onSwitchToPropertyManagement,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
  categoryCreateLoading,
  categoriesError,
  categoryCreateError,
  categoryCreateFeedback,
  categoriesLoading,
  categoryRows,
  editingCategoryId,
  categoryNameDrafts,
  onCategoryDraftChange,
  onSubmitEditCategory,
  onCancelEditCategory,
  onStartEditCategory,
  onDeleteCategory,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-slate-900">Properti & Kamar</h2>
          <p className="mt-1 text-sm text-slate-500">Kelola properti, kamar, dan kategori.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg border border-slate-200 bg-white/90 p-1 backdrop-blur">
            <button
              type="button"
              onClick={onSwitchToPropertyManagement}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Properti
            </button>
            <button type="button" className={`rounded-md px-4 py-1.5 text-sm font-medium shadow-sm ${BUTTON_THEME.softActive}`}>
              Kategori
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newCategoryName}
            onChange={(event) => onNewCategoryNameChange(event.target.value)}
            placeholder="Masukkan nama kategori"
            className={`h-11 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm ${INPUT_THEME.focus}`}
          />
          <button
            type="button"
            onClick={onCreateCategory}
            disabled={categoryCreateLoading}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${BUTTON_THEME.solid} disabled:opacity-60`}
          >
            {categoryCreateLoading ? "Menyimpan..." : "Tambah Kategori"}
          </button>
        </div>

        {categoriesError ? <p className="text-xs text-rose-600">{categoriesError}</p> : null}
        {categoryCreateError ? <p className="text-xs text-rose-600">{categoryCreateError}</p> : null}
        {categoryCreateFeedback ? <p className="text-xs text-emerald-700">{categoryCreateFeedback}</p> : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/88 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4">Nama Kategori</th>
                <th className="px-6 py-4">Jumlah Properti</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoriesLoading ? (
                <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-500">Memuat kategori...</td></tr>
              ) : categoryRows.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-500">Belum ada kategori.</td></tr>
              ) : (
                categoryRows.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {editingCategoryId === category.id ? (
                        <input
                          type="text"
                          value={categoryNameDrafts[category.id] ?? category.name}
                          onChange={(event) => onCategoryDraftChange(category.id, event.target.value)}
                          className={`h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 ${INPUT_THEME.focus}`}
                        />
                      ) : category.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{category.propertiesCount} properti</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingCategoryId === category.id ? (
                          <>
                            <button type="button" onClick={() => onSubmitEditCategory(category)} disabled={categoryCreateLoading} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60">Simpan</button>
                            <button type="button" onClick={onCancelEditCategory} disabled={categoryCreateLoading} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60">Batal</button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => onStartEditCategory(category)} disabled={categoryCreateLoading} className="rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60">Ubah</button>
                            <button type="button" onClick={() => onDeleteCategory(category)} disabled={categoryCreateLoading} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60">Hapus</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
