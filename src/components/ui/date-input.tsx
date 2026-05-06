import { forwardRef } from "react"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        type="date"
        className={cn(
          "w-full rounded-[8px] border border-[#d2d2d7] bg-white px-3 py-[7px] pr-8",
          "text-[13px] text-[#1d1d1f]",
          "focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500",
          "cursor-pointer transition-colors hover:border-[#a0a0a5]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // oculta o ícone nativo mantendo-o clicável para abrir o picker
          "[&::-webkit-calendar-picker-indicator]:absolute",
          "[&::-webkit-calendar-picker-indicator]:right-0",
          "[&::-webkit-calendar-picker-indicator]:h-full",
          "[&::-webkit-calendar-picker-indicator]:w-8",
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:opacity-0",
          error && "border-red-400 bg-red-50",
          className
        )}
        {...props}
      />
      <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868b]" />
    </div>
  )
)
DateInput.displayName = "DateInput"
