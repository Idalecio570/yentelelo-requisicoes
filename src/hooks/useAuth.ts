import { useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import type { Role } from "@/types"

export function useAuth() {
  const ctx      = useAuthContext()
  const navigate = useNavigate()

  /** Verdadeiro se o utilizador tem exactamente este role */
  function isRole(role: Role): boolean {
    return ctx.profile?.role === role
  }

  /** Verdadeiro se o utilizador tem qualquer um dos roles indicados */
  function hasAnyRole(roles: Role[]): boolean {
    return !!ctx.profile && roles.includes(ctx.profile.role)
  }

  /** Termina sessão e redireciona para /login */
  async function signOut() {
    await ctx.signOut()
    navigate("/login", { replace: true })
  }

  return { ...ctx, isRole, hasAnyRole, signOut }
}
