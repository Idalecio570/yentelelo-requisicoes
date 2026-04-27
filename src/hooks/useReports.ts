import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Requisition } from "@/types"

export interface StatsFilters {
  start:      string
  end:        string
  direcao_id?: string
  tipo?:       string
}

export interface RequisitionStats {
  total:           number
  porStatus:       Record<string, number>
  porDirecao:      Record<string, number>
  porTipo:         Record<string, number>
  porUrgencia:     Record<string, number>
  valorTotalEstimado: number
  valorTotalPago:  number
  mediaDiasAprovacao: number
}

export function useRequisitionStats(filters: StatsFilters) {
  const key = JSON.stringify(filters)
  return useQuery({
    queryKey: QUERY_KEYS.stats(key),
    queryFn: async (): Promise<RequisitionStats> => {
      let query = supabase
        .from("requisitions")
        .select("*, direcao:direcoes(nome,codigo)")
        .gte("created_at", filters.start)
        .lte("created_at", filters.end + "T23:59:59")

      if (filters.direcao_id) query = query.eq("direcao_id", filters.direcao_id)
      if (filters.tipo)       query = query.eq("tipo", filters.tipo)

      const { data, error } = await query
      if (error) throw error
      const rows = (data ?? []) as (Requisition & { direcao?: { nome: string; codigo: string } })[]

      const porStatus:   Record<string, number> = {}
      const porDirecao:  Record<string, number> = {}
      const porTipo:     Record<string, number> = {}
      const porUrgencia: Record<string, number> = {}
      let valorTotalEstimado = 0
      let valorTotalPago     = 0
      let somasDias          = 0
      let contAprovadas      = 0

      for (const r of rows) {
        porStatus[r.status]           = (porStatus[r.status] ?? 0) + 1
        porTipo[r.tipo ?? "—"]        = (porTipo[r.tipo ?? "—"] ?? 0) + 1
        porUrgencia[r.urgencia]       = (porUrgencia[r.urgencia] ?? 0) + 1
        const dNome = r.direcao?.nome ?? "Sem direcção"
        porDirecao[dNome]             = (porDirecao[dNome] ?? 0) + 1
        valorTotalEstimado            += r.valor_estimado ?? 0
        valorTotalPago                += r.total_paid ?? 0

        if (r.status === "aprovado_final") {
          const dias = Math.round(
            (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000
          )
          somasDias += dias
          contAprovadas++
        }
      }

      return {
        total: rows.length,
        porStatus,
        porDirecao,
        porTipo,
        porUrgencia,
        valorTotalEstimado,
        valorTotalPago,
        mediaDiasAprovacao: contAprovadas > 0 ? Math.round(somasDias / contAprovadas) : 0,
      }
    },
    staleTime: 60_000,
  })
}

export function useRequisitionsByPeriod(start: string, end: string) {
  return useQuery({
    queryKey: QUERY_KEYS.requisitionsExport(start, end),
    enabled:  !!start && !!end,
    queryFn: async (): Promise<Requisition[]> => {
      const { data, error } = await supabase
        .from("requisitions")
        .select("*, profile:profiles(nome_completo), entity:entities(nome), direcao:direcoes(nome)")
        .gte("created_at", start)
        .lte("created_at", end + "T23:59:59")
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as Requisition[]
    },
    staleTime: 60_000,
  })
}
