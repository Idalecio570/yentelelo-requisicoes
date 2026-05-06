import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Select        = SelectPrimitive.Root
const SelectGroup   = SelectPrimitive.Group
const SelectValue   = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // layout
      "flex w-full items-center justify-between gap-2",
      // sizing — matches system inputs
      "rounded-[8px] border border-[#d2d2d7] bg-white px-3 py-[7px]",
      // text
      "text-[13px] text-[#1d1d1f] [&>span]:line-clamp-1 [&>span]:text-left",
      // placeholder
      "data-[placeholder]:text-[#86868b]",
      // focus
      "focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500",
      // states
      "cursor-pointer transition-colors hover:border-[#a0a0a5]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#86868b]" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "relative z-[9999] max-h-64 overflow-hidden",
        "rounded-[10px] border border-[#e0e0e5] bg-white",
        "shadow-[0_8px_30px_-4px_rgba(15,23,42,.15),0_0_0_1px_rgba(15,23,42,.06)]",
        position === "popper" && [
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          "min-w-[var(--radix-select-trigger-width)]",
        ],
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center",
      "rounded-[6px] py-1.5 pl-8 pr-3 text-[13px] text-[#1d1d1f]",
      // Radix usa data-[highlighted], NÃO :focus/:hover
      "data-[highlighted]:bg-[#f5f5f7] data-[highlighted]:outline-none",
      "data-[state=checked]:text-red-700 data-[state=checked]:font-medium",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-red-600" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[#f0f0f5]", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select, SelectGroup, SelectValue,
  SelectTrigger, SelectContent,
  SelectItem, SelectSeparator,
}
