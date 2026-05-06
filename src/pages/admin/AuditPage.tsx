import { useState } from "react"
import { Download } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Approval, ApprovalDecisao } from "@/types"

const DECISAO_BADGE: Record<ApprovalDecisao, string> = {
  aprovado:  "bg-green-50 text-green-700 ring-1 ring-green-200",
  rejeitado: "bg-red-50 text-red-700 ring-1 ring-red-200",
  devolvido: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
}

const DECISAO_LABEL: Record<ApprovalDecisao, string> = {
  aprovado:  "Aprovado",
  rejeitado: "Rejeitado",
  devolvido: "Devolvido",
}

function todayISO()    { return new Date().toISOString().split("T")[0] ?? "" }
function firstOfMonth() {
  const d = new Date(); d.setDate(1)
  return d.toISOString().split("T")[0] ?? ""
}

interface AuditFilters {
  decisao?:      ApprovalDecisao | ""
  aprovador_id?: string
  start:         string
  end:           string
}

function useAuditApprovals(filters: AuditFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.allApprovals, filters],
    queryFn:  async (): Promise<Approval[]> => {
      let query = supabase
        .from("approvals")
        .select("*, aprovador:profiles(nome_completo, email), requisition:requisitions(id, titulo)")
        .order("created_at", { ascending: false })
        .gte("created_at", filters.start)
        .lte("created_at", filters.end + "T23:59:59")

      if (filters.decisao)      query = query.eq("decisao", filters.decisao)
      if (filters.aprovador_id) query = query.eq("aprovador_id", filters.aprovador_id)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Approval[]
    },
  })
}

const selectCls = "text-[13px] border border-[#d2d2d7] rounded-[8px] px-3 py-[7px] bg-white text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
const labelCls  = "block text-[11px] font-medium text-[#6e6e73] mb-1"
const thCls     = "px-4 py-3 text-left text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide"

export function AuditPage() {
  const [decisao, setDecisao] = useState<ApprovalDecisao | "">("")
  const [start,   setStart]   = useState(firstOfMonth())
  const [end,     setEnd]     = useState(todayISO())

  const { data: approvals = [], isLoading } = useAuditApprovals({
    decisao: decisao || undefined,
    start,
    end,
  })

  async function exportExcel() {
    if (approvals.length === 0) return
    const XLSX = await import("xlsx")
    const wsData = [
      ["Requisição ID","Título","Aprovador","Nível","Decisão","Comentário","Data/Hora"],
      ...approvals.map((a) => {
        const req = a.requisition as { id?: string; titulo?: string } | undefined
        const apr = a.aprovador  as { nome_completo?: string } | undefined
        return [
          req?.id?.slice(0, 8) ?? "—",
          req?.titulo ?? "—",
          apr?.nome_completo ?? "—",
          a.nivel === 1 ? "Escritório" : "Director",
          a.decisao ? DECISAO_LABEL[a.decisao] : "—",
          a.comentario ?? "",
          formatDate(a.created_at),
        ]
      }),
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria")
    XLSX.writeFile(wb, `auditoria_yentelelo_${todayISO()}.xlsx`)
  }

  return (
    <PageWrapper
      titulo="Auditoria de Aprovações"
      breadcrumb={
        <Breadcrumb items={[{ label: "Administração", href: "/admin" }, { label: "Auditoria" }]} />
      }
    >
      {/* Filtros */}
      <div className="bg-white rounded-[20px] p-4 mb-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={labelCls}>Data início</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={selectCls} />
          </div>
          <div>
            <label className={labelCls}>Data fim</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={selectCls} />
          </div>
          <div>
            <label className={labelCls}>Decisão</label>
            <Select value={decisao || "_all"} onValueChange={(v) => setDecisao(v === "_all" ? "" : v as ApprovalDecisao)}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                <SelectItem value="devolvido">Devolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={exportExcel}
            disabled={approvals.length === 0 || isLoading}
            className="ml-auto inline-flex items-center gap-2 px-3.5 py-[7px] border border-[#d2d2d7] text-[13px] text-[#1d1d1f] rounded-[8px] hover:bg-[#f5f5f7] disabled:opacity-40 transition-colors"
          >
            <Download size={13} /> Excel
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC]" style={{ borderBottom: "1px solid #E6E8EC" }}>
              <tr>
                <th className={thCls}>Requisição</th>
                <th className={thCls}>Aprovador</th>
                <th className={thCls}>Nível</th>
                <th className={thCls}>Decisão</th>
                <th className={thCls}>Comentário</th>
                <th className={thCls}>Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 bg-[#f5f5f7] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : approvals.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#6e6e73]">
                      Nenhum registo de aprovação encontrado
                    </td>
                  </tr>
                )
                : approvals.map((a) => {
                  const req = a.requisition as { id?: string; titulo?: string } | undefined
                  const apr = a.aprovador  as { nome_completo?: string } | undefined
                  return (
                    <tr key={a.id} className="hover:bg-[#f5f5f7] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium text-[#1d1d1f] leading-tight">{req?.titulo ?? "—"}</p>
                        <p className="text-[11px] text-[#86868b] font-mono">{req?.id?.slice(0, 8) ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6e6e73]">{apr?.nome_completo ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${
                          a.nivel === 1
                            ? "bg-sky-50 text-sky-700 ring-sky-200"
                            : "bg-violet-50 text-violet-700 ring-violet-200"
                        }`}>
                          {a.nivel === 1 ? "Escritório" : "Director"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {a.decisao && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${DECISAO_BADGE[a.decisao]}`}>
                            {DECISAO_LABEL[a.decisao]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6e6e73] max-w-xs">
                        <span title={a.comentario ?? ""}>
                          {a.comentario ? a.comentario.slice(0, 80) + (a.comentario.length > 80 ? "…" : "") : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#86868b] whitespace-nowrap">
                        {formatDate(a.created_at)}
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>

        {!isLoading && (
          <div className="px-4 py-2.5 text-[11px] text-[#86868b]" style={{ borderTop: "1px solid #E6E8EC" }}>
            {approvals.length} registo{approvals.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
