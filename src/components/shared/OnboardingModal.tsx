import { useState, useEffect } from "react"
import { ArrowRight, X, ChevronLeft, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { ROLE_LABELS } from "@/lib/constants"
import type { Profile } from "@/types"

const ROLE_DESC: Partial<Record<string, string>> = {
  colaborador:
    "Podes criar requisições de compra e serviço. Acompanha o estado na tua lista e recebes notificações quando houver uma decisão.",
  gestor_escritorio:
    "Recebes todas as requisições para análise. Podes aprovar, devolver para correcção ou rejeitar directamente na fila de aprovações.",
  director_comercial:
    "Vês as requisições da Direcção Comercial e acompanhas o processo de aprovação em tempo real.",
  director_projectos:
    "Vês as requisições da Direcção de Projectos e acompanhas o processo de aprovação em tempo real.",
  gestor_comercial:
    "Vês as requisições da Direcção Comercial e acompanhas o processo de aprovação.",
  gestor_tics:
    "Crias requisições para as direcções que seleccionares. Acompanha o estado de cada requisição após submissão.",
  director_geral:
    "És o último nível de aprovação. Apenas chegam até ti as requisições já aprovadas pela Gestora de Escritório.",
  admin:
    "Tens acesso total ao sistema: gestão de utilizadores, templates, limites de aprovação e auditoria completa.",
  auditor:
    "Tens acesso de leitura a todos os dados e podes exportar relatórios detalhados em PDF e Excel.",
}

const ROLE_ACTION: Partial<Record<string, { label: string; to: string }>> = {
  colaborador:       { label: "Criar primeira requisição",     to: "/requisitions/new" },
  gestor_escritorio: { label: "Ver aprovações pendentes",      to: "/approvals" },
  director_geral:    { label: "Ver aprovações pendentes",      to: "/approvals" },
  admin:             { label: "Ver painel de administração",   to: "/admin" },
  auditor:           { label: "Ver relatórios",                to: "/reports" },
}

interface OnboardingModalProps {
  profile: Profile
}

export function OnboardingModal({ profile }: OnboardingModalProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)

  const storageKey = `yentelelo_onboarding_done_${profile.id}`

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      setShow(true)
    }
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, "1")
    setShow(false)
  }

  function handleAction() {
    dismiss()
    const action = ROLE_ACTION[profile.role]
    navigate(action?.to ?? "/dashboard")
  }

  if (!show) return null

  const firstName  = profile.nome_completo.split(" ")[0] ?? profile.nome_completo
  const roleLabel  = ROLE_LABELS[profile.role]
  const roleDesc   = ROLE_DESC[profile.role] ?? "Bem-vindo ao sistema de requisições."
  const roleAction = ROLE_ACTION[profile.role] ?? { label: "Ver o dashboard", to: "/dashboard" }

  const slides = [
    {
      title: `Bem-vindo, ${firstName}!`,
      body: (
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{ background: "#EEF4FF" }}
          >
            👋
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: "#475569" }}>
            Este é o sistema de gestão de requisições da{" "}
            <span className="font-semibold" style={{ color: "#0F172A" }}>Yentelelo Group</span>.
            Aqui podes criar, acompanhar e aprovar requisições de compra e serviço de forma centralizada.
          </p>
        </div>
      ),
    },
    {
      title: `O teu papel: ${roleLabel}`,
      body: (
        <div className="space-y-3">
          <div className="p-4 rounded-[12px]" style={{ background: "#EEF4FF" }}>
            <p className="text-[13px] leading-relaxed" style={{ color: "#1E3A5F" }}>
              {roleDesc}
            </p>
          </div>
          <p className="text-[11px] text-center" style={{ color: "#94A3B8" }}>
            As tuas permissões são geridas pelo administrador do sistema.
          </p>
        </div>
      ),
    },
    {
      title: "Estás pronto!",
      body: (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={40} style={{ color: "#059669" }} />
          <p className="text-[13px] leading-relaxed" style={{ color: "#475569" }}>
            Clica abaixo para ir directamente para a tua área principal.
          </p>
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white rounded-full transition-colors"
            style={{ background: "#002C62" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#003A7A" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#002C62" }}
          >
            {roleAction.label}
            <ArrowRight size={14} />
          </button>
        </div>
      ),
    },
  ]

  const slide = slides[step]!
  const isLast = step === slides.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }} />

      {/* Modal */}
      <div
        className="relative z-10 bg-white w-full max-w-md rounded-[24px] overflow-hidden"
        style={{ boxShadow: "0 24px 64px -12px rgba(15,23,42,.28), 0 0 0 1px rgba(15,23,42,.06)" }}
      >
        {/* Barra de progresso no topo */}
        <div className="flex gap-1 px-6 pt-5">
          {slides.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{
                background: i <= step ? "#002C62" : "#E6E8EC",
              }}
            />
          ))}
        </div>

        {/* Fechar */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full transition-colors"
          style={{ color: "#94A3B8" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "" }}
          title="Fechar"
        >
          <X size={16} />
        </button>

        {/* Conteúdo */}
        <div className="px-6 py-6 space-y-5">
          <h2 className="text-[17px] font-bold text-center" style={{ color: "#0F172A" }}>
            {slide.title}
          </h2>
          {slide.body}
        </div>

        {/* Rodapé */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: "1px solid #E6E8EC" }}
        >
          <button
            onClick={dismiss}
            className="text-[12px] transition-colors"
            style={{ color: "#94A3B8" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8" }}
          >
            Saltar
          </button>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-full transition-colors"
                style={{ border: "1px solid #E6E8EC", color: "#475569" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F8FAFC" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "" }}
              >
                <ChevronLeft size={13} />
                Anterior
              </button>
            )}
            {!isLast && (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white rounded-full transition-colors"
                style={{ background: "#002C62" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#003A7A" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#002C62" }}
              >
                Próximo
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
