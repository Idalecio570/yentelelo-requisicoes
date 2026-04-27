-- ============================================================
-- SEED DE UTILIZADORES DE TESTE — Yentelelo Requisições
-- Executar no SQL Editor do Supabase Dashboard (uma vez)
-- Password de todos os utilizadores: Teste@123
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- SECÇÃO A — CORRECÇÕES DE RLS
-- ═══════════════════════════════════════════════════════════

-- A1. Profiles: permitir leitura por todos (necessário para JOINs)
DROP POLICY IF EXISTS "profiles: ver próprio"                       ON profiles;
DROP POLICY IF EXISTS "profiles: leitura por todos os autenticados" ON profiles;

CREATE POLICY "profiles: leitura por todos os autenticados"
  ON profiles FOR SELECT TO authenticated
  USING (true);


-- A2. Requisitions UPDATE: corrigir WITH CHECK implícito
DROP POLICY IF EXISTS "req: colaborador edita as suas em pendente/devolvido"        ON requisitions;
DROP POLICY IF EXISTS "req: gestor_escritorio analisa em pendente/em_analise"       ON requisitions;
DROP POLICY IF EXISTS "req: director_geral analisa em aprovado/em_analise_director" ON requisitions;
DROP POLICY IF EXISTS "req: admin actualiza todas"                                  ON requisitions;
DROP POLICY IF EXISTS "req: gestor_tics actualiza as suas"                          ON requisitions;

CREATE POLICY "req: colaborador actualiza as suas"
  ON requisitions FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'colaborador'
    AND criado_por = auth.uid()
    AND status NOT IN ('cancelado','rejeitado','aprovado_final')
  )
  WITH CHECK (get_my_role() = 'colaborador' AND criado_por = auth.uid());

CREATE POLICY "req: gestor_tics actualiza as suas"
  ON requisitions FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'gestor_tics'
    AND criado_por = auth.uid()
    AND status NOT IN ('cancelado','rejeitado','aprovado_final')
  )
  WITH CHECK (get_my_role() = 'gestor_tics' AND criado_por = auth.uid());

CREATE POLICY "req: gestor_escritorio analisa em pendente/em_analise"
  ON requisitions FOR UPDATE TO authenticated
  USING (get_my_role() = 'gestor_escritorio' AND status IN ('pendente','em_analise_escritorio'))
  WITH CHECK (get_my_role() = 'gestor_escritorio');

CREATE POLICY "req: director_geral analisa em aprovado/em_analise_director"
  ON requisitions FOR UPDATE TO authenticated
  USING (get_my_role() = 'director_geral' AND status IN ('aprovado_escritorio','em_analise_director'))
  WITH CHECK (get_my_role() = 'director_geral');

CREATE POLICY "req: admin actualiza todas"
  ON requisitions FOR UPDATE TO authenticated
  USING     (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');


-- A3. Approvals SELECT: política única baseada na visibilidade da requisição
DROP POLICY IF EXISTS "approvals: gestor/director/admin/auditor vêem todas"            ON approvals;
DROP POLICY IF EXISTS "approvals: colaborador e gestor_tics vêem das suas requisições" ON approvals;

CREATE POLICY "approvals: acesso por visibilidade da requisição"
  ON approvals FOR SELECT TO authenticated
  USING (can_read_requisition(requisition_id));


-- ═══════════════════════════════════════════════════════════
-- SECÇÃO B — UTILIZADORES DE TESTE
-- Lê os IDs reais das direcções já existentes na tabela
-- ═══════════════════════════════════════════════════════════

DO $$
DECLARE
  uid_admin       UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  uid_colab       UUID := 'aaaaaaaa-0000-0000-0000-000000000002';
  uid_gestor_esc  UUID := 'aaaaaaaa-0000-0000-0000-000000000003';
  uid_dir_com     UUID := 'aaaaaaaa-0000-0000-0000-000000000004';
  uid_dir_proj    UUID := 'aaaaaaaa-0000-0000-0000-000000000005';
  uid_gest_com    UUID := 'aaaaaaaa-0000-0000-0000-000000000006';
  uid_gestor_tics UUID := 'aaaaaaaa-0000-0000-0000-000000000007';
  uid_dir_geral   UUID := 'aaaaaaaa-0000-0000-0000-000000000008';
  uid_auditor     UUID := 'aaaaaaaa-0000-0000-0000-000000000009';

  -- Lê os IDs reais da tabela (criados pela migração com UUIDs aleatórios)
  dir_comercial  UUID;
  dir_projectos  UUID;
  dir_geral      UUID;
  hash           TEXT;
BEGIN
  SELECT id INTO dir_comercial FROM direcoes WHERE codigo = 'direcao_comercial';
  SELECT id INTO dir_projectos FROM direcoes WHERE codigo = 'direcao_projectos';
  SELECT id INTO dir_geral     FROM direcoes WHERE codigo = 'direcao_geral';

  hash := crypt('Teste@123', gen_salt('bf', 10));

  -- Cria utilizadores em auth.users (o trigger cria o profile automaticamente)
  INSERT INTO auth.users (
    instance_id, id, aud, role,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin
  ) VALUES
    ('00000000-0000-0000-0000-000000000000', uid_admin,
     'authenticated', 'authenticated',
     'admin@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"António Silva (Admin)"}'::jsonb, false),

    ('00000000-0000-0000-0000-000000000000', uid_colab,
     'authenticated', 'authenticated',
     'colaborador@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"Maria João"}'::jsonb, false),

    ('00000000-0000-0000-0000-000000000000', uid_gestor_esc,
     'authenticated', 'authenticated',
     'gestor.escritorio@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"Carlos Machava"}'::jsonb, false),

    ('00000000-0000-0000-0000-000000000000', uid_dir_com,
     'authenticated', 'authenticated',
     'director.comercial@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"Fátima Nhamissane"}'::jsonb, false),

    ('00000000-0000-0000-0000-000000000000', uid_dir_proj,
     'authenticated', 'authenticated',
     'director.projectos@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"João Cossa"}'::jsonb, false),

    ('00000000-0000-0000-0000-000000000000', uid_gest_com,
     'authenticated', 'authenticated',
     'gestor.comercial@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"Sónia Nhantumbo"}'::jsonb, false),

    ('00000000-0000-0000-0000-000000000000', uid_gestor_tics,
     'authenticated', 'authenticated',
     'gestor.tics@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"Paulo Sitoe"}'::jsonb, false),

    ('00000000-0000-0000-0000-000000000000', uid_dir_geral,
     'authenticated', 'authenticated',
     'director.geral@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"Eduardo Mondlane Jr."}'::jsonb, false),

    ('00000000-0000-0000-0000-000000000000', uid_auditor,
     'authenticated', 'authenticated',
     'auditor@yentelelo.co.mz', hash, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"nome_completo":"Graça Simango"}'::jsonb, false)
  ON CONFLICT (id) DO NOTHING;

  -- Actualiza roles e direcções nos profiles
  UPDATE profiles SET role = 'admin'                                           WHERE id = uid_admin;
  UPDATE profiles SET role = 'colaborador',        direcao_id = dir_comercial WHERE id = uid_colab;
  UPDATE profiles SET role = 'gestor_escritorio'                               WHERE id = uid_gestor_esc;
  UPDATE profiles SET role = 'director_comercial', direcao_id = dir_comercial WHERE id = uid_dir_com;
  UPDATE profiles SET role = 'director_projectos', direcao_id = dir_projectos WHERE id = uid_dir_proj;
  UPDATE profiles SET role = 'gestor_comercial',   direcao_id = dir_comercial WHERE id = uid_gest_com;
  UPDATE profiles SET role = 'gestor_tics'                                     WHERE id = uid_gestor_tics;
  UPDATE profiles SET role = 'director_geral',     direcao_id = dir_geral     WHERE id = uid_dir_geral;
  UPDATE profiles SET role = 'auditor'                                         WHERE id = uid_auditor;

END $$;


-- ═══════════════════════════════════════════════════════════
-- SECÇÃO C — FORNECEDORES E REQUISIÇÕES DE TESTE
-- ═══════════════════════════════════════════════════════════

INSERT INTO entities (nome, tipo, nuit, email, telefone) VALUES
  ('Papelaria Central, Lda.', 'empresa',    '400123456', 'geral@papelcentral.co.mz', '+258 21 300 100'),
  ('Techsource Moçambique',   'empresa',    '400789012', 'info@techsource.co.mz',    '+258 84 500 200'),
  ('João Alfredo Nhapossa',   'individual',  NULL,        NULL,                       '+258 86 100 300')
ON CONFLICT (nuit) DO NOTHING;

DO $$
DECLARE
  uid_colab       UUID := 'aaaaaaaa-0000-0000-0000-000000000002';
  uid_gestor_tics UUID := 'aaaaaaaa-0000-0000-0000-000000000007';
  dir_comercial   UUID;
  dir_geral       UUID;
BEGIN
  SELECT id INTO dir_comercial FROM direcoes WHERE codigo = 'direcao_comercial';
  SELECT id INTO dir_geral     FROM direcoes WHERE codigo = 'direcao_geral';

  -- Req 1: compra acima do limite → precisa aprovação em 2 níveis
  INSERT INTO requisitions (
    titulo, descricao, tipo, urgencia, valor_estimado,
    status, criado_por, direcao_id, orcamentos
  ) VALUES (
    'Compra de material de escritório — Q2 2026',
    'Papel A4, canetas, pastas e consumíveis.',
    'compra', 'normal', 12500.00,
    'pendente', uid_colab, dir_comercial,
    '[{"fornecedor":"Papelaria Central, Lda.","valor":12500,"notas":"Válido 30 dias","anexo_url":null},
      {"fornecedor":"Distribuidora Nacional","valor":13800,"notas":"Inclui entrega","anexo_url":null}]'::jsonb
  );

  -- Req 2: serviço urgente abaixo do limite → aprovado_final em 1 passo
  INSERT INTO requisitions (
    titulo, descricao, tipo, urgencia, valor_estimado,
    status, criado_por, direcao_id
  ) VALUES (
    'Reparação de portátil — urgente',
    'Substituição de teclado e bateria.',
    'servico', 'urgente', 3500.00,
    'pendente', uid_gestor_tics, dir_geral
  );

  -- Req 3: servidor, valor elevado, muito urgente
  INSERT INTO requisitions (
    titulo, descricao, tipo, urgencia, valor_estimado,
    status, criado_por, direcao_id
  ) VALUES (
    'Servidor para datacenter interno',
    '128GB RAM, 8TB storage, virtualização de serviços.',
    'compra', 'muito_urgente', 185000.00,
    'pendente', uid_gestor_tics, dir_geral
  );
END $$;


-- ═══════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════

SELECT
  p.email,
  p.role,
  p.nome_completo,
  COALESCE(d.nome, '(sem direcção)') AS direcao
FROM profiles p
LEFT JOIN direcoes d ON d.id = p.direcao_id
WHERE p.email LIKE '%@yentelelo.co.mz'
ORDER BY p.role, p.email;
