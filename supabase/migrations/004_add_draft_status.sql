-- Migration 004: Adiciona estado 'rascunho' ao CHECK constraint da coluna status
-- Permite guardar formulários parcialmente preenchidos sem os submeter para aprovação.

ALTER TABLE requisitions
  DROP CONSTRAINT IF EXISTS requisitions_status_check;

ALTER TABLE requisitions
  ADD CONSTRAINT requisitions_status_check
  CHECK (status IN (
    'pendente','em_analise_escritorio','aprovado_escritorio',
    'em_analise_director','aprovado_final',
    'rejeitado','cancelado','devolvido','rascunho'
  ));
