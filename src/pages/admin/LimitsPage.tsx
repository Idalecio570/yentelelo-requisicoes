import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { Modal } from "@/components/shared/Modal"
import { useApprovalLimits, useActiveLimit, useSetLimit } from "@/hooks/useApprovalLimits"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency, formatDate } from "@/lib/utils"

const schema = z.object({
  valor_maximo: z.number({ error: "Valor obrigatório" }).positive("Deve ser positivo"),
})
type FormValues = z.infer<typeof schema>

export function LimitsPage() {
  const { profile } = useAuth()
  const { data: activeLimit, isLoading: loadingActive } = useActiveLimit()
  const { data: limits    = [], isLoading: loadingAll }  = useApprovalLimits()
  const setLimit = useSetLimit()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { valor_maximo: undefined },
  })

  async function onSubmit(values: FormValues) {
    if (!profile) return
    try {
      await setLimit.mutateAsync({ valor_maximo: values.valor_maximo, criado_por: profile.id })
      toast.success("Limite de aprovação actualizado.")
      reset()
      setOpen(false)
    } catch {
      toast.error("Erro ao definir limite.")
    }
  }

  const busy = isSubmitting || setLimit.isPending

  return (
    <PageWrapper
      titulo="Limites de Aprovação"
      breadcrumb={
        <Breadcrumb items={[{ label: "Administração", href: "/admin" }, { label: "Limites de Aprovação" }]} />
      }
    >
      <div className="max-w-3xl space-y-6">

        {/* Card — Limite Actual */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Limite Actual</p>
              {loadingActive
                ? <div className="h-8 w-40 bg-gray-100 rounded animate-pulse mt-1" />
                : <p className="text-3xl font-bold text-gray-900">
                    {activeLimit ? formatCurrency(activeLimit.valor_maximo) : "Não definido"}
                  </p>
              }
              {activeLimit && (
                <p className="text-xs text-gray-400 mt-1">
                  Definido em {formatDate(activeLimit.created_at)}
                  {(activeLimit.criador as { nome_completo?: string } | undefined)?.nome_completo
                    ? ` · por ${(activeLimit.criador as { nome_completo?: string }).nome_completo}`
                    : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            >
              Alterar Limite
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500 leading-relaxed bg-amber-50 border border-amber-200 rounded-md p-3">
            Requisições com valor estimado igual ou inferior a este limite são sinalizadas para aprovação directa
            pelo Gestor de Escritório. O Director Geral é sempre notificado do processo de aprovação.
          </p>
        </div>

        {/* Card — Histórico */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Histórico de Limites</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Definido por</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingAll
                  ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {[...Array(4)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                  : limits.length === 0
                  ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                        Nenhum limite definido
                      </td>
                    </tr>
                  )
                  : limits.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(l.valor_maximo)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {(l.criador as { nome_completo?: string } | undefined)?.nome_completo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(l.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          l.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {l.ativo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal — Definir Novo Limite */}
      <Modal open={open} onClose={() => setOpen(false)} title="Definir Novo Limite">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>O limite anterior será <strong>desactivado automaticamente</strong> e substituído pelo novo valor.</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Novo Limite (MZN) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("valor_maximo", { valueAsNumber: true })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="0.00"
            />
            {errors.valor_maximo && (
              <p className="mt-1 text-xs text-red-600">{errors.valor_maximo.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center gap-2"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              Confirmar
            </button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  )
}
