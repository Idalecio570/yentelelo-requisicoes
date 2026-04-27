-- Migration 003: Corrige RLS de profiles para permitir JOINs em queries de requisições
-- O problema: a política anterior restringia a leitura de profiles só ao próprio ou admin/auditor,
-- o que impedia gestor_escritorio e director_geral de ver o nome do criador numa requisição.

-- Remove política restritiva
DROP POLICY IF EXISTS "profiles: ver próprio" ON profiles;

-- Substitui por leitura global para todos os autenticados
-- (app interna ~20 utilizadores; email/role são dados não-sensíveis no contexto)
CREATE POLICY "profiles: leitura por todos os autenticados"
  ON profiles FOR SELECT TO authenticated
  USING (true);
