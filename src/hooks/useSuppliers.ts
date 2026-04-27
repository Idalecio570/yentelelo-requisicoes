import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Entity, EntityInsert, EntityUpdate } from "@/types"

const SELECT_FULL = "*"

export function useSuppliers(search?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers(search),
    queryFn: async (): Promise<Entity[]> => {
      let query = supabase
        .from("entities")
        .select(SELECT_FULL)
        .order("nome", { ascending: true })

      if (search && search.trim()) {
        const s = search.trim()
        query = query.or(`nome.ilike.%${s}%,nuit.ilike.%${s}%,email.ilike.%${s}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Entity[]
    },
    staleTime: 30_000,
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.supplier(id),
    enabled: !!id,
    queryFn: async (): Promise<Entity | null> => {
      const { data, error } = await supabase
        .from("entities")
        .select(SELECT_FULL)
        .eq("id", id)
        .single()
      if (error) throw error
      return data as Entity
    },
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: EntityInsert): Promise<Entity> => {
      const { data, error } = await supabase
        .from("entities")
        .insert(payload)
        .select(SELECT_FULL)
        .single()
      if (error) throw error
      return data as Entity
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: EntityUpdate }): Promise<Entity> => {
      const { data, error } = await supabase
        .from("entities")
        .update(payload)
        .eq("id", id)
        .select(SELECT_FULL)
        .single()
      if (error) throw error
      return data as Entity
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supplier(id) })
    },
  })
}

export function useToggleSupplierStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }): Promise<void> => {
      const { error } = await supabase
        .from("entities")
        .update({ ativo })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.supplier(id) })
    },
  })
}

export async function checkNuitExists(nuit: string, excludeId?: string): Promise<boolean> {
  let query = supabase
    .from("entities")
    .select("id")
    .eq("nuit", nuit)
  if (excludeId) query = query.neq("id", excludeId)
  const { data } = await query.limit(1)
  return (data?.length ?? 0) > 0
}
