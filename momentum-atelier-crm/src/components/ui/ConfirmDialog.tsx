"use client";

import { Modal } from "./Modal";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-ink-700 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className="btn bg-clay-600 text-parchment-50 hover:bg-clay-500"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
