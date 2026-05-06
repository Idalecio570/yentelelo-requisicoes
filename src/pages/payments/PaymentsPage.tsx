import { useState } from "react"
import { Link } from "react-router-dom"
import { Eye, CreditCard, CheckCircle2, AlertCircle, Ban } from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAllPayments } from "@/hooks/usePayments"
import { useDirecoes } from "@/hooks/useDirecoes"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import type { PaymentStatus } from "@/types"

const payStatusLabels: Record<PaymentStatus, string> = {
  sem_pagamento: "Sem Pagamento",
  pendente:      "Pendente",
  parcial:       "Parcial",
  concluida:     "Concluída",
}

const payStatusCls: Record<PaymentStatus, string> = {
  sem_pagamento: "bg-[#f5f5f7] text-[#6e6e73] ring-1 ring-[#d2d2d7]",
  pendente:      "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  parcial:       "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  concluida:     "bg-green-50 text-green-700 ring-1 ring-green-200",
}


const labelCls  = "block text-[11px] font-medium text-[#6e6e73] mb-1"
const thCls     = "px-4 py-3 text-left text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide whitespace-nowrap"
const tdCls     = "px-4 py-3 text-[13px]"

function MetricCard({ icon: Icon, label, value, iconBg = "#EEF4FF", iconFg = "#002C62" }: {
  icon:    React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label:   string
  value:   string | number
  iconBg?: string
  iconFg?: string
}) {
  return (
    <div className="bg-white rounded-[20px] px-5 py-5 flex items-start gap-4" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: iconBg }}>
        <Icon size={18} style={{ color: iconFg }} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest leading-none mb-1.5" style={{ color: "#94A3B8" }}>{label}</p>
        <p className="text-[22px] font-bold leading-none tracking-tight" style={{ color: "#0F172A" }}>{value}</p>
      </div>
    </div>
  )
}

export function PaymentsPage() {
  const [direcaoId, setDirecaoId] = useState("")
  const [payStatus, setPayStatus] = useState("")
  const [start, setStart]         = useState("")
  const [end, setEnd]             = useState("")
  const [applied, setApplied]     = useState<{
    direcao_id?: string; payment_status?: string; start?: string; end?: string
  }>({})

  const { data: direcoes = [] }                                         = useDirecoes()
  const { data: requisitions = [], isLoading, isError, refetch } = useAllPayments(applied)

  const totalPago    = requisitions.reduce((s, r) => s + (r.total_paid ?? 0), 0)
  const concluidas   = requisitions.filter((r) => r.payment_status === "concluida").length
  const parciais     = requisitions.filter((r) => r.payment_status === "parcial").length
  const semPagamento = requisitions.filter((r) => r.payment_status === "sem_pagamento").length

  function applyFilters() {
    setApplied({
      direcao_id:     direcaoId || undefined,
      payment_status: payStatus || undefined,
      start:          start || undefined,
      end:            end || undefined,
    })
  }

  return (
    <PageWrapper titulo="Pagamentos">

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard icon={CreditCard}   label="Total Pago"        value={formatCurrency(totalPago)} iconBg="#ECFDF5" iconFg="#059669" />
        <MetricCard icon={CheckCircle2} label="Concluídas"        value={concluidas}                iconBg="#ECFDF5" iconFg="#059669" />
        <MetricCard icon={AlertCircle}  label="Pagamento Parcial" value={parciais}                  iconBg="#FFFBEB" iconFg="#D97706" />
        <MetricCard icon={Ban}          label="Sem Pagamento"     value={semPagamento}              iconBg="#F8FAFC" iconFg="#94A3B8" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-[20px] p-4 mb-4" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={labelCls}>Direcção</label>
            <Select value={direcaoId || "_all"} onValueChange={(v) => setDirecaoId(v === "_all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                {direcoes.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Estado de Pagamento</label>
            <Select value={payStatus || "_all"} onValueChange={(v) => setPayStatus(v === "_all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                {(["sem_pagamento","pendente","parcial","concluida"] as PaymentStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{payStatusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Data início</label>
            <DateInput value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Data fim</label>
            <DateInput value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button
            onClick={applyFilters}
            className="px-4 py-[7px] bg-[#002C62] text-white text-[13px] font-medium rounded-full hover:bg-[#003A7A] transition-colors"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F8FAFC]" style={{ borderBottom: "1px solid #E6E8EC" }}>
              <tr>
                {["Requisição","Fornecedor","Valor Estimado","Total Pago","Saldo em Aberto","Estado","Última Prestação",""].map((h) => (
                  <th key={h} className={thCls}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {isError ? (
                <tr>
                  <td colSpan={8}>
                    <ErrorState
                      message="Não foi possível carregar os pagamentos."
                      onRetry={() => { void refetch() }}
                    />
                  </td>
                </tr>
              ) : isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className={tdCls}>
                        <div className="h-3 bg-[#f5f5f7] rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : requisitions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#6e6e73]">
                    Nenhuma requisição encontrada.
                  </td>
                </tr>
              ) : (
                requisitions.map((r) => {
                  const saldo = (r.valor_estimado ?? 0) - (r.total_paid ?? 0)
                  const ps    = (r.payment_status ?? "sem_pagamento") as PaymentStatus
                  return (
                    <tr key={r.id} className="hover:bg-[#f5f5f7] transition-colors">
                      <td className={tdCls}>
                        <p className="font-medium text-[#1d1d1f] max-w-[200px] truncate">{r.titulo}</p>
                        <p className="text-[11px] text-[#86868b] font-mono">{r.id.slice(0, 8)}</p>
                      </td>
                      <td className={`${tdCls} text-[#6e6e73]`}>{r.entity?.nome ?? "—"}</td>
                      <td className={`${tdCls} tabular-nums text-[#1d1d1f]`}>
                        {r.valor_estimado !== null ? formatCurrency(r.valor_estimado) : "—"}
                      </td>
                      <td className={`${tdCls} tabular-nums font-medium text-green-700`}>
                        {formatCurrency(r.total_paid ?? 0)}
                      </td>
                      <td className={`${tdCls} tabular-nums text-[#6e6e73]`}>
                        {formatCurrency(Math.max(0, saldo))}
                      </td>
                      <td className={tdCls}>
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium",
                          payStatusCls[ps]
                        )}>
                          {payStatusLabels[ps]}
                        </span>
                      </td>
                      <td className={`${tdCls} text-[#86868b] whitespace-nowrap`}>
                        {formatDate(r.updated_at)}
                      </td>
                      <td className={tdCls}>
                        <Link
                          to={`/requisitions/${r.id}`}
                          title="Ver requisição"
                          className="p-1.5 rounded-[6px] text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] inline-flex transition-colors"
                        >
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
