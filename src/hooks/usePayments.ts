import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Payment, PaymentInsert, Requisition } from "@/types"

const SELECT_PAYMENT = "*, registador:profiles(*)"

export function usePayments(requisitionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.payments(requisitionId),
    enabled: !!requisitionId,
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select(SELECT_PAYMENT)
        .eq("requisition_id", requisitionId)
        .order("numero_prestacao", { ascending: true })
      if (error) throw error
      return (data ?? []) as Payment[]
    },
  })
}

// Requisições aprovadas com dados de pagamento — para a página global
export function useAllPayments(filters?: {
  direcao_id?: string
  payment_status?: string
  start?: string
  end?: string
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.allPayments, filters],
    queryFn: async (): Promise<Requisition[]> => {
      let query = supabase
        .from("requisitions")
        .select("*, profile:profiles(*), entity:entities(*), direcao:direcoes(*)")
        .eq("status", "aprovado_final")
        .order("updated_at", { ascending: false })

      if (filters?.direcao_id)     query = query.eq("direcao_id", filters.direcao_id)
      if (filters?.payment_status) query = query.eq("payment_status", filters.payment_status)
      if (filters?.start)          query = query.gte("created_at", filters.start)
      if (filters?.end)            query = query.lte("created_at", filters.end + "T23:59:59")

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Requisition[]
    },
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PaymentInsert): Promise<Payment> => {
      const { data, error } = await supabase
        .from("payments")
        .insert(payload)
        .select(SELECT_PAYMENT)
        .single()
      if (error) throw error
      return data as Payment
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.payments(payload.requisition_id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisition(payload.requisition_id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitions })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allPayments })
    },
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; requisition_id: string }): Promise<void> => {
      const { error } = await supabase.from("payments").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: (_, { requisition_id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.payments(requisition_id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisition(requisition_id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.requisitions })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allPayments })
    },
  })
}
