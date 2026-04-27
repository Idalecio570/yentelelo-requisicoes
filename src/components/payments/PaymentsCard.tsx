import { useState } from "react"
import { CreditCard, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PaymentModal } from "./PaymentModal"
import { usePayments, useDeletePayment } from "@/hooks/usePayments"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Requisition } from "@/types"

interface PaymentsCardProps {
  requisition: Requisition
  profileId:   string
  canAdd:      boolean
  isAdmin:     boolean
}

const statusLabels: Record<string, string> = {
  sem_pagamento: "Sem Pagamento",
  pendente:      "Pendente",
  parcial:       "Pagamento Parcial",
  concluida:     "Concluído",
}

const statusStyle: Record<string, { bg: string; fg: string; dot: string }> = {
  sem_pagamento: { bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
  pendente:      { bg: "#FFF8EC", fg: "#D97706", dot: "#F59E0B" },
  parcial:       { bg: "#FFF8EC", fg: "#D97706", dot: "#F59E0B" },
  concluida:     { bg: "#ECFDF5", fg: "#059669", dot: "#10B981" },
}

export function PaymentsCard({ requisition, profileId, canAdd, isAdmin }: PaymentsCardProps) {
  const [modal, setModal] = useState(false)

  const { data: payments = [] } = usePayments(requisition.id)
  const deletePayment           = useDeletePayment()

  const valorEst  = requisition.valor_estimado ?? 0
  const totalPago = payments.reduce((s, p) => s + p.valor, 0)
  const saldo     = Math.max(0, valorEst - totalPago)
  const pct       = valorEst > 0 ? Math.min(100, (totalPago / valorEst) * 100) : 0
  const payStatus = requisition.payment_status ?? "sem_pagamento"
  const jaQuitado = saldo <= 0 && totalPago > 0
  const podePagar = canAdd && saldo > 0

  const cfg = statusStyle[payStatus] ?? { bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" }

  async function handleDelete(paymentId: string) {
    if (!confirm("Eliminar este pagamento?")) return
    try {
      await deletePayment.mutateAsync({ id: paymentId, requisition_id: requisition.id })
      toast.success("Pagamento eliminado.")
    } catch {
      toast.error("Erro ao eliminar pagamento.")
    }
  }

  return (
    <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "#94A3B8" }}>
          <CreditCard size={12} />
          Pagamentos
        </h2>
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: cfg.bg, color: cfg.fg }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
            {statusLabels[payStatus]}
          </span>
          {podePagar && (
            <button
              onClick={() => setModal(true)}
              className="text-[12px] font-semibold hover:underline"
              style={{ color: "#002C62" }}
            >
              + Registar
            </button>
          )}
        </div>
      </div>

      {/* Barra de progresso — sempre visível quando há valor estimado */}
      {valorEst > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-[12px] mb-1.5" style={{ color: "#475569" }}>
            <span>
              Pago:{" "}
              <span className="font-semibold" style={{ color: "#0F172A" }}>
                {formatCurrency(totalPago)}
              </span>
              {" "}<span style={{ color: "#94A3B8" }}>/ {formatCurrency(valorEst)}</span>
            </span>
            <span className="font-semibold" style={{ color: jaQuitado ? "#059669" : "#0F172A" }}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E6E8EC" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: jaQuitado ? "#059669" : pct > 50 ? "#002C62" : "#2563EB",
              }}
            />
          </div>
          {!jaQuitado && saldo > 0 && (
            <p className="text-[11px] mt-1.5" style={{ color: "#94A3B8" }}>
              Saldo em aberto:{" "}
              <span className="font-medium" style={{ color: "#475569" }}>{formatCurrency(saldo)}</span>
            </p>
          )}
          {jaQuitado && (
            <p className="text-[11px] mt-1.5 font-medium" style={{ color: "#059669" }}>
              Requisição totalmente paga
            </p>
          )}
        </div>
      )}

      {/* Lista de prestações */}
      {payments.length === 0 ? (
        <p className="text-[12px] italic" style={{ color: "#94A3B8" }}>Sem pagamentos registados.</p>
      ) : (
        <div className="overflow-x-auto" style={{ margin: "0 -24px", padding: "0 24px" }}>
          <table className="min-w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid #E6E8EC" }}>
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>Nº</th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>Valor</th>
                <th className="pb-2 text-left pl-4 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>Data</th>
                <th className="pb-2 text-left pl-4 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>Registado por</th>
                <th className="pb-2 text-left pl-4 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>Notas</th>
                {isAdmin && <th className="pb-2" />}
              </tr>
            </thead>
            <tbody style={{ borderColor: "#F8FAFC" }} className="divide-y">
              {payments.map((p) => (
                <tr key={p.id} className="transition-colors" onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F8FAFC" }} onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "" }}>
                  <td className="py-2.5 font-medium" style={{ color: "#475569" }}>#{p.numero_prestacao}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums" style={{ color: "#0F172A" }}>
                    {formatCurrency(p.valor)}
                  </td>
                  <td className="py-2.5 pl-4 whitespace-nowrap" style={{ color: "#475569" }}>{formatDate(p.data_pagamento)}</td>
                  <td className="py-2.5 pl-4 text-[12px]" style={{ color: "#94A3B8" }}>
                    {(p.registador as { nome_completo?: string } | undefined)?.nome_completo ?? "—"}
                  </td>
                  <td className="py-2.5 pl-4 text-[12px] max-w-[120px] truncate" style={{ color: "#94A3B8" }}>{p.notas ?? "—"}</td>
                  {isAdmin && (
                    <td className="py-2.5 pl-2">
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletePayment.isPending}
                        className="p-1 rounded-[6px] transition-colors"
                        style={{ color: "#CBD5E1" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EF2627"; (e.currentTarget as HTMLButtonElement).style.background = "#FBECEC" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#CBD5E1"; (e.currentTarget as HTMLButtonElement).style.background = "" }}
                        title="Eliminar"
                      >
                        {deletePayment.isPending
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaymentModal
        open={modal}
        onClose={() => setModal(false)}
        requisitionId={requisition.id}
        registadoPor={profileId}
        valorEstimado={valorEst}
        totalPago={totalPago}
      />
    </div>
  )
}
