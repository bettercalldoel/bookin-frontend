"use client";

import { BUTTON_THEME } from "@/lib/button-theme";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  eyebrow?: string;
  zIndexClassName?: string;
  eyebrowClassName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busyLabel?: string;
  confirmTone?: "default" | "danger";
};

export default function ConfirmModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  loading = false,
  eyebrow = "Konfirmasi",
  zIndexClassName = "z-[70]",
  eyebrowClassName = "text-slate-600",
  confirmLabel = "Ya",
  cancelLabel = "Batal",
  busyLabel = "Memproses...",
  confirmTone = "default",
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-slate-900/55 px-4`}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.3em] ${eyebrowClassName}`}
        >
          {eyebrow}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm text-slate-600">{description}</p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60 ${
              confirmTone === "danger"
                ? "bg-rose-600 text-white transition hover:bg-rose-500"
                : BUTTON_THEME.solid
            }`}
          >
            {loading ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
