import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { ITEM_CATEGORIAS } from "@/lib/constants"

export interface ItemRowData {
  _key:           string
  descricao:      string
  categoria:      string
  quantidade:     number
  valor_unitario: number
  entity_id:      string
  entityName?:    string  // usado na visualização read-only quando disponível via JOIN
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

export function ItemsTable({
  items, onChange, entities, readOnly = false, showErrors = false, error,
}: ItemsTableProps) {
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

  if (readOnly) {
    return (
      <div className="overflow-x-auto">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">
            Esta requisição foi criada sem itens detalhados.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Descrição</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Categoria</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3">Fornecedor</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-3">Qtd</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-3">Val. Unit.</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-3">Total</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((it) => (
                <tr key={it._key}>
                  <td className="py-2 pr-3 text-sm text-gray-900">{it.descricao}</td>
                  <td className="py-2 pr-3 text-xs text-gray-500">{it.categoria || "—"}</td>
                  <td className="py-2 pr-3 text-xs text-gray-500">
                    {it.entityName ?? entities.find((e) => e.id === it.entity_id)?.nome ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-right text-xs tabular-nums">{it.quantidade}</td>
                  <td className="py-2 pr-3 text-right text-xs tabular-nums">{formatCurrency(it.valor_unitario)}</td>
                  <td className="py-2 pr-3 text-right text-sm font-semibold tabular-nums">
                    {formatCurrency(it.quantidade * it.valor_unitario)}
                  </td>
                  <td className="py-2 text-xs text-gray-400">{it.notas || "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={5} className="pt-3 text-xs font-medium text-gray-500 text-right pr-3">
                  Total Geral
                </td>
                <td className="pt-3 text-right text-sm font-bold tabular-nums text-gray-900 pr-3">
                  {formatCurrency(grandTotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  const thCls = "text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide pb-2 pr-2 whitespace-nowrap"
  const inputCls = "w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-red-500"

  return (
    <div>
      {error && (
        <p className="mb-2 text-xs text-red-600 font-medium">{error}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 780 }}>
          <thead>
            <tr className="border-b border-gray-200">
              <th className={cn(thCls, "w-6")}>#</th>
              <th className={cn(thCls, "min-w-[180px]")}>Descrição *</th>
              <th className={cn(thCls, "min-w-[140px]")}>Categoria</th>
              <th className={cn(thCls, "min-w-[150px]")}>Fornecedor</th>
              <th className={cn(thCls, "w-20 text-right")}>Qtd *</th>
              <th className={cn(thCls, "w-28 text-right")}>Val. Unit. *</th>
              <th className={cn(thCls, "w-28 text-right")}>Total</th>
              <th className={cn(thCls, "min-w-[120px]")}>Notas</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((it, idx) => {
              const invalid = showErrors && isRowInvalid(it)
              const rowCls = invalid ? "bg-red-50" : ""
              const cellBorder = (empty: boolean) =>
                invalid && empty ? "border-red-400 bg-red-50" : "border-gray-300"

              return (
                <tr key={it._key} className={rowCls}>
                  <td className="py-1.5 pr-2 text-xs text-gray-400 text-center">{idx + 1}</td>

                  {/* Descrição */}
                  <td className="py-1.5 pr-2">
                    <input
                      value={it.descricao}
                      onChange={(e) => update(it._key, { descricao: e.target.value })}
                      placeholder="Descrição do item"
                      className={cn(inputCls, cellBorder(!it.descricao.trim()))}
                    />
                  </td>

                  {/* Categoria */}
                  <td className="py-1.5 pr-2">
                    <select
                      value={it.categoria}
                      onChange={(e) => update(it._key, { categoria: e.target.value })}
                      className={cn(inputCls, "border-gray-300")}
                    >
                      <option value="">—</option>
                      {ITEM_CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>

                  {/* Fornecedor */}
                  <td className="py-1.5 pr-2">
                    <select
                      value={it.entity_id}
                      onChange={(e) => update(it._key, { entity_id: e.target.value })}
                      className={cn(inputCls, "border-gray-300")}
                    >
                      <option value="">Nenhum</option>
                      {entities.map((e) => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                    </select>
                  </td>

                  {/* Quantidade */}
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={it.quantidade || ""}
                      onChange={(e) => update(it._key, { quantidade: parseFloat(e.target.value) || 0 })}
                      className={cn(inputCls, "text-right", cellBorder(it.quantidade <= 0))}
                    />
                  </td>

                  {/* Valor Unitário */}
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={it.valor_unitario || ""}
                      onChange={(e) => update(it._key, { valor_unitario: parseFloat(e.target.value) || 0 })}
                      className={cn(inputCls, "text-right", cellBorder(it.valor_unitario <= 0))}
                    />
                  </td>

                  {/* Total (read-only) */}
                  <td className="py-1.5 pr-2 text-right text-sm font-medium tabular-nums text-gray-700">
                    {formatCurrency(it.quantidade * it.valor_unitario)}
                  </td>

                  {/* Notas */}
                  <td className="py-1.5 pr-2">
                    <input
                      value={it.notas}
                      onChange={(e) => update(it._key, { notas: e.target.value })}
                      placeholder="Notas…"
                      className={cn(inputCls, "border-gray-300")}
                    />
                  </td>

                  {/* Remover */}
                  <td className="py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => remove(it._key)}
                      disabled={items.length <= 1}
                      className="text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>

          <tfoot>
            <tr className="border-t border-gray-200">
              <td colSpan={6} className="pt-3 text-xs font-medium text-gray-500 text-right pr-2">
                Total Geral
              </td>
              <td className="pt-3 text-right text-sm font-bold tabular-nums text-gray-900 pr-2">
                {formatCurrency(grandTotal)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        type="button"
        onClick={append}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium"
      >
        <Plus size={13} /> Adicionar Item
      </button>
    </div>
  )
}
