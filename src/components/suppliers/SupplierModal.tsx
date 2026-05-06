import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/shared/Modal"
import { useCreateSupplier, useUpdateSupplier, checkNuitExists } from "@/hooks/useSuppliers"
import { cn } from "@/lib/utils"
import type { Entity } from "@/types"

const schema = z.object({
  nome:           z.string().min(3, "Mínimo 3 caracteres"),
  tipo:           z.enum(["empresa", "individual"], { error: "Obrigatório" }),
  nuit:           z.string().regex(/^\d{9}$/, "NUIT deve ter 9 dígitos").optional().or(z.literal("")),
  email:          z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone:       z.string().optional(),
  banco:          z.string().optional(),
  conta_bancaria: z.string().optional(),
  morada:         z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface SupplierModalProps {
  open:     boolean
  onClose:  () => void
  supplier?: Entity
}

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

const inputCls = (err?: string) => cn(
  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500",
  err ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
)

export function SupplierModal({ open, onClose, supplier }: SupplierModalProps) {
  const isEdit = !!supplier
  const create = useCreateSupplier()
  const update = useUpdateSupplier()
  const [nuitError, setNuitError] = useState("")

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "", tipo: "empresa", nuit: "", email: "",
      telefone: "", banco: "", conta_bancaria: "", morada: "",
    },
  })

  useEffect(() => {
    if (supplier) {
      reset({
        nome:           supplier.nome,
        tipo:           supplier.tipo ?? "empresa",
        nuit:           supplier.nuit ?? "",
        email:          supplier.email ?? "",
        telefone:       supplier.telefone ?? "",
        banco:          supplier.banco ?? "",
        conta_bancaria: supplier.conta_bancaria ?? "",
        morada:         supplier.morada ?? "",
      })
    } else {
      reset({ nome: "", tipo: "empresa", nuit: "", email: "", telefone: "", banco: "", conta_bancaria: "", morada: "" })
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNuitError("")
  }, [supplier, open, reset])

  async function onSubmit(values: FormValues) {
    setNuitError("")
    const nuit = values.nuit?.trim() || null

    if (nuit) {
      const exists = await checkNuitExists(nuit, supplier?.id)
      if (exists) { setNuitError("NUIT já registado"); return }
    }

    const payload = {
      nome:           values.nome,
      tipo:           values.tipo,
      nuit,
      email:          values.email?.trim() || null,
      telefone:       values.telefone?.trim() || null,
      banco:          values.banco?.trim() || null,
      conta_bancaria: values.conta_bancaria?.trim() || null,
      morada:         values.morada?.trim() || null,
    }

    try {
      if (isEdit && supplier) {
        await update.mutateAsync({ id: supplier.id, payload })
        toast.success("Fornecedor actualizado!")
      } else {
        await create.mutateAsync(payload)
        toast.success("Fornecedor criado!")
      }
      onClose()
    } catch {
      toast.error("Erro ao guardar fornecedor.")
    }
  }

  const busy = isSubmitting || create.isPending || update.isPending

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Nome" error={errors.nome?.message} required>
          <input {...register("nome")} className={inputCls(errors.nome?.message)} placeholder="Nome completo ou empresa" />
        </Field>

        <Field label="Tipo" error={errors.tipo?.message} required>
          <div className="flex gap-4">
            {(["empresa", "individual"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" value={t} {...register("tipo")} className="accent-red-600" />
                {t === "empresa" ? "Empresa" : "Individual"}
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="NUIT (9 dígitos)" error={nuitError || errors.nuit?.message}>
            <input {...register("nuit")} className={inputCls(nuitError || errors.nuit?.message)} placeholder="400000000" maxLength={9} />
          </Field>
          <Field label="E-mail" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputCls(errors.email?.message)} placeholder="email@exemplo.com" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefone">
            <input {...register("telefone")} className={inputCls()} placeholder="+258 84 000 0000" />
          </Field>
          <Field label="Banco">
            <input {...register("banco")} className={inputCls()} placeholder="BCI, BIM, …" />
          </Field>
        </div>

        <Field label="Conta Bancária">
          <input {...register("conta_bancaria")} className={inputCls()} placeholder="Nº de conta" />
        </Field>

        <Field label="Morada">
          <textarea {...register("morada")} rows={2} className={inputCls()} placeholder="Endereço completo" />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin inline mr-1" /> : null}
            {isEdit ? "Guardar" : "Criar"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
