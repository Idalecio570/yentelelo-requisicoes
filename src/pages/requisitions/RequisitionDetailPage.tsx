import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft, Pencil, XCircle, Loader2,
  CheckCircle2, XOctagon, CornerUpLeft, Send,
  Paperclip, MessageSquare, CreditCard,
} from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Modal } from "@/components/shared/Modal"
import { DangerConfirmModal } from "@/components/shared/DangerConfirmModal"
import { StatusContextBanner } from "@/components/shared/StatusContextBanner"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { useRequisition, useCancelRequisition } from "@/hooks/useRequisitions"
import { useApprovals, useCreateApproval } from "@/hooks/useApprovals"
import { useComments, useCreateComment } from "@/hooks/useComments"
import { usePayments, useCreatePayment } from "@/hooks/usePayments"
import { useRequisitionItems } from "@/hooks/useRequisitionItems"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils"
import { URGENCIA_LABELS } from "@/lib/constants"
import { ItemsTable } from "@/components/requisitions/ItemsTable"
import type { ItemRowData } from "@/components/requisitions/ItemsTable"
import { DateInput } from "@/components/ui/date-input"
import type { ApprovalDecisao } from "@/types"

// ─── Status Stepper ───────────────────────────────────────────────────────────

const STATUS_STEPS = [
  "pendente",
  "em_analise_escritorio",
  "aprovado_escritorio",
  "em_analise_director",
  "aprovado_final",
] as const

const STEP_LABELS: Record<string, string> = {
  pendente:              "Pendente",
  em_analise_escritorio: "Em análise — Escritório",
  aprovado_escritorio:   "Aprovado — Escritório",
  em_analise_director:   "Em análise — Director",
  aprovado_final:        "Aprovado — Final",
}

function StatusStepper({ current }: { current: string }) {
  const isTerminal = current === "rejeitado" || current === "cancelado" || current === "devolvido"
  return (
    <ol className="relative ml-3 space-y-4" style={{ borderLeft: "2px solid #E6E8EC" }}>
      {STATUS_STEPS.map((s, i) => {
        const idx  = STATUS_STEPS.indexOf(current as typeof STATUS_STEPS[number])
        const done = i < idx || current === "aprovado_final"
        const active = s === current
        return (
          <li key={s} className="ml-4">
            <span className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 ${
              active
                ? "border-[#002C62] bg-[#002C62]"
                : done
                ? "border-green-500 bg-green-500"
                : "border-[#E6E8EC] bg-white"
            }`} />
            <p className={`text-[11px] ${
              active ? "font-semibold text-[#002C62]"
                     : done ? "text-green-700"
                     : "text-[#94A3B8]"
            }`}>
              {STEP_LABELS[s] ?? s.replace(/_/g, " ")}
            </p>
          </li>
        )
      })}
      {isTerminal && (
        <li className="ml-4">
          <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-red-400 bg-red-400" />
          <p className="text-[11px] font-semibold text-red-700">{STEP_LABELS[current] ?? current}</p>
        </li>
      )}
    </ol>
  )
}

// ─── Estilos partilhados ──────────────────────────────────────────────────────

const inputCls    = "w-full px-3 py-2 text-[13px] border border-[#d2d2d7] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-[#1d1d1f] bg-white"
const labelCls    = "block text-[11px] font-medium text-[#6e6e73] mb-1"
const sectionHdr  = "text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide"
const cardCls     = "bg-white rounded-[20px] p-5"
const cardStyle   = { boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }

// ─── RequisitionDetailPage ────────────────────────────────────────────────────

export function RequisitionDetailPage() {
  const { id = "" } = useParams<{ id: string }>()
  const { profile }  = useAuth()

  const { data: req,      isLoading }    = useRequisition(id)
  const { data: approvals = [] }         = useApprovals(id)
  const { data: comments  = [] }         = useComments(id)
  const { data: payments  = [] }         = usePayments(id)
  const { data: reqItems  = [] }         = useRequisitionItems(id)
  const cancelReq      = useCancelRequisition()
  const createApproval = useCreateApproval()
  const createComment  = useCreateComment()
  const createPayment  = useCreatePayment()

  const [approvalModal, setApprovalModal] = useState<{
    open: boolean; decisao: ApprovalDecisao
  }>({ open: false, decisao: "aprovado" })
  const [approvalComment, setApprovalComment] = useState("")

  const [cancelModal, setCancelModal]   = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm]   = useState({ valor: "", data: "", notas: "" })
  const [commentText, setCommentText]   = useState("")
  const [sendingComment, setSendingComment] = useState(false)

  if (isLoading) {
    return (
      <PageWrapper titulo="Detalhe da Requisição">
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-red-600" />
        </div>
      </PageWrapper>
    )
  }

  if (!req) {
    return (
      <PageWrapper titulo="Detalhe da Requisição">
        <p className="text-[13px] text-[#6e6e73]">Requisição não encontrada.</p>
      </PageWrapper>
    )
  }

  const isOwner     = profile?.id === req.criado_por
  const canEdit     = isOwner && (req.status === "pendente" || req.status === "devolvido")
  const canCancel   = isOwner && ["pendente", "devolvido"].includes(req.status)
  const isGestor    = profile?.role === "gestor_escritorio"
  const isDirector  = profile?.role === "director_geral"
  const isAdmin     = profile?.role === "admin"

  const canApproveL1  = (isGestor || isAdmin) && req.status === "pendente"
  const canApproveL2  = (isDirector || isAdmin) && req.status === "aprovado_escritorio"
  const saldoReq      = Math.max(0, (req.valor_estimado ?? 0) - (req.total_paid ?? 0))
  const canAddPayment = (isGestor || isDirector || isAdmin) && req.status === "aprovado_final" && saldoReq > 0

  async function handleApproval() {
    if (!profile) return
    const nivel: 1 | 2 = canApproveL1 ? 1 : 2
    try {
      await createApproval.mutateAsync({
        requisition_id: id,
        aprovador_id:   profile.id,
        nivel,
        decisao:        approvalModal.decisao,
        comentario:     approvalComment || null,
      })
      toast.success("Decisão registada com sucesso!")
      setApprovalModal({ open: false, decisao: "aprovado" })
      setApprovalComment("")
    } catch {
      toast.error("Erro ao registar decisão.")
    }
  }

  async function handleCancel() {
    try {
      await cancelReq.mutateAsync(id)
      toast.success("Requisição cancelada.")
      setCancelModal(false)
    } catch {
      toast.error("Erro ao cancelar.")
    }
  }

  async function handleSendComment() {
    if (!commentText.trim() || !profile) return
    setSendingComment(true)
    try {
      await createComment.mutateAsync({
        requisition_id: id,
        autor_id:       profile.id,
        conteudo:       commentText.trim(),
      })
      setCommentText("")
    } catch {
      toast.error("Erro ao enviar comentário.")
    } finally {
      setSendingComment(false)
    }
  }

  async function handleAddPayment() {
    if (!profile) return
    const valor = parseFloat(paymentForm.valor)
    if (isNaN(valor) || valor <= 0) { toast.error("Valor inválido."); return }
    if (!paymentForm.data)           { toast.error("Data obrigatória."); return }
    const saldoRestante = Math.max(0, valorEst - totalPago)
    if (valor > saldoRestante) {
      toast.error(`O valor não pode exceder o saldo em aberto (${formatCurrency(saldoRestante)}).`)
      return
    }
    try {
      await createPayment.mutateAsync({
        requisition_id: id,
        valor,
        data_pagamento: paymentForm.data,
        notas:          paymentForm.notas || null,
        registado_por:  profile.id,
      })
      toast.success("Pagamento registado!")
      setPaymentModal(false)
      setPaymentForm({ valor: "", data: "", notas: "" })
    } catch {
      toast.error("Erro ao registar pagamento.")
    }
  }

  const totalPago = payments.reduce((s, p) => s + p.valor, 0)
  const valorEst  = req.valor_estimado ?? 0
  const pctPago   = valorEst > 0 ? Math.min(100, (totalPago / valorEst) * 100) : 0

  const lastDevolvido = [...approvals].reverse().find((a) => a.decisao === "devolvido")

  return (
    <PageWrapper
      titulo={req.titulo}
      breadcrumb={
        <Breadcrumb items={[{ label: "Requisições", href: "/requisitions" }, { label: req.titulo }]} />
      }
      actions={
        <Link
          to="/requisitions"
          className="inline-flex items-center gap-1 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          <ArrowLeft size={14} /> Voltar
        </Link>
      }
    >
      <StatusContextBanner
        status={req.status}
        updatedAt={req.updated_at}
        lastComment={lastDevolvido?.comentario}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Coluna esquerda (3/5) ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Detalhes gerais */}
          <div className={cardCls} style={cardStyle}>
            <h2 className={`${sectionHdr} mb-4`}>Detalhes</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-[11px] text-[#86868b]">Tipo</dt>
                <dd className="text-[13px] font-medium text-[#1d1d1f] capitalize mt-0.5">{req.tipo ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[#86868b]">Urgência</dt>
                <dd className="text-[13px] font-medium text-[#1d1d1f] mt-0.5">{URGENCIA_LABELS[req.urgencia]}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[#86868b]">Valor Total</dt>
                <dd className="text-[13px] font-medium text-[#1d1d1f] mt-0.5 tabular-nums">
                  {req.valor_estimado !== null ? formatCurrency(req.valor_estimado) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-[#86868b]">Solicitante</dt>
                <dd className="text-[13px] font-medium text-[#1d1d1f] mt-0.5">{req.profile?.nome_completo ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[#86868b]">Direcção</dt>
                <dd className="text-[13px] font-medium text-[#1d1d1f] mt-0.5">{req.direcao?.nome ?? "—"}</dd>
              </div>
              {/* Fornecedor legado (requisições sem itens) */}
              {req.entity?.nome && reqItems.length === 0 && (
                <div>
                  <dt className="text-[11px] text-[#86868b]">Fornecedor</dt>
                  <dd className="text-[13px] font-medium text-[#1d1d1f] mt-0.5">{req.entity.nome}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-[11px] text-[#86868b]">Data de criação</dt>
                <dd className="text-[13px] font-medium text-[#1d1d1f] mt-0.5">{formatDate(req.created_at)}</dd>
              </div>
              {req.descricao && (
                <div className="col-span-2">
                  <dt className="text-[11px] text-[#86868b] mb-1">Descrição</dt>
                  <dd className="text-[13px] text-[#424245] whitespace-pre-wrap leading-relaxed">{req.descricao}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Itens da Requisição */}
          <div className={cardCls} style={cardStyle}>
            <h2 className={`${sectionHdr} mb-4`}>Itens da Requisição</h2>
            <ItemsTable
              items={reqItems.map<ItemRowData>((it) => ({
                _key:           it.id,
                descricao:      it.descricao,
                categoria:      it.categoria ?? "",
                quantidade:     it.quantidade,
                valor_unitario: it.valor_unitario,
                entity_id:      it.entity_id ?? "",
                entityName:     it.entity?.nome,
                notas:          it.notas ?? "",
                ordem:          it.ordem,
              }))}
              onChange={() => {}}
              entities={[]}
              readOnly
            />
          </div>

          {/* Orçamentos */}
          {req.orcamentos.length > 0 && (
            <div className={cardCls} style={cardStyle}>
              <h2 className={`${sectionHdr} mb-4`}>Orçamentos Comparativos</h2>
              <div className="space-y-2">
                {req.orcamentos.map((o, i) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-[#f5f5f7] rounded-[8px]">
                    <div>
                      <p className="text-[13px] font-medium text-[#1d1d1f]">{o.fornecedor}</p>
                      {o.notas && <p className="text-[11px] text-[#6e6e73] mt-0.5">{o.notas}</p>}
                    </div>
                    <span className="text-[13px] font-semibold text-[#1d1d1f] tabular-nums ml-4">
                      {formatCurrency(o.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anexos */}
          {req.anexos.length > 0 && (
            <div className={cardCls} style={cardStyle}>
              <h2 className={`${sectionHdr} mb-3 flex items-center gap-1.5`}>
                <Paperclip size={12} /> Anexos
              </h2>
              <ul className="space-y-1.5">
                {req.anexos.map((url, i) => {
                  const name = url.split("/").pop() ?? `Anexo ${i + 1}`
                  return (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] text-red-600 hover:underline truncate block"
                      >
                        {name}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Comentários */}
          <div className={cardCls} style={cardStyle}>
            <h2 className={`${sectionHdr} mb-4 flex items-center gap-1.5`}>
              <MessageSquare size={12} /> Comentários ({comments.length})
            </h2>

            <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-[11px] text-[#86868b] italic">Sem comentários ainda.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-[11px] font-semibold text-[#424245]">
                      {(c.autor?.nome_completo ?? "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-medium text-[#1d1d1f]">{c.autor?.nome_completo ?? "—"}</span>
                        <span className="text-[10px] text-[#86868b]">{formatRelativeTime(c.created_at)}</span>
                      </div>
                      <p className="text-[13px] text-[#424245] mt-0.5 whitespace-pre-wrap">{c.conteudo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment() }
                }}
                rows={2}
                placeholder="Escreva um comentário… (Enter para enviar)"
                className={`flex-1 ${inputCls} resize-none`}
              />
              <button
                onClick={handleSendComment}
                disabled={!commentText.trim() || sendingComment}
                className="self-end px-3 py-2 bg-red-600 text-white rounded-[8px] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendingComment ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Coluna direita (2/5) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Estado + stepper + acções */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center gap-2 mb-5">
              <StatusBadge estado={req.status} />
            </div>

            <StatusStepper current={req.status} />

            {/* Acções do owner */}
            {(canEdit || canCancel) && (
              <div className="mt-5 pt-5 border-t border-[#f5f5f7] flex flex-col gap-2">
                {canEdit && (
                  <Link
                    to={`/requisitions/${id}/edit`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 border border-[#d2d2d7] text-[13px] font-medium rounded-[8px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                  >
                    <Pencil size={13} /> Editar
                  </Link>
                )}
                {canCancel && (
                  <button
                    onClick={() => setCancelModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 border border-red-200 text-[13px] font-medium rounded-[8px] text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <XCircle size={13} /> Cancelar Requisição
                  </button>
                )}
              </div>
            )}

            {/* Aprovação nível 1 */}
            {canApproveL1 && (
              <div className="mt-5 pt-5 border-t border-[#f5f5f7] space-y-2">
                <p className="text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide mb-2">Aprovação — Nível 1</p>
                <button
                  onClick={() => setApprovalModal({ open: true, decisao: "aprovado" })}
                  className="inline-flex items-center gap-1.5 w-full justify-center py-2 bg-green-600 text-white text-[13px] font-medium rounded-[8px] hover:bg-green-700 transition-colors"
                >
                  <CheckCircle2 size={13} /> Aprovar
                </button>
                <button
                  onClick={() => setApprovalModal({ open: true, decisao: "devolvido" })}
                  className="inline-flex items-center gap-1.5 w-full justify-center py-2 border border-amber-300 text-amber-700 text-[13px] font-medium rounded-[8px] hover:bg-amber-50 transition-colors"
                >
                  <CornerUpLeft size={13} /> Devolver
                </button>
                <button
                  onClick={() => setApprovalModal({ open: true, decisao: "rejeitado" })}
                  className="inline-flex items-center gap-1.5 w-full justify-center py-2 border border-red-200 text-red-600 text-[13px] font-medium rounded-[8px] hover:bg-red-50 transition-colors"
                >
                  <XOctagon size={13} /> Rejeitar
                </button>
              </div>
            )}

            {/* Aprovação nível 2 */}
            {canApproveL2 && (
              <div className="mt-5 pt-5 border-t border-[#f5f5f7] space-y-2">
                <p className="text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide mb-2">Aprovação — Nível 2</p>
                <button
                  onClick={() => setApprovalModal({ open: true, decisao: "aprovado" })}
                  className="inline-flex items-center gap-1.5 w-full justify-center py-2 bg-green-600 text-white text-[13px] font-medium rounded-[8px] hover:bg-green-700 transition-colors"
                >
                  <CheckCircle2 size={13} /> Aprovar
                </button>
                <button
                  onClick={() => setApprovalModal({ open: true, decisao: "devolvido" })}
                  className="inline-flex items-center gap-1.5 w-full justify-center py-2 border border-amber-300 text-amber-700 text-[13px] font-medium rounded-[8px] hover:bg-amber-50 transition-colors"
                >
                  <CornerUpLeft size={13} /> Devolver
                </button>
                <button
                  onClick={() => setApprovalModal({ open: true, decisao: "rejeitado" })}
                  className="inline-flex items-center gap-1.5 w-full justify-center py-2 border border-red-200 text-red-600 text-[13px] font-medium rounded-[8px] hover:bg-red-50 transition-colors"
                >
                  <XOctagon size={13} /> Rejeitar
                </button>
              </div>
            )}
          </div>

          {/* Histórico de aprovações */}
          {approvals.length > 0 && (
            <div className={cardCls} style={cardStyle}>
              <h2 className={`${sectionHdr} mb-4`}>Histórico de Aprovações</h2>
              <div className="space-y-3">
                {approvals.map((a) => (
                  <div key={a.id}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] font-medium text-[#1d1d1f]">{a.aprovador?.nome_completo ?? "—"}</span>
                      <span className="text-[11px] text-[#86868b]">{formatDate(a.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-[#86868b]">Nível {a.nivel} ·</span>
                      <span className={`text-[11px] font-medium ${
                        a.decisao === "aprovado"  ? "text-green-700"
                        : a.decisao === "rejeitado" ? "text-red-600"
                        : "text-amber-600"
                      }`}>
                        {a.decisao ?? "pendente"}
                      </span>
                    </div>
                    {a.comentario && (
                      <p className="text-[11px] text-[#6e6e73] mt-1 italic">"{a.comentario}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagamentos */}
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${sectionHdr} flex items-center gap-1.5`}>
                <CreditCard size={12} /> Pagamentos
              </h2>
              {canAddPayment && (
                <button
                  onClick={() => setPaymentModal(true)}
                  className="text-[12px] font-semibold hover:underline"
                  style={{ color: "#002C62" }}
                >
                  + Registar
                </button>
              )}
            </div>

            {/* Barra de progresso — sempre visível quando há valor estimado */}
            {valorEst > 0 && (
              <div className="mb-4 p-3 rounded-[12px]" style={{ background: "#F8FAFC" }}>
                <div className="flex justify-between text-[12px] mb-1.5" style={{ color: "#475569" }}>
                  <span>
                    Pago:{" "}
                    <span className="font-semibold" style={{ color: "#0F172A" }}>{formatCurrency(totalPago)}</span>
                    {" "}<span style={{ color: "#94A3B8" }}>/ {formatCurrency(valorEst)}</span>
                  </span>
                  <span className="font-semibold" style={{ color: pctPago >= 100 ? "#059669" : "#0F172A" }}>
                    {pctPago.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E6E8EC" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pctPago}%`,
                      background: pctPago >= 100 ? "#059669" : pctPago > 50 ? "#002C62" : "#2563EB",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] mt-1.5">
                  {pctPago >= 100
                    ? <span className="font-medium" style={{ color: "#059669" }}>Totalmente pago</span>
                    : <span style={{ color: "#94A3B8" }}>
                        Saldo:{" "}
                        <span className="font-medium" style={{ color: "#475569" }}>
                          {formatCurrency(Math.max(0, valorEst - totalPago))}
                        </span>
                      </span>
                  }
                </div>
              </div>
            )}

            {payments.length === 0 ? (
              <p className="text-[11px] italic" style={{ color: "#94A3B8" }}>Sem pagamentos registados.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid #F8FAFC" }}>
                    <div>
                      <span className="text-[11px]" style={{ color: "#94A3B8" }}>Prestação {p.numero_prestacao}</span>
                      <p className="text-[13px] font-semibold" style={{ color: "#0F172A" }}>{formatCurrency(p.valor)}</p>
                    </div>
                    <span className="text-[11px]" style={{ color: "#94A3B8" }}>{formatDate(p.data_pagamento)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de cancelamento */}
      <DangerConfirmModal
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancelar Requisição"
        description="Tem a certeza de que pretende cancelar esta requisição? Esta acção não pode ser desfeita."
        confirmLabel="Sim, Cancelar"
        isPending={cancelReq.isPending}
      />

      {/* Modal de aprovação */}
      <Modal
        open={approvalModal.open}
        onClose={() => setApprovalModal({ open: false, decisao: "aprovado" })}
        title={
          approvalModal.decisao === "aprovado"  ? "Confirmar Aprovação"
          : approvalModal.decisao === "devolvido" ? "Devolver para Revisão"
          : "Rejeitar Requisição"
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[#6e6e73]">
            {approvalModal.decisao === "aprovado"  && "Confirma a aprovação desta requisição?"}
            {approvalModal.decisao === "devolvido" && "Esta requisição será devolvida ao solicitante para revisão."}
            {approvalModal.decisao === "rejeitado" && "Esta requisição será rejeitada de forma definitiva."}
          </p>
          <div>
            <label className={labelCls}>
              Comentário{approvalModal.decisao !== "aprovado" && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              rows={3}
              placeholder="Motivo ou observações…"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setApprovalModal({ open: false, decisao: "aprovado" })}
              className="px-4 py-2 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApproval}
              disabled={
                createApproval.isPending ||
                (approvalModal.decisao !== "aprovado" && !approvalComment.trim())
              }
              className={`px-5 py-2 text-[13px] font-medium text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                approvalModal.decisao === "aprovado"  ? "bg-green-600 hover:bg-green-700"
                : approvalModal.decisao === "devolvido" ? "bg-amber-500 hover:bg-amber-600"
                : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {createApproval.isPending ? <Loader2 size={15} className="animate-spin inline" /> : "Confirmar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de pagamento */}
      <Modal
        open={paymentModal}
        onClose={() => { setPaymentModal(false); setPaymentForm({ valor: "", data: "", notas: "" }) }}
        title="Registar Pagamento"
      >
        {(() => {
          const saldoRestante = Math.max(0, valorEst - totalPago)
          const valorNum      = parseFloat(paymentForm.valor)
          const excede        = !isNaN(valorNum) && valorNum > saldoRestante && saldoRestante > 0
          return (
            <div className="space-y-4">
              {/* Info saldo */}
              {valorEst > 0 && (
                <div className="p-3 rounded-[12px]" style={{ background: "#F8FAFC" }}>
                  <div className="flex justify-between text-[12px]" style={{ color: "#475569" }}>
                    <span>Saldo em aberto</span>
                    <span className="font-semibold" style={{ color: "#0F172A" }}>{formatCurrency(saldoRestante)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "#E6E8EC" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pctPago}%`,
                        background: pctPago >= 100 ? "#059669" : "#002C62",
                      }}
                    />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>
                    {formatCurrency(totalPago)} pago de {formatCurrency(valorEst)}
                  </p>
                </div>
              )}

              <div>
                <label className={labelCls}>Valor (MZN) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={saldoRestante}
                  value={paymentForm.valor}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, valor: e.target.value }))}
                  placeholder="0.00"
                  className={inputCls}
                />
                {excede && (
                  <p className="mt-1 text-[11px] text-orange-600">
                    Valor excede o saldo em aberto de {formatCurrency(saldoRestante)}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Data <span className="text-red-500">*</span></label>
                <DateInput
                  value={paymentForm.data}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, data: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Notas</label>
                <input
                  value={paymentForm.notas}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, notas: e.target.value }))}
                  placeholder="Observações"
                  className={inputCls}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setPaymentModal(false); setPaymentForm({ valor: "", data: "", notas: "" }) }}
                  className="px-4 py-2 text-[13px] transition-colors"
                  style={{ color: "#475569" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={createPayment.isPending || excede}
                  className="px-5 py-2 text-[13px] font-semibold text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ background: "#002C62" }}
                  onMouseEnter={(e) => { if (!createPayment.isPending && !excede) (e.currentTarget as HTMLButtonElement).style.background = "#003A7A" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#002C62" }}
                >
                  {createPayment.isPending
                    ? <Loader2 size={15} className="animate-spin inline mr-1" />
                    : "Registar"}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </PageWrapper>
  )
}
