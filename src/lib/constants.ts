import type {
  Role, DirecaoCodigo, RequisitionTipo,
  RequisitionUrgencia, RequisitionStatus, PaymentStatus,
} from "@/types"

// ---------------------------------------------------------------------------
// Arrays de constantes (úteis para <select> e validações Zod)
// ---------------------------------------------------------------------------

export const ROLES: Role[] = [
  "colaborador",
  "gestor_escritorio",
  "director_comercial",
  "director_projectos",
  "gestor_comercial",
  "gestor_tics",
  "director_geral",
  "admin",
  "auditor",
]

export const DIRECAO_CODIGOS: DirecaoCodigo[] = [
  "direcao_comercial",
  "direcao_projectos",
  "direcao_geral",
]

export const REQUISITION_STATUSES: RequisitionStatus[] = [
  "pendente",
  "em_analise_escritorio",
  "aprovado_escritorio",
  "em_analise_director",
  "aprovado_final",
  "rejeitado",
  "cancelado",
  "devolvido",
  "rascunho",
]

export const REQUISITION_TIPOS: RequisitionTipo[] = ["compra", "servico"]

export const REQUISITION_URGENCIAS: RequisitionUrgencia[] = [
  "normal",
  "urgente",
  "muito_urgente",
]

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "sem_pagamento",
  "pendente",
  "parcial",
  "concluida",
]

// ---------------------------------------------------------------------------
// Rótulos para a UI (Português pré-AO90)
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<Role, string> = {
  colaborador:        "Colaborador",
  gestor_escritorio:  "Gestor de Escritório",
  director_comercial: "Director Comercial",
  director_projectos: "Director de Projectos",
  gestor_comercial:   "Gestor Comercial",
  gestor_tics:        "Gestor de TICs",
  director_geral:     "Director Geral",
  admin:              "Administrador",
  auditor:            "Auditor",
}

export const STATUS_LABELS: Record<RequisitionStatus, string> = {
  pendente:               "Pendente",
  em_analise_escritorio:  "Em análise (Escritório)",
  aprovado_escritorio:    "Aprovado pelo Escritório",
  em_analise_director:    "Em análise (Director)",
  aprovado_final:         "Aprovado",
  rejeitado:              "Rejeitado",
  cancelado:              "Cancelado",
  devolvido:              "Devolvido",
  rascunho:               "Rascunho",
}

export const URGENCIA_LABELS: Record<RequisitionUrgencia, string> = {
  normal:        "Normal",
  urgente:       "Urgente",
  muito_urgente: "Muito Urgente",
}

export const DIRECAO_LABELS: Record<DirecaoCodigo, string> = {
  direcao_comercial:  "Direcção Comercial",
  direcao_projectos:  "Direcção de Projectos",
  direcao_geral:      "Direcção Geral",
}

// ---------------------------------------------------------------------------
// Chaves de cache TanStack Query
// ---------------------------------------------------------------------------

export const QUERY_KEYS = {
  requisitions:     ["requisitions"] as const,
  requisition:      (id: string) => ["requisitions", id] as const,
  entities:         ["entities"] as const,
  entity:           (id: string) => ["entities", id] as const,
  payments:         (reqId: string) => ["payments", reqId] as const,
  approvals:        (reqId: string) => ["approvals", reqId] as const,
  comments:         (reqId: string) => ["comments", reqId] as const,
  notifications:    ["notifications"] as const,
  templates:        ["templates"] as const,
  approvalLimits:   ["approval_limits"] as const,
  direcoes:         ["direcoes"] as const,
  profile:          ["profile"] as const,
  profiles:         ["profiles"] as const,
  suppliers:          (search?: string) => ["suppliers", search ?? ""] as const,
  supplier:           (id: string) => ["supplier", id] as const,
  allPayments:        ["all-payments"] as const,
  stats:              (filters: string) => ["stats", filters] as const,
  requisitionsExport: (start: string, end: string) => ["requisitions-export", start, end] as const,
  users:              ["users"] as const,
  user:               (id: string) => ["user", id] as const,
  activeLimit:        ["active-limit"] as const,
  allApprovals:       ["all-approvals"] as const,
} as const

// ---------------------------------------------------------------------------
// Redireccionamento pós-login por role
// ---------------------------------------------------------------------------

export const ROLE_DEFAULT_ROUTE: Record<Role, string> = {
  colaborador:        "/requisitions",
  gestor_escritorio:  "/approvals",
  director_comercial: "/requisitions",
  director_projectos: "/requisitions",
  gestor_comercial:   "/requisitions",
  gestor_tics:        "/requisitions",
  director_geral:     "/approvals",
  admin:              "/admin",
  auditor:            "/reports",
}

// ---------------------------------------------------------------------------
// Classes CSS do badge de role no Header
// ---------------------------------------------------------------------------

export const ROLE_AVATAR_CLASSES: Record<Role, string> = {
  colaborador:        "bg-gray-500",
  gestor_escritorio:  "bg-blue-600",
  director_comercial: "bg-purple-600",
  director_projectos: "bg-indigo-600",
  gestor_comercial:   "bg-cyan-600",
  gestor_tics:        "bg-green-600",
  director_geral:     "bg-red-800",
  admin:              "bg-red-600",
  auditor:            "bg-amber-500",
}

export const ROLE_BADGE_CLASSES: Record<Role, string> = {
  colaborador:        "bg-gray-100 text-gray-700",
  gestor_escritorio:  "bg-blue-100 text-blue-700",
  director_comercial: "bg-purple-100 text-purple-700",
  director_projectos: "bg-purple-100 text-purple-700",
  gestor_comercial:   "bg-indigo-100 text-indigo-700",
  gestor_tics:        "bg-indigo-100 text-indigo-700",
  director_geral:     "bg-orange-100 text-orange-700",
  admin:              "bg-red-100 text-red-700",
  auditor:            "bg-amber-100 text-amber-700",
}

