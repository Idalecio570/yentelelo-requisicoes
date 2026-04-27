import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Comment, CommentInsert } from "@/types"

export function useComments(requisitionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.comments(requisitionId),
    enabled: !!requisitionId,
    refetchInterval: 30_000,
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, autor:profiles(*)")
        .eq("requisition_id", requisitionId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as Comment[]
    },
  })
}

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CommentInsert): Promise<Comment> => {
      const { data, error } = await supabase
        .from("comments")
        .insert(payload)
        .select("*, autor:profiles(*)")
        .single()
      if (error) throw error
      return data as Comment
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.comments(payload.requisition_id) })
    },
  })
}
