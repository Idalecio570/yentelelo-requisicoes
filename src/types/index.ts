// ============================================================
// Tipos base — espelham directamente as tabelas da base de dados
// ============================================================

// ---------------------------------------------------------------------------
// Tipos literais (CHECK constraints do SQL)
// ---------------------------------------------------------------------------

export type Role =
  | "colaborador"
  | "gestor_escritorio"
  | "director_comercial"
  | "director_projectos"
  | "gestor_comercial"
  | "gestor_tics"
  | "director_geral"
  | "admin"
  | "auditor"

export type DirecaoCodigo =
  | "direcao_comercial"
  | "direcao_projectos"
  | "direcao_geral"

export type RequisitionTipo = "compra" | "servico"

export type RequisitionUrgencia = "normal" | "urgente" | "muito_urgente"

export type RequisitionStatus =
  | "pendente"
  | "em_analise_escritorio"
  | "aprovado_escritorio"
  | "em_analise_director"
  | "aprovado_final"
  | "rejeitado"
  | "cancelado"
  | "devolvido"
  | "rascunho"

export type PaymentStatus = "sem_pagamento" | "pendente" | "parcial" | "concluida"

export type EntityTipo = "empresa" | "individual"

export type ApprovalDecisao = "aprovado" | "rejeitado" | "devolvido"

export type ApprovalNivel = 1 | 2

// ---------------------------------------------------------------------------
// Tabela: direcoes
// ---------------------------------------------------------------------------
export interface Direcao {
  id:         string
  nome:       string
  codigo:     DirecaoCodigo
  created_at: string
}

// ---------------------------------------------------------------------------
// Tabela: profiles  (estende auth.users)
// ---------------------------------------------------------------------------
export interface Profile {
  id:            string
  nome_completo: string
  email:         string
  role:          Role
  direcao_id:    string | null
  ativo:         boolean
  notif_email:   boolean
  created_at:    string
  updated_at:    string
  // Relações (via JOIN/embed)
  direcao?:      Direcao
}

// ---------------------------------------------------------------------------
// Tabela: entities  (fornecedores)
// ---------------------------------------------------------------------------
export interface Entity {
  id:             string
  nome:           string
  tipo:           EntityTipo | null
  nuit:           string | null
  email:          string | null
  telefone:       string | null
  banco:          string | null
  conta_bancaria: string | null
  morada:         string | null
  ativo:          boolean
  created_at:     string
  updated_at:     string
}

// ---------------------------------------------------------------------------
// Tabela: templates
// ---------------------------------------------------------------------------
export interface Template {
  id:               string
  nome:             string
  tipo:             RequisitionTipo | null
  descricao_padrao: string | null
  criado_por:       string | null
  ativo:            boolean
  created_at:       string
  // Relações
  criador?:         Profile
}

// ---------------------------------------------------------------------------
// Tabela: approval_limits
// ---------------------------------------------------------------------------
export interface ApprovalLimit {
  id:           string
  valor_maximo: number
  ativo:        boolean
  criado_por:   string | null
  created_at:   string
  // Relações
  criador?:     Profile
}

// Orçamento embutido em requisitions.orcamentos (JSONB)
export interface OrcamentoItem {
  fornecedor: string
  valor:      number
  anexo_url:  string | null
  notas:      string | null
}

// ---------------------------------------------------------------------------
// Tabela: requisition_items
// ---------------------------------------------------------------------------
export interface RequisitionItem {
  id:             string
  requisition_id: string
  descricao:      string
  categoria:      string | null
  quantidade:     number
  valor_unitario: number
  valor_total:    number
  entity_id:      string | null
  entity?:        Entity
  notas:          string | null
  ordem:          number
  created_at:     string
}

// ---------------------------------------------------------------------------
// Tabela: requisitions
// ---------------------------------------------------------------------------
export interface Requisition {
  id:              string
  titulo:          string
  descricao:       string | null
  tipo:            RequisitionTipo | null
  urgencia:        RequisitionUrgencia
  valor_estimado:  number | null
  status:          RequisitionStatus
  entity_id:       string | null
  criado_por:      string
  direcao_id:      string
  anexos:          string[]
  orcamentos:      OrcamentoItem[]
  template_origem: string | null
  total_paid:      number
  payment_status:  PaymentStatus
  created_at:      string
  updated_at:      string
  // Relações
  profile?:        Profile
  entity?:         Entity
  direcao?:        Direcao
  template?:       Template
  items?:          RequisitionItem[]
}

// ---------------------------------------------------------------------------
// Tabela: approvals
// ---------------------------------------------------------------------------
export interface Approval {
  id:             string
  requisition_id: string
  aprovador_id:   string
  nivel:          ApprovalNivel
  decisao:        ApprovalDecisao | null
  comentario:     string | null
  created_at:     string
  // Relações
  aprovador?:     Profile
  requisition?:   Requisition
}

// ---------------------------------------------------------------------------
// Tabela: comments
// ---------------------------------------------------------------------------
export interface Comment {
  id:             string
  requisition_id: string
  autor_id:       string
  conteudo:       string
  created_at:     string
  // Relações
  autor?:         Profile
}

// ---------------------------------------------------------------------------
// Tabela: payments
// ---------------------------------------------------------------------------
export interface Payment {
  id:               string
  requisition_id:   string
  numero_prestacao: number
  valor:            number
  data_pagamento:   string   // DATE → string ISO
  notas:            string | null
  registado_por:    string | null
  created_at:       string
  // Relações
  registador?:      Profile
}

// ---------------------------------------------------------------------------
// Tabela: notifications
// ---------------------------------------------------------------------------
export interface Notification {
  id:              string
  destinatario_id: string
  tipo:            string
  titulo:          string
  mensagem:        string | null
  lida:            boolean
  requisition_id:  string | null
  created_at:      string
}

// ============================================================
// Tipos utilitários para INSERT (sem campos gerados pela DB)
// ============================================================

export type RequisitionInsert = Pick<
  Requisition,
  "titulo" | "descricao" | "tipo" | "urgencia" | "valor_estimado" |
  "entity_id" | "criado_por" | "direcao_id" | "anexos" | "orcamentos" | "template_origem"
> & { status?: RequisitionStatus }

export type ProfileUpdate = Partial<
  Pick<Profile, "nome_completo" | "email" | "role" | "direcao_id" | "ativo" | "notif_email">
>

export type ApprovalInsert = Pick<
  Approval,
  "requisition_id" | "aprovador_id" | "nivel" | "decisao" | "comentario"
>

export type PaymentInsert = Pick<
  Payment,
  "requisition_id" | "valor" | "data_pagamento" | "notas" | "registado_por"
>

export type CommentInsert = Pick<Comment, "requisition_id" | "autor_id" | "conteudo">

export type EntityInsert = Pick<
  Entity,
  "nome" | "tipo" | "nuit" | "email" | "telefone" | "banco" | "conta_bancaria" | "morada"
>

export type EntityUpdate = Partial<EntityInsert & Pick<Entity, "ativo">>

