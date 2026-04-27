import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/shared/Modal"
import { useCreatePayment } from "@/hooks/usePayments"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

type FormValues = {
  valor:          number
  data_pagamento: string
  notas:          string
}

const inputCls = (err?: string) => cn(
  "w-full px-3 py-2 text-[13px] border rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#002C62] focus:border-[#002C62] bg-white transition",
  err ? "border-red-400 bg-red-50" : "border-[#E6E8EC]"
)

interface PaymentModalProps {
  open:          boolean
  onClose:       () => void
  requisitionId: string
  registadoPor:  string
  valorEstimado: number
  totalPago:     number
}

export function PaymentModal({
  open, onClose, requisitionId, registadoPor, valorEstimado, totalPago,
}: PaymentModalProps) {
  const createPayment = useCreatePayment()
  const saldoAberto   = Math.max(0, valorEstimado - totalPago)
  const jaQuitado     = saldoAberto <= 0

  const schema = z.object({
    valor: z
      .number({ error: "Obrigatório" })
      .positive("Deve ser positivo")
      .max(saldoAberto, `Não pode exceder ${formatCurrency(saldoAberto)}`),
    data_pagamento: z.string().min(1, "Data obrigatória"),
    notas:          z.string().optional(),
  })

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      valor:          undefined,
      data_pagamento: new Date().toISOString().split("T")[0],
      notas:          "",
    },
  })

  const valorWatch = watch("valor")
  const excede     = !jaQuitado && valorWatch > 0 && valorWatch > saldoAberto
  const pct        = valorEstimado > 0 ? Math.min(100, (totalPago / valorEstimado) * 100) : 0

  async function onSubmit(values: FormValues) {
    if (values.valor > saldoAberto) {
      toast.error(`O valor não pode exceder o saldo em aberto (${formatCurrency(saldoAberto)}).`)
      return
    }
    try {
      await createPayment.mutateAsync({
        requisition_id: requisitionId,
        valor:          values.valor,
        data_pagamento: values.data_pagamento,
        notas:          values.notas?.trim() || null,
        registado_por:  registadoPor,
      })
      toast.success("Pagamento registado com sucesso!")
      reset()
      onClose()
    } catch {
      toast.error("Erro ao registar pagamento.")
    }
  }

  const busy = isSubmitting || createPayment.isPending

  return (
    <Modal open={open} onClose={onClose} title="Registar Pagamento">
      {/* Progresso actual */}
      {valorEstimado > 0 && (
        <div className="mb-5 p-4 rounded-[12px]" style={{ background: "#F8FAFC" }}>
          <div className="flex justify-between text-[12px] mb-2" style={{ color: "#475569" }}>
            <span>Pago: <span className="font-semibold" style={{ color: "#0F172A" }}>{formatCurrency(totalPago)}</span></span>
            <span className="font-semibold">{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E6E8EC" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: jaQuitado ? "#059669" : "#002C62",
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] mt-1.5" style={{ color: "#94A3B8" }}>
            <span>Total estimado: {formatCurrency(valorEstimado)}</span>
            {jaQuitado
              ? <span className="font-semibold text-green-600">Totalmente pago</span>
              : <span>Saldo: <span className="font-medium" style={{ color: "#0F172A" }}>{formatCurrency(saldoAberto)}</span></span>
            }
          </div>
        </div>
      )}

      {jaQuitado ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle2 size={36} style={{ color: "#059669" }} />
          <p className="text-[13px] font-medium" style={{ color: "#0F172A" }}>Esta requisição já está totalmente paga.</p>
          <button
            onClick={onClose}
            className="mt-2 px-5 py-2 text-[13px] rounded-full transition-colors"
            style={{ background: "#F1F5F9", color: "#475569" }}
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: "#475569" }}>
              Valor (MZN) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={saldoAberto}
              {...register("valor", { valueAsNumber: true })}
              className={inputCls(errors.valor?.message)}
              placeholder="0.00"
            />
            {errors.valor && <p className="mt-1 text-[11px] text-red-600">{errors.valor.message}</p>}
            {excede && !errors.valor && (
              <p className="mt-1 text-[11px] text-orange-600">
                Valor excede o saldo em aberto de {formatCurrency(saldoAberto)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: "#475569" }}>
              Data de Pagamento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("data_pagamento")}
              className={inputCls(errors.data_pagamento?.message)}
            />
            {errors.data_pagamento && (
              <p className="mt-1 text-[11px] text-red-600">{errors.data_pagamento.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: "#475569" }}>Notas</label>
            <textarea
              {...register("notas")}
              rows={2}
              className={inputCls()}
              placeholder="Observações sobre este pagamento…"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] transition-colors"
              style={{ color: "#475569" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || excede}
              className="px-5 py-2 text-[13px] font-semibold text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#002C62" }}
              onMouseEnter={(e) => { if (!busy && !excede) (e.currentTarget as HTMLButtonElement).style.background = "#003A7A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#002C62" }}
            >
              {busy && <Loader2 size={14} className="animate-spin inline mr-1.5" />}
              Registar
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
