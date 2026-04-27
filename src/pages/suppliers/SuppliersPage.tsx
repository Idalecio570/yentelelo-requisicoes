import { useState } from "react"
import { Link } from "react-router-dom"
import { Search, Plus, Pencil, Eye, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { SupplierModal } from "@/components/suppliers/SupplierModal"
import { ErrorState } from "@/components/shared/ErrorState"
import { useSuppliers, useToggleSupplierStatus } from "@/hooks/useSuppliers"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import type { Entity } from "@/types"

const thCls = "px-4 py-3 text-left text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide whitespace-nowrap"
const tdCls = "px-4 py-3 text-[13px]"
const iconBtn = "p-1.5 rounded-[6px] text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"

function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i} className={tdCls}>
          <div className="h-3 bg-[#f5f5f7] rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  )
}

export function SuppliersPage() {
  const { profile }                                                 = useAuth()
  const [search, setSearch]                                         = useState("")
  const [modal, setModal]                                           = useState(false)
  const [editing, setEditing]                                       = useState<Entity | undefined>()
  const { data: suppliers = [], isLoading, isError, refetch } = useSuppliers(search)
  const toggle                                                      = useToggleSupplierStatus()
  const canManage = ["gestor_escritorio", "director_geral", "admin"].includes(profile?.role ?? "")

  async function handleToggle(s: Entity) {
    try {
      await toggle.mutateAsync({ id: s.id, ativo: !s.ativo })
      toast.success(s.ativo ? "Fornecedor desactivado." : "Fornecedor activado.")
    } catch {
      toast.error("Erro ao alterar estado.")
    }
  }

  function openEdit(s: Entity)  { setEditing(s); setModal(true) }
  function openCreate()          { setEditing(undefined); setModal(true) }
  function closeModal()          { setModal(false); setEditing(undefined) }

  return (
    <PageWrapper
      titulo="Fornecedores"
      actions={
        canManage ? (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002C62] text-white text-[13px] font-medium rounded-full hover:bg-[#003A7A] transition-colors"
          >
            <Plus size={14} /> Novo Fornecedor
          </button>
        ) : undefined
      }
    >
      {/* Pesquisa */}
      <div className="mb-4 relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, NUIT ou e-mail…"
          className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#d2d2d7] rounded-[8px] bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-[#1d1d1f] placeholder:text-[#86868b]"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F8FAFC]" style={{ borderBottom: "1px solid #E6E8EC" }}>
              <tr>
                {["Nome","Tipo","NUIT","E-mail","Telefone","Banco / Conta","Estado","Acções"].map((h) => (
                  <th key={h} className={thCls}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {isError ? (
                <tr>
                  <td colSpan={8}>
                    <ErrorState
                      message="Não foi possível carregar os fornecedores."
                      onRetry={() => { void refetch() }}
                    />
                  </td>
                </tr>
              ) : isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[13px] text-[#6e6e73]">
                    Nenhum fornecedor registado.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f5f5f7] transition-colors">
                    <td className={`${tdCls} font-medium text-[#1d1d1f] max-w-[200px] truncate`}>{s.nome}</td>
                    <td className={tdCls}>
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                        s.tipo === "empresa"
                          ? "bg-sky-50 text-sky-700 ring-sky-200"
                          : "bg-violet-50 text-violet-700 ring-violet-200"
                      )}>
                        {s.tipo === "empresa" ? "Empresa" : "Individual"}
                      </span>
                    </td>
                    <td className={`${tdCls} text-[#6e6e73]`}>{s.nuit ?? "—"}</td>
                    <td className={`${tdCls} text-[#6e6e73] max-w-[160px] truncate`}>{s.email ?? "—"}</td>
                    <td className={`${tdCls} text-[#6e6e73] whitespace-nowrap`}>{s.telefone ?? "—"}</td>
                    <td className={`${tdCls} text-[#6e6e73]`}>
                      {s.banco ? `${s.banco}${s.conta_bancaria ? ` / ${s.conta_bancaria}` : ""}` : "—"}
                    </td>
                    <td className={tdCls}>
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                        s.ativo
                          ? "bg-green-50 text-green-700 ring-green-200"
                          : "bg-[#f5f5f7] text-[#6e6e73] ring-[#d2d2d7]"
                      )}>
                        {s.ativo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1">
                        <Link to={`/suppliers/${s.id}`} title="Ver detalhes" className={iconBtn}>
                          <Eye size={14} />
                        </Link>
                        {canManage && (
                          <>
                            <button onClick={() => openEdit(s)} title="Editar" className={iconBtn}>
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleToggle(s)}
                              disabled={toggle.isPending}
                              title={s.ativo ? "Desactivar" : "Activar"}
                              className={cn(
                                "p-1.5 rounded-[6px] transition-colors",
                                s.ativo
                                  ? "text-[#86868b] hover:text-red-600 hover:bg-red-50"
                                  : "text-[#86868b] hover:text-green-600 hover:bg-green-50"
                              )}
                            >
                              {s.ativo ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal open={modal} onClose={closeModal} supplier={editing} />
    </PageWrapper>
  )
}
