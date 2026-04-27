import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-[12px] text-[#6e6e73] mb-3 flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={11} className="text-[#d2d2d7] shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? "font-medium text-[#1d1d1f]" : ""}>{item.label}</span>
            ) : (
              <Link to={item.href} className="hover:text-[#1d1d1f] transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
