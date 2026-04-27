# Handoff: Yentelelo Requisições — Sistema Web Interno

> Pacote de handoff para implementação em código real.
> **Stack alvo:** React 18 + TypeScript + Tailwind CSS + shadcn/ui + Vite (ou Next.js)
> **Idioma da UI:** Português (pt-MZ)

---

## Sobre os ficheiros deste bundle

Os ficheiros neste pacote são **referências de design** criadas em HTML/JSX simples — protótipos que demonstram o **aspecto visual e o comportamento** pretendidos. **Não são código de produção** para copiar directamente.

A sua tarefa é **recriar este design em React + Tailwind + shadcn/ui**, seguindo as convenções do seu codebase. Use os tokens, componentes e fluxos descritos abaixo como especificação.

## Fidelidade

**Alta fidelidade (hifi)** — cores, tipografia, espaçamento, raios e estados estão finalizados. Implemente pixel-perfect usando shadcn/ui como base, ajustando os tokens conforme a secção "Design Tokens".

---

## 1. Identidade visual

A paleta deriva da marca **Yentelelo Comunicações** (extraída do PDF oficial):

| Cor          | Hex       | Uso                                             |
|--------------|-----------|-------------------------------------------------|
| Navy         | `#002C62` | Cor primária — sidebar, botão primário, headings, valores monetários, estado "aprovação final" |
| Vermelho     | `#EF2627` | **Apenas** destrutivo (rejeitar) e prioridade alta |
| Dourado      | `#FCC631` | Acentos discretos — avatar do utilizador autenticado, dot do badge "aprovação final" |
| Cinza claro  | `#EFEFF1` | Surface secundária |
| Slate        | `#A9B6C7` | Bordas, texto auxiliar |

**Princípio:** sistema **minimalista e pouco colorido**. O navy domina; vermelho e dourado aparecem com parcimónia.

---

## 2. Design Tokens

### Cores (mapear para `tailwind.config.ts`)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          navy:    '#002C62',
          'navy-700': '#003A7A',
          'navy-600': '#00498F',
          red:     '#EF2627',
          gold:    '#FCC631',
        },
        // Neutrais
        bg:        '#FAFAFA',
        surface:   '#FFFFFF',
        'surface-2': '#F5F6F8',
        border:    '#E6E8EC',
        'border-strong': '#D5D9E0',
        text:      '#0F172A',
        'text-2':  '#475569',
        'text-3':  '#94A3B8',
        // Estados
        status: {
          'pendente-bg':   '#F1F2F5', 'pendente-fg':   '#475569', 'pendente-dot':   '#94A3B8',
          'analise-bg':    '#EEF2F7', 'analise-fg':    '#1E40AF', 'analise-dot':    '#3B6FB6',
          'aprov1-bg':     '#ECF4EF', 'aprov1-fg':     '#2F6B47', 'aprov1-dot':     '#4F9970',
          'director-bg':   '#F0EFF7', 'director-fg':   '#4C3F8F', 'director-dot':   '#7967C7',
          'final-bg':      '#002C62', 'final-fg':      '#FFFFFF', 'final-dot':      '#FCC631',
          'rejeitado-bg':  '#FBECEC', 'rejeitado-fg':  '#B0211F', 'rejeitado-dot':  '#EF2627',
          'devolvido-bg':  '#FBF3E6', 'devolvido-fg':  '#8A5A0B', 'devolvido-dot':  '#D4A02A',
          'cancelado-bg':  '#F1F2F5', 'cancelado-fg':  '#94A3B8', 'cancelado-dot':  '#CBD5E1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
      boxShadow: {
        '1': '0 1px 2px rgba(15,23,42,.04), 0 0 0 1px rgba(15,23,42,.04)',
        '2': '0 4px 16px -4px rgba(15,23,42,.08), 0 0 0 1px rgba(15,23,42,.05)',
      },
    }
  }
}
```

### Mapeamento para CSS variables do shadcn/ui (`globals.css`)

```css
@layer base {
  :root {
    --background: 0 0% 98%;        /* #FAFAFA */
    --foreground: 222 47% 11%;     /* #0F172A */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --primary: 213 100% 19%;       /* #002C62 navy */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;      /* #F5F6F8 */
    --secondary-foreground: 215 20% 35%;
    --muted: 220 14% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 220 14% 96%;
    --destructive: 0 84% 54%;      /* #EF2627 */
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;         /* #E6E8EC */
    --input: 220 13% 88%;
    --ring: 213 100% 19%;
    --radius: 0.375rem;            /* 6px */
  }
}
```

### Tipografia

| Token       | Tamanho | Peso | Uso                                 |
|-------------|---------|------|--------------------------------------|
| display     | 28px    | 600  | Logins, headings hero (cor: navy)    |
| h1          | 22px    | 600  | Título de página                     |
| h2          | 16px    | 600  | Título de card                       |
| h3 (eyebrow)| 13px    | 600  | UPPERCASE, letter-spacing 0.06em     |
| body        | 14px    | 400  | Texto corrente                       |
| meta        | 12px    | 400  | Datas, ajudas, captions              |
| tiny        | 11px    | 500  | UPPERCASE, labels de secção          |
| mono        | —       | —    | Geist Mono, tabular-nums, para códigos REQ-... e MZN |

`letter-spacing: -0.015em` em h1/display. `font-feature-settings: 'cv11', 'ss01'` em body.

### Espaçamento e raios

- Base: múltiplos de 4 (4, 8, 12, 16, 20, 24, 32)
- Padding interno de cards: `20px`
- Padding interno de página: `28px 32px 40px`
- Raio padrão: `6px` (`rounded-md`); cards: `10px` (`rounded-lg`); pills: `999px`
- Hairlines, NÃO sombras pesadas. Borda 1px `#E6E8EC` é o estilo dominante.

---

## 3. Layout & shell

```
┌────────────┬─────────────────────────────────────────┐
│            │  Topbar (56px) — search + actions       │
│  Sidebar   ├─────────────────────────────────────────┤
│  (232px)   │                                         │
│  navy bg   │  Page (overflow-auto)                   │
│            │  • PageHead (crumb + h1 + actions)      │
│  brand     │  • content                              │
│  + nav     │                                         │
│  + user    │                                         │
└────────────┴─────────────────────────────────────────┘
```

### Sidebar (`<aside>` — 232px wide, `bg-brand-navy`, `text-white/85`)
- Brand block: monograma 28px + "Yentelelo / REQUISIÇÕES"
- Secção "GERAL": Dashboard, Requisições (badge "24"), Aprovações (badge "7" se gestora/director), Fornecedores, Pagamentos, Relatórios
- Secção "SISTEMA" (apenas admin): Administração, Utilizadores
- Footer fixo: avatar dourado + nome + role + botão logout
- Item activo: `bg-white/10`; hover: `bg-white/6`
- Badges: `bg-brand-gold text-[#3a2c00]`

### Topbar
- Search input full-width até max 420px com ícone à esquerda, fundo `surface-2`, border `border`
- Acções à direita: **Btn primary "Nova requisição"**, sino com dot vermelho, ajuda

---

## 4. Estados de Requisição (8 badges)

Componente `<StatusPill status={...} />` — pill 22px com dot 6px + label.

| `status`    | Label                          | bg          | fg          | dot         |
|-------------|--------------------------------|-------------|-------------|-------------|
| `pendente`  | Pendente                       | `#F1F2F5`   | `#475569`   | `#94A3B8`   |
| `analise`   | Em análise (Escritório)        | `#EEF2F7`   | `#1E40AF`   | `#3B6FB6`   |
| `aprov1`    | Aprovado (Escritório)          | `#ECF4EF`   | `#2F6B47`   | `#4F9970`   |
| `director`  | Em análise (Director)          | `#F0EFF7`   | `#4C3F8F`   | `#7967C7`   |
| `final`     | Aprovação final                | `#002C62`   | `#FFFFFF`   | `#FCC631`   |
| `rejeitado` | Rejeitado                      | `#FBECEC`   | `#B0211F`   | `#EF2627`   |
| `devolvido` | Devolvido                      | `#FBF3E6`   | `#8A5A0B`   | `#D4A02A`   |
| `cancelado` | Cancelado                      | `#F1F2F5`   | `#94A3B8`   | `#CBD5E1`   |

> O estado `final` é o **único** com fundo sólido navy + dot dourado — é o "estado de honra" e usa a paleta da marca.

Implementar como variante de `<Badge>` shadcn:
```tsx
<Badge className="bg-status-aprov1-bg text-status-aprov1-fg gap-1.5 pl-2 pr-2.5 h-5.5 font-medium">
  <span className="w-1.5 h-1.5 rounded-full bg-status-aprov1-dot" />
  Aprovado (Escritório)
</Badge>
```

---

## 5. Iconografia

Usar **lucide-react** (já familiar ao shadcn). Stroke padrão **1.6**, rounded line caps. Tamanho default 16px, 14px em botões `sm`.

| Módulo / acção          | Ícone Lucide        |
|-------------------------|---------------------|
| Dashboard               | `Home`              |
| Requisições             | `FileText`          |
| Aprovações              | `CheckCheck`        |
| Fornecedores            | `Building2`         |
| Pagamentos              | `CreditCard`        |
| Relatórios              | `BarChart3`         |
| Administração           | `Settings`          |
| Utilizadores            | `Users`             |
| Nova / Adicionar        | `Plus`              |
| Aprovar                 | `Check`             |
| Rejeitar / Fechar       | `X`                 |
| Devolver                | `RotateCcw`         |
| Ver detalhe             | `Eye`               |
| Editar                  | `Pencil`            |
| Apagar                  | `Trash2`            |
| Exportar                | `Download`          |
| Anexar                  | `Paperclip`         |
| Submeter                | `Send`              |
| Notificações            | `Bell`              |
| Procurar                | `Search`            |
| Filtros                 | `Filter`            |
| Ajuda                   | `HelpCircle`        |
| Mais opções             | `MoreHorizontal`    |

---

## 6. Páginas / ecrãs

### 6.1 Login
- Centrado, card com largura 420px, fundo `bg`
- Monograma 48px topo
- "Yentelelo Requisições" em h1
- Inputs: email, password
- Botão primário full-width "Entrar"
- Link discreto "Esqueci a password"

### 6.2 Dashboard (por papel)

**Layout:** PageHead + grid 4 stat-tiles + grid `2fr 1fr` (tabela recentes + sidebar com donut + nota informativa)

**Stat tile:**
- Label uppercase 11.5px text-2
- Valor 28px peso 600 navy
- Sub 12px text-2

**Para colaborador:** "Minhas requisições", "Em aprovação", "Aprovadas (mês)", "Valor solicitado"
**Para gestora:** trocar para fila pendente + SLA em risco
**Para director:** as suas pendências + estatísticas do departamento

### 6.3 Lista de requisições
- PageHead com filtros (Filtros, Exportar, Nova)
- Tabs com contador: Todas / Pendentes / Em análise / Aprovadas / Rejeitadas
- Tab activa: borda inferior 2px navy, badge contador navy
- Tabela em `<Card>` com header background `surface-2`
- Colunas: checkbox / código (mono) / descrição (título + categoria·dept) / solicitante (avatar+nome) / estado (pill) / valor (mono, right) / data / menu
- Linha clicável → detalhe; hover `surface-2`
- Prioridade alta = dot vermelho 6px junto ao código
- Paginação: "1–10 de 24" + botões

### 6.4 Detalhe da requisição
- Strip de 4 colunas: Código / Estado / Valor total / Prazo
- Layout `2fr 1fr`:
  - **Esquerda:** tabela de itens com totalizadores (subtotal/IVA 16%/total) → justificação com anexos → comentários com input
  - **Direita:** Pessoas (solicitante, dept, aprovadores 1º e 2º nível), Fornecedor (com KPIs), **Cadeia de aprovação** (timeline vertical com dots: verde=feito, navy=actual com glow, cinza=pendente)
- Acções no header: Voltar, PDF, Devolver, Rejeitar (vermelho), **Aprovar** (primário)

### 6.5 Wizard de criação (3 passos)
- Stepper horizontal no topo, dot 28px (navy=actual, verde com check=feito, cinza=pendente)
- Layout `1fr 320px`: form principal + side panel sticky com Resumo (categoria, dept, itens, subtotal, IVA, total) + botões Continuar/Voltar + alert dourado sobre limite de aprovação
- **Passo 1 — Detalhes:** título, categoria, departamento, prioridade (segmented control 3 opções), prazo, justificação
- **Passo 2 — Itens & fornecedor:** tabela editável de linhas (descrição, qtd, unidade, preço, subtotal) + grid de cards de fornecedor (selecionado tem borda navy + ring 3px)
- **Passo 3 — Revisão:** cada secção como bloco com eyebrow uppercase + checkbox de confirmação no fundo + botão final "Submeter requisição"

### 6.6 Fila de aprovações (Gestora/Director)
- 4 stat tiles: Pendentes / SLA em risco (vermelho) / Aprovadas hoje / Valor em fila
- Lista de cards horizontais (não tabela) — cada card:
  - Avatar + (código mono + estado pill + se prioridade alta: pill vermelho)
  - Título grande + meta (autor · dept · data)
  - À direita: valor em mono navy + grupo de 4 botões (Ver, Devolver, Rejeitar, Aprovar)

### 6.7 Outros (esboçar com mesmo sistema)
- **Fornecedores:** lista com card por fornecedor (ícone building, NUIT, cidade, contadores)
- **Pagamentos:** tabela de prestações com progresso por requisição
- **Relatórios:** grid de gráficos (donut, barras, linha) com filtro de período + Exportar
- **Administração:** tabs (Utilizadores / Templates / Limites) + tabelas CRUD
- **Perfil:** cabeçalho com avatar grande + 3 secções (dados, segurança, notificações)

---

## 7. Comportamento e interacções

- **Navegação:** sidebar manda sempre; itens com badge mostram contagens em tempo real
- **Pesquisa global:** topbar — debounced 300ms, abre dropdown com 3 secções (Requisições, Fornecedores, Pessoas)
- **Submissão de requisição:**
  1. Submeter → POST → cria com status `pendente` → notifica Gestora
  2. Gestora pode: Aprovar (→ `aprov1` ou `director` se valor > 50.000 MZN) / Devolver (→ `devolvido`, autor edita e re-submete) / Rejeitar (→ `rejeitado`, terminal)
  3. Director: Aprovar (→ `final`) / Rejeitar
- **Limite de aprovação:** valores acima de **MZN 50.000** exigem Director Geral (regra configurável em Admin)
- **Validação de form:** mostrar erros inline abaixo do input em vermelho, 12px
- **Estados de loading:** Skeleton (shadcn) nas tabelas e cards durante fetch
- **Estados vazios:** ilustração simples (placeholder cinza), título e botão CTA centrados
- **Toasts (sonner):** sucesso=navy, erro=vermelho, info=cinza
- **Animações:** transições 120ms ease em hover; entrada de modal/sheet 180ms ease-out
- **Responsivo:** colapsar sidebar para drawer abaixo de 1024px; tabelas → cards empilhados

---

## 8. State management & dados

- **Auth + role:** Zustand ou Context — guarda `{ user, role: 'colaborador' | 'gestora' | 'director' | 'dg' | 'admin' }`
- **Server state:** TanStack Query para requisições, fornecedores, aprovações
- **Form:** React Hook Form + Zod
- **Routing:** React Router (`/dashboard`, `/requisicoes`, `/requisicoes/:id`, `/requisicoes/nova`, `/aprovacoes`, `/fornecedores`, `/pagamentos`, `/relatorios`, `/admin/*`, `/perfil`)
- **i18n:** strings em pt-MZ, formatação de moeda `Intl.NumberFormat('pt-MZ', { style:'currency', currency:'MZN' })` ou helper `MZN(n)` (ver `components/data.jsx`)

### Modelo de Requisição (sugestão)

```ts
type Status = 'pendente'|'analise'|'aprov1'|'director'|'final'|'rejeitado'|'devolvido'|'cancelado';
type Prioridade = 'baixa'|'normal'|'alta';

interface Requisicao {
  id: string;              // "REQ-2026-0148"
  titulo: string;
  categoria: string;
  departamento: string;
  autorId: string;
  fornecedorId?: string;
  itens: { descricao:string; quantidade:number; unidade:string; precoUnit:number }[];
  justificacao: string;
  anexos: { nome:string; url:string; tamanho:number }[];
  prioridade: Prioridade;
  prazo: string;           // ISO date
  status: Status;
  historico: { quem:string; acao:string; quando:string; comentario?:string }[];
  comentarios: { autorId:string; texto:string; quando:string }[];
  valorTotal: number;      // calculado
  criadoEm: string;
  atualizadoEm: string;
}
```

---

## 9. Assets

- **Monograma Yentelelo** (`brand/YENTELELO GROUP MONOGRAMA.pdf`) — círculo navy/dourado/vermelho. Pedir ao cliente versão SVG ou converter o PDF a SVG. Como fallback, ver `components/primitives.jsx` → componente `<Mono>` reproduz a forma com SVG inline (4 círculos concêntricos).
- **Fontes:** Google Fonts — Inter (400/450/500/600/700) + Geist Mono (400/500/600)

---

## 10. Ficheiros incluídos neste pacote

| Ficheiro | O que é |
|----------|---------|
| `Yentelelo Requisicoes.html` | Protótipo principal — abrir no browser para navegar todos os ecrãs |
| `styles.css` | Tokens e classes utilitárias do design system (referência) |
| `components/primitives.jsx` | Icon, Mono, StatusPill, Avatar, Btn |
| `components/shell.jsx` | Sidebar, Topbar, PageHead |
| `components/dashboard.jsx` | Dashboard + gráficos (Spark, MiniBars, Donut) |
| `components/lista.jsx` | Lista com tabs e tabela |
| `components/detalhe.jsx` | Detalhe completo + timeline de aprovação |
| `components/wizard.jsx` | Wizard 3 passos |
| `components/aprovacoes.jsx` | Fila de aprovações |
| `components/data.jsx` | Mock data + helper `MZN()` |
| `brand/YENTELELO GROUP MONOGRAMA.pdf` | Monograma oficial |
| `design-canvas.jsx`, `tweaks-panel.jsx` | Apenas para visualização do protótipo (NÃO portar) |

---

## 11. Prompt sugerido para Claude Code

> "Implementa o sistema **Yentelelo Requisições** em React 18 + TypeScript + Vite + Tailwind + shadcn/ui, seguindo o `README.md` deste pacote. Começa por:
> 1. Configurar `tailwind.config.ts` e `globals.css` com os tokens da secção 2.
> 2. Criar o shell (`<AppLayout>` com Sidebar + Topbar) seguindo a secção 3.
> 3. Criar o componente `<StatusPill>` cobrindo os 8 estados da secção 4.
> 4. Implementar o Dashboard, a Lista de requisições e o Detalhe (secções 6.2–6.4) com mock data inspirada em `components/data.jsx`.
> 5. Implementar o Wizard e a Fila de aprovações.
>
> Mantém pixel-fidelity ao HTML de referência. Usa lucide-react, Inter e Geist Mono. Português pt-MZ em toda a UI. Moeda: MZN."

---

**Pronto a implementar.**
