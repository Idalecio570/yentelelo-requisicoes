import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Home, FileText, CheckCheck, CreditCard,
  BarChart3, Settings, Building2, FolderKanban,
  ChevronDown, ChevronRight, X, ClipboardList,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import type { Role } from "@/types"

// ─── Monograma SVG inline ─────────────────────────────────────────────────────

function YenteleleMono({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx={32} cy={32} r={28} fill="#002C62" />
      <circle cx={38} cy={32} r={22} fill="#FCC631" />
      <circle cx={44} cy={32} r={16} fill="#fff" />
      <circle cx={44} cy={32} r={10} fill="#EF2627" />
    </svg>
  )
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem {
  to:       string
  label:    string
  icon:     React.ComponentType<{ size?: number; className?: string }>
  roles?:   Role[]
  badge?:   number
  children?: { to: string; label: string }[]
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function usePendingCount(role: Role | undefined) {
  return useQuery({
    queryKey: ["pending-count", role],
    queryFn:  async () => {
      const statusFilter =
        role === "gestor_escritorio"
          ? ["pendente", "em_analise_escritorio"]
          : role === "director_geral"
          ? ["aprovado_escritorio", "em_analise_director"]
          : ["pendente", "em_analise_escritorio", "aprovado_escritorio", "em_analise_director"]

      const { count } = await supabase
        .from("requisitions")
        .select("*", { count: "exact", head: true })
        .in("status", statusFilter)

      return count ?? 0
    },
    enabled:         !!role && ["gestor_escritorio", "director_geral", "admin"].includes(role),
    refetchInterval: 30_000,
    staleTime:       15_000,
  })
}

function useDeliverCount(userId: string | undefined, role: Role | undefined) {
  return useQuery({
    queryKey: ["devolvidas-count", userId],
    queryFn:  async () => {
      if (!userId) return 0
      const { count } = await supabase
        .from("requisitions")
        .select("*", { count: "exact", head: true })
        .eq("status", "devolvido")
        .eq("criado_por", userId)
      return count ?? 0
    },
    enabled:         !!userId && !!role && ["colaborador", "gestor_tics", "gestor_escritorio"].includes(role),
    refetchInterval: 60_000,
    staleTime:       30_000,
  })
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const role     = profile?.role

  const [adminOpen, setAdminOpen] = useState(
    location.pathname.startsWith("/admin")
  )

  const { data: pendingCount = 0 } = usePendingCount(role)
  const { data: deliverCount = 0 } = useDeliverCount(profile?.id, role)

  const requisitionItem: NavItem =
    role === "director_comercial" || role === "gestor_comercial"
      ? { to: "/requisitions", label: "Requisições da Direcção", icon: Building2 }
      : role === "director_projectos"
      ? { to: "/requisitions", label: "Requisições da Direcção", icon: FolderKanban }
      : {
          to:    "/requisitions",
          label: "Requisições",
          icon:  FileText,
          badge: deliverCount > 0 ? deliverCount : undefined,
        }

  const navItems: NavItem[] = [
    { to: "/dashboard",  label: "Dashboard",   icon: Home },
    requisitionItem,
    {
      to:    "/approvals",
      label: "Aprovações",
      icon:  CheckCheck,
      roles: ["gestor_escritorio", "director_geral", "admin"],
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { to: "/suppliers", label: "Fornecedores", icon: Building2 },
    {
      to:    "/payments",
      label: "Pagamentos",
      icon:  CreditCard,
      roles: ["gestor_escritorio", "director_geral", "admin"],
    },
    {
      to:    "/reports",
      label: "Relatórios",
      icon:  BarChart3,
      roles: ["gestor_escritorio", "director_geral", "admin", "auditor"],
    },
    {
      to:    "/admin/audit",
      label: "Auditoria",
      icon:  ClipboardList,
      roles: ["admin", "auditor"],
    },
  ]

  const adminItem: NavItem = {
    to:    "/admin",
    label: "Administração",
    icon:  Settings,
    roles: ["admin"],
    children: [
      { to: "/admin/users",     label: "Utilizadores" },
      { to: "/admin/limits",    label: "Limites de Aprovação" },
      { to: "/admin/templates", label: "Templates" },
      { to: "/admin/audit",     label: "Auditoria" },
    ],
  }

  const visible = (item: NavItem) =>
    !item.roles || (role && item.roles.includes(role))

  const isAdminActive = location.pathname.startsWith("/admin")

  const initials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

  return (
    <aside className="flex flex-col h-full" style={{ background: "#002C62" }}>

      {/* ── Logo / Brand ── */}
      <div className="flex items-center justify-between px-4 h-[56px] shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <YenteleleMono size={28} />
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-white">Yentelelo</p>
            <p className="text-[10px] uppercase tracking-[0.06em] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              Requisições
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded lg:hidden"
            style={{ color: "rgba(255,255,255,0.55)" }}
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Navegação ── */}
      {/* min-h-0 é obrigatório para overflow-y-auto funcionar em flex column */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-px">

        {/* Secção GERAL */}
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.35)" }}>
          Geral
        </p>

        {navItems.filter(visible).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "hover:text-white"
              )
            }
            style={({ isActive }) => ({
              background: isActive ? "rgba(255,255,255,0.12)" : undefined,
              color:      !({ isActive }).isActive ? "rgba(255,255,255,0.7)" : undefined,
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={15}
                  className={cn("shrink-0", isActive ? "opacity-100" : "opacity-70")}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className="inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 text-[10px] font-bold rounded-full leading-none"
                    style={{ background: "#FCC631", color: "#3a2c00" }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* ── Admin com submenu ── */}
        {visible(adminItem) && (
          <>
            <p className="px-3 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Sistema
            </p>
            <div>
              <button
                onClick={() => setAdminOpen((v) => !v)}
                className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-[6px] text-[13px] font-medium transition-colors"
                style={{
                  background: isAdminActive ? "rgba(255,255,255,0.12)" : undefined,
                  color:      isAdminActive ? "#fff" : "rgba(255,255,255,0.7)",
                }}
              >
                <Settings size={15} className="shrink-0" style={{ opacity: isAdminActive ? 1 : 0.7 }} />
                <span className="flex-1 text-left">Administração</span>
                {adminOpen
                  ? <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                  : <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                }
              </button>

              {adminOpen && adminItem.children && (
                <div className="ml-[26px] mt-0.5 mb-1 pl-3 space-y-px" style={{ borderLeft: "1px solid rgba(255,255,255,0.12)" }}>
                  {adminItem.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      onClick={onClose}
                      className="block py-1.5 px-2 rounded text-[12px] transition-colors"
                      style={({ isActive }) => ({
                        color:      isActive ? "#fff" : "rgba(255,255,255,0.6)",
                        background: isActive ? "rgba(255,255,255,0.10)" : undefined,
                        fontWeight: isActive ? 500 : 400,
                      })}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* ── Perfil / Footer ── */}
      {profile && (
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Avatar dourado */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
            style={{ background: "#FCC631", color: "#3a2c00" }}
            title={profile.nome_completo}
          >
            {initials(profile.nome_completo)}
          </div>

          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[12px] font-medium text-white truncate">{profile.nome_completo}</p>
            <p className="text-[10px] uppercase tracking-[0.06em] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
              {profile.role.replace(/_/g, " ")}
            </p>
          </div>

          <button
            onClick={signOut}
            title="Terminar sessão"
            className="p-1.5 rounded transition-colors shrink-0"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#fff")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)")}
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  )
}
