import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, Upload, X } from "lucide-react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { useAuth } from "@/hooks/useAuth"
import { useRequisition, useUpdateRequisition } from "@/hooks/useRequisitions"
import { useRequisitionItems, useSyncRequisitionItems } from "@/hooks/useRequisitionItems"
import { useEntities } from "@/hooks/useEntities"
import { useDirecoes } from "@/hooks/useDirecoes"
import { ItemsTable, newItemRow } from "@/components/requisitions/ItemsTable"
import type { ItemRowData } from "@/components/requisitions/ItemsTable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { URGENCIA_LABELS } from "@/lib/constants"
import type { RequisitionTipo, RequisitionUrgencia } from "@/types"

const orcamentoSchema = z.object({
  fornecedor: z.string().min(1, "Obrigatório"),
  valor:      z.number({ error: "Valor inválido" }).positive("Deve ser positivo"),
  notas:      z.string().optional(),
  anexo_url:  z.string().nullable().optional(),
})

const schema = z.object({
  titulo:     z.string().min(3, "Mínimo 3 caracteres"),
  descricao:  z.string().optional(),
  tipo:       z.enum(["compra", "servico"]),
  urgencia:   z.enum(["normal", "urgente", "muito_urgente"]),
  direcao_id: z.string().min(1, "Seleccione a direcção"),
  orcamentos: z.array(orcamentoSchema).max(3),
})

type FormValues = z.infer<typeof schema>

export function EditRequisitionPage() {
  const { id = "" }  = useParams<{ id: string }>()
  const navigate      = useNavigate()
  const { profile }   = useAuth()

  const { data: req,      isLoading: loadingReq } = useRequisition(id)
  const { data: reqItems = [],       isLoading: loadingItems } = useRequisitionItems(id)
  const updateReq  = useUpdateRequisition()
  const syncItems  = useSyncRequisitionItems()
  const { data: entities = [] } = useEntities()
  const { data: direcoes = [] } = useDirecoes()

  const [newFiles,   setNewFiles]   = useState<File[]>([])
  const [keepUrls,   setKeepUrls]   = useState<string[]>([])
  const [uploading,  setUploading]  = useState(false)
  const [populated,  setPopulated]  = useState(false)
  const [items,      setItems]      = useState<ItemRowData[]>([newItemRow(1)])
  const [itemsLoaded,setItemsLoaded]= useState(false)
  const [showItemsErr, setShowItemsErr] = useState(false)
  const [itemsError,   setItemsError]   = useState<string | null>(null)

  const isGestorTics = !profile?.direcao_id

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: "", descricao: "", tipo: "compra",
      urgencia: "normal", direcao_id: "", orcamentos: [],
    },
  })

  const { fields: orcFields, append: appendOrc, remove: removeOrc } = useFieldArray({
    control, name: "orcamentos",
  })

  // Preenche formulário quando dados chegam
  useEffect(() => {
    if (!req || populated) return
    reset({
      titulo:     req.titulo,
      descricao:  req.descricao ?? "",
      tipo:       req.tipo ?? "compra",
      urgencia:   req.urgencia,
      direcao_id: req.direcao_id,
      orcamentos: req.orcamentos.map((o) => ({
        fornecedor: o.fornecedor,
        valor:      o.valor,
        notas:      o.notas ?? "",
        anexo_url:  o.anexo_url,
      })),
    })
    setKeepUrls(req.anexos)
    setPopulated(true)
  }, [req, populated, reset])

  // Preenche itens quando chegam da BD
  useEffect(() => {
    if (loadingItems || itemsLoaded) return
    if (reqItems.length > 0) {
      setItems(reqItems.map<ItemRowData>((it) => ({
        _key:           it.id,
        descricao:      it.descricao,
        categoria:      it.categoria ?? "",
        quantidade:     it.quantidade,
        valor_unitario: it.valor_unitario,
        entity_id:      it.entity_id ?? "",
        entityName:     it.entity?.nome,
        notas:          it.notas ?? "",
        ordem:          it.ordem,
      })))
    }
    setItemsLoaded(true)
  }, [reqItems, loadingItems, itemsLoaded])

  // Guarda contra edições não autorizadas
  useEffect(() => {
    if (!req || !profile) return
    const allowed = req.criado_por === profile.id &&
      (req.status === "pendente" || req.status === "devolvido")
    if (!allowed) {
      toast.error("Não tem permissão para editar esta requisição.")
      navigate(`/requisitions/${id}`)
    }
  }, [req, profile, id, navigate])

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files ?? [])
    setNewFiles((prev) => [...prev, ...added].slice(0, 10))
    e.target.value = ""
  }

  async function uploadNewFiles(): Promise<string[]> {
    const urls: string[] = []
    for (const file of newFiles) {
      const path = `${id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage
        .from("requisitions-attachments")
        .upload(path, file)
      if (error) throw error
      const { data } = supabase.storage
        .from("requisitions-attachments")
        .getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function onSubmit(values: FormValues) {
    // Valida itens
    if (items.length === 0 || items.some((it) => !it.descricao.trim() || it.valor_unitario <= 0 || it.quantidade <= 0)) {
      setItemsError("Corrija os itens antes de guardar.")
      setShowItemsErr(true)
      return
    }

    setUploading(true)
    try {
      let anexos = keepUrls
      if (newFiles.length > 0) {
        const uploaded = await uploadNewFiles()
        anexos = [...keepUrls, ...uploaded]
      }

      await updateReq.mutateAsync({
        id,
        payload: {
          titulo:     values.titulo,
          descricao:  values.descricao ?? null,
          tipo:       values.tipo,
          urgencia:   values.urgencia,
          direcao_id: values.direcao_id,
          orcamentos: values.orcamentos.map((o) => ({
            fornecedor: o.fornecedor,
            valor:      o.valor,
            notas:      o.notas ?? null,
            anexo_url:  o.anexo_url ?? null,
          })),
          anexos,
        },
      })

      await syncItems.mutateAsync({
        requisitionId: id,
        items: items.map((it, i) => ({
          descricao:      it.descricao,
          categoria:      it.categoria || null,
          quantidade:     it.quantidade,
          valor_unitario: it.valor_unitario,
          entity_id:      it.entity_id || null,
          notas:          it.notas || null,
          ordem:          i + 1,
        })),
      })

      toast.success("Requisição actualizada!")
      navigate(`/requisitions/${id}`)
    } catch {
      toast.error("Erro ao actualizar requisição.")
    } finally {
      setUploading(false)
    }
  }

  if (loadingReq || loadingItems) {
    return (
      <PageWrapper titulo="Editar Requisição">
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-red-600" />
        </div>
      </PageWrapper>
    )
  }

  const isLoading = isSubmitting || uploading
  const reqTitulo = watch("titulo") || "Requisição"

  return (
    <PageWrapper
      titulo="Editar Requisição"
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Requisições", href: "/requisitions" },
            { label: reqTitulo, href: `/requisitions/${id}` },
            { label: "Editar" },
          ]}
        />
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">

        {/* Informação Básica */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Informação Básica</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                {...register("titulo")}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
              {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                {...register("descricao")}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo <span className="text-red-500">*</span></label>
                <Select value={watch("tipo")} onValueChange={(v) => setValue("tipo", v as RequisitionTipo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compra">Compra</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Urgência <span className="text-red-500">*</span></label>
                <Select value={watch("urgencia")} onValueChange={(v) => setValue("urgencia", v as RequisitionUrgencia)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["normal", "urgente", "muito_urgente"] as const).map((u) => (
                      <SelectItem key={u} value={u}>{URGENCIA_LABELS[u]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isGestorTics && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Direcção <span className="text-red-500">*</span></label>
                <Select value={watch("direcao_id") ?? ""} onValueChange={(v) => setValue("direcao_id", v)}>
                  <SelectTrigger className={errors.direcao_id ? "border-red-400 bg-red-50" : ""}>
                    <SelectValue placeholder="Seleccione a direcção" />
                  </SelectTrigger>
                  <SelectContent>
                    {direcoes.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.direcao_id && <p className="mt-1 text-xs text-red-600">{errors.direcao_id.message}</p>}
              </div>
            )}
            {!isGestorTics && <input type="hidden" {...register("direcao_id")} />}
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Itens da Requisição *</h2>
          <p className="text-xs text-gray-400 mb-4">
            Adiciona cada produto ou serviço separadamente. Podes associar um fornecedor diferente a cada item.
          </p>
          <ItemsTable
            items={items}
            onChange={setItems}
            entities={entities}
            showErrors={showItemsErr}
            error={itemsError ?? undefined}
          />
        </div>

        {/* Orçamentos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Orçamentos Comparativos</h2>
            {orcFields.length < 3 && (
              <button
                type="button"
                onClick={() => appendOrc({ fornecedor: "", valor: 0, notas: "", anexo_url: null })}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
              >
                <Plus size={13} /> Adicionar
              </button>
            )}
          </div>
          {orcFields.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Nenhum orçamento</p>
          ) : (
            <div className="space-y-4">
              {orcFields.map((field, idx) => (
                <div key={field.id} className="border border-gray-200 rounded-md p-4 relative">
                  <button type="button" onClick={() => removeOrc(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                  <p className="text-xs font-medium text-gray-700 mb-3">Orçamento {idx + 1}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fornecedor <span className="text-red-500">*</span></label>
                      <input {...register(`orcamentos.${idx}.fornecedor`)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Valor (MZN) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" min="0" {...register(`orcamentos.${idx}.valor`, { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Notas</label>
                      <input {...register(`orcamentos.${idx}.notas`)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anexos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Anexos</h2>

          {keepUrls.length > 0 && (
            <ul className="mb-3 space-y-1">
              {keepUrls.map((url, i) => {
                const name = url.split("/").pop() ?? `Anexo ${i + 1}`
                return (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <a href={url} target="_blank" rel="noreferrer" className="flex-1 truncate text-red-600 hover:underline">{name}</a>
                    <button type="button" onClick={() => setKeepUrls((p) => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                      <X size={13} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors text-sm text-gray-500">
            <Upload size={16} />
            Adicionar ficheiros
            <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={handleFileAdd} className="sr-only" />
          </label>

          {newFiles.length > 0 && (
            <ul className="mt-3 space-y-1">
              {newFiles.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
                  <button type="button" onClick={() => setNewFiles((p) => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Acções */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            {isLoading ? "A guardar…" : "Guardar Alterações"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/requisitions/${id}`)}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </form>
    </PageWrapper>
  )
}
