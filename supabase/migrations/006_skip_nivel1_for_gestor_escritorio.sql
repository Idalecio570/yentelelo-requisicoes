-- ============================================================
-- Migração 006: Skip nível 1 para gestor_escritorio
-- Requisições criadas por gestor_escritorio entram directamente
-- em aprovado_escritorio, saltando a etapa de análise do escritório.
-- ============================================================

-- ── 1. Trigger BEFORE INSERT: muda status pendente → aprovado_escritorio ──

CREATE OR REPLACE FUNCTION auto_skip_nivel1_for_gestor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = NEW.criado_por;

  IF v_role = 'gestor_escritorio' AND NEW.status = 'pendente' THEN
    NEW.status := 'aprovado_escritorio';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_skip_nivel1_for_gestor
  BEFORE INSERT ON requisitions
  FOR EACH ROW EXECUTE FUNCTION auto_skip_nivel1_for_gestor();

-- ── 2. RLS UPDATE: permite que gestor_escritorio edite as suas em devolvido ──

DROP POLICY IF EXISTS "req: gestor_escritorio analisa em pendente/em_analise" ON requisitions;

CREATE POLICY "req: gestor_escritorio analisa em pendente/em_analise"
  ON requisitions FOR UPDATE
  USING (
    get_my_role() = 'gestor_escritorio'
    AND (
      status = ANY (ARRAY['pendente', 'em_analise_escritorio'])
      OR (criado_por = auth.uid() AND status = 'devolvido')
    )
  );
