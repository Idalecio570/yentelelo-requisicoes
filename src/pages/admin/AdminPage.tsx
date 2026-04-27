import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Users, LayoutTemplate, SlidersHorizontal,
  ClipboardList, ArrowRight,
} from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { supabase } from "@/lib/supabase"

function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, pendingRes, templatesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("requisitions").select("id", { count: "exact", head: true })
          .in("status", ["pendente", "aprovado_escritorio"]),
        supabase.from("templates").select("id", { count: "exact", head: true }).eq("ativo", true),
      ])
      return {
        activeUsers:      usersRes.count ?? 0,
        pendingApprovals: pendingRes.count ?? 0,
        activeTemplates:  templatesRes.count ?? 0,
      }
    },
    staleTime: 30_000,
  })
}

function StatCard({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <div className="bg-white rounded-[20px] px-5 py-5" style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#94A3B8" }}>{label}</p>
      {isLoading ? (
        <div className="h-7 w-12 rounded animate-pulse" style={{ background: "#F1F5F9" }} />
      ) : (
        <p className="text-[26px] font-bold leading-none tracking-tight" style={{ color: "#0F172A" }}>{value}</p>
      )}
    </div>
  )
}

interface NavCard {
  to:          string
  icon:        React.ReactNode
  title:       string
  description: string
}

function NavCardItem({ to, icon, title, description }: NavCard) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 p-5 bg-white rounded-[20px] transition-shadow hover:shadow-lg"
      style={{ boxShadow: "0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.04)" }}
    >
      <div className="p-2.5 rounded-[12px] transition-colors shrink-0" style={{ background: "#EEF4FF", color: "#002C62" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold leading-tight transition-colors" style={{ color: "#0F172A" }}>
          {title}
        </p>
        <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "#475569" }}>{description}</p>
      </div>
      <ArrowRight size={15} className="shrink-0 mt-0.5" style={{ color: "#94A3B8" }} />
    </Link>
  )
}

const NAV_CARDS: NavCard[] = [
  {
    to:          "/admin/users",
    icon:        <Users size={17} />,
    title:       "Utilizadores",
    description: "Criar, editar e gerir contas de acesso ao sistema.",
  },
  {
    to:          "/admin/templates",
    icon:        <LayoutTemplate size={17} />,
    title:       "Templates de Requisição",
    description: "Gerir modelos pré-definidos para agilizar a criação de requisições.",
  },
  {
    to:          "/admin/limits",
    icon:        <SlidersHorizontal size={17} />,
    title:       "Limites de Aprovação",
    description: "Configurar o limite de valor que requer aprovação de director.",
  },
  {
    to:          "/admin/audit",
    icon:        <ClipboardList size={17} />,
    title:       "Auditoria",
    description: "Consultar o histórico completo de decisões de aprovação.",
  },
]

export function AdminPage() {
  const { data: stats, isLoading } = useAdminStats()

  return (
    <PageWrapper titulo="Administração">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Utilizadores activos"   value={stats?.activeUsers ?? 0}      isLoading={isLoading} />
        <StatCard label="Requisições pendentes"  value={stats?.pendingApprovals ?? 0} isLoading={isLoading} />
        <StatCard label="Templates activos"      value={stats?.activeTemplates ?? 0}  isLoading={isLoading} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {NAV_CARDS.map((card) => (
          <NavCardItem key={card.to} {...card} />
        ))}
      </div>
    </PageWrapper>
  )
}
