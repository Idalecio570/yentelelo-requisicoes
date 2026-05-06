import { useState } from "react"
import { UserPlus, KeyRound, Power, Pencil } from "lucide-react"
import { toast } from "sonner"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { UserModal } from "@/components/admin/UserModal"
import { useUsers, useToggleUserStatus, useResetPassword } from "@/hooks/useUsers"
import { useDirecoes } from "@/hooks/useDirecoes"
import { formatDate } from "@/lib/utils"
import { ROLES, ROLE_LABELS, ROLE_AVATAR_CLASSES, DIRECAO_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Profile, Role, DirecaoCodigo } from "@/types"

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("")
}

const selectCls = "text-[13px] border border-[#d2d2d7] rounded-[8px] px-3 py-[7px] bg-white text-[#1d1d1f] focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
const labelCls  = "block text-[11px] font-medium text-[#6e6e73] mb-1"
const thCls     = "px-4 py-3 text-left text-[11px] font-medium text-[#6e6e73] uppercase tracking-wide"
const iconBtn   = "p-1.5 rounded-[6px] text-[#86868b] transition-colors"

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 bg-[#f5f5f7] rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function UsersPage() {
  const [search,    setSearch]    = useState("")
  const [role,      setRole]      = useState<Role | "">("")
  const [direcaoId, setDirecaoId] = useState("")
  const [ativo,     setAtivo]     = useState<"" | "true" | "false">("")
  const [modal,     setModal]     = useState<{ open: boolean; user?: Profile }>({ open: false })

  const filters = {
    search:     search || undefined,
    role:       (role || undefined) as Role | undefined,
    direcao_id: direcaoId || undefined,
    ativo:      ativo === "" ? undefined : ativo === "true",
  }

  const { data: users = [], isLoading } = useUsers(filters)
  const { data: direcoes = [] }         = useDirecoes()
  const toggle                          = useToggleUserStatus()
  const resetPassword                   = useResetPassword()

  async function handleToggle(user: Profile) {
    try {
      await toggle.mutateAsync({ id: user.id, ativo: !user.ativo })
      toast.success(user.ativo ? "Utilizador desactivado." : "Utilizador activado.")
    } catch {
      toast.error("Erro ao alterar estado.")
    }
  }

  async function handleResetPassword(user: Profile) {
    try {
      await resetPassword.mutateAsync(user.email)
      toast.success("Email de reset enviado para " + user.email)
    } catch {
      toast.error("Erro ao enviar email de reset.")
    }
  }

  return (
    <PageWrapper
      titulo="Gestão de Utilizadores"
      breadcrumb={
        <Breadcrumb items={[{ label: "Administração", href: "/admin" }, { label: "Utilizadores" }]} />
      }
    >
      {/* Filtros */}
      <div className="bg-white rounded-[20px] p-4 mb-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className={labelCls}>Pesquisar</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome ou email…"
              className={`${selectCls} w-full`}
            />
          </div>
          <div>
            <label className={labelCls}>Função</label>
            <Select value={role} onValueChange={(v) => setRole(v as Role | "")}>
              <SelectTrigger className={selectCls}><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Direcção</label>
            <Select value={direcaoId} onValueChange={setDirecaoId}>
              <SelectTrigger className={selectCls}><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {direcoes.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <Select value={ativo} onValueChange={(v) => setAtivo(v as "" | "true" | "false")}>
              <SelectTrigger className={selectCls}><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="ml-auto inline-flex items-center gap-1.5 px-4 py-[7px] bg-[#002C62] text-white text-[13px] font-medium rounded-full hover:bg-[#003A7A] transition-colors"
          >
            <UserPlus size={14} /> Novo Utilizador
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC]" style={{ borderBottom: "1px solid #E6E8EC" }}>
              <tr>
                <th className={thCls}>Utilizador</th>
                <th className={thCls}>Função</th>
                <th className={thCls}>Direcção</th>
                <th className={thCls}>Estado</th>
                <th className={thCls}>Criado em</th>
                <th className={`${thCls} text-right`}>Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7]">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : users.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-[#6e6e73]">
                      Nenhum utilizador encontrado
                    </td>
                  </tr>
                )
                : users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f5f5f7] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ROLE_AVATAR_CLASSES[u.role]}`}>
                          <span className="text-white text-[11px] font-semibold">{getInitials(u.nome_completo)}</span>
                        </div>
                        <div className="leading-tight">
                          <p className="text-[13px] font-medium text-[#1d1d1f]">{u.nome_completo}</p>
                          <p className="text-[11px] text-[#86868b]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f7] text-[#424245] ring-1 ring-[#d2d2d7]">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#6e6e73]">
                      {u.direcao_id
                        ? DIRECAO_LABELS[u.direcao_id as DirecaoCodigo] ?? u.direcao?.nome ?? "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ring-1",
                        u.ativo
                          ? "bg-green-50 text-green-700 ring-green-200"
                          : "bg-[#f5f5f7] text-[#6e6e73] ring-[#d2d2d7]"
                      )}>
                        {u.ativo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#86868b]">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => setModal({ open: true, user: u })}
                          title="Editar"
                          className={`${iconBtn} hover:text-[#1d1d1f] hover:bg-[#f5f5f7]`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          title="Reset de password"
                          className={`${iconBtn} hover:text-sky-600 hover:bg-sky-50`}
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(u)}
                          title={u.ativo ? "Desactivar" : "Activar"}
                          className={cn(
                            iconBtn,
                            u.ativo
                              ? "hover:text-red-600 hover:bg-red-50"
                              : "hover:text-green-600 hover:bg-green-50"
                          )}
                        >
                          <Power size={14} />
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
          <div className="px-4 py-2.5 text-[11px] text-[#86868b]" style={{ borderTop: "1px solid #E6E8EC" }}>
            {users.length} utilizador{users.length !== 1 ? "es" : ""}
          </div>
        )}
      </div>

      <UserModal
        open={modal.open}
        user={modal.user}
        onClose={() => setModal({ open: false })}
      />
    </PageWrapper>
  )
}
