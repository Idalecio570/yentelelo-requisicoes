-- ============================================================
-- Migração 013: Permite cancelamento via RLS para colaborador,
-- gestor_tics e gestor_escritorio.
--
-- Bug: useCancelRequisition faz UPDATE status='cancelado', mas
-- as políticas UPDATE não incluem 'cancelado' no WITH CHECK
-- (explícito ou implícito). A mudança é bloqueada pelo Postgres.
--
-- Fix: adicionar WITH CHECK explícito que aceita 'cancelado'
-- como novo estado válido para cada role.
-- ============================================================

-- Fix 1: colaborador
-- A política original não tem WITH CHECK → implicit = USING,
-- que avalia o NEW row: status IN ('pendente','devolvido') falha
-- para status='cancelado'. Reescrevemos com WITH CHECK explícito.
DROP POLICY IF EXISTS "req: colaborador edita as suas em pendente/devolvido" ON requisitions;
CREATE POLICY "req: colaborador edita as suas em pendente/devolvido"
  ON requisitions FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'colaborador'
    AND criado_por = auth.uid()
    AND status = ANY(ARRAY['pendente'::text, 'devolvido'::text])
  )
  WITH CHECK (
    get_my_role() = 'colaborador'
    AND criado_por = auth.uid()
    AND status = ANY(ARRAY['pendente'::text, 'cancelado'::text])
  );

-- Fix 2: gestor_tics
-- A política da migração 012 tem WITH CHECK limitado a
-- pendente/devolvido — não permite cancelado.
DROP POLICY IF EXISTS "req: gestor_tics edita as suas em pendente/devolvido" ON requisitions;
CREATE POLICY "req: gestor_tics edita as suas em pendente/devolvido"
  ON requisitions FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'gestor_tics'
    AND criado_por = auth.uid()
    AND status = ANY(ARRAY['pendente'::text, 'devolvido'::text])
  )
  WITH CHECK (
    get_my_role() = 'gestor_tics'
    AND criado_por = auth.uid()
    AND status = ANY(ARRAY['pendente'::text, 'cancelado'::text])
  );

-- Fix 3: gestor_escritorio
-- A política da migração 012 não inclui 'cancelado' no WITH CHECK.
-- Necessário quando o director_geral devolve a requisição e o
-- gestor_escritorio (criador) quer cancelar.
DROP POLICY IF EXISTS "req: gestor_escritorio analisa em pendente/em_analise" ON requisitions;
CREATE POLICY "req: gestor_escritorio analisa em pendente/em_analise"
  ON requisitions FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'gestor_escritorio'
    AND (
      status = ANY(ARRAY['pendente'::text, 'em_analise_escritorio'::text])
      OR (criado_por = auth.uid() AND status = 'devolvido'::text)
    )
  )
  WITH CHECK (
    get_my_role() = 'gestor_escritorio'
    AND status = ANY(ARRAY[
      'pendente'::text, 'em_analise_escritorio'::text,
      'aprovado_escritorio'::text, 'rejeitado'::text,
      'devolvido'::text, 'cancelado'::text
    ])
  );
