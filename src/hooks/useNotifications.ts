import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import { useAuthContext } from "@/context/AuthContext"
import type { Notification } from "@/types"

export function useNotifications() {
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    enabled: !!profile,
    refetchInterval: 30_000,
    queryFn: async (): Promise<Notification[]> => {
      if (!profile) return []
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("destinatario_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as Notification[]
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("notifications")
        .update({ lida: true })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const { profile } = useAuthContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!profile) return
      const { error } = await supabase
        .from("notifications")
        .update({ lida: true })
        .eq("destinatario_id", profile.id)
        .eq("lida", false)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications })
    },
  })
}
