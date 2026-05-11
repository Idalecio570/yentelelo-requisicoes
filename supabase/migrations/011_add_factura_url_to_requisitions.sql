-- ============================================================
-- Migração 011: Factura por requisição
-- Adiciona coluna factura_url e função RPC segura para anexar
-- a factura. Só o criador pode anexar, apenas quando a
-- requisição está em aprovado_final e tem pelo menos um pagamento.
-- ============================================================

ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS factura_url TEXT;

CREATE OR REPLACE FUNCTION attach_factura(req_id UUID, url TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM requisitions
    WHERE id            = req_id
      AND criado_por    = auth.uid()
      AND status        = 'aprovado_final'
      AND payment_status <> 'sem_pagamento'
  ) THEN
    RAISE EXCEPTION 'Não autorizado ou condições não satisfeitas';
  END IF;

  UPDATE requisitions SET factura_url = url WHERE id = req_id;
END;
$$;
