import { Navigate, Outlet } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import { useAuth } from "@/hooks/useAuth"
import type { Role } from "@/types"

interface ProtectedRouteProps {
  allowedRoles?: Role[]
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" />
    </div>
  )
}

/** Guarda de rota com verificação de autenticação e role */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, loading } = useAuthContext()
  // profile e signOut via hook completo (dentro do router)
  const { profile, signOut } = useAuth()

  if (loading) return <Spinner />

  if (!session) return <Navigate to="/login" replace />

  // Sessão existe mas perfil ainda não carregou (fetch em curso)
  if (!profile) return <Spinner />

  // Sessão existe, perfil carregado, mas o perfil não consta da tabela profiles
  // (utilizador auth sem perfil — edge case)
  if (session && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-red-600 font-medium">Perfil não encontrado.</p>
          <p className="text-sm text-muted-foreground">
            Contacte o administrador para configurar a sua conta.
          </p>
          <button
            onClick={signOut}
            className="text-sm underline text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
