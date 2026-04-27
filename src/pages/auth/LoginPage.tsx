import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/context/AuthContext"
import { ROLE_DEFAULT_ROUTE } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

const loginSchema = z.object({
  email:    z.string().min(1, "E-mail obrigatório").email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type LoginData = z.infer<typeof loginSchema>

function YenteleleMono({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: "block" }}>
      <circle cx={32} cy={32} r={28} fill="#002C62" />
      <circle cx={38} cy={32} r={22} fill="#FCC631" />
      <circle cx={44} cy={32} r={16} fill="#fff" />
      <circle cx={44} cy={32} r={10} fill="#EF2627" />
    </svg>
  )
}

export function LoginPage() {
  const { isAuthenticated, profile } = useAuthContext()
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [authError,    setAuthError]    = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && profile) {
      navigate(ROLE_DEFAULT_ROUTE[profile.role], { replace: true })
    }
  }, [isAuthenticated, profile, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginData) {
    setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    values.email,
        password: values.password,
      })
      if (error) throw error

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      const role    = (profileData?.role ?? "colaborador") as Role
      const destino = ROLE_DEFAULT_ROUTE[role]
      navigate(destino, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      if (msg.includes("Invalid login credentials")) {
        setAuthError("E-mail ou palavra-passe incorrectos.")
      } else if (msg.includes("Email not confirmed")) {
        setAuthError("Confirme o seu e-mail antes de entrar.")
      } else {
        setAuthError(msg)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#001a3d" }}>
      <div className="w-full max-w-[400px]">

        {/* Card */}
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 24px 48px -12px rgba(0,0,0,0.36)" }}>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <YenteleleMono size={52} />
            <h1 className="mt-4 text-[22px] font-semibold tracking-tight" style={{ color: "#0F172A" }}>
              Yentelelo
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "#94A3B8" }}>
              Sistema de Requisições
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium mb-1.5" style={{ color: "#475569" }}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nome@yentelelo.co.mz"
                {...register("email")}
                className={cn(
                  "w-full rounded-[6px] border px-3.5 py-2.5 text-[13px] outline-none transition",
                  "placeholder:text-[#94A3B8]",
                  errors.email
                    ? "border-[#EF2627] bg-red-50"
                    : "border-[#E6E8EC] bg-[#F5F6F8]"
                )}
                style={{ color: "#0F172A" }}
              />
              {errors.email && (
                <p className="text-[11px] mt-1" style={{ color: "#EF2627" }}>{errors.email.message}</p>
              )}
            </div>

            {/* Palavra-passe */}
            <div>
              <label htmlFor="password" className="block text-[12px] font-medium mb-1.5" style={{ color: "#475569" }}>
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={cn(
                    "w-full rounded-[6px] border px-3.5 py-2.5 pr-10 text-[13px] outline-none transition",
                    "placeholder:text-[#94A3B8]",
                    errors.password
                      ? "border-[#EF2627] bg-red-50"
                      : "border-[#E6E8EC] bg-[#F5F6F8]"
                  )}
                  style={{ color: "#0F172A" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                  style={{ color: "#94A3B8" }}
                  aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] mt-1" style={{ color: "#EF2627" }}>{errors.password.message}</p>
              )}
            </div>

            {/* Erro de autenticação */}
            {authError && (
              <div className="rounded-[6px] px-4 py-3" style={{ background: "#FBECEC", border: "1px solid #f5c6c6" }}>
                <p className="text-[13px]" style={{ color: "#B0211F" }}>{authError}</p>
              </div>
            )}

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#002C62" }}
              onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = "#003A7A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#002C62" }}
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isSubmitting ? "A entrar…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          © {new Date().getFullYear()} Yentelelo Group · Maputo, Moçambique
        </p>
      </div>
    </div>
  )
}
