import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Approval, ApprovalDecisao, ApprovalNivel } from "@/types"

const SELECT_FULL = "*, aprovador:profiles(*), requisition:requisitions(*)"

export function useApprovals(requisitionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.approvals(requisitionId),
    enabled: !!requisitionId,
    queryFn: async (): Promise<Approval[]> => {
      const { data, error } = await supabase
        .from("approvals")
        .select(SELECT_FULL)
        .eq("requisition_id", requisitionId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as Approval[]
    },
  })
}

type ApprovalPayload = {
  requisition_id: string
  aprovador_id:   string
  nivel:          ApprovalNivel
  decisao:        ApprovalDecisao
  comentario:     string | null
}

export function useCreateApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ApprovalPayload): Promise<{ novo_status: string }> => {
      const { data, error } = await supabase.functions.invoke<{
        success?:    boolean
        novo_status?: string
        error?:      string
      }>("process-approval", { body: payload })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      return { novo_status: data?.novo_status ?? "" }
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.approvals(payload.requisition_id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisition(payload.requisition_id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitions })
    },
  })
}

// Determina o próximo status com base na decisão e nível de aprovação
// Todas as requisições passam sempre pelos 2 níveis: escritório → director_geral
export function getNextStatus(
  nivel: 1 | 2,
  decisao: ApprovalDecisao
): string {
  if (decisao === "rejeitado") return "rejeitado"
  if (decisao === "devolvido") return "devolvido"
  if (nivel === 1) return "aprovado_escritorio"
  return "aprovado_final"
}
