import { useState } from "react"
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { TemplateModal } from "@/components/admin/TemplateModal"
import { useAllTemplates, useToggleTemplate } from "@/hooks/useTemplates"
import { useAuth } from "@/hooks/useAuth"
import type { Template } from "@/types"

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function TemplatesPage() {
  const { profile } = useAuth()
  const { data: templates = [], isLoading } = useAllTemplates()
  const toggle = useToggleTemplate()
  const [modal, setModal] = useState<{ open: boolean; template?: Template }>({ open: false })

  async function handleToggle(t: Template) {
    try {
      await toggle.mutateAsync({ id: t.id, ativo: !t.ativo })
      toast.success(t.ativo ? "Template desactivado." : "Template activado.")
    } catch {
      toast.error("Erro ao alterar estado.")
    }
  }

  return (
    <PageWrapper
      titulo="Templates de Requisição"
      breadcrumb={
        <Breadcrumb items={[{ label: "Administração", href: "/admin" }, { label: "Templates" }]} />
      }
    >

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
        >
          <Plus size={15} /> Novo Template
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição Padrão</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Criado por</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : templates.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Nenhum template criado
                    </td>
                  </tr>
                )
                : templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.nome}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.tipo === "compra"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {t.tipo === "compra" ? "Compra" : "Serviço"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs">
                      {t.descricao_padrao
                        ? <span title={t.descricao_padrao}>{t.descricao_padrao.slice(0, 80)}{t.descricao_padrao.length > 80 ? "…" : ""}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {(t.criador as { nome_completo?: string } | undefined)?.nome_completo ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.ativo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {t.ativo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal({ open: true, template: t })}
                          title="Editar"
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(t)}
                          title={t.ativo ? "Desactivar" : "Activar"}
                          className={`p-1.5 rounded ${
                            t.ativo
                              ? "text-green-500 hover:text-red-500 hover:bg-red-50"
                              : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {t.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {!isLoading && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {templates.length} template{templates.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <TemplateModal
        open={modal.open}
        template={modal.template}
        userId={profile?.id}
        onClose={() => setModal({ open: false })}
      />
    </PageWrapper>
  )
}
