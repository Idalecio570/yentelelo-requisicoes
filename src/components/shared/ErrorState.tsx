import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = "Ocorreu um erro ao carregar os dados.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-11 h-11 rounded-full bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-4">
        <AlertCircle size={20} className="text-red-600" />
      </div>
      <p className="text-[14px] font-medium text-[#1d1d1f] mb-1">{message}</p>
      <p className="text-[12px] text-[#6e6e73] mb-5">Verifique a ligação e tente novamente.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] rounded-full hover:bg-[#e8e8ed] transition-colors"
        >
          <RefreshCw size={13} />
          Tentar novamente
        </button>
      )}
    </div>
  )
}
