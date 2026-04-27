import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Pencil, Loader2 } from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { SupplierModal } from "@/components/suppliers/SupplierModal"
import { useSupplier } from "@/hooks/useSuppliers"
import { useRequisitions } from "@/hooks/useRequisitions"
import { useAuth } from "@/hooks/useAuth"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-3 border-b border-[#f5f5f7] last:border-0">
      <dt className="text-[11px] text-[#86868b] sm:w-36 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-[13px] font-medium text-[#1d1d1f]">{value || "—"}</dd>
    </div>
  )
}

const thCls = "px-4 py-3 text-left text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide whitespace-nowrap"
const tdCls = "px-4 py-3 text-[13px]"

export function SupplierDetailPage() {
  const { id = "" }  = useParams<{ id: string }>()
  const { profile }  = useAuth()
  const [modal, setModal] = useState(false)

  const { data: supplier, isLoading } = useSupplier(id)
  const { data: allReqs = [] }        = useRequisitions()
  const requisitions = allReqs.filter((r) => r.entity_id === id)

  const canEdit = ["gestor_escritorio", "director_geral", "admin"].includes(profile?.role ?? "")

  if (isLoading) {
    return (
      <PageWrapper titulo="Detalhe do Fornecedor">
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-red-600" />
        </div>
      </PageWrapper>
    )
  }

  if (!supplier) {
    return (
      <PageWrapper titulo="Detalhe do Fornecedor">
        <p className="text-[13px] text-[#6e6e73]">Fornecedor não encontrado.</p>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      titulo={supplier.nome}
      breadcrumb={
        <Breadcrumb items={[{ label: "Fornecedores", href: "/suppliers" }, { label: supplier.nome }]} />
      }
      actions={
        <div className="flex items-center gap-3">
          <Link
            to="/suppliers"
            className="inline-flex items-center gap-1 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
          >
            <ArrowLeft size={14} /> Voltar
          </Link>
          {canEdit && (
            <button
              onClick={() => setModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002C62] text-white text-[13px] font-medium rounded-full hover:bg-[#003A7A] transition-colors"
            >
              <Pencil size={13} /> Editar
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Dados do fornecedor */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                supplier.tipo === "empresa"
                  ? "bg-sky-50 text-sky-700 ring-sky-200"
                  : "bg-violet-50 text-violet-700 ring-violet-200"
              )}>
                {supplier.tipo === "empresa" ? "Empresa" : "Individual"}
              </span>
              <span className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                supplier.ativo
                  ? "bg-green-50 text-green-700 ring-green-200"
                  : "bg-[#f5f5f7] text-[#6e6e73] ring-[#d2d2d7]"
              )}>
                {supplier.ativo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <dl>
              <InfoRow label="NUIT"           value={supplier.nuit} />
              <InfoRow label="E-mail"         value={supplier.email} />
              <InfoRow label="Telefone"       value={supplier.telefone} />
              <InfoRow label="Banco"          value={supplier.banco} />
              <InfoRow label="Conta Bancária" value={supplier.conta_bancaria} />
              <InfoRow label="Morada"         value={supplier.morada} />
              <InfoRow label="Registado em"   value={formatDate(supplier.created_at)} />
            </dl>
          </div>
        </div>

        {/* Requisições associadas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #E6E8EC" }}>
              <h2 className="text-[13px] font-semibold text-[#1d1d1f]">
                Requisições associadas
                <span className="ml-1.5 text-[11px] font-normal text-[#86868b]">({requisitions.length})</span>
              </h2>
            </div>
            {requisitions.length === 0 ? (
              <p className="px-5 py-10 text-[13px] text-[#6e6e73] text-center">
                Nenhuma requisição associada a este fornecedor.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#F8FAFC]" style={{ borderBottom: "1px solid #E6E8EC" }}>
                    <tr>
                      {["Título","Tipo","Valor Estimado","Estado","Data"].map((h) => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f7]">
                    {requisitions.map((r) => (
                      <tr key={r.id} className="hover:bg-[#f5f5f7] transition-colors">
                        <td className={tdCls}>
                          <Link
                            to={`/requisitions/${r.id}`}
                            className="text-[13px] font-medium text-red-600 hover:underline"
                          >
                            {r.titulo}
                          </Link>
                        </td>
                        <td className={`${tdCls} text-[#6e6e73] capitalize`}>{r.tipo ?? "—"}</td>
                        <td className={`${tdCls} text-[#1d1d1f] tabular-nums`}>
                          {r.valor_estimado !== null ? formatCurrency(r.valor_estimado) : "—"}
                        </td>
                        <td className={tdCls}><StatusBadge estado={r.status} /></td>
                        <td className={`${tdCls} text-[#86868b] whitespace-nowrap`}>
                          {formatDate(r.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <SupplierModal open={modal} onClose={() => setModal(false)} supplier={supplier} />
    </PageWrapper>
  )
}
