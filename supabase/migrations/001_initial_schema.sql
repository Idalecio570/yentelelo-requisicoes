-- ============================================================
-- Yentelelo Group — Sistema de Requisições
-- Migration: 001_initial_schema.sql
-- Criado: 2026-04-24
-- ============================================================

-- ---------------------------------------------------------------------------
-- EXTENSÕES
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABELAS
-- ============================================================

-- ---------------------------------------------------------------------------
-- direcoes
-- ---------------------------------------------------------------------------
CREATE TABLE direcoes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT        NOT NULL,
  codigo      TEXT        UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  direcoes        IS 'Direcções orgânicas da empresa';
COMMENT ON COLUMN direcoes.codigo IS 'Identificador programático: direcao_comercial | direcao_projectos | direcao_geral';


-- ---------------------------------------------------------------------------
-- profiles  (estende auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo  TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  role           TEXT        NOT NULL
                             CHECK (role IN (
                               'colaborador','gestor_escritorio','director_comercial',
                               'director_projectos','gestor_comercial','gestor_tics',
                               'director_geral','admin','auditor'
                             )),
  direcao_id     UUID        REFERENCES direcoes(id),
  ativo          BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN profiles.direcao_id IS 'NULL permitido: gestor_escritorio e gestor_tics não têm direcção fixa';


-- ---------------------------------------------------------------------------
-- entities  (fornecedores)
-- ---------------------------------------------------------------------------
CREATE TABLE entities (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           TEXT        NOT NULL,
  tipo           TEXT        CHECK (tipo IN ('empresa','individual')),
  nuit           TEXT        UNIQUE,
  email          TEXT,
  telefone       TEXT,
  banco          TEXT,
  conta_bancaria TEXT,
  morada         TEXT,
  ativo          BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- templates  (modelos de requisição)
-- ---------------------------------------------------------------------------
CREATE TABLE templates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              TEXT        NOT NULL,
  tipo              TEXT        CHECK (tipo IN ('compra','servico')),
  descricao_padrao  TEXT,
  criado_por        UUID        REFERENCES profiles(id),
  ativo             BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- approval_limits  (configurável pelo admin)
-- ---------------------------------------------------------------------------
CREATE TABLE approval_limits (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_maximo  NUMERIC(15,2) NOT NULL CHECK (valor_maximo > 0),
  ativo         BOOLEAN       NOT NULL DEFAULT true,
  criado_por    UUID          REFERENCES profiles(id),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  approval_limits             IS 'Requisições com valor_estimado <= valor_maximo só requerem aprovação do gestor_escritorio';
COMMENT ON COLUMN approval_limits.valor_maximo IS 'Em MZN. Apenas o registo com ativo=true é considerado activo';


-- ---------------------------------------------------------------------------
-- requisitions
-- ---------------------------------------------------------------------------
CREATE TABLE requisitions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          TEXT          NOT NULL,
  descricao       TEXT,
  tipo            TEXT          CHECK (tipo IN ('compra','servico')),
  urgencia        TEXT          NOT NULL
                                CHECK (urgencia IN ('normal','urgente','muito_urgente'))
                                DEFAULT 'normal',
  valor_estimado  NUMERIC(15,2) CHECK (valor_estimado > 0),
  status          TEXT          NOT NULL
                                CHECK (status IN (
                                  'pendente','em_analise_escritorio','aprovado_escritorio',
                                  'em_analise_director','aprovado_final',
                                  'rejeitado','cancelado','devolvido'
                                ))
                                DEFAULT 'pendente',
  entity_id       UUID          REFERENCES entities(id),
  criado_por      UUID          NOT NULL REFERENCES profiles(id),
  direcao_id      UUID          NOT NULL REFERENCES direcoes(id),
  anexos          TEXT[]        NOT NULL DEFAULT '{}',
  orcamentos      JSONB         NOT NULL DEFAULT '[]',
  template_origem UUID          REFERENCES templates(id),
  total_paid      NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_status  TEXT          NOT NULL
                                CHECK (payment_status IN (
                                  'sem_pagamento','pendente','parcial','concluida'
                                ))
                                DEFAULT 'sem_pagamento',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON COLUMN requisitions.orcamentos IS 'Array JSON: [{fornecedor, valor, anexo_url, notas}] — máx. 3 orçamentos';
COMMENT ON COLUMN requisitions.anexos     IS 'URLs do Supabase Storage';


-- ---------------------------------------------------------------------------
-- approvals
-- ---------------------------------------------------------------------------
CREATE TABLE approvals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id  UUID        NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  aprovador_id    UUID        NOT NULL REFERENCES profiles(id),
  nivel           INT         NOT NULL CHECK (nivel IN (1, 2)),
  decisao         TEXT        CHECK (decisao IN ('aprovado','rejeitado','devolvido')),
  comentario      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Comentário obrigatório quando a decisão é negativa
  CONSTRAINT approvals_comentario_required
    CHECK (decisao = 'aprovado' OR comentario IS NOT NULL)
);

COMMENT ON COLUMN approvals.nivel IS '1 = gestor_escritorio  |  2 = director_geral';


-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
CREATE TABLE comments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id  UUID        NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  autor_id        UUID        NOT NULL REFERENCES profiles(id),
  conteudo        TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id   UUID          NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  numero_prestacao INT           NOT NULL CHECK (numero_prestacao > 0),
  valor            NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  data_pagamento   DATE          NOT NULL,
  notas            TEXT,
  registado_por    UUID          REFERENCES profiles(id),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

  UNIQUE (requisition_id, numero_prestacao)
);


-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID        NOT NULL REFERENCES profiles(id),
  tipo            TEXT        NOT NULL,
  titulo          TEXT        NOT NULL,
  mensagem        TEXT,
  lida            BOOLEAN     NOT NULL DEFAULT false,
  requisition_id  UUID        REFERENCES requisitions(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- ÍNDICES  (optimizam as queries de RLS e filtros comuns)
-- ============================================================

CREATE INDEX idx_profiles_role       ON profiles(role);
CREATE INDEX idx_profiles_direcao_id ON profiles(direcao_id);
CREATE INDEX idx_profiles_ativo      ON profiles(ativo);

CREATE INDEX idx_requisitions_criado_por  ON requisitions(criado_por);
CREATE INDEX idx_requisitions_direcao_id  ON requisitions(direcao_id);
CREATE INDEX idx_requisitions_status      ON requisitions(status);
CREATE INDEX idx_requisitions_entity_id   ON requisitions(entity_id);
CREATE INDEX idx_requisitions_created_at  ON requisitions(created_at DESC);

CREATE INDEX idx_approvals_requisition_id ON approvals(requisition_id);
CREATE INDEX idx_approvals_aprovador_id   ON approvals(aprovador_id);

CREATE INDEX idx_payments_requisition_id  ON payments(requisition_id);

CREATE INDEX idx_comments_requisition_id  ON comments(requisition_id);
CREATE INDEX idx_comments_autor_id        ON comments(autor_id);

CREATE INDEX idx_notifications_destinatario_lida
  ON notifications(destinatario_id, lida);
CREATE INDEX idx_notifications_created_at
  ON notifications(created_at DESC);


-- ============================================================
-- FUNÇÕES AUXILIARES  (usadas nas políticas RLS)
-- ============================================================

-- Retorna o role do utilizador autenticado
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Retorna o direcao_id do utilizador autenticado
CREATE OR REPLACE FUNCTION get_my_direcao()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT direcao_id FROM profiles WHERE id = auth.uid();
$$;

-- Verifica se o utilizador autenticado tem acesso de leitura a uma dada requisição
-- (reutilizada nas políticas de approvals, comments e payments)
CREATE OR REPLACE FUNCTION can_read_requisition(p_req_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM requisitions r
    WHERE r.id = p_req_id
      AND (
        get_my_role() IN ('gestor_escritorio','director_geral','admin','auditor')
        OR r.criado_por = auth.uid()
        OR (get_my_role() IN ('director_comercial','gestor_comercial')
            AND r.direcao_id = get_my_direcao())
        OR (get_my_role() = 'director_projectos'
            AND r.direcao_id = get_my_direcao())
      )
  );
$$;


-- ============================================================
-- FUNÇÕES DE TRIGGER
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. handle_updated_at
--    Actualiza updated_at automaticamente em profiles, requisitions e entities
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_requisitions_updated_at
  BEFORE UPDATE ON requisitions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ---------------------------------------------------------------------------
-- 2. auto_numero_prestacao
--    Calcula automaticamente numero_prestacao = MAX + 1 para a requisição
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_numero_prestacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT COALESCE(MAX(numero_prestacao), 0) + 1
  INTO NEW.numero_prestacao
  FROM payments
  WHERE requisition_id = NEW.requisition_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_numero_prestacao
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION auto_numero_prestacao();


-- ---------------------------------------------------------------------------
-- 3. update_payment_totals
--    Recalcula total_paid e payment_status após qualquer alteração em payments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_payment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req_id         UUID;
  v_total          NUMERIC(15,2);
  v_valor_estimado NUMERIC(15,2);
  v_payment_status TEXT;
BEGIN
  v_req_id := CASE TG_OP WHEN 'DELETE' THEN OLD.requisition_id
                          ELSE NEW.requisition_id END;

  SELECT COALESCE(SUM(valor), 0)
  INTO v_total
  FROM payments
  WHERE requisition_id = v_req_id;

  SELECT valor_estimado
  INTO v_valor_estimado
  FROM requisitions
  WHERE id = v_req_id;

  IF v_total = 0 THEN
    v_payment_status := 'sem_pagamento';
  ELSIF v_valor_estimado IS NOT NULL AND v_total >= v_valor_estimado THEN
    v_payment_status := 'concluida';
  ELSE
    v_payment_status := 'parcial';
  END IF;

  UPDATE requisitions
  SET
    total_paid     = v_total,
    payment_status = v_payment_status,
    updated_at     = now()
  WHERE id = v_req_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_payment_totals
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_payment_totals();


-- ---------------------------------------------------------------------------
-- 4. cleanup_approvals_on_resubmit
--    Quando status volta a 'pendente' (ressubmissão), apaga o ciclo anterior
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_approvals_on_resubmit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'pendente' AND OLD.status IS DISTINCT FROM 'pendente' THEN
    DELETE FROM approvals WHERE requisition_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_approvals_on_resubmit
  AFTER UPDATE OF status ON requisitions
  FOR EACH ROW EXECUTE FUNCTION cleanup_approvals_on_resubmit();


-- ---------------------------------------------------------------------------
-- 5. notify_on_status_change
--    Cria notificações automáticas ao actualizar o status de uma requisição
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dest    UUID;
  v_tipo    TEXT;
  v_titulo  TEXT;
  v_msg     TEXT;
BEGIN
  -- Só actua quando o status efectivamente muda
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'pendente' THEN
    -- Ressubmissão após devolução: notifica todos os gestores de escritório
    v_tipo   := 'requisicao_ressubmetida';
    v_titulo := 'Requisição ressubmetida';
    v_msg    := 'Uma requisição devolvida foi editada e ressubmetida para análise.';
    FOR v_dest IN
      SELECT id FROM profiles WHERE role = 'gestor_escritorio' AND ativo = true
    LOOP
      INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
      VALUES (v_dest, v_tipo, v_titulo, v_msg, NEW.id);
    END LOOP;

  ELSIF NEW.status = 'em_analise_escritorio' THEN
    v_tipo   := 'em_analise';
    v_titulo := 'Requisição em análise';
    v_msg    := 'A sua requisição está a ser analisada pelo Gestor de Escritório.';
    INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
    VALUES (NEW.criado_por, v_tipo, v_titulo, v_msg, NEW.id);

  ELSIF NEW.status = 'aprovado_escritorio' THEN
    -- Notifica o criador e todos os directores gerais
    v_tipo   := 'aprovado_escritorio';
    v_titulo := 'Requisição aprovada pelo Escritório';
    v_msg    := 'A requisição foi aprovada pelo Gestor de Escritório e aguarda aprovação do Director Geral.';
    INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
    VALUES (NEW.criado_por, v_tipo, v_titulo, v_msg, NEW.id);
    FOR v_dest IN
      SELECT id FROM profiles WHERE role = 'director_geral' AND ativo = true
    LOOP
      INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
      VALUES (v_dest, v_tipo, v_titulo, v_msg, NEW.id);
    END LOOP;

  ELSIF NEW.status = 'em_analise_director' THEN
    v_tipo   := 'em_analise_director';
    v_titulo := 'Requisição em análise pelo Director Geral';
    v_msg    := 'A sua requisição está a ser analisada pelo Director Geral.';
    INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
    VALUES (NEW.criado_por, v_tipo, v_titulo, v_msg, NEW.id);

  ELSIF NEW.status = 'aprovado_final' THEN
    v_tipo   := 'aprovado_final';
    v_titulo := 'Requisição aprovada definitivamente';
    v_msg    := 'A sua requisição foi aprovada pelo Director Geral.';
    INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
    VALUES (NEW.criado_por, v_tipo, v_titulo, v_msg, NEW.id);

  ELSIF NEW.status = 'rejeitado' THEN
    v_tipo   := 'rejeitado';
    v_titulo := 'Requisição rejeitada';
    v_msg    := 'A sua requisição foi rejeitada. Consulte os comentários para mais detalhes.';
    INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
    VALUES (NEW.criado_por, v_tipo, v_titulo, v_msg, NEW.id);

  ELSIF NEW.status = 'devolvido' THEN
    v_tipo   := 'devolvido';
    v_titulo := 'Requisição devolvida para revisão';
    v_msg    := 'A sua requisição foi devolvida para revisão. Consulte os comentários e edite-a.';
    INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
    VALUES (NEW.criado_por, v_tipo, v_titulo, v_msg, NEW.id);

  ELSIF NEW.status = 'cancelado' THEN
    v_tipo   := 'cancelado';
    v_titulo := 'Requisição cancelada';
    v_msg    := 'A requisição foi cancelada.';
    FOR v_dest IN
      SELECT id FROM profiles
      WHERE role IN ('gestor_escritorio','director_geral') AND ativo = true
    LOOP
      INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
      VALUES (v_dest, v_tipo, v_titulo, v_msg, NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_status_change
  AFTER UPDATE OF status ON requisitions
  FOR EACH ROW EXECUTE FUNCTION notify_on_status_change();


-- ---------------------------------------------------------------------------
-- 6. notify_on_new_requisition  (complementar ao nº 5)
--    Notifica gestores de escritório quando uma nova requisição é submetida
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_on_new_requisition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dest UUID;
BEGIN
  FOR v_dest IN
    SELECT id FROM profiles WHERE role = 'gestor_escritorio' AND ativo = true
  LOOP
    INSERT INTO notifications (destinatario_id, tipo, titulo, mensagem, requisition_id)
    VALUES (
      v_dest,
      'nova_requisicao',
      'Nova requisição submetida',
      'Uma nova requisição foi submetida e aguarda análise.',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_new_requisition
  AFTER INSERT ON requisitions
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_requisition();


-- ---------------------------------------------------------------------------
-- BONUS: handle_new_user
--    Cria automaticamente um perfil ao registar um utilizador via Supabase Auth
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, nome_completo, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
    NEW.email,
    'colaborador'   -- role inicial; admin promove depois
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE direcoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- direcoes
-- ---------------------------------------------------------------------------
CREATE POLICY "direcoes: leitura por todos os autenticados"
  ON direcoes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "direcoes: escrita só admin"
  ON direcoes FOR ALL TO authenticated
  USING     (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');


-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- SELECT: próprio perfil + admin/auditor vêem todos
-- NOTA: para que os JOINs em requisitions funcionem no frontend
--       (ver nome do criador), pode ser necessário alargar esta política.
CREATE POLICY "profiles: ver próprio"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR get_my_role() IN ('admin','auditor'));

-- UPDATE: próprio perfil ou admin
CREATE POLICY "profiles: actualizar próprio"
  ON profiles FOR UPDATE TO authenticated
  USING     (id = auth.uid() OR get_my_role() = 'admin')
  WITH CHECK (id = auth.uid() OR get_my_role() = 'admin');


-- ---------------------------------------------------------------------------
-- entities  (fornecedores)
-- ---------------------------------------------------------------------------
CREATE POLICY "entities: leitura por todos os autenticados"
  ON entities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "entities: inserir — escritório/director/admin"
  ON entities FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('admin','gestor_escritorio','director_geral'));

CREATE POLICY "entities: actualizar — escritório/director/admin"
  ON entities FOR UPDATE TO authenticated
  USING     (get_my_role() IN ('admin','gestor_escritorio','director_geral'))
  WITH CHECK (get_my_role() IN ('admin','gestor_escritorio','director_geral'));


-- ---------------------------------------------------------------------------
-- templates
-- ---------------------------------------------------------------------------
CREATE POLICY "templates: leitura por todos os autenticados"
  ON templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "templates: inserir — gestor/admin"
  ON templates FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() IN ('admin','gestor_escritorio')
    AND criado_por = auth.uid()
  );

CREATE POLICY "templates: actualizar — gestor/admin"
  ON templates FOR UPDATE TO authenticated
  USING     (get_my_role() IN ('admin','gestor_escritorio'))
  WITH CHECK (get_my_role() IN ('admin','gestor_escritorio'));

CREATE POLICY "templates: eliminar — gestor/admin"
  ON templates FOR DELETE TO authenticated
  USING (get_my_role() IN ('admin','gestor_escritorio'));


-- ---------------------------------------------------------------------------
-- approval_limits
-- ---------------------------------------------------------------------------
CREATE POLICY "approval_limits: leitura por todos os autenticados"
  ON approval_limits FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "approval_limits: inserir — admin"
  ON approval_limits FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    AND criado_por = auth.uid()
  );

CREATE POLICY "approval_limits: actualizar — admin"
  ON approval_limits FOR UPDATE TO authenticated
  USING     (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');


-- ---------------------------------------------------------------------------
-- requisitions — SELECT  (permissões por role)
-- ---------------------------------------------------------------------------
CREATE POLICY "req: colaborador vê as suas"
  ON requisitions FOR SELECT TO authenticated
  USING (get_my_role() = 'colaborador' AND criado_por = auth.uid());

CREATE POLICY "req: gestor_tics vê as suas"
  ON requisitions FOR SELECT TO authenticated
  USING (get_my_role() = 'gestor_tics' AND criado_por = auth.uid());

CREATE POLICY "req: gestor_escritorio vê todas"
  ON requisitions FOR SELECT TO authenticated
  USING (get_my_role() = 'gestor_escritorio');

CREATE POLICY "req: director_comercial e gestor_comercial vêem a sua direcção"
  ON requisitions FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('director_comercial','gestor_comercial')
    AND direcao_id = get_my_direcao()
  );

CREATE POLICY "req: director_projectos vê a sua direcção"
  ON requisitions FOR SELECT TO authenticated
  USING (
    get_my_role() = 'director_projectos'
    AND direcao_id = get_my_direcao()
  );

CREATE POLICY "req: director_geral, admin e auditor vêem todas"
  ON requisitions FOR SELECT TO authenticated
  USING (get_my_role() IN ('director_geral','admin','auditor'));

-- ---------------------------------------------------------------------------
-- requisitions — INSERT
-- ---------------------------------------------------------------------------
CREATE POLICY "req: qualquer utilizador activo pode criar"
  ON requisitions FOR INSERT TO authenticated
  WITH CHECK (
    criado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND ativo = true
    )
  );

-- ---------------------------------------------------------------------------
-- requisitions — UPDATE  (permissões por role e status)
-- ---------------------------------------------------------------------------
CREATE POLICY "req: colaborador edita as suas em pendente/devolvido"
  ON requisitions FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'colaborador'
    AND criado_por = auth.uid()
    AND status IN ('pendente','devolvido')
  );

CREATE POLICY "req: gestor_escritorio analisa em pendente/em_analise"
  ON requisitions FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'gestor_escritorio'
    AND status IN ('pendente','em_analise_escritorio')
  );

CREATE POLICY "req: director_geral analisa em aprovado/em_analise_director"
  ON requisitions FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'director_geral'
    AND status IN ('aprovado_escritorio','em_analise_director')
  );

CREATE POLICY "req: admin actualiza todas"
  ON requisitions FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin');


-- ---------------------------------------------------------------------------
-- approvals
-- ---------------------------------------------------------------------------
CREATE POLICY "approvals: gestor/director/admin/auditor vêem todas"
  ON approvals FOR SELECT TO authenticated
  USING (get_my_role() IN ('gestor_escritorio','director_geral','admin','auditor'));

CREATE POLICY "approvals: colaborador e gestor_tics vêem das suas requisições"
  ON approvals FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('colaborador','gestor_tics')
    AND can_read_requisition(requisition_id)
  );

CREATE POLICY "approvals: gestor_escritorio insere nível 1"
  ON approvals FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'gestor_escritorio'
    AND nivel = 1
    AND aprovador_id = auth.uid()
  );

CREATE POLICY "approvals: director_geral insere nível 2"
  ON approvals FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'director_geral'
    AND nivel = 2
    AND aprovador_id = auth.uid()
  );

CREATE POLICY "approvals: admin insere qualquer nível"
  ON approvals FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    AND aprovador_id = auth.uid()
  );


-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
-- SELECT: qualquer utilizador que tenha acesso de leitura à requisição-pai
CREATE POLICY "comments: acesso por visibilidade da requisição"
  ON comments FOR SELECT TO authenticated
  USING (can_read_requisition(requisition_id));

-- INSERT: qualquer utilizador autenticado (desde que identifique-se como autor)
CREATE POLICY "comments: qualquer autenticado pode comentar"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid());


-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE POLICY "payments: gestor/director/admin/auditor vêem todos"
  ON payments FOR SELECT TO authenticated
  USING (get_my_role() IN ('gestor_escritorio','director_geral','admin','auditor'));

CREATE POLICY "payments: colaborador e gestor_tics vêem das suas requisições"
  ON payments FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('colaborador','gestor_tics')
    AND can_read_requisition(requisition_id)
  );

CREATE POLICY "payments: gestor/director/admin registam pagamentos"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() IN ('gestor_escritorio','director_geral','admin')
    AND registado_por = auth.uid()
  );


-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
-- Inserção só por trigger functions (SECURITY DEFINER) — sem política de INSERT para utilizadores
CREATE POLICY "notifications: destinatário lê as suas"
  ON notifications FOR SELECT TO authenticated
  USING (destinatario_id = auth.uid());

CREATE POLICY "notifications: destinatário marca como lida"
  ON notifications FOR UPDATE TO authenticated
  USING     (destinatario_id = auth.uid())
  WITH CHECK (destinatario_id = auth.uid());


-- ============================================================
-- SEED DATA
-- ============================================================

-- Direcções orgânicas
INSERT INTO direcoes (nome, codigo) VALUES
  ('Direcção Comercial',     'direcao_comercial'),
  ('Direcção de Projectos',  'direcao_projectos'),
  ('Direcção Geral',         'direcao_geral');

-- Limite de aprovação inicial: requisições até 5 000 MZN só precisam do gestor de escritório
INSERT INTO approval_limits (valor_maximo, ativo)
VALUES (5000.00, true);


-- ============================================================
-- COMO CRIAR O PRIMEIRO UTILIZADOR ADMIN
-- ============================================================
--
-- 1. No Supabase Dashboard → Authentication → Users → "Invite User"
--    (ou usar Supabase CLI: supabase auth invite --email admin@yentelelo.co.mz)
--
-- 2. Após o utilizador confirmar o e-mail, o trigger handle_new_user cria
--    automaticamente um perfil com role = 'colaborador'.
--
-- 3. No SQL Editor do Dashboard, promover para admin:
--
--    UPDATE profiles
--    SET role = 'admin'
--    WHERE email = 'admin@yentelelo.co.mz';
--
-- 4. Atribuir direcção (se aplicável):
--
--    UPDATE profiles
--    SET direcao_id = (SELECT id FROM direcoes WHERE codigo = 'direcao_geral')
--    WHERE email = 'admin@yentelelo.co.mz';
--
-- ============================================================
