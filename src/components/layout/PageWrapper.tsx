interface PageWrapperProps {
  titulo:      string
  children:    React.ReactNode
  actions?:    React.ReactNode
  breadcrumb?: React.ReactNode
}

export function PageWrapper({ titulo, children, actions, breadcrumb }: PageWrapperProps) {
  return (
    <div className="px-6 py-8 lg:px-10 max-w-7xl mx-auto">
      {breadcrumb}
      <div className="flex items-center justify-between mb-7">
        <h1 className="text-[26px] font-semibold text-[#1d1d1f] tracking-[-0.3px] leading-tight">
          {titulo}
        </h1>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  )
}
