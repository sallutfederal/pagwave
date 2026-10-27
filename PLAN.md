# Planejamento — Dashboard "Greetings / NiroTrip" (clone fiel da referência)

> Objetivo: reproduzir a interface da imagem de referência com **pixel-fidelity**,
> mantendo o código organizado, tipado e preparado para evoluir.

---

## 1. Escopo do que existe na referência

Vamos decompor a tela em blocos rebuildáveis:

| # | Bloco | Descrição |
|---|-------|-----------|
| 1 | **Sidebar (icon rail)** | Faixa escura vertical ~88px, logo "N", ~10 ícones, item ativo com destaque, item "sair" no rodapé |
| 2 | **Topbar** | Avatar + "Greetings! 👋" + subtítulo "Start your day with pagwave"; input de busca (pill cinza); botão "My account ⌄" (pill escuro) |
| 3 | **Section: Cards** | Título + link "See all" à direita |
| 4 | **Bank card (dark)** | Fundo preto com textura/mesh, valor `$ 15,780.0`, `•••• 1810`, validade `10/24`, logo VISA, menu `⋮` |
| 5 | **Bank card (light)** | Fundo branco, valor `₺ 123,424.0`, `•••• 1423`, `10/24`, badge circular (mastercard-like) |
| 6 | **Quick actions** | 4 pills: Transfer (ativo, azul), Utility, Taxes, Transport — ícone circular + label |
| 7 | **Statistic card** | Header "Statistic" + badge `?`, select "This month ⌄"; **donut/arc** com 2 segmentos e valor `$14,810.0` centralizado; label flutuante "Usage" à direita; legenda inferior |
| 8 | **Recent Sales** | Tabela: avatar + nome + email, Date, Status (badge Success/Process/Failed), Amount |
| 9 | **Transactions list** | Cards brancos empilhados: avatar, nome, sub-legenda, valor negativo alinhado à direita |

**Layout alvo:** grid de 12 colunas dentro de um `main` com sidebar fixa.
Col ~8 = cards + tabela; col ~4 = Statistic + transactions.

---

## 2. Stack recomendada

### 2.1 Escolha principal — Next.js 15 (App Router)

| Camada | Tech | Por quê |
|---|---|---|
| Framework | **Next.js 15** (App Router, RSC) | Rotas prontas para evoluir (ex.: `/dashboard`, `/transactions`), SSR, fonts via `next/font`, API routes para mock |
| Linguagem | **TypeScript 5.x** (strict) | Segurança nos contratos dos dados |
| Estilo | **Tailwind CSS v4** (`@theme` no CSS) | Tokens designs direto no CSS, sem config JS; rebuild instantâneo |
| Componentes | **shadcn/ui** (Radix + CVA) | Só o que a gente usa, código no repo; `Select`, `Avatar`, `Badge`, `Tooltip`, `DropdownMenu` já prontos |
| Ícones | **lucide-react** | Mesma família visual do shot (ícones outline ~20px) |
| Dados | **MSW (Mock Service Worker)** ou **Next route handlers** | Dados fake tipados por `zod` schema; troca por API real sem tocar na UI |
| Estado de servidor | **TanStack Query** | Cache/refetch dos blocos "Statistic" e "Transactions" |
| Gráfico | **SVG custom** (o donut é 1 anel com 2 arcos) | Controle total de `stroke-dasharray`/`stroke-linecap`, zero peso, pixel-perfect |
| Temas | **next-themes** | Light/dark готовos (o shot é light com sidebar dark) |
| Utilidades | `clsx` + `tailwind-merge` + `class-variance-authority` | — |
| Qualidade | ESLint, Prettier, `tsc --noEmit` | — |

### 2.2 Alternativa leve — Vite + React 19
Se o objetivo for **só a tela** (SPA, sem rotas nem servidor), `npm create vite@latest -- --template react-ts` entrega o mesmo resultado com ~3x menos boilerplate. Mesmo Tailwind v4 + shadcn/ui.
**Recomendação:** Next.js, porque o dashboard é naturalmente multipágina e o custo extra é pequeno.

### 2.3 Fontes
O shot usa uma grotesca geométrica. Opções gratuitas:
- **Plus Jakarta Sans** (recomendada — próxima do original), **Manrope** ou **Poppins** como alternativa.
- `next/font/google` → zero request extra, antialiasing correto, `font-feature-settings: "ss01","cv11"`.

### 2.4 Ambiente (já validado nesta máquina)
- Node `v24.21.0` ✅ · npm `11.19.0` ✅ · git `2.56.0` ✅ · pnpm ❌ (usar **npm** ou instalar pnpm)

---

## 3. Design tokens (design system)

```
Cores
  --bg-app        #F4F6FA   fundo da página
  --surface       #FFFFFF   cards
  --rail          #0E1117   sidebar (quase preto azulado)
  --rail-icon     #98A2B3   ícone inativo
  --rail-active   #FFFFFF   ícone ativo
  --accent        #3B82F6   azul primário (pills, donut)
  --accent-soft   #EAF1FF   fundo do pill ativo
  --text-strong   #0B1220   títulos / valores
  --text-muted    #8A94A6   labels secundários
  --line          #EEF1F6   bordas 1px
  --success       #16A34A  bg #E9F8EF
  --warning       #F59E0B  bg #FEF4E6
  --danger        #EF4444  bg #FDEBEB

Escala
  raio      card 24px · pill 999px · thumb 999px · inner 16px
  sombra    0 1px 2px rgba(16,24,40,.04), 0 12px 24px -12px rgba(16,24,40,.10)
  grid      12 col · gap 24px · padding main 32px · sidebar 88px
  ícones    20px (nav) · 24px (chips) · 18px (tabela)
```

Texturas e efeitos (SVG/CSS inline, sem asset binário):
- Cartão dark: gradiente radial `#1B2430 → #0B0F14` + **noise via `feTurbulence`** + pontos em `opacity .06`.
- Avatar: `ui-avatars.com` ou SVGs locais (evita dependência de rede em dev).
- Sombras e blur do menu `⋮` conforme o shot.

---

## 4. Estrutura de arquivos planejada

```
dash/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx            # <Sidebar/> <Topbar/> <main>
│  │  ├─ page.tsx              # compose a tela
│  │  ├─ globals.css           # @theme tokens, base, utilities
│  │  └─ api/
│  │     ├─ summary/route.ts   # KPI dos cartões
│  │     ├─ sales/route.ts     # Recent Sales
│  │     └─ transactions/route.ts
│  ├─ components/
│  │  ├─ layout/  sidebar.tsx · topbar.tsx · app-shell.tsx
│  │  ├─ cards/   bank-card.tsx · bank-card-dark.tsx · quick-actions.tsx
│  │  ├─ charts/  donut-chart.tsx  (SVG puro) · legend.tsx
│  │  ├─ sales/   recent-sales.tsx · sales-table.tsx · sales-row.tsx · status-badge.tsx
│  │  ├─ transactions/ transaction-list.tsx · transaction-item.tsx
│  │  └─ ui/      (shadcn: button, card, badge, avatar, select, tooltip, dropdown-menu)
│  ├─ lib/
│  │  ├─ api/       client.ts · hooks.ts (TanStack Query)
│  │  ├─ format.ts  currency · number · date (pt-BR/USD)
│  │  ├─ utils.ts   cn()
│  │  └─ validation/ schemas.ts (zod)
│  ├─ mocks/        data.ts · handlers.ts (MSW) · db.ts
│  └─ types/
├─ public/
├─ tailwind/postcss/next config
├─ .eslintrc · prettier · tsconfig
└─ package.json
```

---

## 5. Dados (mock tipado)

```ts
type BankCard      = { id, variant: 'dark'|'light', label, symbol,
                      balance: number, last4: string, expiry: string, brand: 'visa'|'mastercard' }
type QuickAction   = { id, label, icon, active: boolean }
type Sale          = { id, customer: {name,email,avatar}, date, status: 'Success'|'Process'|'Failed', amount }
type Transaction   = { id, title, subtitle, avatar, amount (negativo), kind }
type Statistic     = { total, segments: [{label, value, color}] }
```

- `zod` valida a resposta; erro → skeleton de fallback (nunca quebrar a tela).
- Toggle `NEXT_PUBLIC_USE_MOCK=1` liga/desliga MSW.

---

## 6. Fases de execução

| Fase | Entrega | Critério de aceite |
|---|---|---|
| **0. Setup** | Scaffold Next 15 + TS strict + Tailwind v4 + shadcn/ui + lint + fontes + tokens | `npm run dev` sobe página em branco com fundo `#F4F6FA` e fonte correta |
| **1. Shell** | Sidebar (rail de ícones, estado ativo, hover), Topbar (avatar, busca, account menu), grid de 12 col | Estrutura geométrica batendo com o shot em 1440×900 |
| **2. Cards** | `BankCard` dark + light (textura, VISA/MC em SVG, menu `⋮`) e `QuickActions` (4 pills) | Cards com mesmas proporções, raios e sombras |
| **3. Statistic** | Card + select "This month" + donut SVG 2 segmentos + valor central + label "Usage" + legenda | Anel com gaps, caps arredondados e ângulos idênticos à referência |
| **4. Recent Sales** | Tabela com cabeçalhos, avatar, data, badge de status colorido, amount | Alinhamento das colunas e cores de status corretos |
| **5. Transactions** | Lista de 5 itens com avatar, título, subtítulo, valor | Espaçamento e alinhamento à direita idênticos |
| **6. Data + Estados** | API mock/zod, skeletons, empty state, formatação de moeda/data pt-BR | Trocar mock por API real sem alterar componente |
| **7. Responsivo + Dark** | ≥1280 layout do shot · 1024 2 col · 768 sidebar→bottom-bar + tabelas empilham · animações sutis · **dark mode** (`next-themes`, tokens `[data-theme]`) | Sem overflow horizontal; contraste AA no dark |
| **7b. Rotas placeholder** | `/dashboard`, `/transactions`, `/cards`, `/settings` com layout compartilhado e sidebar ativa por rota | Navegação da sidebar não dá 404 |
| **8. QA visual** | Playwright: screenshot em 1440×900 e overlay de diff vs imagem de referência | Diff < 5% de pixels divergentes |

**Estimativa:** ~1 a 1,5 dia de trabalho (±, depende do polimento do donut e da textura do cartão dark).

---

## 7. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| "Idêntico" é ambíguo (fonte, textura do cartão dark) | Fixar tokens + screenshot de referência como baseline do Playwright |
| Retrabalho de tokens | Definir `@theme` antes de escrever qualquer componente |
| Dependência de rede (fontes/avatares) | `next/font` + avatares SVG locais |
| Donut "flat" demais | Componente SVG próprio, com `stroke-linecap: round` e gaps calculados |

---

## 8. Decisões fechadas ✅

1. **Framework: Next.js 15** (App Router, RSC, TypeScript strict).
2. **Dados: API mock tipada** — route handlers + schemas `zod` + TanStack Query, com flag
   `NEXT_PUBLIC_USE_MOCK` para trocar por API real sem tocar na UI. Inclui skeletons/erro.
3. **Escopo: tela do print + rotas placeholder + dark mode**
   - Rotas: `/` (redirect → `/dashboard`), `/dashboard` (tela da referência),
     `/transactions`, `/cards`, `/settings` (placeholders com layout compartilhado).
   - Sidebar vira navegação funcional de verdade.
   - Tema light/dark via `next-themes` (light = referência; sidebar permanece escura nos dois).

---

## 9. Como validar

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint
npm run test:visual  # screenshot vs referência
```