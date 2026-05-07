-- ============================================================
-- Migração 010: Corrige sync_requisition_total para usar NULL
-- quando não há itens em vez de 0, que violava o CHECK constraint
-- valor_estimado > 0 da tabela requisitions.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_requisition_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE requisitions
  SET valor_estimado = NULLIF(
        (SELECT SUM(valor_total) FROM requisition_items
         WHERE requisition_id = COALESCE(NEW.requisition_id, OLD.requisition_id)),
        0)
  WHERE id = COALESCE(NEW.requisition_id, OLD.requisition_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;
