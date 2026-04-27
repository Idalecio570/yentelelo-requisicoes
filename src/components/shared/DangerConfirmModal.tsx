import { AlertTriangle, Loader2 } from "lucide-react"
import { Modal } from "./Modal"

interface DangerConfirmModalProps {
  open:             boolean
  onClose:          () => void
  onConfirm:        () => void
  title:            string
  description:      string
  confirmLabel?:    string
  isPending?:       boolean
  requireComment?:  boolean
  comment?:         string
  onCommentChange?: (v: string) => void
}

export function DangerConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel    = "Confirmar",
  isPending       = false,
  requireComment  = false,
  comment         = "",
  onCommentChange,
}: DangerConfirmModalProps) {
  const canConfirm = !requireComment || comment.trim().length > 0

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex gap-3 p-3 bg-red-50 rounded-md border border-red-100">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 leading-relaxed">{description}</p>
        </div>

        {requireComment && onCommentChange !== undefined && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              rows={3}
              placeholder="Explique o motivo…"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending || !canConfirm}
            className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
