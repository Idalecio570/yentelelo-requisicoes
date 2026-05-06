# Yentelelo — Sistema de Requisições

## Projecto
Sistema interno de gestão de requisições de compra/serviço para a Yentelelo Group (comunicação e formação, Maputo, Moçambique). Aproximadamente 20 utilizadores. Deploy em VPS Turbo Host via Nginx + Supabase Cloud.

## Stack
- Frontend: React 18 + Vite 5 + TypeScript
- Estilos: Tailwind CSS v3 + shadcn/ui (tema zinc)
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- State: TanStack Query v5
- Forms: React Hook Form + Zod
- Routing: React Router v6
- Deploy: Nginx (VPS) + GitHub Actions CI/CD

## Roles

| Role | Acesso |
|---|---|
| colaborador | Cria requisições; vê só as suas |
| gestor_escritorio | 1.º nível de aprovação — recebe TODAS as requisições |
| director_comercial | Visibilidade das requisições da Direcção Comercial |
| director_projectos | Visibilidade das requisições da Direcção de Projectos |
| gestor_comercial | Visibilidade das requisições da Direcção Comercial |
| gestor_tics | Sem direcção; cria e vê só as suas requisições |
| director_geral | 2.º e último nível de aprovação |
| admin | Acesso total |
| auditor | Leitura global |

## Direcções
- direcao_comercial
- direcao_projectos
- direcao_geral

## Fluxo de Aprovação
pendente → [gestor_escritorio analisa] → aprovado_escritorio → [director_geral analisa] → aprovado_final
Qualquer nível pode rejeitar ou devolver. Quando devolvida, o colaborador edita e ressubmete (estados limpam-se).

## Estados das Requisições
pendente, em_analise_escritorio, aprovado_escritorio, em_analise_director, aprovado_final, rejeitado, cancelado, devolvido

## Módulos do Sistema
1. Autenticação e gestão de perfis
2. Requisições (compra/serviço) com anexos
3. Fluxo de aprovação em 2 níveis
4. Gestão de fornecedores
5. Pagamentos por prestações
6. Notificações in-app + email (Resend via Edge Functions)
7. Dashboard personalizado por role
8. Timeline visual por requisição
9. Orçamentos comparativos (até 3 por requisição)
10. Templates de requisição
11. Limites de valor configuráveis (admin)
12. Comentários em thread por requisição
13. Relatórios exportáveis PDF/Excel

## Convenções
- UI inteiramente em Português (pré-AO90)
- Moeda: MZN
- Datas: dd/MM/yyyy
- Componentes: PascalCase
- Hooks e funções: camelCase
- Tabelas DB: snake_case, plural
- IDs: UUID v4
- NUNCA expor service_role key no frontend
- Usar sempre RLS — zero acesso sem política activa
- Queries via TanStack Query com chaves de cache padronizadas
- Formulários via React Hook Form + Zod, sempre com validação client-side

## Verificação e Testes

### Automático (hook PostToolUse)
Após cada edição a ficheiros `.ts` / `.tsx`, o hook corre automaticamente:
```
npx tsc --noEmit
```
Zero erros TypeScript é obrigatório antes de qualquer commit.

### Build de produção
```bash
npm run build   # tsc -b + vite build — deve completar sem erros
```

### Servidor local
```bash
npm run dev     # http://localhost:5173
```

### Fluxos críticos a verificar manualmente
1. **Login / Logout** — autenticação com conta real Supabase
2. **Criar requisição** — wizard 3 passos; testar com todos os roles (colaborador, gestor_escritorio, gestor_tics)
3. **Aprovação nível 1** — gestor_escritorio aprova/devolve/rejeita
4. **Aprovação nível 2** — director_geral aprova/devolve/rejeita
5. **Criar utilizador** — admin cria conta via edge function `create-user`
6. **Refresh de página** — qualquer rota deve carregar sem erro 500

### Casos limite a validar
- Utilizador sem `direcao_id` a criar requisição → deve ver selector de direcção
- Perfil não encontrado após login → mensagem clara, botão de logout
- Formulários com dados inválidos → mensagens de erro Zod visíveis
- Token de sessão expirado → redireccionamento para /login sem loop
