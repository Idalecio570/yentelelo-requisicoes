import { cn } from "@/lib/utils"
import type { RequisitionStatus } from "@/types"

interface BannerConfig {
  bg:      string
  border:  string
  text:    string
  message: string
}

const BANNER: Record<RequisitionStatus, BannerConfig> = {
  pendente: {
    bg:      "bg-amber-50",
    border:  "border-amber-200",
    text:    "text-amber-800",
    message: "Aguarda aprovação da Gestora de Escritório.",
  },
  em_analise_escritorio: {
    bg:      "bg-sky-50",
    border:  "border-sky-200",
    text:    "text-sky-800",
    message: "A Gestora de Escritório está a analisar esta requisição.",
  },
  aprovado_escritorio: {
    bg:      "bg-cyan-50",
    border:  "border-cyan-200",
    text:    "text-cyan-800",
    message: "Aprovada pela Gestora de Escritório. Aguarda aprovação do Director Geral.",
  },
  em_analise_director: {
    bg:      "bg-indigo-50",
    border:  "border-indigo-200",
    text:    "text-indigo-800",
    message: "O Director Geral está a analisar esta requisição.",
  },
  aprovado_final: {
    bg:      "bg-green-50",
    border:  "border-green-200",
    text:    "text-green-800",
    message: "Requisição aprovada. Os pagamentos podem ser registados.",
  },
  rejeitado: {
    bg:      "bg-red-50",
    border:  "border-red-200",
    text:    "text-red-800",
    message: "Requisição rejeitada. Consulte o motivo no histórico de aprovações abaixo.",
  },
  devolvido: {
    bg:      "bg-amber-50",
    border:  "border-amber-200",
    text:    "text-amber-800",
    message: "Requisição devolvida para correcção. Edite e ressubmeta para continuar o processo.",
  },
  cancelado: {
    bg:      "bg-[#f5f5f7]",
    border:  "border-[#d2d2d7]",
    text:    "text-[#6e6e73]",
    message: "Requisição cancelada.",
  },
  rascunho: {
    bg:      "bg-[#f5f5f7]",
    border:  "border-[#d2d2d7]",
    text:    "text-[#6e6e73]",
    message: "Rascunho guardado. Edite e submeta quando estiver pronto.",
  },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hrs  = Math.floor(diff / 3_600_000)
  const days = Math.floor(hrs / 24)
  if (hrs < 1) return "há poucos minutos"
  if (hrs < 24) return `há ${hrs}h`
  if (days === 1) return "há 1 dia"
  return `há ${days} dias`
}

interface StatusContextBannerProps {
  status:       RequisitionStatus
  updatedAt:    string
  lastComment?: string | null
}

export function StatusContextBanner({ status, updatedAt, lastComment }: StatusContextBannerProps) {
  const cfg = BANNER[status]
  if (!cfg) return null

  return (
    <div className="space-y-3 mb-6">
      <div className={cn("px-4 py-3 rounded-[12px] border", cfg.bg, cfg.border)}>
        <p className={cn("text-[13px] font-medium", cfg.text)}>{cfg.message}</p>
        <p className={cn("text-[11px] mt-0.5 opacity-60", cfg.text)}>
          Actualizado {timeAgo(updatedAt)}
        </p>
      </div>

      {status === "devolvido" && lastComment && (
        <div className="flex gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-[12px]">
          <div className="w-1 shrink-0 bg-amber-400 rounded-full" />
          <div>
            <p className="text-[11px] font-semibold text-amber-800 mb-1">Motivo da devolução</p>
            <p className="text-[13px] text-amber-900 whitespace-pre-wrap">{lastComment}</p>
          </div>
        </div>
      )}
    </div>
  )
}
