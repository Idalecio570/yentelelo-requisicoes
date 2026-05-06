import { useState } from "react"
import { Download, FileSpreadsheet } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { ErrorState } from "@/components/shared/ErrorState"
import { useRequisitionStats, useRequisitionsByPeriod } from "@/hooks/useReports"
import { useDirecoes } from "@/hooks/useDirecoes"
import { formatCurrency, formatDate } from "@/lib/utils"
import { STATUS_LABELS, URGENCIA_LABELS } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RequisitionStatus, RequisitionUrgencia } from "@/types"

function todayISO() { return new Date().toISOString().split("T")[0] ?? "" }
function firstOfMonth() {
  const d = new Date(); d.setDate(1)
  return d.toISOString().split("T")[0] ?? ""
}

const URGENCIA_COLORS = ["#F59E0B", "#EF4444", "#94A3B8"]

const STATUS_COLORS: Record<string, string> = {
  pendente:               "#94A3B8",
  em_analise_escritorio:  "#F59E0B",
  aprovado_escritorio:    "#3B82F6",
  em_analise_director:    "#8B5CF6",
  aprovado_final:         "#059669",
  rejeitado:              "#EF4444",
  cancelado:              "#9CA3AF",
  devolvido:              "#D97706",
}

const selectCls = "text-[13px] border border-[#E6E8EC] rounded-[8px] px-3 py-[7px] bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#002C62] focus:border-[#002C62]"
const labelCls  = "block text-[11px] font-medium mb-1 text-[#475569]"

function MetricCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-[20px] px-5 py-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#94A3B8" }}>{label}</p>
      <p className={`text-[24px] font-bold leading-none tracking-tight ${color ?? "text-[#0F172A]"}`}>{value}</p>
    </div>
  )
}

async function exportPDF(
  stats: ReturnType<typeof useRequisitionStats>["data"],
  rows: ReturnType<typeof useRequisitionsByPeriod>["data"],
  start: string, end: string
) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation: "landscape" })

  doc.setFontSize(16)
  doc.text("Yentelelo — Relatório de Requisições", 14, 18)
  doc.setFontSize(10)
  doc.text(`Período: ${formatDate(start)} a ${formatDate(end)}`, 14, 26)
  doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 32)

  if (stats) {
    doc.setFontSize(12)
    doc.text("Métricas", 14, 42)
    autoTable(doc, {
      startY: 46,
      head: [["Indicador","Valor"]],
      body: [
        ["Total de Requisições", String(stats.total)],
        ["Aprovadas", String(stats.porStatus["aprovado_final"] ?? 0)],
        ["Rejeitadas", String(stats.porStatus["rejeitado"] ?? 0)],
        ["Valor Total Estimado", formatCurrency(stats.valorTotalEstimado)],
        ["Valor Total Pago", formatCurrency(stats.valorTotalPago)],
        ["Média Dias de Aprovação", `${stats.mediaDiasAprovacao} dias`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 38, 38] },
    })
  }

  if (rows && rows.length > 0) {
    doc.setFontSize(12)
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 80
    doc.text("Requisições do Período", 14, y + 10)
    autoTable(doc, {
      startY: y + 14,
      head: [["ID","Título","Tipo","Direcção","Fornecedor","Valor Est.","Total Pago","Estado","Criado em"]],
      body: rows.map((r) => [
        r.id.slice(0,8),
        r.titulo.slice(0,40),
        r.tipo ?? "—",
        r.direcao?.nome ?? "—",
        r.entity?.nome ?? "—",
        r.valor_estimado !== null ? formatCurrency(r.valor_estimado) : "—",
        formatCurrency(r.total_paid ?? 0),
        STATUS_LABELS[r.status] ?? r.status,
        formatDate(r.created_at),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [220, 38, 38] },
    })
  }

  doc.save(`relatorio_yentelelo_${todayISO()}.pdf`)
}

async function exportExcel(rows: ReturnType<typeof useRequisitionsByPeriod>["data"]) {
  if (!rows || rows.length === 0) return
  const XLSX = await import("xlsx")
  const wsData = [
    ["ID","Título","Tipo","Urgência","Direcção","Fornecedor","Valor Estimado","Total Pago","Nº de Itens","Status","Criado Por","Data Criação","Data Atualização"],
    ...rows.map((r) => [
      r.id,
      r.titulo,
      r.tipo ?? "",
      URGENCIA_LABELS[r.urgencia as RequisitionUrgencia] ?? r.urgencia,
      r.direcao?.nome ?? "",
      r.entity?.nome ?? "",
      r.valor_estimado ?? "",
      r.total_paid ?? 0,
      r.items?.length ?? 0,
      STATUS_LABELS[r.status as RequisitionStatus] ?? r.status,
      r.profile?.nome_completo ?? "",
      formatDate(r.created_at),
      formatDate(r.updated_at),
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Requisições")
  XLSX.writeFile(wb, `requisicoes_yentelelo_${todayISO()}.xlsx`)
}

async function exportExcelDetalhado(rows: ReturnType<typeof useRequisitionsByPeriod>["data"]) {
  if (!rows || rows.length === 0) return
  const XLSX = await import("xlsx")
  const header = [
    "Requisição ID","Título","Tipo","Urgência","Direcção","Estado","Data Criação",
    "Nº Item","Descrição Item","Categoria","Fornecedor Item","Quantidade","Val. Unit. (MZN)","Total Item (MZN)",
  ]
  const body = rows.flatMap((r) => {
    const base = [
      r.id, r.titulo, r.tipo ?? "",
      URGENCIA_LABELS[r.urgencia as RequisitionUrgencia] ?? r.urgencia,
      r.direcao?.nome ?? "",
      STATUS_LABELS[r.status as RequisitionStatus] ?? r.status,
      formatDate(r.created_at),
    ]
    if (r.items && r.items.length > 0) {
      return r.items.map((it, idx) => [
        ...base,
        idx + 1,
        it.descricao,
        it.categoria ?? "",
        it.entity?.nome ?? "",
        it.quantidade,
        it.valor_unitario,
        it.valor_total,
      ])
    }
    return [[...base, 0, "", "", "", "", "", ""]]
  })
  const ws = XLSX.utils.aoa_to_sheet([header, ...body])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Itens por Requisição")
  XLSX.writeFile(wb, `requisicoes_detalhado_${todayISO()}.xlsx`)
}

export function ReportsPage() {
  const [start,     setStart]     = useState(firstOfMonth())
  const [end,       setEnd]       = useState(todayISO())
  const [direcaoId, setDirecaoId] = useState("")
  const [tipo,      setTipo]      = useState("")
  const [filters, setFilters] = useState<{
    start: string; end: string; direcao_id?: string; tipo?: string
  }>({ start: firstOfMonth(), end: todayISO() })

  const { data: direcoes = [] } = useDirecoes()
  const { data: stats, isLoading: loadingStats, isError: errorStats, refetch: refetchStats } = useRequisitionStats({
    start: filters.start, end: filters.end,
    direcao_id: filters.direcao_id,
    tipo:       filters.tipo,
  } as Parameters<typeof useRequisitionStats>[0])
  const { data: rows = [], isLoading: loadingRows, isError: errorRows, refetch: refetchRows } = useRequisitionsByPeriod(filters.start, filters.end)

  function applyFilters() {
    setFilters({ start, end, direcao_id: direcaoId || undefined, tipo: tipo || undefined } as typeof filters)
  }

  const barStatus = Object.entries(stats?.porStatus ?? {}).map(([k, v]) => ({
    key: k, name: STATUS_LABELS[k as RequisitionStatus] ?? k, value: v,
  }))

  const barDirecao = Object.entries(stats?.porDirecao ?? {}).map(([k, v]) => ({
    name: k, value: v,
  }))

  const donutUrgencia = Object.entries(stats?.porUrgencia ?? {}).map(([k, v]) => ({
    name: URGENCIA_LABELS[k as RequisitionUrgencia] ?? k, value: v,
  }))

  const chartTooltipStyle = {
    borderRadius: 12,
    border: "none",
    fontSize: 12,
    boxShadow: "0 8px 24px -4px rgba(15,23,42,.16)",
    color: "#0F172A",
    background: "#fff",
  }

  return (
    <PageWrapper
      titulo="Relatórios"
      breadcrumb={<Breadcrumb items={[{ label: "Relatórios" }]} />}
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
            <label className={labelCls}>Direcção</label>
            <Select value={direcaoId} onValueChange={setDirecaoId}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {direcoes.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="compra">Compra</SelectItem>
                <SelectItem value="servico">Serviço</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={applyFilters}
            className="px-4 py-[7px] bg-[#002C62] text-white text-[13px] font-medium rounded-full hover:bg-[#003A7A] transition-colors"
          >
            Aplicar Filtros
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => exportPDF(stats, rows, filters.start, filters.end)}
              disabled={loadingStats || loadingRows}
              className="inline-flex items-center gap-2 px-3 py-[7px] text-[13px] rounded-[8px] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors" style={{ border: "1px solid #E6E8EC", color: "#475569" }}
            >
              <Download size={13} /> PDF
            </button>
            <button
              onClick={() => exportExcel(rows)}
              disabled={loadingRows}
              className="inline-flex items-center gap-2 px-3 py-[7px] text-[13px] rounded-[8px] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors" style={{ border: "1px solid #E6E8EC", color: "#475569" }}
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button
              onClick={() => exportExcelDetalhado(rows)}
              disabled={loadingRows}
              className="inline-flex items-center gap-2 px-3 py-[7px] text-[13px] rounded-[8px] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors" style={{ border: "1px solid #E6E8EC", color: "#475569" }}
            >
              <FileSpreadsheet size={13} /> Detalhado
            </button>
          </div>
        </div>
      </div>

      {/* Erro */}
      {(errorStats || errorRows) && (
        <div className="bg-white rounded-[20px] mb-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
          <ErrorState
            message="Não foi possível carregar os dados do relatório."
            onRetry={() => { void refetchStats(); void refetchRows() }}
          />
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <MetricCard label="Total de Requisições"   value={stats?.total ?? 0} />
        <MetricCard label="Aprovadas"              value={stats?.porStatus["aprovado_final"] ?? 0} color="text-green-700" />
        <MetricCard label="Rejeitadas"             value={stats?.porStatus["rejeitado"] ?? 0}      color="text-red-600" />
        <MetricCard
          label="Pendentes / Em Análise"
          value={(stats?.porStatus["pendente"] ?? 0) + (stats?.porStatus["em_analise_escritorio"] ?? 0) + (stats?.porStatus["em_analise_director"] ?? 0)}
          color="text-amber-600"
        />
        <MetricCard label="Valor Total Estimado"   value={formatCurrency(stats?.valorTotalEstimado ?? 0)} />
        <MetricCard label="Valor Total Pago"       value={formatCurrency(stats?.valorTotalPago ?? 0)} color="text-green-700" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Requisições por Estado — barras coloridas por status */}
        <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#94A3B8" }}>Requisições por Estado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barStatus} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E6E8EC" strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(0,44,98,.04)" }} />
              <Bar dataKey="value" name="Requisições" radius={[6,6,0,0]} maxBarSize={44}>
                {barStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.key] ?? "#002C62"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por Direcção — horizontal para melhor leitura dos nomes */}
        <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#94A3B8" }}>Requisições por Direcção</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barDirecao} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E6E8EC" strokeOpacity={0.6} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(0,44,98,.04)" }} />
              <Bar dataKey="value" name="Requisições" fill="#002C62" radius={[0,6,6,0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Urgência — donut limpo com legenda */}
        <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#94A3B8" }}>Distribuição por Urgência</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={donutUrgencia}
                cx="50%" cy="42%"
                innerRadius={55} outerRadius={82}
                dataKey="value" nameKey="name"
                paddingAngle={2}
              >
                {donutUrgencia.map((_, i) => (
                  <Cell key={i} fill={URGENCIA_COLORS[i % URGENCIA_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#475569" }} />
              <text x="50%" y="39%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 20, fontWeight: 700, fill: "#0F172A" }}>
                {donutUrgencia.reduce((s, d) => s + d.value, 0)}
              </text>
              <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 10, fill: "#94A3B8" }}>
                total
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Valor Estimado vs Pago — área com gradiente */}
        <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#94A3B8" }}>Valor Estimado vs Pago (MZN)</h3>
          {(() => {
            const byMonth: Record<string, { mes: string; estimado: number; pago: number }> = {}
            for (const r of rows) {
              const m = r.created_at.slice(0, 7)
              if (!byMonth[m]) byMonth[m] = { mes: m, estimado: 0, pago: 0 }
              byMonth[m].estimado += r.valor_estimado ?? 0
              byMonth[m].pago     += r.total_paid ?? 0
            }
            const areaData = Object.values(byMonth).sort((a, b) => a.mes.localeCompare(b.mes))
            return (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData} margin={{ left: 10 }}>
                  <defs>
                    <linearGradient id="repGradEst" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="repGradPago" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#059669" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E6E8EC" strokeOpacity={0.6} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => typeof v === "number" ? formatCurrency(v) : String(v ?? "")} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#475569" }} />
                  <Area type="monotone" dataKey="estimado" name="Estimado" stroke="#3B82F6" strokeWidth={2} fill="url(#repGradEst)" dot={false} />
                  <Area type="monotone" dataKey="pago"     name="Pago"     stroke="#059669" strokeWidth={2} fill="url(#repGradPago)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )
          })()}
        </div>
      </div>
    </PageWrapper>
  )
}
