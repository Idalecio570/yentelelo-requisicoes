import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, RefreshCw, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/shared/Modal"
import { useCreateUser, useUpdateUser, checkEmailExists } from "@/hooks/useUsers"
import { useDirecoes } from "@/hooks/useDirecoes"
import { cn } from "@/lib/utils"
import { ROLES, ROLE_LABELS } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Profile, Role } from "@/types"

// ---------------------------------------------------------------------------
// Esquema Zod
// ---------------------------------------------------------------------------

const ROLES_COM_DIRECAO_OBRIGATORIA: Role[] = ["director_comercial", "director_projectos", "gestor_comercial"]
const ROLES_SEM_DIRECAO: Role[] = ["gestor_escritorio", "gestor_tics", "director_geral", "admin", "auditor"]

const baseSchema = z.object({
  nome_completo:         z.string().min(3, "Mínimo 3 caracteres"),
  email:                 z.string().email("E-mail inválido"),
  role:                  z.enum(ROLES as [Role, ...Role[]], { error: "Seleccione uma função" }),
  direcao_id:            z.string().nullable().optional(),
  force_password_change: z.boolean().default(true),
})

const createSchema = baseSchema.extend({
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Deve conter letras e números"),
})

type CreateFormValues = z.infer<typeof createSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generatePassword(): string {
  const upper  = "ABCDEFGHJKMNPQRSTUVWXYZ"
  const lower  = "abcdefghjkmnpqrstuvwxyz"
  const digits = "23456789"
  const all    = upper + lower + digits
  const rand   = (set: string) => set.charAt(Math.floor(Math.random() * set.length))
  return (
    rand(upper) + rand(lower) + rand(digits) +
    Array.from({ length: 9 }, () => rand(all)).join("")
  ).split("").sort(() => Math.random() - 0.5).join("")
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("")
}

const inputCls = (err?: string) => cn(
  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500",
  err ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
)

function Field({ label, error, children, required }: {
  label: string; error?: string; children: React.ReactNode; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lógica de direcao_id por role
// ---------------------------------------------------------------------------

function getAutodirecaoId(role: Role, direcoes: { id: string; codigo: string }[]): string | null {
  if (role === "director_comercial" || role === "gestor_comercial") {
    return direcoes.find((d) => d.codigo === "direcao_comercial")?.id ?? null
  }
  if (role === "director_projectos") {
    return direcoes.find((d) => d.codigo === "direcao_projectos")?.id ?? null
  }
  return null
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface UserModalProps {
  open:     boolean
  onClose:  () => void
  user?:    Profile
}

export function UserModal({ open, onClose, user }: UserModalProps) {
  const isEdit = !!user
  const create = useCreateUser()
  const update = useUpdateUser()
  const { data: direcoes = [] } = useDirecoes()

  const [emailError, setEmailError] = useState("")
  const [showPass,   setShowPass]   = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<CreateFormValues>({
      resolver: zodResolver(isEdit ? baseSchema : createSchema) as never,
      defaultValues: {
        nome_completo:         "",
        email:                 "",
        role:                  "colaborador",
        direcao_id:            null,
        password:              "",
        force_password_change: true,
      },
    })

  const roleWatch = watch("role") as Role

  // Reset ao abrir
  useEffect(() => {
    if (user) {
      reset({
        nome_completo:         user.nome_completo,
        email:                 user.email,
        role:                  user.role,
        direcao_id:            user.direcao_id ?? null,
        force_password_change: false,
      } as CreateFormValues)
    } else {
      reset({
        nome_completo: "", email: "", role: "colaborador",
        direcao_id: null, password: generatePassword(), force_password_change: true,
      })
    }
    setEmailError("")
    setShowPass(false)
  }, [user, open, reset])

  // Ajusta direcao_id automaticamente para roles com direcção fixa
  useEffect(() => {
    if (ROLES_SEM_DIRECAO.includes(roleWatch)) {
      setValue("direcao_id", null)
    } else if (ROLES_COM_DIRECAO_OBRIGATORIA.includes(roleWatch)) {
      const auto = getAutodirecaoId(roleWatch, direcoes)
      setValue("direcao_id", auto)
    }
  }, [roleWatch, direcoes, setValue])

  const showDirecaoSelect = !ROLES_SEM_DIRECAO.includes(roleWatch) && !ROLES_COM_DIRECAO_OBRIGATORIA.includes(roleWatch)

  async function onSubmit(values: CreateFormValues) {
    setEmailError("")

    const emailExists = await checkEmailExists(values.email, user?.id)
    if (emailExists) { setEmailError("E-mail já registado"); return }

    try {
      if (isEdit && user) {
        await update.mutateAsync({
          id:      user.id,
          payload: {
            nome_completo: values.nome_completo,
            role:          values.role,
            direcao_id:    values.direcao_id ?? null,
          },
        })
        toast.success("Utilizador actualizado!")
      } else {
        await create.mutateAsync({
          email:                 values.email,
          password:              values.password,
          nome_completo:         values.nome_completo,
          role:                  values.role,
          direcao_id:            values.direcao_id ?? null,
          force_password_change: values.force_password_change,
        })
        toast.success("Utilizador criado. Email de boas-vindas enviado.")
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar utilizador.")
    }
  }

  const busy = isSubmitting || create.isPending || update.isPending
  const nameWatch = watch("nome_completo") ?? ""
  const passWatch = watch("password") ?? ""

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar Utilizador" : "Novo Utilizador"} className="max-w-xl">
      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">

        {/* Avatar preview */}
        {nameWatch && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">{getInitials(nameWatch)}</span>
            </div>
            <p className="text-sm font-medium text-gray-700">{nameWatch}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Nome Completo" error={errors.nome_completo?.message} required>
              <input {...register("nome_completo")} className={inputCls(errors.nome_completo?.message)} placeholder="Nome completo" />
            </Field>
          </div>

          <div className="col-span-2">
            <Field label="E-mail" error={emailError || (errors as { email?: { message?: string } }).email?.message} required>
              <input
                {...register("email")}
                type="email"
                disabled={isEdit}
                className={inputCls(emailError || (errors as { email?: { message?: string } }).email?.message)}
                placeholder="utilizador@empresa.co.mz"
              />
            </Field>
          </div>

          <div>
            <Field label="Função" error={(errors as { role?: { message?: string } }).role?.message} required>
              <Select value={roleWatch} onValueChange={(v) => setValue("role", v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div>
            {showDirecaoSelect ? (
              <Field label="Direcção" error={(errors as { direcao_id?: { message?: string } }).direcao_id?.message}>
                <Select
                  value={watch("direcao_id") || "_none"}
                  onValueChange={(v) => setValue("direcao_id", v === "_none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— Seleccione —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Nenhuma —</SelectItem>
                    {direcoes.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Direcção</label>
                <p className="text-sm text-gray-400 py-2">
                  {ROLES_SEM_DIRECAO.includes(roleWatch)
                    ? "Sem direcção fixa"
                    : direcoes.find((d) => d.id === watch("direcao_id"))?.nome ?? "—"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Password — apenas na criação */}
        {!isEdit && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acesso</p>
            <Field label="Password inicial" error={(errors as { password?: { message?: string } }).password?.message} required>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  className={cn(inputCls((errors as { password?: { message?: string } }).password?.message), "pr-20")}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={showPass ? "Ocultar" : "Mostrar"}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("password", generatePassword())}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Gerar password aleatória"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              {passWatch && (
                <p className="mt-1 text-xs text-gray-400 font-mono">{passWatch}</p>
              )}
            </Field>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register("force_password_change")} className="accent-red-600 w-4 h-4" />
              <span className="text-sm text-gray-700">Forçar alteração no primeiro login</span>
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center gap-2"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {isEdit ? "Guardar" : "Criar Utilizador"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
