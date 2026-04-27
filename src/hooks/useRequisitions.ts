import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import { useAuthContext } from "@/context/AuthContext"
import type { Requisition, RequisitionInsert, RequisitionStatus } from "@/types"

const SELECT_FULL = "*, profile:profiles(*), entity:entities(*), direcao:direcoes(*)"

export function useRequisitions() {
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: [...QUERY_KEYS.requisitions, profile?.role, profile?.direcao_id],
    enabled: !!profile,
    queryFn: async (): Promise<Requisition[]> => {
      let query = supabase
        .from("requisitions")
        .select(SELECT_FULL)
        .order("created_at", { ascending: false })

      if (!profile) return []

      // Colaborador e gestor_tics vêem apenas as suas próprias
      if (profile.role === "colaborador" || profile.role === "gestor_tics") {
        query = query.eq("criado_por", profile.id)
      }
      // Directores e gestores comerciais vêem as da sua direcção
      else if (
        profile.role === "director_comercial" ||
        profile.role === "director_projectos" ||
        profile.role === "gestor_comercial"
      ) {
        if (profile.direcao_id) {
          query = query.eq("direcao_id", profile.direcao_id)
        } else {
          return []
        }
      }
      // gestor_escritorio, director_geral, admin, auditor → todas

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Requisition[]
    },
  })
}

export function useRequisition(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.requisition(id),
    enabled: !!id,
    queryFn: async (): Promise<Requisition | null> => {
      const { data, error } = await supabase
        .from("requisitions")
        .select(SELECT_FULL)
        .eq("id", id)
        .single()
      if (error) throw error
      return data as Requisition
    },
  })
}

export function useCreateRequisition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RequisitionInsert): Promise<Requisition> => {
      const { data, error } = await supabase
        .from("requisitions")
        .insert(payload)
        .select(SELECT_FULL)
        .single()
      if (error) throw error
      return data as Requisition
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitions })
    },
  })
}

export function useUpdateRequisition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<RequisitionInsert>
    }): Promise<Requisition> => {
      const { data, error } = await supabase
        .from("requisitions")
        .update({ ...payload, status: "pendente" })
        .eq("id", id)
        .select(SELECT_FULL)
        .single()
      if (error) throw error
      return data as Requisition
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitions })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisition(id) })
    },
  })
}

export function useCancelRequisition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("requisitions")
        .update({ status: "cancelado" as RequisitionStatus })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitions })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisition(id) })
    },
  })
}

// Aliases de compatibilidade
export { useRequisitions as useRequisicoes, useRequisition as useRequisicao }
