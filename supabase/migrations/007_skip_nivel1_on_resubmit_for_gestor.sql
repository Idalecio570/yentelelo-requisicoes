-- ============================================================
-- Migração 007: Skip nível 1 na ressubmissão para gestor_escritorio
-- Quando uma requisição devolvida é ressubmetida por gestor_escritorio,
-- passa directamente a aprovado_escritorio em vez de pendente.
-- ============================================================

CREATE OR REPLACE FUNCTION auto_skip_nivel1_on_resubmit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF OLD.status = 'devolvido' AND NEW.status = 'pendente' THEN
    SELECT role INTO v_role FROM profiles WHERE id = NEW.criado_por;
    IF v_role = 'gestor_escritorio' THEN
      NEW.status := 'aprovado_escritorio';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_skip_nivel1_on_resubmit
  BEFORE UPDATE ON requisitions
  FOR EACH ROW EXECUTE FUNCTION auto_skip_nivel1_on_resubmit();
