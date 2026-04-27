import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Template, RequisitionTipo } from "@/types"

const SELECT_FULL = "*, criador:profiles(nome_completo)"

// Templates activos — para formulários de requisição
export function useTemplates() {
  return useQuery({
    queryKey: QUERY_KEYS.templates,
    queryFn:  async (): Promise<Template[]> => {
      const { data, error } = await supabase
        .from("templates")
        .select(SELECT_FULL)
        .eq("ativo", true)
        .order("nome", { ascending: true })
      if (error) throw error
      return (data ?? []) as Template[]
    },
  })
}

// Todos os templates (incluindo inactivos) — para o painel de admin
export function useAllTemplates() {
  return useQuery({
    queryKey: [...QUERY_KEYS.templates, "all"],
    queryFn:  async (): Promise<Template[]> => {
      const { data, error } = await supabase
        .from("templates")
        .select(SELECT_FULL)
        .order("nome", { ascending: true })
      if (error) throw error
      return (data ?? []) as Template[]
    },
  })
}

interface TemplatePayload {
  nome:             string
  tipo:             RequisitionTipo
  descricao_padrao: string | null
  criado_por?:      string
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TemplatePayload): Promise<Template> => {
      const { data, error } = await supabase
        .from("templates")
        .insert({ ...payload, ativo: true })
        .select(SELECT_FULL)
        .single()
      if (error) throw error
      return data as Template
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.templates })
    },
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<TemplatePayload> }) => {
      const { error } = await supabase.from("templates").update(payload).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.templates })
    },
  })
}

export function useToggleTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("templates").update({ ativo }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.templates })
    },
  })
}
