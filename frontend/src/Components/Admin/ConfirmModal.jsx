import Modal from "./Modal";

export default function ConfirmModal({
  open,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  detail,
  dangerText = "Tindakan ini tidak dapat dibatalkan.",
  cancelText = "Batal",
  confirmText = "Hapus",
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal open={open} size="sm" title={title} onClose={onCancel}>
      <div className="space-y-4 text-sm">
        <div className="rounded-xl border bg-white p-3">
          <div className="text-gray-800">{message}</div>
          {detail ? (
            <div className="mt-2 font-semibold text-gray-900">{detail}</div>
          ) : null}
        </div>

        <div className="rounded-xl border bg-red-50 p-3 text-red-700">
          {dangerText}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
