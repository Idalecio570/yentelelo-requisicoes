import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Entity } from "@/types"

export function useEntities() {
  return useQuery({
    queryKey: QUERY_KEYS.entities,
    queryFn: async (): Promise<Entity[]> => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true })
      if (error) throw error
      return (data ?? []) as Entity[]
    },
  })
}

export function useCreateEntity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Pick<Entity, "nome" | "tipo" | "nuit" | "email" | "telefone" | "banco" | "conta_bancaria" | "morada">
    ): Promise<Entity> => {
      const { data, error } = await supabase
        .from("entities")
        .insert(payload)
        .select("*")
        .single()
      if (error) throw error
      return data as Entity
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.entities })
    },
  })
}
