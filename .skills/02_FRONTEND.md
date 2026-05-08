# ⚡ SKILL: FRONTEND

> Executada quando a tarefa envolve HTML, CSS ou JavaScript do client-side.

## STACK FIXA
- **Build:** Vite 8+
- **JS:** Vanilla ES6 Modules (import/export)
- **CSS:** Vanilla CSS com custom properties
- **Fonts:** Google Fonts (Inter + Orbitron)
- **Charts:** Chart.js (CDN)
- **Icons:** Emoji/SVG inline (zero dependências)

## ESTRUTURA DE ARQUIVOS
```
XGaming/
├── index.html          → Homepage
├── categoria.html      → Listagem por categoria
├── produto.html        → Detalhe do produto
├── comparador.html     → Comparador side-by-side
├── sobre.html          → Página institucional
├── style.css           → Design system global
├── main.js             → JS da homepage
├── categoria.css       → CSS específico categoria
├── categoria.js        → JS da categoria
├── produto.css         → CSS específico produto
├── produto.js          → JS do produto
├── vite.config.js      → Config multi-page
├── package.json        → Dependencies
└── .skills/            → Este diretório
```

## REGRAS DE CÓDIGO

### HTML
- Toda página começa com `<canvas id="particles-canvas">`
- Navbar é sempre o primeiro elemento após canvas
- Sections usam `.section-container` para max-width 1200px
- Footer é sempre o último elemento
- Semantic tags: nav, section, main, footer, article
- Todos IDs são únicos e descritivos
- `aria-label` em botões de ícone/hamburger
- Meta description em toda página

### CSS
- **NUNCA** usar cores hardcoded — sempre `var(--token)`
- **NUNCA** usar !important (exceto `.hidden`)
- Organizar por seção com comentários `/* ========== SECTION ========== */`
- Mobile breakpoints: `@media (max-width: 768px)` e `@media (max-width: 1024px)`
- Ordem de propriedades: position → display → sizing → spacing → visual → animation

### JavaScript
- Toda página importa `./style.css` como primeiro import
- Funções organizadas por responsabilidade:
  - `initParticles()` — Canvas de partículas
  - `initNavbar()` — Scroll + hamburger
  - `initScrollAnimations()` — IntersectionObserver
  - `initCounters()` — Animação de números
  - `render*()` — Renderização dinâmica de conteúdo
- `DOMContentLoaded` no final do arquivo
- Error handling: try/catch em operações que podem falhar
- `requestAnimationFrame` para animações pesadas

## PADRÃO DE NOVA PÁGINA
```
1. Criar [pagina].html com estrutura padrão (canvas, navbar, footer)
2. Criar [pagina].css com estilos específicos
3. Criar [pagina].js com imports e inicialização
4. Adicionar rota no vite.config.js (rollupOptions.input)
5. Adicionar link na navbar de TODAS as páginas
6. Adicionar link no footer
7. Testar no browser
```

## PADRÃO DE NOVO COMPONENTE
```
1. Definir HTML semântico
2. Adicionar classes seguindo naming: [componente]-[elemento]
3. CSS no arquivo da página ou style.css se global
4. Hover effect obrigatório
5. Scroll reveal class (fade-up/fade-left/fade-right)
6. Responsivo em 768px
```

## INTERATIVIDADE OBRIGATÓRIA
- **Sortable tables:** Click no header → sort asc/desc
- **Filter pills:** Click → filter data → re-render
- **Search input:** Input event → filter em tempo real
- **View toggle:** Table ↔ Grid com transição
- **Scroll to top:** Em páginas longas
- **Loading states:** Skeleton ou spinner durante carregamento
- **Empty states:** Mensagem amigável quando sem resultados
- **Hover tooltips:** Em badges e scores
