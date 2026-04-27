import { Link } from "react-router-dom"
import {
  Plus, AlertTriangle, CheckCircle2, Clock, XCircle,
  CreditCard, ArrowRight, TrendingUp, BarChart2,
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from "recharts"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useRequisitions } from "@/hooks/useRequisitions"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency, formatDate } from "@/lib/utils"
import { URGENCIA_LABELS } from "@/lib/constants"
import type { Requisition, RequisitionStatus } from "@/types"

// ─── Constantes visuais ───────────────────────────────────────────────────────

const CARD_SHADOW = "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)"

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 8px 24px -4px rgba(15,23,42,.16)",
  fontSize: 12,
  color: "#0F172A",
  background: "#fff",
  padding: "10px 14px",
}

const AXIS  = { fontSize: 10, fill: "#94A3B8" }
const GRID  = { strokeDasharray: "4 4", stroke: "#E6E8EC", strokeOpacity: 0.6, vertical: false as const }
const CURSOR = { fill: "rgba(0,44,98,.04)" }

const STATUS_COLORS: Record<string, string> = {
  pendente:              "#94A3B8",
  em_analise_escritorio: "#F59E0B",
  aprovado_escritorio:   "#3B82F6",
  em_analise_director:   "#8B5CF6",
  aprovado_final:        "#059669",
  rejeitado:             "#EF4444",
  cancelado:             "#9CA3AF",
  devolvido:             "#D97706",
}

const URGENCIA_COLORS = {
  muito_urgente: "#EF4444",
  urgente:       "#F59E0B",
  normal:        "#3B82F6",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-")
  return new Date(parseInt(y ?? "0"), parseInt(m ?? "1") - 1, 1)
    .toLocaleDateString("pt-PT", { month: "short" })
}

function getMonthly(reqs: Requisition[], last = 6) {
  const map: Record<string, { label: string; total: number; aprovadas: number }> = {}
  for (const r of reqs) {
    const k = r.created_at.slice(0, 7)
    if (!map[k]) map[k] = { label: fmtMonth(k), total: 0, aprovadas: 0 }
    map[k].total++
    if (r.status === "aprovado_final") map[k].aprovadas++
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-last)
    .map(([, v]) => v)
}

function statusBarData(reqs: Requisition[]) {
  const map: Record<string, number> = {}
  for (const r of reqs) map[r.status] = (map[r.status] ?? 0) + 1
  return Object.entries(map).map(([k, v]) => ({ key: k, name: k.replace(/_/g, " "), value: v }))
}

// ─── Blocos partilhados ───────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, iconBg = "#EEF4FF", iconFg = "#002C62", to }: {
  icon:    React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label:   string
  value:   string | number
  sub?:    string
  iconBg?: string
  iconFg?: string
  to?:     string
}) {
  const inner = (
    <div className="bg-white rounded-[20px] px-5 py-5 flex items-start gap-4 transition-shadow hover:shadow-lg" style={{ boxShadow: CARD_SHADOW }}>
      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: iconBg }}>
        <Icon size={18} style={{ color: iconFg }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest leading-none mb-2" style={{ color: "#94A3B8" }}>{label}</p>
        <p className="text-[26px] font-bold leading-none tracking-tight" style={{ color: "#0F172A" }}>{value}</p>
        {sub && <p className="text-[11px] mt-1.5" style={{ color: "#94A3B8" }}>{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block">{inner}</Link> : <div>{inner}</div>
}

function StatusTile({ status, count }: { status: RequisitionStatus; count: number }) {
  return (
    <div className="bg-white rounded-[20px] p-4" style={{ boxShadow: CARD_SHADOW }}>
      <p className="text-[30px] font-bold leading-none mb-3" style={{ color: "#0F172A" }}>{count}</p>
      <StatusBadge estado={status} />
    </div>
  )
}

function PanelCard({ title, children, action, noPad }: {
  title:    string
  children: React.ReactNode
  action?:  React.ReactNode
  noPad?:   boolean
}) {
  return (
    <div className="bg-white rounded-[20px]" style={{ boxShadow: CARD_SHADOW }}>
      <div className={`flex items-center justify-between ${noPad ? "px-5 pt-5" : "px-5 pt-5"} mb-4`}>
        <h3 className="text-[13px] font-semibold" style={{ color: "#0F172A" }}>{title}</h3>
        {action}
      </div>
      <div className={noPad ? "" : "px-5 pb-5"}>{children}</div>
    </div>
  )
}

function ReqTable({ rows, limit = 5 }: { rows: Requisition[] | undefined; limit?: number }) {
  const slice = (rows ?? []).slice(0, limit)
  if (!slice.length) return <p className="text-[13px] pb-5 text-center" style={{ color: "#94A3B8" }}>Sem requisições.</p>
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-[13px]">
        <thead>
          <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
            {["Título", "Urgência", "Estado", "Data"].map((h) => (
              <th key={h} className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-widest px-3 first:pl-5 last:pr-5" style={{ color: "#94A3B8" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slice.map((r) => (
            <tr
              key={r.id}
              className="transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F8FAFC" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "" }}
              style={{ borderBottom: "1px solid #F8FAFC" }}
            >
              <td className="py-2.5 pl-5 pr-3 max-w-[180px]">
                <Link to={`/requisitions/${r.id}`} className="font-semibold hover:underline truncate block" style={{ color: "#002C62" }}>
                  {r.titulo}
                </Link>
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: "#475569" }}>{URGENCIA_LABELS[r.urgencia]}</td>
              <td className="py-2.5 px-3"><StatusBadge estado={r.status} /></td>
              <td className="py-2.5 px-3 pr-5 whitespace-nowrap" style={{ color: "#94A3B8" }}>{formatDate(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Gráfico de área com gradiente reutilizável
function AreaTrend({ data, dataKey, name, color = "#002C62", height = 200, valueFormatter }: {
  data:            Array<Record<string, string | number>>
  dataKey:         string
  name:            string
  color?:          string
  height?:         number
  valueFormatter?: (v: number) => string
}) {
  const id = `grad-${dataKey}-${color.replace("#", "")}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -8, right: 4, top: 4 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.14} />
            <stop offset="95%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false}
          tickFormatter={valueFormatter ? (v: number) => valueFormatter(v) : undefined} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={CURSOR}
          formatter={(v) => [valueFormatter ? valueFormatter(v as number) : v, name]}
        />
        <Area type="monotone" dataKey={dataKey} name={name}
          stroke={color} strokeWidth={2.5}
          fill={`url(#${id})`}
          dot={false}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Gráfico de barras com cores por estado
function StatusBarChart({ data, height = 200 }: {
  data:    { key: string; name: string; value: number }[]
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -8, right: 4, top: 4 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="name" tick={{ ...AXIS, fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR} formatter={(v) => [v, "Requisições"]} />
        <Bar dataKey="value" name="Requisições" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.key] ?? "#002C62"} fillOpacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Donut chart reutilizável
const DONUT_COLORS = ["#002C62", "#2563EB", "#059669", "#F59E0B", "#EF4444", "#8B5CF6", "#D97706"]

function DonutChart({ data, height = 220 }: {
  data:    { name: string; value: number; fill?: string }[]
  height?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="46%"
          innerRadius={52} outerRadius={78}
          dataKey="value"
          paddingAngle={3}
          startAngle={90} endAngle={-270}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill ?? DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v, name) => [v, name]}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          formatter={(value) => (
            <span style={{ color: "#475569", fontSize: 11 }}>{value}</span>
          )}
        />
        {/* Texto central */}
        <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle">
          <tspan x="50%" dy="0" style={{ fontSize: 22, fontWeight: 700, fill: "#0F172A" }}>{total}</tspan>
          <tspan x="50%" dy="18" style={{ fontSize: 10, fill: "#94A3B8" }}>total</tspan>
        </text>
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Dashboards por role ──────────────────────────────────────────────────────

function DashColabTics({ reqs }: { reqs: Requisition[] }) {
  const devolvidas = reqs.filter((r) => r.status === "devolvido")
  const porStatus: Record<string, number> = {}
  for (const r of reqs) porStatus[r.status] = (porStatus[r.status] ?? 0) + 1

  const monthly = getMonthly(reqs)
  const aprovadas = reqs.filter((r) => r.status === "aprovado_final").length
  const pendentes  = reqs.filter((r) => r.status === "pendente").length

  return (
    <>
      {devolvidas.length > 0 && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-[16px]" style={{ background: "#FFF8EC", border: "1px solid #FDE68A" }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "#D97706" }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#92400E" }}>
              {devolvidas.length} requisição{devolvidas.length > 1 ? "ões devolvidas" : " devolvida"} aguarda{devolvidas.length > 1 ? "m" : ""} revisão
            </p>
            <Link to="/requisitions" className="text-[12px] hover:underline" style={{ color: "#D97706" }}>Ver requisições</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(["pendente", "em_analise_escritorio", "aprovado_final", "devolvido"] as RequisitionStatus[]).map((s) => (
          <StatusTile key={s} status={s} count={porStatus[s] ?? 0} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Evolução mensal */}
        <div className="lg:col-span-2">
          <PanelCard title="As Minhas Requisições — Evolução" noPad>
            <div className="px-5 pb-5">
              <AreaTrend data={monthly} dataKey="total" name="Requisições" color="#002C62" height={180} />
            </div>
          </PanelCard>
        </div>

        {/* Resumo rápido */}
        <div className="space-y-3">
          <div className="bg-white rounded-[20px] px-5 py-4" style={{ boxShadow: CARD_SHADOW }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "#ECFDF5" }}>
                <CheckCircle2 size={16} style={{ color: "#059669" }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Aprovadas</p>
                <p className="text-[22px] font-bold" style={{ color: "#0F172A" }}>{aprovadas}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] px-5 py-4" style={{ boxShadow: CARD_SHADOW }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "#FFF8EC" }}>
                <Clock size={16} style={{ color: "#D97706" }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Pendentes</p>
                <p className="text-[22px] font-bold" style={{ color: "#0F172A" }}>{pendentes}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[20px] px-5 py-4" style={{ boxShadow: CARD_SHADOW }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "#EEF4FF" }}>
                <BarChart2 size={16} style={{ color: "#002C62" }} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Total</p>
                <p className="text-[22px] font-bold" style={{ color: "#0F172A" }}>{reqs.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PanelCard
        title="Requisições Recentes"
        noPad
        action={
          <Link to="/requisitions/new" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-white text-[12px] font-medium rounded-full hover:opacity-90 transition-opacity" style={{ background: "#002C62" }}>
            <Plus size={12} /> Nova Requisição
          </Link>
        }
      >
        <ReqTable rows={reqs} />
      </PanelCard>
    </>
  )
}

function DashGestorEscritorio({ reqs }: { reqs: Requisition[] }) {
  const pendentes = reqs.filter((r) => ["pendente", "em_analise_escritorio"].includes(r.status))
  const hoje      = new Date().toDateString()
  const aprovHoje = reqs.filter((r) => r.status === "aprovado_final" && new Date(r.updated_at).toDateString() === hoje)
  const rejMes    = reqs.filter((r) => r.status === "rejeitado")
  const semPag    = reqs.filter((r) => r.status === "aprovado_final" && r.payment_status !== "concluida")
  const urgentes  = [...pendentes].sort((a, b) => {
    const o = { muito_urgente: 0, urgente: 1, normal: 2 }
    return (o[a.urgencia] ?? 3) - (o[b.urgencia] ?? 3)
  })

  const urgenciaData = (["muito_urgente", "urgente", "normal"] as const)
    .map((u) => ({ name: URGENCIA_LABELS[u], value: pendentes.filter((r) => r.urgencia === u).length, fill: URGENCIA_COLORS[u] }))
    .filter((d) => d.value > 0)

  const monthly = getMonthly(reqs)
  const taxaAprov = (() => {
    const concluidas = reqs.filter((r) => ["aprovado_final", "rejeitado"].includes(r.status)).length
    const aprov = reqs.filter((r) => r.status === "aprovado_final").length
    return concluidas > 0 ? Math.round((aprov / concluidas) * 100) : 0
  })()

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard icon={Clock}        label="A minha aprovação"    value={pendentes.length}  iconBg="#FFF8EC" iconFg="#D97706" to="/approvals" />
        <MetricCard icon={CheckCircle2} label="Aprovadas hoje"       value={aprovHoje.length}  iconBg="#ECFDF5" iconFg="#059669" />
        <MetricCard icon={XCircle}      label="Rejeitadas"           value={rejMes.length}     iconBg="#FBECEC" iconFg="#DC2626" />
        <MetricCard icon={CreditCard}   label="Pagamentos em aberto" value={semPag.length}     iconBg="#EFF6FF" iconFg="#2563EB" to="/payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Pendentes por urgência — donut */}
        <PanelCard title="Pendentes por Urgência">
          {urgenciaData.length > 0
            ? <DonutChart data={urgenciaData} height={200} />
            : <p className="text-[13px] text-center py-10" style={{ color: "#94A3B8" }}>Nenhum pendente.</p>
          }
        </PanelCard>

        {/* Evolução mensal */}
        <div className="lg:col-span-2">
          <PanelCard title={`Evolução Mensal · Taxa de Aprovação ${taxaAprov}%`} noPad>
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthly} margin={{ left: -8, right: 4, top: 4 }}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#002C62" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#002C62" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="gAprov" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#059669" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR} />
                  <Area type="monotone" dataKey="total"     name="Total"     stroke="#002C62" strokeWidth={2.5} fill="url(#gTotal)" dot={false} activeDot={{ r: 4, fill: "#002C62", strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="aprovadas" name="Aprovadas" stroke="#059669" strokeWidth={2}   fill="url(#gAprov)" dot={false} activeDot={{ r: 4, fill: "#059669", strokeWidth: 0 }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ paddingTop: 8 }} formatter={(v) => <span style={{ color: "#475569", fontSize: 11 }}>{v}</span>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </PanelCard>
        </div>
      </div>

      <PanelCard title="Mais Urgentes a Aprovar" noPad>
        <ReqTable rows={urgentes} />
      </PanelCard>
    </>
  )
}

function DashDirectorDivisao({ reqs }: { reqs: Requisition[] }) {
  const porStatus: Record<string, number> = {}
  for (const r of reqs) porStatus[r.status] = (porStatus[r.status] ?? 0) + 1
  const barData  = statusBarData(reqs)
  const monthly  = getMonthly(reqs)
  const totalVal = reqs.reduce((s, r) => s + (r.valor_estimado ?? 0), 0)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(["pendente", "aprovado_escritorio", "aprovado_final", "rejeitado"] as RequisitionStatus[]).map((s) => (
          <StatusTile key={s} status={s} count={porStatus[s] ?? 0} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Estado com cores semânticas */}
        <PanelCard title="Requisições por Estado" noPad>
          <div className="px-5 pb-5">
            <StatusBarChart data={barData} height={200} />
          </div>
        </PanelCard>

        {/* Evolução mensal */}
        <PanelCard title="Evolução Mensal" noPad>
          <div className="px-5 pb-5">
            <AreaTrend data={monthly} dataKey="total" name="Requisições" color="#002C62" height={200} />
          </div>
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PanelCard title="Requisições Recentes" noPad>
            <ReqTable rows={reqs} />
          </PanelCard>
        </div>
        <MetricCard icon={CreditCard} label="Valor Total Estimado" value={formatCurrency(totalVal)} iconBg="#EFF6FF" iconFg="#2563EB" />
      </div>
    </>
  )
}

function DashDirectorGeral({ reqs }: { reqs: Requisition[] }) {
  const aguarda   = reqs.filter((r) => r.status === "aprovado_escritorio")
  const hoje      = new Date().toDateString()
  const aprovHoje = reqs.filter((r) => r.status === "aprovado_final" && new Date(r.updated_at).toDateString() === hoje)
  const valorPend = aguarda.reduce((s, r) => s + (r.valor_estimado ?? 0), 0)

  const porDirecao: { name: string; value: number }[] = []
  const mapDir: Record<string, number> = {}
  for (const r of reqs) {
    const d = (r.direcao as { nome?: string } | undefined)?.nome ?? "—"
    mapDir[d] = (mapDir[d] ?? 0) + 1
  }
  for (const [k, v] of Object.entries(mapDir)) porDirecao.push({ name: k, value: v })
  porDirecao.sort((a, b) => b.value - a.value)

  const monthly = getMonthly(reqs)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <MetricCard icon={Clock}        label="Aguardam aprovação"       value={aguarda.length}            iconBg="#FFF8EC" iconFg="#D97706" to="/approvals" />
        <MetricCard icon={CheckCircle2} label="Aprovadas hoje"           value={aprovHoje.length}           iconBg="#ECFDF5" iconFg="#059669" />
        <MetricCard icon={CreditCard}   label="Valor pendente aprovação" value={formatCurrency(valorPend)} iconBg="#EFF6FF" iconFg="#2563EB" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Barras horizontais por direcção */}
        <PanelCard title="Por Direcção" noPad>
          <div className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porDirecao} layout="vertical" margin={{ left: 4, right: 12, top: 4 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E6E8EC" strokeOpacity={0.6} horizontal={false} />
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR} formatter={(v) => [v, "Requisições"]} />
                <Bar dataKey="value" name="Requisições" fill="#002C62" radius={[0, 6, 6, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        {/* Evolução mensal com aprovações */}
        <PanelCard title="Evolução Mensal" noPad>
          <div className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly} margin={{ left: -8, right: 4, top: 4 }}>
                <defs>
                  <linearGradient id="gDGTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#002C62" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#002C62" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gDGAprov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#059669" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR} />
                <Area type="monotone" dataKey="total"     name="Total"     stroke="#002C62" strokeWidth={2.5} fill="url(#gDGTotal)" dot={false} activeDot={{ r: 4, fill: "#002C62", strokeWidth: 0 }} />
                <Area type="monotone" dataKey="aprovadas" name="Aprovadas" stroke="#059669" strokeWidth={2}   fill="url(#gDGAprov)" dot={false} activeDot={{ r: 4, fill: "#059669", strokeWidth: 0 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ paddingTop: 8 }} formatter={(v) => <span style={{ color: "#475569", fontSize: 11 }}>{v}</span>} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>
      </div>

      <PanelCard title="A Aguardar a Minha Aprovação" noPad>
        <ReqTable rows={aguarda} />
      </PanelCard>
    </>
  )
}

function DashAdmin({ reqs }: { reqs: Requisition[] }) {
  const totalValor = reqs.reduce((s, r) => s + (r.valor_estimado ?? 0), 0)
  const totalPago  = reqs.reduce((s, r) => s + (r.total_paid ?? 0), 0)
  const emAprov    = reqs.filter((r) => ["pendente", "em_analise_escritorio", "aprovado_escritorio", "em_analise_director"].includes(r.status))
  const valorAprov = emAprov.reduce((s, r) => s + (r.valor_estimado ?? 0), 0)
  const taxaAprov  = (() => {
    const c = reqs.filter((r) => ["aprovado_final", "rejeitado"].includes(r.status)).length
    const a = reqs.filter((r) => r.status === "aprovado_final").length
    return c > 0 ? Math.round((a / c) * 100) : 0
  })()

  const barData = statusBarData(reqs)
  const monthly = getMonthly(reqs, 8)

  const tipoData = [
    { name: "Compra",  value: reqs.filter((r) => r.tipo === "compra").length,  fill: "#002C62" },
    { name: "Serviço", value: reqs.filter((r) => r.tipo === "servico").length, fill: "#2563EB" },
  ].filter((d) => d.value > 0)

  const shortcuts = [
    { to: "/admin/users",     label: "Utilizadores" },
    { to: "/admin/limits",    label: "Limites de Aprovação" },
    { to: "/admin/templates", label: "Templates" },
    { to: "/reports",         label: "Relatórios" },
    { to: "/payments",        label: "Pagamentos" },
  ]

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MetricCard icon={BarChart2}    label="Total Requisições"    value={reqs.length}                iconBg="#EEF4FF" iconFg="#002C62" />
        <MetricCard icon={Clock}        label="Valor em Aprovação"   value={formatCurrency(valorAprov)} iconBg="#FFF8EC" iconFg="#D97706" />
        <MetricCard icon={CreditCard}   label="Valor Total Estimado" value={formatCurrency(totalValor)} iconBg="#EFF6FF" iconFg="#2563EB" />
        <MetricCard icon={CheckCircle2} label="Valor Total Pago"     value={formatCurrency(totalPago)}  iconBg="#ECFDF5" iconFg="#059669" />
      </div>

      {/* Gráfico principal — ComposedChart */}
      <div className="mb-4">
        <PanelCard title={`Evolução Mensal · Taxa de aprovação: ${taxaAprov}%`} noPad>
          <div className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={monthly} margin={{ left: -8, right: 4, top: 4 }}>
                <defs>
                  <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#002C62" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#002C62" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR} />
                <Bar dataKey="total" name="Total" fill="url(#adminBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Line type="monotone" dataKey="aprovadas" name="Aprovadas" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: "#059669", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ paddingTop: 8 }} formatter={(v) => <span style={{ color: "#475569", fontSize: 11 }}>{v}</span>} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Estado com cores semânticas */}
        <div className="lg:col-span-1">
          <PanelCard title="Por Tipo" >
            <DonutChart data={tipoData} height={200} />
          </PanelCard>
        </div>

        <div className="lg:col-span-1">
          <PanelCard title="Por Estado" noPad>
            <div className="px-5 pb-5">
              <StatusBarChart data={barData} height={200} />
            </div>
          </PanelCard>
        </div>

        {/* Atalhos */}
        <PanelCard title="Atalhos">
          <div className="space-y-0.5">
            {shortcuts.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between px-3 py-2.5 text-[13px] rounded-[10px] transition-colors"
                style={{ color: "#0F172A" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#F0F4FF" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "" }}
              >
                <span>{item.label}</span>
                <ArrowRight size={13} style={{ color: "#94A3B8" }} />
              </Link>
            ))}
          </div>
        </PanelCard>
      </div>
    </>
  )
}

function DashAuditor({ reqs }: { reqs: Requisition[] }) {
  const totalValor = reqs.reduce((s, r) => s + (r.valor_estimado ?? 0), 0)
  const totalPago  = reqs.reduce((s, r) => s + (r.total_paid ?? 0), 0)
  const rejeitadas = reqs.filter((r) => r.status === "rejeitado").length
  const taxaRej    = reqs.length > 0 ? Math.round((rejeitadas / reqs.length) * 100) : 0

  const monthly  = getMonthly(reqs, 8)
  const tipoData = [
    { name: "Compra",  value: reqs.filter((r) => r.tipo === "compra").length,  fill: "#002C62" },
    { name: "Serviço", value: reqs.filter((r) => r.tipo === "servico").length, fill: "#2563EB" },
  ].filter((d) => d.value > 0)

  const barData = statusBarData(reqs)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <MetricCard icon={BarChart2}    label="Total Requisições"    value={reqs.length}                iconBg="#EEF4FF" iconFg="#002C62" />
        <MetricCard icon={CreditCard}   label="Valor Total Estimado" value={formatCurrency(totalValor)} iconBg="#EFF6FF" iconFg="#2563EB" />
        <MetricCard icon={CheckCircle2} label="Valor Total Pago"     value={formatCurrency(totalPago)}  iconBg="#ECFDF5" iconFg="#059669" />
      </div>

      {/* Evolução mensal — AreaChart com gradiente */}
      <div className="mb-4">
        <PanelCard title={`Evolução Mensal · Taxa de rejeição: ${taxaRej}%`} noPad>
          <div className="px-5 pb-5">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ left: -8, right: 4, top: 4 }}>
                <defs>
                  <linearGradient id="audTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#002C62" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="#002C62" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="audAprov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#059669" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR} />
                <Area type="monotone" dataKey="total"     name="Total"     stroke="#002C62" strokeWidth={2.5} fill="url(#audTotal)" dot={false} activeDot={{ r: 4, fill: "#002C62", strokeWidth: 0 }} />
                <Area type="monotone" dataKey="aprovadas" name="Aprovadas" stroke="#059669" strokeWidth={2}   fill="url(#audAprov)" dot={false} activeDot={{ r: 4, fill: "#059669", strokeWidth: 0 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ paddingTop: 8 }} formatter={(v) => <span style={{ color: "#475569", fontSize: 11 }}>{v}</span>} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PanelCard title="Por Tipo">
          <DonutChart data={tipoData} height={200} />
        </PanelCard>
        <div className="lg:col-span-2">
          <PanelCard title="Por Estado" noPad>
            <div className="px-5 pb-5">
              <StatusBarChart data={barData} height={200} />
            </div>
          </PanelCard>
        </div>
      </div>

      <div className="mt-4 text-right">
        <Link to="/reports" className="text-[13px] font-semibold hover:underline" style={{ color: "#002C62" }}>
          Ver Relatórios Completos <TrendingUp size={13} className="inline ml-0.5" />
        </Link>
      </div>
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DashboardPage() {
  const { profile }                    = useAuth()
  const { data: reqs = [], isLoading } = useRequisitions()
  const role = profile?.role

  function renderContent() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[20px] p-5 animate-pulse" style={{ boxShadow: CARD_SHADOW }}>
              <div className="w-10 h-10 rounded-[12px] mb-4" style={{ background: "#F1F5F9" }} />
              <div className="h-3 rounded w-1/2 mb-3" style={{ background: "#F1F5F9" }} />
              <div className="h-7 rounded w-1/3" style={{ background: "#F1F5F9" }} />
            </div>
          ))}
        </div>
      )
    }
    if (role === "colaborador" || role === "gestor_tics")                                          return <DashColabTics       reqs={reqs} />
    if (role === "gestor_escritorio")                                                               return <DashGestorEscritorio reqs={reqs} />
    if (role === "director_comercial" || role === "director_projectos" || role === "gestor_comercial") return <DashDirectorDivisao  reqs={reqs} />
    if (role === "director_geral")                                                                  return <DashDirectorGeral    reqs={reqs} />
    if (role === "admin")                                                                           return <DashAdmin            reqs={reqs} />
    if (role === "auditor")                                                                         return <DashAuditor          reqs={reqs} />
    return <p className="text-[13px]" style={{ color: "#94A3B8" }}>Sem dashboard definido para este role.</p>
  }

  const greetings: Record<string, string> = {
    colaborador:        "As Minhas Requisições",
    gestor_tics:        "As Minhas Requisições",
    gestor_escritorio:  "Painel de Aprovações",
    director_comercial: "Direcção Comercial",
    director_projectos: "Direcção de Projectos",
    gestor_comercial:   "Direcção Comercial",
    director_geral:     "Direcção Geral",
    admin:              "Painel de Administração",
    auditor:            "Auditoria",
  }

  return (
    <PageWrapper titulo={greetings[role ?? ""] ?? "Dashboard"}>
      {renderContent()}
    </PageWrapper>
  )
}
