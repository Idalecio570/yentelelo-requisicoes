import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/shared/Modal"
import { useCreateTemplate, useUpdateTemplate } from "@/hooks/useTemplates"
import { cn } from "@/lib/utils"
import type { Template, RequisitionTipo } from "@/types"

const schema = z.object({
  nome:             z.string().min(3, "Mínimo 3 caracteres"),
  tipo:             z.enum(["compra", "servico"], { error: "Seleccione um tipo" }),
  descricao_padrao: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface TemplateModalProps {
  open:      boolean
  onClose:   () => void
  template?: Template
  userId?:   string
}

const inputCls = (err?: string) => cn(
  "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500",
  err ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
)

export function TemplateModal({ open, onClose, template, userId }: TemplateModalProps) {
  const isEdit = !!template
  const create = useCreateTemplate()
  const update = useUpdateTemplate()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", tipo: "compra", descricao_padrao: "" },
  })

  useEffect(() => {
    if (template) {
      reset({
        nome:             template.nome,
        tipo:             (template.tipo ?? "compra") as RequisitionTipo,
        descricao_padrao: template.descricao_padrao ?? "",
      })
    } else {
      reset({ nome: "", tipo: "compra", descricao_padrao: "" })
    }
  }, [template, open, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      nome:             values.nome,
      tipo:             values.tipo,
      descricao_padrao: values.descricao_padrao?.trim() || null,
    }
    try {
      if (isEdit && template) {
        await update.mutateAsync({ id: template.id, payload })
        toast.success("Template actualizado!")
      } else {
        await create.mutateAsync({ ...payload, criado_por: userId })
        toast.success("Template criado!")
      }
      onClose()
    } catch {
      toast.error("Erro ao guardar template.")
    }
  }

  const busy = isSubmitting || create.isPending || update.isPending

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar Template" : "Novo Template"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input {...register("nome")} className={inputCls(errors.nome?.message)} placeholder="Nome do template" />
          {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            {(["compra", "servico"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" value={t} {...register("tipo")} className="accent-red-600" />
                {t === "compra" ? "Compra" : "Serviço"}
              </label>
            ))}
          </div>
          {errors.tipo && <p className="mt-1 text-xs text-red-600">{errors.tipo.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Descrição Padrão</label>
          <textarea
            {...register("descricao_padrao")}
            rows={4}
            className={inputCls()}
            placeholder="Texto que será pré-preenchido na descrição da requisição ao usar este template…"
          />
          <p className="mt-1 text-xs text-gray-400">
            Este texto será copiado para o campo de descrição quando o template for seleccionado.
          </p>
        </div>

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
            {isEdit ? "Guardar" : "Criar"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
