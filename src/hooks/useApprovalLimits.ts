import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { ApprovalLimit } from "@/types"

const SELECT_FULL = "*, criador:profiles(nome_completo)"

// Todos os limites — para histórico na página de admin
export function useApprovalLimits() {
  return useQuery({
    queryKey: QUERY_KEYS.approvalLimits,
    queryFn:  async (): Promise<ApprovalLimit[]> => {
      const { data, error } = await supabase
        .from("approval_limits")
        .select(SELECT_FULL)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as ApprovalLimit[]
    },
  })
}

// Limite actualmente activo
export function useActiveLimit() {
  return useQuery({
    queryKey: QUERY_KEYS.activeLimit,
    queryFn:  async (): Promise<ApprovalLimit | null> => {
      const { data, error } = await supabase
        .from("approval_limits")
        .select(SELECT_FULL)
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as ApprovalLimit | null
    },
  })
}

export function useSetLimit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ valor_maximo, criado_por }: { valor_maximo: number; criado_por: string }) => {
      // Desactiva todos os registos existentes
      const { error: deactivateErr } = await supabase
        .from("approval_limits")
        .update({ ativo: false })
        .eq("ativo", true)
      if (deactivateErr) throw deactivateErr

      // Insere novo registo activo
      const { error: insertErr } = await supabase
        .from("approval_limits")
        .insert({ valor_maximo, criado_por, ativo: true })
      if (insertErr) throw insertErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.approvalLimits })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activeLimit })
    },
  })
}
