import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open:       boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Card */}
      <div
        className={cn(
          "relative z-10 bg-white rounded-[18px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto",
          "ring-1 ring-black/[0.06]",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#d2d2d7]">
            <h2 className="text-[15px] font-semibold text-[#1d1d1f]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[8px] text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
