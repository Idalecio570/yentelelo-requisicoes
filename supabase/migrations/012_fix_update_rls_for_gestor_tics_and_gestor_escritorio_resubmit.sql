-- ============================================================
-- Migração 012: Corrige políticas UPDATE para gestor_tics e
-- resubmissão de devolvido por gestor_escritorio.
--
-- Bug 1: gestor_tics não tem política UPDATE → não consegue
--   editar requisições devolvidas.
--
-- Bug 2: gestor_escritorio tem WITH CHECK implícito igual ao
--   USING, que bloqueia a mudança devolvido → aprovado_escritorio
--   (with check avalia o novo estado, que não é 'devolvido').
-- ============================================================

-- Fix 1: Adicionar política UPDATE para gestor_tics
CREATE POLICY "req: gestor_tics edita as suas em pendente/devolvido"
  ON requisitions FOR UPDATE
  USING (
    get_my_role() = 'gestor_tics'
    AND criado_por = auth.uid()
    AND status = ANY(ARRAY['pendente'::text, 'devolvido'::text])
  )
  WITH CHECK (
    get_my_role() = 'gestor_tics'
    AND criado_por = auth.uid()
    AND status = ANY(ARRAY['pendente'::text, 'devolvido'::text])
  );

-- Fix 2: Actualizar política UPDATE do gestor_escritorio com
-- WITH CHECK explícito que permite o novo estado aprovado_escritorio
DROP POLICY IF EXISTS "req: gestor_escritorio analisa em pendente/em_analise" ON requisitions;
CREATE POLICY "req: gestor_escritorio analisa em pendente/em_analise"
  ON requisitions FOR UPDATE
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
      'aprovado_escritorio'::text, 'rejeitado'::text, 'devolvido'::text
    ])
  );
