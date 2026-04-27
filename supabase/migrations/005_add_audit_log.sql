-- Migration 005: Tabela de auditoria de alterações em requisições
-- Regista diferenças de campos quando uma requisição é editada após devolução.

CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID        NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  campo          TEXT        NOT NULL,
  valor_anterior TEXT,
  valor_novo     TEXT,
  alterado_por   UUID        REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Leitura: próprio criador, gestor_escritorio, director_geral, admin, auditor
CREATE POLICY "audit_log: leitura permitida"
  ON audit_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('gestor_escritorio','director_geral','admin','auditor')
    )
    OR
    EXISTS (
      SELECT 1 FROM requisitions r
      WHERE r.id = audit_log.requisition_id
        AND r.criado_por = auth.uid()
    )
  );

-- Inserção apenas via trigger (service role), sem acesso directo do frontend
CREATE POLICY "audit_log: inserção restrita"
  ON audit_log FOR INSERT TO authenticated
  WITH CHECK (false);

-- Trigger: regista alterações de campos quando status transita de 'devolvido' → 'pendente'
CREATE OR REPLACE FUNCTION log_requisition_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'devolvido' AND NEW.status = 'pendente' THEN
    IF OLD.titulo IS DISTINCT FROM NEW.titulo THEN
      INSERT INTO audit_log (requisition_id, campo, valor_anterior, valor_novo, alterado_por)
      VALUES (NEW.id, 'titulo', OLD.titulo, NEW.titulo, NEW.criado_por);
    END IF;
    IF OLD.descricao IS DISTINCT FROM NEW.descricao THEN
      INSERT INTO audit_log (requisition_id, campo, valor_anterior, valor_novo, alterado_por)
      VALUES (NEW.id, 'descricao', OLD.descricao, NEW.descricao, NEW.criado_por);
    END IF;
    IF OLD.valor_estimado IS DISTINCT FROM NEW.valor_estimado THEN
      INSERT INTO audit_log (requisition_id, campo, valor_anterior, valor_novo, alterado_por)
      VALUES (NEW.id, 'valor_estimado',
              OLD.valor_estimado::TEXT, NEW.valor_estimado::TEXT, NEW.criado_por);
    END IF;
    IF OLD.urgencia IS DISTINCT FROM NEW.urgencia THEN
      INSERT INTO audit_log (requisition_id, campo, valor_anterior, valor_novo, alterado_por)
      VALUES (NEW.id, 'urgencia', OLD.urgencia, NEW.urgencia, NEW.criado_por);
    END IF;
    IF OLD.entity_id IS DISTINCT FROM NEW.entity_id THEN
      INSERT INTO audit_log (requisition_id, campo, valor_anterior, valor_novo, alterado_por)
      VALUES (NEW.id, 'entity_id', OLD.entity_id::TEXT, NEW.entity_id::TEXT, NEW.criado_por);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_requisition_changes ON requisitions;
CREATE TRIGGER trg_log_requisition_changes
  AFTER UPDATE ON requisitions
  FOR EACH ROW EXECUTE FUNCTION log_requisition_changes();
