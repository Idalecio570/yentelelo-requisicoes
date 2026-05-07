-- ============================================================
-- Migração 009: Corrige RLS de requisition_items para gestor_escritorio
-- As políticas verificavam status IN ('pendente','devolvido','rascunho').
-- Quando gestor_escritorio cria uma requisição, o trigger muda o status
-- para 'aprovado_escritorio' antes dos itens serem inseridos — bloqueando
-- o INSERT de itens. Adiciona-se a excepção para este caso.
-- ============================================================

DROP POLICY IF EXISTS "items_insert" ON requisition_items;
CREATE POLICY "items_insert" ON requisition_items FOR INSERT
  WITH CHECK (
    requisition_id IN (
      SELECT id FROM requisitions
      WHERE criado_por = auth.uid()
        AND (
          status = ANY (ARRAY['pendente', 'devolvido', 'rascunho'])
          OR (status = 'aprovado_escritorio' AND get_my_role() = 'gestor_escritorio')
        )
    )
  );

DROP POLICY IF EXISTS "items_update" ON requisition_items;
CREATE POLICY "items_update" ON requisition_items FOR UPDATE
  USING (
    requisition_id IN (
      SELECT id FROM requisitions
      WHERE criado_por = auth.uid()
        AND (
          status = ANY (ARRAY['pendente', 'devolvido', 'rascunho'])
          OR (status = 'aprovado_escritorio' AND get_my_role() = 'gestor_escritorio')
        )
    )
  );

DROP POLICY IF EXISTS "items_delete" ON requisition_items;
CREATE POLICY "items_delete" ON requisition_items FOR DELETE
  USING (
    requisition_id IN (
      SELECT id FROM requisitions
      WHERE criado_por = auth.uid()
        AND (
          status = ANY (ARRAY['pendente', 'devolvido', 'rascunho'])
          OR (status = 'aprovado_escritorio' AND get_my_role() = 'gestor_escritorio')
        )
    )
  );
