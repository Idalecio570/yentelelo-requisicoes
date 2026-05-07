import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, ChevronLeft, ChevronRight, CornerUpLeft } from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ErrorState } from "@/components/shared/ErrorState"
import { useRequisitions } from "@/hooks/useRequisitions"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency, formatDate } from "@/lib/utils"
import { URGENCIA_LABELS, REQUISITION_STATUSES, REQUISITION_URGENCIAS, STATUS_LABELS } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import type { RequisitionStatus, RequisitionUrgencia, RequisitionTipo } from "@/types"

const PAGE_SIZE = 10

const URGENCIA_CLASSES: Record<RequisitionUrgencia, string> = {
  normal:        "bg-[#f5f5f7] text-[#424245] ring-1 ring-[#d2d2d7]",
  urgente:       "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  muito_urgente: "bg-red-50 text-red-700 ring-1 ring-red-200",
}

const inputCls = "px-3 py-[7px] text-[13px] border border-[#d2d2d7] rounded-[8px] bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-[#1d1d1f] placeholder:text-[#86868b]"

export function RequisitionsPage() {
  const { profile } = useAuth()
  const { data: requisitions = [], isLoading, isError, refetch } = useRequisitions()

  const [search,   setSearch]   = useState("")
  const [status,   setStatus]   = useState<RequisitionStatus | "">("")
  const [tipo,     setTipo]     = useState<RequisitionTipo | "">("")
  const [urgencia, setUrgencia] = useState<RequisitionUrgencia | "">("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo,   setDateTo]   = useState("")
  const [page,     setPage]     = useState(1)

  const filtered = useMemo(() => {
    let list = requisitions
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.titulo.toLowerCase().includes(q) ||
          (r.profile?.nome_completo ?? "").toLowerCase().includes(q)
      )
    }
    if (status)   list = list.filter((r) => r.status === status)
    if (tipo)     list = list.filter((r) => r.tipo === tipo)
    if (urgencia) list = list.filter((r) => r.urgencia === urgencia)
    if (dateFrom) list = list.filter((r) => r.created_at >= dateFrom)
    if (dateTo)   list = list.filter((r) => r.created_at <= dateTo + "T23:59:59")
    return list
  }, [requisitions, search, status, tipo, urgencia, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function resetFilters() {
    setSearch(""); setStatus(""); setTipo(""); setUrgencia("")
    setDateFrom(""); setDateTo(""); setPage(1)
  }

  const canCreate = profile?.role !== "auditor"

  const devolvidas = useMemo(
    () => requisitions.filter(
      (r) => r.status === "devolvido" && r.criado_por === profile?.id
    ),
    [requisitions, profile?.id]
  )

  const hasFilters = !!(search || status || tipo || urgencia || dateFrom || dateTo)

  return (
    <PageWrapper
      titulo="Requisições"
      actions={
        canCreate ? (
          <Link
            to="/requisitions/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002C62] text-white text-[13px] font-medium rounded-full hover:bg-[#003A7A] transition-colors"
          >
            <Plus size={14} />
            Nova Requisição
          </Link>
        ) : undefined
      }
    >
      {/* Banner: devolvidas */}
      {devolvidas.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3 mb-4">
          <CornerUpLeft size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-[13px]">
            <span className="font-semibold text-amber-800">
              {devolvidas.length === 1
                ? "1 requisição foi devolvida para revisão."
                : `${devolvidas.length} requisições foram devolvidas para revisão.`}
            </span>
            <span className="text-amber-700 ml-1">
              Edite e ressubmeta antes de prosseguir.
            </span>
          </div>
          <button
            onClick={() => { setStatus("devolvido"); setPage(1) }}
            className="text-[12px] font-medium text-amber-700 hover:text-amber-900 shrink-0 underline"
          >
            Ver
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-[20px] p-4 mb-4" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>

        {/* Linha 1 — Pesquisa (largura total) */}
        <div className="relative mb-2.5">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar título ou solicitante…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className={`${inputCls} w-full pl-8`}
          />
        </div>

        {/* Linha 2 — Filtros + Datas + Limpar
            Mobile: grid 2 colunas
            md:     grid 3 colunas
            xl:     todos em linha (6 colunas)                          */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 items-center">

          <Select value={status || "_all"} onValueChange={(v) => { setStatus(v === "_all" ? "" : v as RequisitionStatus); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Todos os estados" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os estados</SelectItem>
              {REQUISITION_STATUSES.filter((s) => s !== "rascunho").map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tipo || "_all"} onValueChange={(v) => { setTipo(v === "_all" ? "" : v as RequisitionTipo); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os tipos</SelectItem>
              <SelectItem value="compra">Compra</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
            </SelectContent>
          </Select>

          <Select value={urgencia || "_all"} onValueChange={(v) => { setUrgencia(v === "_all" ? "" : v as RequisitionUrgencia); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Todas as urgências" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas as urgências</SelectItem>
              {REQUISITION_URGENCIAS.map((u) => (
                <SelectItem key={u} value={u}>{URGENCIA_LABELS[u]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateInput
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            title="Data de início"
          />

          <DateInput
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            title="Data de fim"
          />

          {/* Botão Limpar — span 2 colunas em mobile, 1 nas restantes */}
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="col-span-2 md:col-span-1 w-full px-3 py-[7px] text-[12px] font-medium text-red-600 rounded-[8px] border border-transparent hover:bg-red-50 hover:border-red-100 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
        {isError ? (
          <ErrorState
            message="Não foi possível carregar as requisições."
            onRetry={() => { void refetch() }}
          />
        ) : isLoading ? (
          <div className="divide-y divide-[#f5f5f7]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="h-3.5 bg-[#f5f5f7] rounded flex-1" />
                <div className="h-3.5 bg-[#f5f5f7] rounded w-20" />
                <div className="h-3.5 bg-[#f5f5f7] rounded w-24" />
                <div className="h-3.5 bg-[#f5f5f7] rounded w-28" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#86868b]">
            <Search size={36} className="mb-3 opacity-25" />
            <p className="text-[13px] font-medium text-[#6e6e73]">Nenhuma requisição encontrada</p>
            {hasFilters && (
              <p className="text-[12px] text-[#86868b] mt-1">Tente ajustar os filtros</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-[13px]">
                <thead className="bg-[#F8FAFC]" style={{ borderBottom: "1px solid #E6E8EC" }}>
                  <tr>
                    {["Título", "Tipo", "Estado", "Urgência", "Valor Est.", "Solicitante", "Direcção", "Data", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide whitespace-nowrap last:w-12"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7]">
                  {paginated.map((req) => (
                    <tr key={req.id} className="hover:bg-[#f5f5f7] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1d1d1f] max-w-xs truncate">
                        {req.titulo}
                      </td>
                      <td className="px-4 py-3 text-[#6e6e73] capitalize">
                        {req.tipo ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge estado={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${URGENCIA_CLASSES[req.urgencia]}`}>
                          {URGENCIA_LABELS[req.urgencia]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#1d1d1f] tabular-nums">
                        {req.valor_estimado !== null ? formatCurrency(req.valor_estimado) : "—"}
                      </td>
                      <td className="px-4 py-3 text-[#6e6e73]">
                        {req.profile?.nome_completo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#86868b]">
                        {req.direcao?.nome ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#86868b] whitespace-nowrap">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/requisitions/${req.id}`}
                          className="text-[12px] font-medium text-red-600 hover:underline"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="px-6 py-3 flex items-center justify-between text-[12px] text-[#6e6e73]" style={{ borderTop: "1px solid #E6E8EC" }}>
                <span>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-[6px] hover:bg-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-2">Pág. {page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-[6px] hover:bg-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
