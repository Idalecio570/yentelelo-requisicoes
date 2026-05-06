import { useState, useRef } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  value:         string
  onValueChange: (value: string) => void
  options:       ComboboxOption[]
  placeholder?:  string
  className?:    string
  disabled?:     boolean
  onCreateNew?:  () => void
  createLabel?:  string
}

export function Combobox({
  value, onValueChange, options,
  placeholder = "Seleccionar...",
  className, disabled = false,
  onCreateNew, createLabel = "Criar novo",
}: ComboboxProps) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState("")
  const inputRef            = useRef<HTMLInputElement>(null)

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selectedLabel = options.find((o) => o.value === value)?.label

  function handleSelect(optValue: string) {
    onValueChange(optValue)
    setOpen(false)
    setSearch("")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setTimeout(() => inputRef.current?.focus(), 0)
    else      setSearch("")
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between gap-2",
            "rounded-lg border border-gray-300 bg-white px-3 py-2",
            "text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            selectedLabel ? "text-gray-900" : "text-gray-400",
            className
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Content
        align="start"
        sideOffset={4}
        style={{ minWidth: "var(--radix-popover-trigger-width)" }}
        className={cn(
          "z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        )}
      >
        {/* Pesquisa */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
          <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
          />
        </div>

        {/* Lista */}
        <div className="max-h-52 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">Sem resultados</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value === "" ? "__empty__" : o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left",
                  "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                  o.value === value ? "bg-red-50/50 text-red-700 font-medium" : "text-gray-900"
                )}
              >
                <Check className={cn(
                  "h-3.5 w-3.5 shrink-0 text-red-600",
                  o.value === value ? "opacity-100" : "opacity-0"
                )} />
                <span className="truncate">{o.label}</span>
              </button>
            ))
          )}
        </div>

        {/* Criar novo */}
        {onCreateNew && (
          <>
            <div className="border-t border-gray-100" />
            <button
              type="button"
              onClick={() => { setOpen(false); setSearch(""); onCreateNew() }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              {createLabel}
            </button>
          </>
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  )
}
