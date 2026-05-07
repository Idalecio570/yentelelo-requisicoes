-- ============================================================
-- Migração 008: Corrige notificações e limpeza de aprovações
--               para o fluxo de skip nível 1 do gestor_escritorio
-- ============================================================

-- ── 1. cleanup_approvals_on_resubmit: trata devolvido → aprovado_escritorio ──
-- Quando gestor_escritorio ressubmete, o status vai para aprovado_escritorio
-- (não pendente), por isso o cleanup também precisa de tratar esse caso.

CREATE OR REPLACE FUNCTION cleanup_approvals_on_resubmit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.status = 'pendente' AND OLD.status IS DISTINCT FROM 'pendente')
     OR (NEW.status = 'aprovado_escritorio' AND OLD.status = 'devolvido')
  THEN
    DELETE FROM approvals WHERE requisition_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 2. notify_on_new_requisition: notifica director_geral para requisições
--       do gestor_escritorio; SECURITY DEFINER para poder inserir notificações ──

CREATE OR REPLACE FUNCTION notify_on_new_requisition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dest        UUID;
  v_role        TEXT;
  v_is_gestor   BOOLEAN := FALSE;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = NEW.criado_por;

  IF v_role = 'gestor_escritorio' THEN
    v_is_gestor := TRUE;
  END IF;

  IF v_is_gestor THEN
    -- Requisição da gestora de escritório → vai directo para o director_geral
    FOR v_dest IN SELECT id FROM profiles WHERE role = 'director_geral' AND ativo = true LOOP
      INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
      VALUES (v_dest, 'aprovado_escritorio',
              'Nova requisição aguarda aprovação',
              'Uma nova requisição foi submetida pelo Gestor de Escritório e aguarda a sua aprovação.',
              NEW.id);
    END LOOP;
  ELSE
    -- Requisição normal → notifica gestor_escritorio para análise
    FOR v_dest IN SELECT id FROM profiles WHERE role = 'gestor_escritorio' AND ativo = true LOOP
      INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
      VALUES (v_dest, 'nova_requisicao',
              'Nova requisição submetida',
              'Uma nova requisição foi submetida e aguarda análise.',
              NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
