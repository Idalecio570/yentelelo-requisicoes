import { cn } from "@/lib/utils"
import type { RequisitionStatus } from "@/types"

interface Config {
  label:   string
  bg:      string
  fg:      string
  dot:     string
  tooltip: string
}

const ESTADO_CONFIG: Record<RequisitionStatus, Config> = {
  pendente: {
    label:   "Pendente",
    bg:      "#F1F2F5",
    fg:      "#475569",
    dot:     "#94A3B8",
    tooltip: "Aguarda análise da Gestora de Escritório",
  },
  em_analise_escritorio: {
    label:   "Em análise",
    bg:      "#EEF2F7",
    fg:      "#1E40AF",
    dot:     "#3B6FB6",
    tooltip: "A Gestora de Escritório está a rever esta requisição",
  },
  aprovado_escritorio: {
    label:   "Aprov. Escritório",
    bg:      "#ECF4EF",
    fg:      "#2F6B47",
    dot:     "#4F9970",
    tooltip: "Aprovada no 1.º nível — aguarda Director Geral",
  },
  em_analise_director: {
    label:   "Em análise — Dir.",
    bg:      "#F0EFF7",
    fg:      "#4C3F8F",
    dot:     "#7967C7",
    tooltip: "O Director Geral está a rever",
  },
  aprovado_final: {
    label:   "Aprovação Final",
    bg:      "#002C62",
    fg:      "#FFFFFF",
    dot:     "#FCC631",
    tooltip: "Aprovada em todos os níveis",
  },
  rejeitado: {
    label:   "Rejeitado",
    bg:      "#FBECEC",
    fg:      "#B0211F",
    dot:     "#EF2627",
    tooltip: "Requisição recusada definitivamente",
  },
  cancelado: {
    label:   "Cancelado",
    bg:      "#F1F2F5",
    fg:      "#94A3B8",
    dot:     "#CBD5E1",
    tooltip: "Cancelada pelo colaborador",
  },
  devolvido: {
    label:   "Devolvido",
    bg:      "#FBF3E6",
    fg:      "#8A5A0B",
    dot:     "#D4A02A",
    tooltip: "Devolvida ao colaborador para correcção",
  },
  rascunho: {
    label:   "Rascunho",
    bg:      "#F1F2F5",
    fg:      "#94A3B8",
    dot:     "#CBD5E1",
    tooltip: "Rascunho guardado, ainda não submetido",
  },
}

interface StatusBadgeProps {
  estado:     RequisitionStatus
  className?: string
}

export function StatusBadge({ estado, className }: StatusBadgeProps) {
  const cfg = ESTADO_CONFIG[estado]
  if (!cfg) return null

  return (
    <span className={cn("relative group/badge inline-flex", className)}>
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium leading-none cursor-default select-none"
        style={{ background: cfg.bg, color: cfg.fg }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: cfg.dot }}
        />
        {cfg.label}
      </span>

      {/* Tooltip */}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
          "px-2.5 py-1.5 rounded-[6px] text-white text-[11px] whitespace-nowrap leading-tight",
          "opacity-0 group-hover/badge:opacity-100",
          "transition-opacity duration-150 delay-300 z-50"
        )}
        style={{ background: "#0F172A", boxShadow: "0 4px 16px -4px rgba(15,23,42,.18)" }}
      >
        {cfg.tooltip}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: "#0F172A" }} />
      </span>
    </span>
  )
}
