import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { ITEM_CATEGORIAS, QUERY_KEYS } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { SupplierModal } from "@/components/suppliers/SupplierModal"
import type { Entity } from "@/types"

export interface ItemRowData {
  _key:           string
  descricao:      string
  categoria:      string
  quantidade:     number
  valor_unitario: number
  entity_id:      string
  entityName?:    string
  notas:          string
  ordem:          number
}

type EntityLike = { id: string; nome: string }

export function newItemRow(ordem: number): ItemRowData {
  return {
    _key:           crypto.randomUUID(),
    descricao:      "",
    categoria:      "",
    quantidade:     1,
    valor_unitario: 0,
    entity_id:      "",
    notas:          "",
    ordem,
  }
}

function isRowInvalid(row: ItemRowData) {
  return !row.descricao.trim() || row.valor_unitario <= 0 || row.quantidade <= 0
}

interface ItemsTableProps {
  items:       ItemRowData[]
  onChange:    (items: ItemRowData[]) => void
  entities:    EntityLike[]
  readOnly?:   boolean
  showErrors?: boolean
  error?:      string
}

const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5"
const inputCls =
  "w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors placeholder:text-gray-300"

export function ItemsTable({
  items, onChange, entities, readOnly = false, showErrors = false, error,
}: ItemsTableProps) {
  const [extraEntities, setExtraEntities] = useState<EntityLike[]>([])
  const [pendingKey,    setPendingKey]    = useState<string | null>(null)
  const [createOpen,    setCreateOpen]    = useState(false)
  const qc = useQueryClient()

  const allEntities: EntityLike[] = [
    ...entities,
    ...extraEntities.filter((e) => !entities.some((x) => x.id === e.id)),
  ]

  const grandTotal = items.reduce((s, it) => s + it.quantidade * it.valor_unitario, 0)

  function update(key: string, patch: Partial<ItemRowData>) {
    onChange(items.map((it) => it._key === key ? { ...it, ...patch } : it))
  }

  function remove(key: string) {
    const next = items.filter((it) => it._key !== key)
    onChange(next.map((it, i) => ({ ...it, ordem: i + 1 })))
  }

  function append() {
    onChange([...items, newItemRow(items.length + 1)])
  }

  function handleSupplierCreated(entity: Entity) {
    setExtraEntities((prev) => [...prev, { id: entity.id, nome: entity.nome }])
    if (pendingKey) update(pendingKey, { entity_id: entity.id })
    setPendingKey(null)
    setCreateOpen(false)
    void qc.invalidateQueries({ queryKey: QUERY_KEYS.entities })
  }

  // ── Modo leitura ────────────────────────────────────────────────────────────
  if (readOnly) {
    if (items.length === 0) {
      return (
        <p className="text-xs text-gray-400 italic py-2">
          Esta requisição foi criada sem itens detalhados.
        </p>
      )
    }
    return (
      <div className="space-y-0">
        {items.map((it, idx) => {
          const supplier  = it.entityName ?? allEntities.find((e) => e.id === it.entity_id)?.nome
          const lineTotal = it.quantidade * it.valor_unitario
          return (
            <div key={it._key} className="flex items-start gap-3 py-3.5 border-b border-gray-100 last:border-0">
              <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-snug">{it.descricao}</p>
                <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-1.5">
                  {it.categoria && <span>{it.categoria}</span>}
                  {supplier && <><span>·</span><span>{supplier}</span></>}
                  <span>·</span>
                  <span className="tabular-nums">{it.quantidade} × {formatCurrency(it.valor_unitario)}</span>
                </p>
                {it.notas && <p className="text-xs text-gray-400 mt-1 italic">{it.notas}</p>}
              </div>
              <span className="shrink-0 text-sm font-semibold text-gray-900 tabular-nums">
                {formatCurrency(lineTotal)}
              </span>
            </div>
          )
        })}
        <div className="flex justify-end pt-3">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Total Geral</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Modo edição ─────────────────────────────────────────────────────────────
  const supplierOptions = [
    { value: "", label: "— Nenhum —" },
    ...allEntities.map((e) => ({ value: e.id, label: e.nome })),
  ]

  return (
    <>
      <div>
        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {items.map((it, idx) => {
            const invalid     = showErrors && isRowInvalid(it)
            const missingDesc = invalid && !it.descricao.trim()
            const missingQty  = invalid && it.quantidade <= 0
            const missingVal  = invalid && it.valor_unitario <= 0
            const lineTotal   = it.quantidade * it.valor_unitario

            return (
              <div
                key={it._key}
                className={cn(
                  "rounded-xl border p-4 sm:p-5 transition-colors",
                  invalid ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-white"
                )}
              >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 truncate max-w-[220px] sm:max-w-none">
                      {it.descricao.trim()
                        ? it.descricao
                        : <span className="text-gray-300 font-normal">Item sem título</span>}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(it._key)}
                    disabled={items.length <= 1}
                    className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Remover item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Descrição */}
                  <div>
                    <label className={labelCls}>Descrição *</label>
                    <input
                      value={it.descricao}
                      onChange={(e) => update(it._key, { descricao: e.target.value })}
                      placeholder="Nome do produto ou serviço"
                      className={cn(inputCls, missingDesc ? "border-red-400 bg-red-50" : "border-gray-300")}
                    />
                  </div>

                  {/* Categoria + Fornecedor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Categoria</label>
                      <Select
                        value={it.categoria || "_none"}
                        onValueChange={(v) => update(it._key, { categoria: v === "_none" ? "" : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="— Seleccionar —" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">— Nenhuma —</SelectItem>
                          {ITEM_CATEGORIAS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className={labelCls}>Fornecedor</label>
                      <Combobox
                        value={it.entity_id}
                        onValueChange={(v) => update(it._key, { entity_id: v })}
                        options={supplierOptions}
                        placeholder="— Nenhum —"
                        onCreateNew={() => { setPendingKey(it._key); setCreateOpen(true) }}
                        createLabel="+ Criar novo fornecedor"
                      />
                    </div>
                  </div>

                  {/* Quantidade + Valor + Total */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Quantidade *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={it.quantidade || ""}
                        onChange={(e) => update(it._key, { quantidade: parseFloat(e.target.value) || 0 })}
                        className={cn(inputCls, "text-right tabular-nums", missingQty ? "border-red-400 bg-red-50" : "border-gray-300")}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Val. Unitário (MZN) *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={it.valor_unitario || ""}
                        onChange={(e) => update(it._key, { valor_unitario: parseFloat(e.target.value) || 0 })}
                        className={cn(inputCls, "text-right tabular-nums", missingVal ? "border-red-400 bg-red-50" : "border-gray-300")}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelCls}>Total do Item</label>
                      <div className="flex items-center justify-end h-9 px-3 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm font-bold tabular-nums text-gray-900">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className={labelCls}>
                      Notas{" "}
                      <span className="normal-case font-normal tracking-normal text-gray-400">(opcional)</span>
                    </label>
                    <input
                      value={it.notas}
                      onChange={(e) => update(it._key, { notas: e.target.value })}
                      placeholder="Especificações, referência, observações…"
                      className={cn(inputCls, "border-gray-300")}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={append}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors"
          >
            <Plus size={14} /> Adicionar Item
          </button>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Total Geral</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>

      <SupplierModal
        open={createOpen}
        onClose={() => { setPendingKey(null); setCreateOpen(false) }}
        onCreated={handleSupplierCreated}
      />
    </>
  )
}
