import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { RequisitionItem } from "@/types"

const SELECT = "*, entity:entities(id, nome)"

export function useRequisitionItems(requisitionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.requisitionItems(requisitionId),
    enabled: !!requisitionId,
    queryFn: async (): Promise<RequisitionItem[]> => {
      const { data, error } = await supabase
        .from("requisition_items")
        .select(SELECT)
        .eq("requisition_id", requisitionId)
        .order("ordem", { ascending: true })
      if (error) throw error
      return (data ?? []) as RequisitionItem[]
    },
  })
}

export type ItemPayload = {
  descricao:      string
  categoria:      string | null
  quantidade:     number
  valor_unitario: number
  entity_id:      string | null
  notas:          string | null
  ordem:          number
}

export function useBulkInsertItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requisitionId,
      items,
    }: {
      requisitionId: string
      items: ItemPayload[]
    }) => {
      if (items.length === 0) return
      const { error } = await supabase
        .from("requisition_items")
        .insert(items.map((it) => ({ ...it, requisition_id: requisitionId })))
      if (error) throw error
    },
    onSuccess: (_, { requisitionId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitionItems(requisitionId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitions })
    },
  })
}

export function useSyncRequisitionItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requisitionId,
      items,
    }: {
      requisitionId: string
      items: ItemPayload[]
    }) => {
      const { error: delErr } = await supabase
        .from("requisition_items")
        .delete()
        .eq("requisition_id", requisitionId)
      if (delErr) throw delErr

      if (items.length > 0) {
        const { error: insErr } = await supabase
          .from("requisition_items")
          .insert(items.map((it) => ({ ...it, requisition_id: requisitionId })))
        if (insErr) throw insErr
      }
    },
    onSuccess: (_, { requisitionId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitionItems(requisitionId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisition(requisitionId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitions })
    },
  })
}
