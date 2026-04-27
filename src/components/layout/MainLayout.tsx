import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { OnboardingModal } from "@/components/shared/OnboardingModal"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

export function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { profile } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#FAFAFA" }}>
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar desktop (fixa, visível em lg+)                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0">
        <Sidebar />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Drawer móvel                                                         */}
      {/* ------------------------------------------------------------------ */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity duration-200",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden
      />
      {/* Painel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shadow-xl lg:hidden",
          "transform transition-transform duration-200 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setIsMobileOpen(false)} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Área principal                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Onboarding — apenas na primeira visita */}
      {profile && <OnboardingModal profile={profile} />}
    </div>
  )
}
