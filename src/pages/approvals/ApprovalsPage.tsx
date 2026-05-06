import { useState, useRef, useCallback } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  CheckCircle2, XOctagon, CornerUpLeft,
  Loader2, ExternalLink, Inbox, X,
} from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { ErrorState } from "@/components/shared/ErrorState"
import { useCreateApproval } from "@/hooks/useApprovals"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { QUERY_KEYS, URGENCIA_LABELS } from "@/lib/constants"
import { formatCurrency, formatRelativeTime, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Requisition, ApprovalDecisao, ApprovalNivel } from "@/types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function waitDays(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function WaitBadge({ dateStr }: { dateStr: string }) {
  const days = waitDays(dateStr)
  if (days < 2) {
    return (
      <span className="text-[11px] text-[#86868b]">
        {days === 0 ? "Hoje" : "1 dia"}
      </span>
    )
  }
  if (days < 4) {
    return (
      <span className="text-[11px] font-medium text-amber-600">
        {days} dias
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 text-[11px] font-semibold animate-pulse">
      {days} dias — Atenção
    </span>
  )
}

// ─── Ordenação inteligente ────────────────────────────────────────────────────

const URGENCIA_BASE: Record<string, number> = {
  muito_urgente: 0,
  urgente:       2,
  normal:        4,
}

function sortSmart(items: Requisition[]): Requisition[] {
  return [...items].sort((a, b) => {
    const daysA = waitDays(a.created_at)
    const daysB = waitDays(b.created_at)

    const tierOf = (req: Requisition, days: number): number => {
      const base = URGENCIA_BASE[req.urgencia] ?? 4
      if (req.urgencia === "muito_urgente" && days > 1) return 0
      if (req.urgencia === "urgente"       && days > 2) return 1
      return base + (days > 0 ? 0 : 1)
    }

    const ta = tierOf(a, daysA)
    const tb = tierOf(b, daysB)
    if (ta !== tb) return ta - tb
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const SELECT = "*, profile:profiles(nome_completo), direcao:direcoes(nome), entity:entities(nome)"

function usePendingLevel1(enabled: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEYS.requisitions, "pending-l1"] as const,
    enabled,
    queryFn: async (): Promise<Requisition[]> => {
      const { data, error } = await supabase
        .from("requisitions")
        .select(SELECT)
        .eq("status", "pendente")
        .order("created_at", { ascending: true })
      if (error) throw error
      return sortSmart((data ?? []) as Requisition[])
    },
  })
}

function usePendingLevel2(enabled: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEYS.requisitions, "pending-l2"] as const,
    enabled,
    queryFn: async (): Promise<Requisition[]> => {
      const { data, error } = await supabase
        .from("requisitions")
        .select(SELECT)
        .eq("status", "aprovado_escritorio")
        .order("created_at", { ascending: true })
      if (error) throw error
      return sortSmart((data ?? []) as Requisition[])
    },
  })
}

// ─── Preview Tooltip ──────────────────────────────────────────────────────────

function RequisitionPreview({ req }: { req: Requisition }) {
  const profile = req.profile as { nome_completo?: string } | undefined
  const entity  = req.entity  as { nome?: string } | undefined

  return (
    <div className="w-72 bg-white rounded-[16px] p-4" style={{ boxShadow: "0 8px 24px -4px rgba(15,23,42,.16)" }}>
      <p className="text-[13px] font-semibold text-[#1d1d1f] mb-2 leading-snug">{req.titulo}</p>
      {req.descricao && (
        <p className="text-[11px] text-[#6e6e73] mb-3 leading-relaxed">
          {req.descricao.slice(0, 120)}{req.descricao.length > 120 ? "…" : ""}
        </p>
      )}
      <dl className="space-y-1">
        {entity?.nome && (
          <div className="flex gap-2">
            <dt className="text-[11px] text-[#86868b] shrink-0 w-20">Fornecedor</dt>
            <dd className="text-[11px] text-[#1d1d1f] font-medium">{entity.nome}</dd>
          </div>
        )}
        {req.valor_estimado !== null && (
          <div className="flex gap-2">
            <dt className="text-[11px] text-[#86868b] shrink-0 w-20">Valor est.</dt>
            <dd className="text-[11px] text-[#1d1d1f] font-medium">{formatCurrency(req.valor_estimado)}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="text-[11px] text-[#86868b] shrink-0 w-20">Criado por</dt>
          <dd className="text-[11px] text-[#6e6e73]">{profile?.nome_completo ?? "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[11px] text-[#86868b] shrink-0 w-20">Data</dt>
          <dd className="text-[11px] text-[#6e6e73]">{formatDate(req.created_at)}</dd>
        </div>
      </dl>
    </div>
  )
}

// ─── InlineActionForm ─────────────────────────────────────────────────────────

interface InlineActionProps {
  req:       Requisition
  nivel:     ApprovalNivel
  decisao:   ApprovalDecisao
  onCancel:  () => void
  onConfirm: (comment: string) => Promise<void>
  isPending: boolean
}

function InlineActionForm({ decisao, onCancel, onConfirm, isPending }: InlineActionProps) {
  const [comment, setComment] = useState("")

  const labels: Record<ApprovalDecisao, { title: string; btnCls: string; needsComment: boolean }> = {
    aprovado:  { title: "Confirmar aprovação",   btnCls: "bg-green-600 hover:bg-green-700",   needsComment: false },
    devolvido: { title: "Devolver para revisão", btnCls: "bg-orange-500 hover:bg-orange-600", needsComment: true  },
    rejeitado: { title: "Rejeitar requisição",   btnCls: "bg-red-600 hover:bg-red-700",       needsComment: true  },
  }
  const cfg = labels[decisao]
  const disabled = isPending || (cfg.needsComment && !comment.trim())

  return (
    <div className="px-4 pb-4 pt-3 border-t border-[#d2d2d7] bg-[#f5f5f7] rounded-b-[12px] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[#1d1d1f]">{cfg.title}</p>
        <button onClick={onCancel} className="text-[#86868b] hover:text-[#1d1d1f] p-0.5 rounded-[4px] transition-colors">
          <X size={13} />
        </button>
      </div>
      <div>
        <label className="block text-[11px] text-[#6e6e73] mb-1">
          Comentário{cfg.needsComment && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Motivo ou observações…"
          autoFocus
          className="w-full px-3 py-2 text-[13px] border border-[#d2d2d7] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none bg-white text-[#1d1d1f]"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-[11px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(comment)}
          disabled={disabled}
          className={cn(
            "px-4 py-1.5 text-[11px] font-medium text-white rounded-full disabled:opacity-50 flex items-center gap-1.5 transition-colors",
            cfg.btnCls
          )}
        >
          {isPending && <Loader2 size={11} className="animate-spin" />}
          Confirmar
        </button>
      </div>
    </div>
  )
}

// ─── ReqCard ──────────────────────────────────────────────────────────────────

interface ReqCardProps {
  req:       Requisition
  nivel:     ApprovalNivel
  onApprove: (req: Requisition, decisao: ApprovalDecisao, nivel: ApprovalNivel, comment: string) => Promise<void>
  isPending: boolean
  busyId:    string | null
}

function ReqCard({ req, nivel, onApprove, isPending, busyId }: ReqCardProps) {
  const profile = req.profile as { nome_completo?: string } | undefined
  const direcao = req.direcao as { nome?: string } | undefined

  const [action, setAction]       = useState<ApprovalDecisao | null>(null)
  const [showPreview, setPreview] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isBusy = isPending && busyId === req.id

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => setPreview(true), 400)
  }, [])

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current)
    setPreview(false)
  }, [])

  async function handleConfirm(comment: string) {
    if (!action) return
    await onApprove(req, action, nivel, comment)
    setAction(null)
  }

  return (
    <div
      className="relative bg-white rounded-[16px] transition-shadow"
      style={{ boxShadow: "0 2px 8px -2px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium ring-1",
              req.urgencia === "muito_urgente"
                ? "bg-red-50 text-red-700 ring-red-200"
                : req.urgencia === "urgente"
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : "bg-[#f5f5f7] text-[#6e6e73] ring-[#d2d2d7]"
            )}>
              {URGENCIA_LABELS[req.urgencia]}
            </span>
            {req.tipo && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] bg-[#f5f5f7] text-[#6e6e73] ring-1 ring-[#d2d2d7] capitalize">
                {req.tipo}
              </span>
            )}
            <WaitBadge dateStr={req.created_at} />
          </div>
          <p className="text-[13px] font-semibold text-[#1d1d1f] leading-tight">{req.titulo}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-[#6e6e73]">
            <span>{profile?.nome_completo ?? "—"}</span>
            <span className="text-[#d2d2d7]">·</span>
            <span>{direcao?.nome ?? "—"}</span>
            {req.valor_estimado !== null && (
              <>
                <span className="text-[#d2d2d7]">·</span>
                <span className="font-medium text-[#1d1d1f]">{formatCurrency(req.valor_estimado)}</span>
              </>
            )}
            <span className="text-[#d2d2d7]">·</span>
            <span>{formatRelativeTime(req.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 ml-2">
          <Link
            to={`/requisitions/${req.id}`}
            title="Ver detalhes"
            className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-[6px] transition-colors"
          >
            <ExternalLink size={14} />
          </Link>
          {(["aprovado", "devolvido", "rejeitado"] as ApprovalDecisao[]).map((d) => (
            <button
              key={d}
              onClick={() => setAction(action === d ? null : d)}
              title={{ aprovado: "Aprovar", devolvido: "Devolver", rejeitado: "Rejeitar" }[d]}
              disabled={isBusy}
              className={cn(
                "p-1.5 rounded-[6px] transition-colors disabled:opacity-50",
                d === "aprovado"  && (action === d ? "bg-green-50 text-green-700"  : "text-green-600 hover:bg-green-50"),
                d === "devolvido" && (action === d ? "bg-amber-50 text-amber-700"   : "text-amber-500 hover:bg-amber-50"),
                d === "rejeitado" && (action === d ? "bg-red-50 text-red-700"       : "text-red-500 hover:bg-red-50"),
              )}
            >
              {isBusy && action === d
                ? <Loader2 size={16} className="animate-spin" />
                : d === "aprovado"  ? <CheckCircle2 size={16} />
                : d === "devolvido" ? <CornerUpLeft size={16} />
                : <XOctagon size={16} />
              }
            </button>
          ))}
        </div>
      </div>

      {action && (
        <InlineActionForm
          req={req}
          nivel={nivel}
          decisao={action}
          onCancel={() => setAction(null)}
          onConfirm={handleConfirm}
          isPending={isBusy}
        />
      )}

      {showPreview && !action && (
        <div className="absolute right-0 top-full mt-1 z-50 pointer-events-none">
          <RequisitionPreview req={req} />
        </div>
      )}
    </div>
  )
}

// ─── SectionQueue ─────────────────────────────────────────────────────────────

function SectionQueue({
  title, items, nivel, isLoading, isError, onRetry, onApprove, isPending, busyId,
}: {
  title:     string
  items:     Requisition[]
  nivel:     ApprovalNivel
  isLoading: boolean
  isError:   boolean
  onRetry:   () => void
  onApprove: (req: Requisition, decisao: ApprovalDecisao, nivel: ApprovalNivel, comment: string) => Promise<void>
  isPending: boolean
  busyId:    string | null
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <h2 className="text-[13px] font-semibold text-[#1d1d1f]">{title}</h2>
        {!isLoading && !isError && items.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[11px] font-bold" style={{ background: "#002C62", color: "#fff" }}>
            {items.length}
          </span>
        )}
      </div>

      {isError ? (
        <div className="bg-white rounded-[16px]" style={{ boxShadow: "0 2px 8px -2px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)" }}>
          <ErrorState
            message="Não foi possível carregar as aprovações."
            onRetry={onRetry}
          />
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#f5f5f7] rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-[16px] text-[#86868b]" style={{ boxShadow: "0 2px 8px -2px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)" }}>
          <Inbox size={26} className="mb-2 opacity-40" />
          <p className="text-[13px]">Nenhuma requisição pendente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((req) => (
            <ReqCard
              key={req.id}
              req={req}
              nivel={nivel}
              onApprove={onApprove}
              isPending={isPending}
              busyId={busyId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ApprovalsPage ────────────────────────────────────────────────────────────

export function ApprovalsPage() {
  const { profile }    = useAuth()
  const createApproval = useCreateApproval()

  const [busyId, setBusyId] = useState<string | null>(null)

  const isGestor   = profile?.role === "gestor_escritorio"
  const isDirector = profile?.role === "director_geral"
  const isAdmin    = profile?.role === "admin"

  const showL1 = isGestor || isAdmin
  const showL2 = isDirector || isAdmin

  const l1 = usePendingLevel1(showL1)
  const l2 = usePendingLevel2(showL2)

  async function handleApprove(
    req: Requisition,
    decisao: ApprovalDecisao,
    nivel: ApprovalNivel,
    comment: string,
  ) {
    if (!profile) return
    setBusyId(req.id)
    try {
      await createApproval.mutateAsync({
        requisition_id: req.id,
        aprovador_id:   profile.id,
        nivel,
        decisao,
        comentario:     comment.trim() || null,
      })
      const msg = { aprovado: "Aprovado!", devolvido: "Devolvido para revisão.", rejeitado: "Rejeitado." }
      toast.success(msg[decisao])
    } catch {
      toast.error("Erro ao registar decisão.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageWrapper
      titulo="Fila de Aprovações"
      breadcrumb={<Breadcrumb items={[{ label: "Aprovações" }]} />}
    >
      <div className="space-y-8">
        {showL1 && (
          <SectionQueue
            title="Nível 1 — Escritório"
            items={l1.data ?? []}
            nivel={1}
            isLoading={l1.isLoading}
            isError={l1.isError}
            onRetry={() => { void l1.refetch() }}
            onApprove={handleApprove}
            isPending={createApproval.isPending}
            busyId={busyId}
          />
        )}
        {showL2 && (
          <SectionQueue
            title="Nível 2 — Director Geral"
            items={l2.data ?? []}
            nivel={2}
            isLoading={l2.isLoading}
            isError={l2.isError}
            onRetry={() => { void l2.refetch() }}
            onApprove={handleApprove}
            isPending={createApproval.isPending}
            busyId={busyId}
          />
        )}
      </div>
    </PageWrapper>
  )
}
