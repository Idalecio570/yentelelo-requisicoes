import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  ShoppingCart, Wrench, Zap, AlertTriangle, Clock,
  Plus, Trash2, Loader2, Upload, X, Check,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useCreateRequisition } from "@/hooks/useRequisitions"
import { useBulkInsertItems } from "@/hooks/useRequisitionItems"
import { useEntities } from "@/hooks/useEntities"
import { useTemplates } from "@/hooks/useTemplates"
import { useDirecoes } from "@/hooks/useDirecoes"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { ItemsTable, newItemRow } from "@/components/requisitions/ItemsTable"
import type { ItemRowData } from "@/components/requisitions/ItemsTable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RequisitionUrgencia, RequisitionTipo } from "@/types"

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const orcamentoSchema = z.object({
  fornecedor: z.string().min(1, "Obrigatório"),
  valor:      z.number({ error: "Valor inválido" }).positive("Deve ser positivo"),
  notas:      z.string().optional(),
  anexo_url:  z.string().nullable().optional(),
})

const schema = z.object({
  titulo:          z.string().min(3, "Mínimo 3 caracteres"),
  descricao:       z.string().optional(),
  tipo:            z.enum(["compra", "servico"]),
  urgencia:        z.enum(["normal", "urgente", "muito_urgente"]),
  direcao_id:      z.string().min(1, "Seleccione a direcção"),
  template_origem: z.string().optional().nullable(),
  orcamentos:      z.array(orcamentoSchema).max(3, "Máximo 3 orçamentos"),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Step 1 sub-components
// ---------------------------------------------------------------------------

const TIPO_CARDS: { value: RequisitionTipo; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "compra",
    label: "Compra",
    desc:  "Aquisição de bens, materiais ou equipamentos",
    icon:  <ShoppingCart size={22} />,
  },
  {
    value: "servico",
    label: "Serviço",
    desc:  "Contratação de prestação de serviços",
    icon:  <Wrench size={22} />,
  },
]

const URGENCIA_CARDS: {
  value:  RequisitionUrgencia
  label:  string
  desc:   string
  icon:   React.ReactNode
  color:  string
  border: string
}[] = [
  {
    value:  "normal",
    label:  "Normal",
    desc:   "Sem prazo urgente",
    icon:   <Clock size={20} />,
    color:  "text-gray-600",
    border: "border-gray-200 hover:border-gray-400",
  },
  {
    value:  "urgente",
    label:  "Urgente",
    desc:   "Necessário em breve",
    icon:   <AlertTriangle size={20} />,
    color:  "text-orange-600",
    border: "border-orange-200 hover:border-orange-400",
  },
  {
    value:  "muito_urgente",
    label:  "Muito Urgente",
    desc:   "Impacto imediato na operação",
    icon:   <Zap size={20} />,
    color:  "text-red-600",
    border: "border-red-200 hover:border-red-400",
  },
]

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

const STEP_LABELS = ["O que precisas?", "Itens e Anexos", "Revisão"]

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const done    = i < step
        const active  = i === step
        const last    = i === STEP_LABELS.length - 1
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                done   ? "bg-green-600 border-green-600 text-white"
                : active ? "bg-red-600 border-red-600 text-white"
                : "bg-white border-gray-300 text-gray-400"
              )}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                active ? "text-red-700" : done ? "text-green-700" : "text-gray-400"
              )}>
                {label}
              </span>
            </div>
            {!last && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 mb-5 transition-colors",
                i < step ? "bg-green-400" : "bg-gray-200"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1
// ---------------------------------------------------------------------------

function Step1({
  register, watch, setValue, errors, templates, direcoes, isGestorTics,
}: {
  register:    ReturnType<typeof useForm<FormValues>>["register"]
  watch:       ReturnType<typeof useForm<FormValues>>["watch"]
  setValue:    ReturnType<typeof useForm<FormValues>>["setValue"]
  errors:      ReturnType<typeof useForm<FormValues>>["formState"]["errors"]
  templates:   { id: string; nome: string; tipo?: string | null; descricao_padrao?: string | null }[]
  direcoes:    { id: string; nome: string }[]
  isGestorTics: boolean
}) {
  const tipo    = watch("tipo")
  const urgencia = watch("urgencia")
  const template = watch("template_origem")

  function handleTemplateChange(id: string) {
    setValue("template_origem", id || null)
    if (!id) return
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    if (tpl.tipo) setValue("tipo", tpl.tipo as RequisitionTipo)
    if (tpl.descricao_padrao) setValue("descricao", tpl.descricao_padrao)
  }

  return (
    <div className="space-y-6">
      {/* Template */}
      {templates.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Usar um modelo anterior?
          </label>
          <Select value={template || "_none"} onValueChange={(v) => handleTemplateChange(v === "_none" ? "" : v)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Sem template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sem template</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tipo */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Tipo de requisição <span className="text-red-500 normal-case">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TIPO_CARDS.map((card) => (
            <button
              key={card.value}
              type="button"
              onClick={() => setValue("tipo", card.value)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                tipo === card.value
                  ? "border-red-600 bg-red-50"
                  : "border-gray-200 hover:border-gray-400 bg-white"
              )}
            >
              <div className={cn("shrink-0 mt-0.5", tipo === card.value ? "text-red-600" : "text-gray-400")}>
                {card.icon}
              </div>
              <div>
                <p className={cn("text-sm font-semibold", tipo === card.value ? "text-red-700" : "text-gray-800")}>
                  {card.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Urgência */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Urgência <span className="text-red-500 normal-case">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {URGENCIA_CARDS.map((card) => (
            <button
              key={card.value}
              type="button"
              onClick={() => setValue("urgencia", card.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 text-center transition-all",
                urgencia === card.value
                  ? "border-current bg-gray-50 " + card.color
                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-500"
              )}
            >
              <span className={urgencia === card.value ? card.color : "text-gray-400"}>
                {card.icon}
              </span>
              <div>
                <p className="text-xs font-semibold">{card.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{card.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          {...register("titulo")}
          placeholder="Descreve brevemente o que precisas"
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500",
            errors.titulo ? "border-red-400 bg-red-50" : "border-gray-300"
          )}
        />
        {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          {...register("descricao")}
          rows={3}
          placeholder="Detalhes adicionais sobre a requisição…"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
        />
      </div>

      {/* Direcção (para roles sem direcção fixa) */}
      {isGestorTics ? (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Direcção <span className="text-red-500">*</span>
          </label>
          <Select
            value={watch("direcao_id") ?? ""}
            onValueChange={(v) => setValue("direcao_id", v)}
          >
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
      ) : (
        <input type="hidden" {...register("direcao_id")} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Itens, Orçamentos e Anexos
// ---------------------------------------------------------------------------

function Step2({
  items, onItemsChange, entities, files, onFilesChange,
  register, control, itemsError, showItemsErrors,
  entityId, onEntityChange,
}: {
  items:           ItemRowData[]
  onItemsChange:   (items: ItemRowData[]) => void
  entities:        { id: string; nome: string; ativo: boolean; created_at: string; updated_at: string; tipo: import("@/types").EntityTipo | null; nuit: string | null; email: string | null; telefone: string | null; banco: string | null; conta_bancaria: string | null; morada: string | null }[]
  files:           File[]
  onFilesChange:   (files: File[]) => void
  register:        ReturnType<typeof useForm<FormValues>>["register"]
  control:         ReturnType<typeof useForm<FormValues>>["control"]
  itemsError:      string | null
  showItemsErrors: boolean
  entityId:        string
  onEntityChange:  (id: string) => void
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "orcamentos" })

  const supplierOptions = [
    { value: "", label: "— Nenhum —" },
    ...entities.map((e) => ({ value: e.id, label: e.nome })),
  ]

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files ?? [])
    onFilesChange([...files, ...added].slice(0, 10))
    e.target.value = ""
  }

  return (
    <div className="space-y-8">
      {/* Fornecedor principal */}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Fornecedor <span className="normal-case font-normal text-gray-400">(opcional)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">Fornecedor principal desta requisição.</p>
        <Combobox
          value={entityId}
          onValueChange={onEntityChange}
          options={supplierOptions}
          placeholder="— Nenhum —"
        />
      </div>

      {/* Itens */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Itens da Requisição *</p>
        <p className="text-xs text-gray-400 mb-4">
          Adiciona cada produto ou serviço separadamente. Podes associar um fornecedor diferente a cada item.
        </p>
        <ItemsTable
          items={items}
          onChange={onItemsChange}
          entities={entities}
          showErrors={showItemsErrors}
          error={itemsError ?? undefined}
        />
      </div>

      {/* Orçamentos comparativos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-gray-700">
            Orçamentos Comparativos <span className="text-gray-400">(opcional, máx. 3)</span>
          </label>
          {fields.length < 3 && (
            <button
              type="button"
              onClick={() => append({ fornecedor: "", valor: 0, notas: "", anexo_url: null })}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
        {fields.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">Nenhum orçamento adicionado.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="border border-gray-200 rounded-md p-4 relative">
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
                <p className="text-xs font-medium text-gray-600 mb-3">Orçamento {idx + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Fornecedor <span className="text-red-500">*</span></label>
                    <input
                      {...register(`orcamentos.${idx}.fornecedor`)}
                      placeholder="Nome do fornecedor"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Valor (MZN) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`orcamentos.${idx}.valor`, { valueAsNumber: true })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Notas</label>
                    <input
                      {...register(`orcamentos.${idx}.notas`)}
                      placeholder="Notas adicionais"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anexos */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Anexos</label>
        <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors text-sm text-gray-500">
          <Upload size={15} />
          Adicionar ficheiros
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            onChange={handleFileAdd}
            className="sr-only"
          />
        </label>
        <p className="mt-1 text-xs text-gray-400">PDF, Word, Excel, imagens — máx. 10 ficheiros</p>
        {files.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
                <button
                  type="button"
                  onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Review
// ---------------------------------------------------------------------------

function ReviewRow({ label, value, step, onGoTo }: {
  label:  string
  value?: string | null
  step:   number
  onGoTo: (step: number) => void
}) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0">
      <dt className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-gray-800 flex-1">{value || "—"}</dd>
      <button
        type="button"
        onClick={() => onGoTo(step)}
        className="text-xs text-red-600 hover:underline ml-3 shrink-0"
      >
        Editar
      </button>
    </div>
  )
}

function Step3({
  values,
  items,
  files,
  entities,
  direcoes,
  onGoTo,
  onSubmit,
  onSaveDraft,
  isSubmitting,
}: {
  values:       FormValues
  items:        ItemRowData[]
  files:        File[]
  entities:     { id: string; nome: string }[]
  direcoes:     { id: string; nome: string }[]
  onGoTo:       (step: number) => void
  onSubmit:     () => void
  onSaveDraft:  () => void
  isSubmitting: boolean
}) {
  const direcaoName  = direcoes.find((d) => d.id === values.direcao_id)?.nome
  const grandTotal   = items.reduce((s, it) => s + it.quantidade * it.valor_unitario, 0)

  const urgenciaLabel: Record<string, string> = {
    normal: "Normal", urgente: "Urgente", muito_urgente: "Muito Urgente",
  }

  return (
    <div className="space-y-6">
      {/* Detalhes gerais */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Detalhes</h3>
        <dl className="divide-y divide-gray-100">
          <ReviewRow label="Tipo"     value={values.tipo === "compra" ? "Compra" : "Serviço"} step={0} onGoTo={onGoTo} />
          <ReviewRow label="Urgência" value={urgenciaLabel[values.urgencia]}                  step={0} onGoTo={onGoTo} />
          <ReviewRow label="Título"   value={values.titulo}                                   step={0} onGoTo={onGoTo} />
          {values.descricao && (
            <ReviewRow label="Descrição" value={values.descricao} step={0} onGoTo={onGoTo} />
          )}
          {direcaoName && <ReviewRow label="Direcção" value={direcaoName} step={0} onGoTo={onGoTo} />}
        </dl>
      </div>

      {/* Itens */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Itens ({items.length})
          </h3>
          <button type="button" onClick={() => onGoTo(1)} className="text-xs text-red-600 hover:underline">
            Editar
          </button>
        </div>
        <ItemsTable items={items} onChange={() => {}} entities={entities} readOnly />
      </div>

      {/* Orçamentos */}
      {values.orcamentos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Orçamentos</h3>
          {values.orcamentos.map((o, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <span>{o.fornecedor}</span>
              <span className="font-medium">{formatCurrency(o.valor)}</span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Anexos ({files.length})
          </h3>
          {files.map((f, i) => (
            <p key={i} className="text-xs text-gray-600 truncate">{f.name}</p>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
        Ao submeter, esta requisição com {items.length} item(s) e total de{" "}
        <strong>{formatCurrency(grandTotal)}</strong> será enviada para aprovação.
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isSubmitting ? "A submeter…" : "Submeter Requisição"}
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="px-5 py-3 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Guardar Rascunho
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wizard principal
// ---------------------------------------------------------------------------

export function RequisitionWizard() {
  const navigate    = useNavigate()
  const { profile } = useAuth()
  const createReq   = useCreateRequisition()
  const bulkInsert  = useBulkInsertItems()
  const { data: entities  = [] } = useEntities()
  const { data: templates = [] } = useTemplates()
  const { data: direcoes  = [] } = useDirecoes()

  const [step,           setStep]          = useState(0)
  const [files,          setFiles]         = useState<File[]>([])
  const [entityId,       setEntityId]      = useState<string>("")
  const [uploading,      setUploading]     = useState(false)
  const [items,          setItems]         = useState<ItemRowData[]>(() => {
    if (!profile) return [newItemRow(1)]
    try {
      const saved = localStorage.getItem(`yentelelo_draft_items_${profile.id}`)
      if (saved) {
        const parsed = JSON.parse(saved) as ItemRowData[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return [newItemRow(1)]
  })
  const [itemsError,     setItemsError]    = useState<string | null>(null)
  const [showItemsErr,   setShowItemsErr]  = useState(false)
  const [draftBanner,    setDraftBanner]   = useState<boolean>(() => {
    if (!profile) return false
    return !!localStorage.getItem(`yentelelo_draft_${profile.id}`)
  })

  const isGestorTics   = !profile?.direcao_id
  const defaultDirecao = isGestorTics ? "" : (profile?.direcao_id ?? "")

  const {
    register, control, watch, setValue, reset,
    trigger, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: (() => {
      if (profile) {
        const saved = localStorage.getItem(`yentelelo_draft_${profile.id}`)
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as Partial<FormValues>
            return { ...parsed, direcao_id: parsed.direcao_id ?? defaultDirecao }
          } catch { /* ignore */ }
        }
      }
      return {
        titulo:          "",
        descricao:       "",
        tipo:            "compra",
        urgencia:        "normal",
        direcao_id:      defaultDirecao,
        template_origem: null,
        orcamentos:      [],
      }
    })(),
  })

  const values = watch()

  function saveDraftLocally() {
    if (!profile) return
    localStorage.setItem(`yentelelo_draft_${profile.id}`, JSON.stringify(values))
    localStorage.setItem(`yentelelo_draft_items_${profile.id}`, JSON.stringify(items))
  }

  function clearDraft() {
    if (!profile) return
    localStorage.removeItem(`yentelelo_draft_${profile.id}`)
    localStorage.removeItem(`yentelelo_draft_items_${profile.id}`)
  }

  function handleRestoreDraft() {
    setDraftBanner(false)
  }

  function handleDiscardDraft() {
    clearDraft()
    setDraftBanner(false)
    setItems([newItemRow(1)])
    reset({
      titulo: "", descricao: "", tipo: "compra", urgencia: "normal",
      direcao_id: defaultDirecao, template_origem: null, orcamentos: [],
    })
  }

  async function goToStep(target: number) {
    if (target > step) {
      if (step === 0) {
        const valid = await trigger(["tipo", "urgencia", "titulo", "direcao_id"] as never)
        if (!valid) return
      }
      if (step === 1) {
        if (items.length === 0) {
          setItemsError("Adicione pelo menos 1 item antes de avançar.")
          setShowItemsErr(true)
          return
        }
        const invalid = items.some(
          (it) => !it.descricao.trim() || it.valor_unitario <= 0 || it.quantidade <= 0
        )
        if (invalid) {
          setItemsError("Corrija os itens assinalados a vermelho antes de avançar.")
          setShowItemsErr(true)
          return
        }
        setItemsError(null)
        setShowItemsErr(false)
      }
    }
    setStep(target)
    saveDraftLocally()
  }

  async function uploadFiles(reqId: string): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      const path = `${reqId}/${Date.now()}_${file.name}`
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

  async function submitRequisition() {
    if (!profile) return
    const valid = await trigger()
    if (!valid) return

    if (items.length === 0 || items.some((it) => !it.descricao.trim() || it.valor_unitario <= 0 || it.quantidade <= 0)) {
      setItemsError("Corrija os itens antes de submeter.")
      setShowItemsErr(true)
      setStep(1)
      return
    }

    setUploading(true)
    try {
      const req = await createReq.mutateAsync({
        titulo:          values.titulo,
        descricao:       values.descricao ?? null,
        tipo:            values.tipo,
        urgencia:        values.urgencia,
        valor_estimado:  null,
        entity_id:       entityId || null,
        criado_por:      profile.id,
        direcao_id:      values.direcao_id,
        template_origem: values.template_origem ?? null,
        status:          profile.role === "gestor_escritorio" ? "aprovado_escritorio" : "pendente",
        anexos:          [],
        orcamentos:      values.orcamentos.map((o) => ({
          fornecedor: o.fornecedor,
          valor:      o.valor,
          notas:      o.notas ?? null,
          anexo_url:  null,
        })),
      })

      await bulkInsert.mutateAsync({
        requisitionId: req.id,
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

      if (files.length > 0) {
        const urls = await uploadFiles(req.id)
        await supabase.from("requisitions").update({ anexos: urls }).eq("id", req.id)
      }

      clearDraft()
      toast.success("Requisição submetida com sucesso!")
      navigate(`/requisitions/${req.id}`)
    } catch {
      toast.error("Erro ao submeter requisição.")
    } finally {
      setUploading(false)
    }
  }

  async function saveDraftToDB() {
    if (!profile) return
    saveDraftLocally()

    const direcao = values.direcao_id || profile.direcao_id
    if (!direcao) {
      toast.success("Rascunho guardado localmente.")
      navigate("/requisitions")
      return
    }

    try {
      await supabase.from("requisitions").insert({
        titulo:          values.titulo || "Rascunho",
        descricao:       values.descricao ?? null,
        tipo:            values.tipo ?? "compra",
        urgencia:        values.urgencia ?? "normal",
        valor_estimado:  null,
        entity_id:       null,
        criado_por:      profile.id,
        direcao_id:      direcao,
        template_origem: values.template_origem ?? null,
        status:          "rascunho",
        anexos:          [],
        orcamentos:      [],
      })
      toast.success("Rascunho guardado.")
    } catch {
      toast.success("Rascunho guardado localmente.")
    }
    navigate("/requisitions")
  }

  const isLoading = isSubmitting || uploading

  return (
    <div className="max-w-2xl mx-auto">
      {draftBanner && (
        <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="flex-1 text-sm text-blue-800">
            Tens um rascunho guardado. Continuar de onde paraste?
          </p>
          <button
            onClick={handleRestoreDraft}
            className="text-xs font-medium text-blue-700 hover:underline shrink-0"
          >
            Continuar
          </button>
          <button
            onClick={handleDiscardDraft}
            className="text-xs text-blue-500 hover:underline shrink-0"
          >
            Começar do zero
          </button>
        </div>
      )}

      <ProgressBar step={step} />

      <form onSubmit={(e) => { e.preventDefault() }} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {step === 0 && (
          <Step1
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
            templates={templates}
            direcoes={direcoes}
            isGestorTics={isGestorTics}
          />
        )}
        {step === 1 && (
          <Step2
            items={items}
            onItemsChange={setItems}
            entities={entities}
            files={files}
            onFilesChange={setFiles}
            register={register}
            control={control}
            itemsError={itemsError}
            showItemsErrors={showItemsErr}
            entityId={entityId}
            onEntityChange={setEntityId}
          />
        )}
        {step === 2 && (
          <Step3
            values={values}
            items={items}
            files={files}
            entities={entities}
            direcoes={direcoes}
            onGoTo={(s) => setStep(s)}
            onSubmit={submitRequisition}
            onSaveDraft={saveDraftToDB}
            isSubmitting={isLoading}
          />
        )}

        {step < 2 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md"
              >
                <ChevronLeft size={15} />
                Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Próximo
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
