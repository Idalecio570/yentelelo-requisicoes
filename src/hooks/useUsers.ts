import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Profile, Role, ProfileUpdate } from "@/types"

interface UserFilters {
  role?:       Role
  direcao_id?: string
  ativo?:      boolean
  search?:     string
}

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.users, filters],
    queryFn:  async (): Promise<Profile[]> => {
      let query = supabase
        .from("profiles")
        .select("*, direcao:direcoes(*)")
        .order("nome_completo", { ascending: true })

      if (filters?.role)       query = query.eq("role", filters.role)
      if (filters?.direcao_id) query = query.eq("direcao_id", filters.direcao_id)
      if (filters?.ativo !== undefined) query = query.eq("ativo", filters.ativo)
      if (filters?.search) {
        const s = `%${filters.search}%`
        query = query.or(`nome_completo.ilike.${s},email.ilike.${s}`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Profile[]
    },
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    enabled:  !!id,
    queryFn:  async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, direcao:direcoes(*)")
        .eq("id", id)
        .single()
      if (error) throw error
      return data as Profile
    },
  })
}

interface CreateUserPayload {
  email:                 string
  password:              string
  nome_completo:         string
  role:                  Role
  direcao_id:            string | null
  force_password_change: boolean
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: payload,
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      return data as { id: string }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users })
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProfileUpdate }) => {
      const { error } = await supabase.from("profiles").update(payload).eq("id", id)
      if (error) throw error
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.user(id) })
    },
  })
}

export function useToggleUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("profiles").update({ ativo }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users })
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`,
      })
      if (error) throw error
    },
  })
}

export async function checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from("profiles").select("id").eq("email", email).limit(1)
  if (excludeId) query = query.neq("id", excludeId)
  const { data } = await query
  return (data?.length ?? 0) > 0
}
