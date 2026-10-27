# Planejamento — Landing Page "pagwave"

> Página de apresentação do próprio dashboard: mostra o que existe, por que foi construído
> assim e leva o visitante até `/dashboard`.
> **Nenhuma linha de código desta página é executada durante o planejamento.**

---

## 1. Decisões fechadas (o plano escolhe, você revisa)

| Tema | Decisão | Justificativa |
|---|---|---|
| **Linguagem do copy** | **Inglês** | O produto inteiro é em inglês (sidebar, tabelas, badges). Copy em português num site em inglês soa quebrado. Todo o texto vive em **um único arquivo** (`src/lib/landing-copy.ts`) com tipo `LandingCopy`, então trocar para PT-BR é substituir esse arquivo. |
| **Direção visual** | **Dark premium** com gradientes suaves | O app tem sidebar preta e acento azul; a landing em dark cria contraste e faz o dashboard (claro) virar o objeto de interesse. |
| **Tom de voz** | Direto e técnico | Frases curtas, sem jargão de marketing vazio. Números concretos em vez de adjetivos. |
| **Rota** | `/` (raiz), via route group `(marketing)` | Substitui o redirect atual de `/` → `/dashboard`. O app continua em `/dashboard` e em `/…`. Landing e app não compartilham layout. |
| **Tema da landing** | Fixo em dark, **independente** do toggle do app | Tokens próprios (`--landing-*`); trocar tema no dashboard não embaralha a landing. |

---

## 2. Stack da landing

Tudo já instalado no projeto, **menos duas libs**:

| Papel | Lib | Motivo |
|---|---|---|
| Animações de scroll e microinterações | **`motion`** (o ex-framer-motion, `motion/react`) | `whileInView` para reveals, `useScroll` + `useTransform` para parallax, `useSpring` para suavidade, `useReducedMotion` para acessibilidade. É o padrão do ecossistema React e pesa menos que GSAP. |
| Scroll suave (smooth scroll) | **`lenis`** | Spooky-smooth que faz o parallax "grudar". ~2 kB. Integra com `motion` via `lenis.on("scroll", scrollHandler)`. **Desligado** quando `prefers-reduced-motion` está ativo. |
| Empacotamento da página | **`@motionone/dom`** (vem junto com `motion`) | Animações declarativas curtas dentro dos componentes. |
| Ícones | `lucide-react` (já instalado) | — |
| Tokens/CSS | **Tailwind v4** + CSS puro em `globals.css` | Sem nenhuma imagem: gradientes, Patterns e grão são CSS/SVG. |
| Tipografia | `next/font/google` | Auto-hospedado, zero request externo, sem CLS. |

**Não vamos usar:** GSAP/ScrollTrigger (peso demais para o que precisamos), framer de 3D
(`@react-three/drei`, ~600 kB), Lottie, carrossel de libs.

Orçamento de performance: **JS da landing < 120 kB gzip** além do app; **0 imagens**;
LCP < 2,0 s em 4G.

---

## 3. Tipografia

| Papel | Fonte | Aplicação |
|---|---|---|
| **Display / headlines** | **Sora** (700/600) | Geométrica, levemente técnica — passa "fintech" sem ser genérica. É o rosto da landing. |
| **Corpo / UI** | **Inter** (400/500) | Máxima legibilidade em texto corrido e números. |
| **Números / código** | `ui-monospace` (fallback do sistema) | Métricas, snippets, `•1810`, rotas de API. |

O app continua em **Plus Jakarta Sans** (contexto diferente, sem conflito).

### Escala fluida (clamp)

```css
--lh-display: clamp(2.75rem, 1.2rem + 6.5vw, 5.5rem);   /* 44 → 88px */
--lh-h2:      clamp(2rem, 1.2rem + 3.2vw, 3.25rem);
--lh-h3:      clamp(1.25rem, 1.05rem + 0.8vw, 1.5rem);
--lh-lead:    clamp(1.05rem, 0.98rem + 0.35vw, 1.25rem);
--lh-body:    1rem;   /* 16px, line-height 1.65 */
--lh-small:   0.875rem;
--lh-eyebrow: 0.75rem;  /* uppercase, tracking 0.16em */
```

Regras: display com `letter-spacing: -0.03em` e `line-height: 0.98`; corpo com
`text-wrap: balance` nas headlines e `text-wrap: pretty` nos parágrafos; números sempre com
`font-variant-numeric: tabular-nums`.

---

## 4. Backgrounds e texturas (zero assets)

Todos em CSS/SVG, definidos em `globals.css` sob o prefixo `--landing-`:

| Efeito | Implementação | Onde |
|---|---|---|
| **Aurora blobs** | 3 `radial-gradient` desfocados com `filter: blur(80px)`, cores do acento, `opacity .5` | Hero, CTA final |
| **Grid fino** | `linear-gradient` 1px repetindo 64px + `mask-image: radial-gradient` para sumir nas bordas | Fundo geral da página |
| **Grain/ruído** | `feTurbulence` em data-URI SVG, `opacity .04`, `mix-blend-mode: overlay` | Sobreposição global (tira o aspecto "plástico" do gradiente) |
| **Spotlight no cursor** | `useMotionValue` do Motion → CSS vars `--mx/--my` num `radial-gradient` de 420px | Card de destaque do hero |
| **Borda em gradiente** | `padding: 1px` + `background: linear-gradient(...)` + `mask-composite` | Cards de feature e CTA |
| **Scanline sutil** | `repeating-linear-gradient` 2px, `opacity .03` | Bloco de código / terminal |

Regra: **nenhum PNG/SVG de fundo**. Isso mantém a landing em poucos KB e nítida em qualquer DPR.

---

## 5. Efeitos de scroll

| # | Efeito | Técnica | Seção |
|---|---|---|---|
| 1 | **Reveal on scroll** | `<Reveal>` (client) com `whileInView={{opacity:1, y:0}}`, `viewport={{once:true, margin:"-12%"}}`, stagger de 60–90 ms nos grids | Todas |
| 2 | **Parallax do hero** | `useScroll({target, offset:["start start","end start"]})` → `y` e `opacity` do headline/blur do preview | Hero |
| 3 | **Barra de progresso de leitura** | `useScroll().scrollYProgress` → `scaleX` fixo no topo | Global |
| 4 | **Nav que encolhe no scroll** | `useMotionValueEvent(scrollY)` → `backdrop-blur` + borda + sombra após 24 px | Nav |
| 5 | **Contadores animados** | `useInView` + `animate()` do Motion em métricas (12 rotas, 8 endpoints, 100 % tipado) | Stats |
| 6 | **Card 3D sutil** | `useMotionValue` para x/y → `rotateX/rotateY` (±6°) com `useSpring` | Card de destaque |
| 7 | **Marquee infinito** | `animate` com `repeat: Infinity` e `x: ["0%","-50%"]` (conteúdo duplicado) | Faixa de logos/stack |
| 8 | **Sticky storytelling** | Card do lado esquerdo `sticky top-24`, coluna direita rolando trocando o conteúdo | "Como funciona" |
| 9 | **Smooth scroll (Lenis)** | `useEffect` com `autoRaf: true`; desligado com `prefers-reduced-motion` | Global |

Regras inegociáveis: todo wrapped em `useReducedMotion()` (sem movimento = opacity-only),
`will-change` só durante a animação, e `viewport={{ once: true }}` para não reanimar ao voltar.

---

## 6. Seções da página

```
┌ Nav (sticky, blur no scroll, menu mobile em sheet)
│
├ Hero — eyebrow, H1 display, lead, 2 CTAs, preview do app com spotlight
│        + badges de stack (Next 16 · React 19 · Tailwind v4 · TS strict)
├ Marquee — faixa infinita com as tecnologias
├ Stats — 4 métricas com contador animado
├ Features — 6 cards (uma por página real do app) com ícone + link
├ Showcase — preview AO VIVO do /dashboard em iframe lazy (só monta ao entrar na viewport)
├ Arquitetura — 3 passos (Route handler → zod → service layer 'use cache') + snippet
├ Stack — grade técnica com badges
├ CTA final — painel com aurora + 2 botões
└ Footer — links, repo, nota de rodapé
```

**Copy (inglês, tom direto)** — esqueleto em `src/lib/landing-copy.ts`:

- H1: *"The fintech dashboard you can actually read."*
- Lead: *"Cards, statistics, sales and transactions in one screen — typed end to end, cached at
  the server, and ready to swap your backend in."*
- CTA primário: *"Open the dashboard"* → `/dashboard` · secundário: *"View on GitHub"*
- Features (uma por página real): Dashboard / Cards / Transactions / Messages / Products / Customers
- Stats: `7 pages`, `8 typed endpoints`, `100% zod contracts`, `0 kB of imagery`

---

## 7. Estrutura de arquivos

```
src/app/(marketing)/
├─ layout.tsx              # sem sidebar/topbar: <LandingNav/> {children} <LandingFooter/>
└─ page.tsx                # compõe as seções (server component)
src/components/landing/
├─ landing-nav.tsx          # client: scroll state + sheet mobile (Radix Dialog)
├─ hero.tsx                 # server, com <Reveal/> e <HeroPreview/>
├─ hero-preview.tsx         # client: parallax + spotlight no cursor
├─ marquee.tsx              # client: loop infinito
├─ stats.tsx                # client: contadores com useInView
├─ features.tsx             # server: grid dos 6 recursos
├─ showcase.tsx             # client: iframe lazy do /dashboard
├─ architecture.tsx         # server: 3 passos + snippet
├─ stack-grid.tsx           # server
├─ cta.tsx                  # server
├─ footer.tsx
└─ motion-primitives.tsx    # client: <Reveal>, <Parallax>, <CountUp>, useLenis
src/lib/landing-copy.ts     # TODO o texto, tipado
src/app/globals.css         # tokens --landing-*, backgrounds, escala tipográfica
```

Mudança de rota: `src/app/page.tsx` (redirect) sai; `(marketing)/page.tsx` assume a raiz.
`metadata` da raiz passa a descrever a landing; `/dashboard` mantém a sua.

---

## 8. Fases de execução

| Fase | Entrega | Aceite |
|---|---|---|
| **0. Fundação** | Rotas `(marketing)`, copy centralizado, tokens `--landing-*`, fontes Sora + Inter | `/` renderiza seção vazia com fundo dark correto |
| **1. Nav + Hero** | Nav com blur no scroll e sheet mobile; hero com H1, CTAs e preview | Blur entra aos 24 px; CTAs navegam |
| **2. Backgrounds** | Aurora, grid com mask, grain, spotlight, borda-gradiente | Zero assets; sem banding visível |
| **3. Reveal global** | `<Reveal>` + stagger nos grids; barra de progresso; Lenis | Nada aparece "popando" sem animação |
| **4. Seções de conteúdo** | Marquee, Stats (contadores), Features, Stack | Copy bate com `landing-copy.ts` |
| **5. Showcase + arquitetura** | Iframe lazy do dashboard e os 3 passos do BFF | Iframe não carrega antes de visível |
| **6. CTA + Footer + polish** | Painel final, footer, foco/teclado, SEO (`metadata`, OG) | Navegação 100 % por teclado |
| **7. QA** | 375 / 768 / 1280 / 1440, `prefers-reduced-motion`, lint, typecheck, build | Zero warning de console; build passa |

---

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Gradientes com banding em telas wide | Grain por cima + evitar rampas muito longas |
| Iframe do app pesa a página | `loading="lazy"` + só monta quando visível (IntersectionObserver) |
| Animações causam nausea / Motion | `useReducedMotion` corta parallax e Lenis |
| Três fontes no bundle | `display: swap`, subsets enxutos, apenas 4 pesos |
| Copy desalinhada do app | `landing-copy.ts` como fonte única e revisão contra as rotas reais |

---

## 10. Como validar

```bash
npm run typecheck && npm run lint && npm run build
npm run dev   # / = landing,  /dashboard = app
```

Checklist manual: scroll do topo ao fim em 1440 e 375, tabs em todos os links, toggle de
reduced-motion do SO, Lighthouse (Performance/Accessibility/SEO ≥ 90).