import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Menu, Search, Bell, HelpCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { NotificationBell } from "@/components/shared/NotificationBell"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const [search, setSearch] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) navigate(`/requisitions?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header
      className="h-[56px] shrink-0 bg-white flex items-center gap-3 px-4 lg:px-5"
      style={{ borderBottom: "1px solid #E6E8EC" }}
    >
      {/* Hambúrguer — apenas mobile */}
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-[6px] transition-colors lg:hidden"
        style={{ color: "#94A3B8" }}
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-[420px]">
        <label className="flex items-center gap-2 px-3 h-9 rounded-[6px] cursor-text" style={{ background: "#F5F6F8", border: "1px solid #E6E8EC" }}>
          <Search size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar requisição, fornecedor, código…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#94A3B8]"
            style={{ color: "#0F172A" }}
          />
        </label>
      </form>

      {/* Espaço flexível */}
      <div className="flex-1" />

      {/* Acções à direita */}
      <div className="flex items-center gap-1">
        <NotificationBell />

        <button
          title="Ajuda"
          className="p-1.5 rounded-[6px] transition-colors"
          style={{ color: "#94A3B8" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#475569")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#94A3B8")}
        >
          <HelpCircle size={16} />
        </button>

        {profile && (
          <div className="hidden sm:flex items-center gap-2 ml-2 pl-2" style={{ borderLeft: "1px solid #E6E8EC" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
              style={{ background: "#002C62", color: "#fff" }}
              title={profile.nome_completo}
            >
              {profile.nome_completo.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
            </div>
            <div className="hidden md:block leading-tight">
              <p className="text-[12px] font-medium" style={{ color: "#0F172A" }}>{profile.nome_completo}</p>
              <p className="text-[10px]" style={{ color: "#94A3B8" }}>{profile.email}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
