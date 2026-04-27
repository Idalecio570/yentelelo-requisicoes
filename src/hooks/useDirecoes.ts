import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import type { Direcao } from "@/types"

export function useDirecoes() {
  return useQuery({
    queryKey: QUERY_KEYS.direcoes,
    staleTime: Infinity,
    queryFn: async (): Promise<Direcao[]> => {
      const { data, error } = await supabase
        .from("direcoes")
        .select("*")
        .order("nome", { ascending: true })
      if (error) throw error
      return (data ?? []) as Direcao[]
    },
  })
}
