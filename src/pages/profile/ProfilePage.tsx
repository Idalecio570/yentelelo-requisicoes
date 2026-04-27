import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Eye, EyeOff, Save } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { cn, formatDate } from "@/lib/utils"
import { ROLE_LABELS, ROLE_BADGE_CLASSES, ROLE_AVATAR_CLASSES, DIRECAO_LABELS, QUERY_KEYS } from "@/lib/constants"
import type { DirecaoCodigo } from "@/types"

// ---------------------------------------------------------------------------
// Esquemas Zod
// ---------------------------------------------------------------------------

const nameSchema = z.object({
  nome_completo: z.string().min(3, "Mínimo 3 caracteres"),
})

const passwordSchema = z.object({
  password_atual: z.string().min(1, "Campo obrigatório"),
  password_nova:  z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Deve conter letras e números"),
  password_conf:  z.string(),
}).refine((v) => v.password_nova !== v.password_atual, {
  message: "A nova password deve ser diferente da actual",
  path: ["password_nova"],
}).refine((v) => v.password_nova === v.password_conf, {
  message: "As passwords não coincidem",
  path: ["password_conf"],
})

type NameValues     = z.infer<typeof nameSchema>
type PasswordValues = z.infer<typeof passwordSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("")
}

const inputCls = (err?: string) => cn(
  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500",
  err ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
)

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ProfilePage() {
  const { profile } = useAuth()
  const qc          = useQueryClient()

  // --- Nome ---
  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    values:   { nome_completo: profile?.nome_completo ?? "" },
  })

  async function onSaveName(values: NameValues) {
    if (!profile) return
    const { error } = await supabase
      .from("profiles")
      .update({ nome_completo: values.nome_completo })
      .eq("id", profile.id)
    if (error) { toast.error("Erro ao actualizar nome."); return }
    qc.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    toast.success("Nome actualizado.")
  }

  // --- Password ---
  const [showCurr, setShowCurr] = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [showConf, setShowConf] = useState(false)

  const passForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password_atual: "", password_nova: "", password_conf: "" },
  })

  async function onSavePassword(values: PasswordValues) {
    // Re-autentica com a password actual para validar
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email:    profile?.email ?? "",
      password: values.password_atual,
    })
    if (signInErr) {
      passForm.setError("password_atual", { message: "Password actual incorrecta" })
      return
    }
    const { error } = await supabase.auth.updateUser({ password: values.password_nova })
    if (error) { toast.error("Erro ao alterar password."); return }
    toast.success("Password alterada com sucesso!")
    passForm.reset()
  }

  // --- Notificações ---
  const [notifEmail, setNotifEmail] = useState<boolean>(profile?.notif_email ?? true)
  const [savingNotif, setSavingNotif] = useState(false)

  async function onToggleNotifEmail(val: boolean) {
    if (!profile) return
    setNotifEmail(val)
    setSavingNotif(true)
    const { error } = await supabase.from("profiles").update({ notif_email: val }).eq("id", profile.id)
    setSavingNotif(false)
    if (error) { toast.error("Erro ao guardar preferência."); setNotifEmail(!val) }
    else toast.success("Preferência actualizada.")
  }

  if (!profile) return null

  const nameBusy = nameForm.formState.isSubmitting
  const passBusy = passForm.formState.isSubmitting

  return (
    <PageWrapper titulo="O Meu Perfil">
      <div className="max-w-2xl space-y-6">

        {/* ── Secção 1: Avatar + Info pessoal ── */}
        <SectionCard title="Informações Pessoais">
          <div className="flex items-start gap-5 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${ROLE_AVATAR_CLASSES[profile.role]}`}>
              <span className="text-white text-xl font-bold">{getInitials(profile.nome_completo)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-base">{profile.nome_completo}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_CLASSES[profile.role]}`}>
                  {ROLE_LABELS[profile.role]}
                </span>
                {profile.direcao_id && (
                  <span className="text-xs text-gray-400">
                    · {DIRECAO_LABELS[profile.direcao_id as DirecaoCodigo] ?? profile.direcao_id}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Conta criada em {formatDate(profile.created_at)}</p>
            </div>
          </div>

          {/* Editar nome */}
          <form onSubmit={nameForm.handleSubmit(onSaveName)} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                {...nameForm.register("nome_completo")}
                className={inputCls(nameForm.formState.errors.nome_completo?.message)}
              />
              {nameForm.formState.errors.nome_completo && (
                <p className="mt-1 text-xs text-red-600">{nameForm.formState.errors.nome_completo.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={nameBusy}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 shrink-0"
            >
              {nameBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-500">E-mail</span>
              <p className="text-gray-700">{profile.email}</p>
              <p className="text-xs text-gray-400">Alteração via administrador</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Estado</span>
              <p className={profile.ativo ? "text-green-700" : "text-gray-500"}>
                {profile.ativo ? "Conta activa" : "Conta inactiva"}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── Secção 2: Segurança ── */}
        <SectionCard title="Segurança — Alterar Password">
          <form onSubmit={passForm.handleSubmit(onSavePassword)} className="space-y-4">
            {(
              [
                { name: "password_atual" as const, label: "Password Actual",    show: showCurr, toggle: () => setShowCurr((v) => !v) },
                { name: "password_nova"  as const, label: "Nova Password",       show: showNew,  toggle: () => setShowNew((v) => !v)  },
                { name: "password_conf"  as const, label: "Confirmar Nova Password", show: showConf, toggle: () => setShowConf((v) => !v) },
              ] as const
            ).map(({ name, label, show, toggle }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <div className="relative">
                  <input
                    {...passForm.register(name)}
                    type={show ? "text" : "password"}
                    className={cn(inputCls(passForm.formState.errors[name]?.message), "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={toggle}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {passForm.formState.errors[name] && (
                  <p className="mt-1 text-xs text-red-600">{passForm.formState.errors[name]?.message}</p>
                )}
              </div>
            ))}

            <div className="pt-2">
              <button
                type="submit"
                disabled={passBusy}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {passBusy && <Loader2 size={14} className="animate-spin" />}
                Alterar Password
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Secção 3: Notificações ── */}
        <SectionCard title="Preferências de Notificação">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Notificações in-app</p>
                <p className="text-xs text-gray-500">Alertas dentro do sistema</p>
              </div>
              <div className="w-10 h-6 bg-red-600 rounded-full flex items-center px-1 cursor-not-allowed opacity-60">
                <div className="w-4 h-4 bg-white rounded-full ml-auto" />
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Notificações por e-mail</p>
                <p className="text-xs text-gray-500">Receber actualizações de requisições no e-mail</p>
              </div>
              <button
                type="button"
                disabled={savingNotif}
                onClick={() => onToggleNotifEmail(!notifEmail)}
                className={cn(
                  "relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none",
                  notifEmail ? "bg-red-600" : "bg-gray-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                  notifEmail ? "translate-x-5" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>
        </SectionCard>

      </div>
    </PageWrapper>
  )
}
