# 🎨 SKILL: DESIGN

> Executada automaticamente quando a tarefa envolve qualquer aspecto visual.

## DESIGN SYSTEM — TOKENS OBRIGATÓRIOS

### Cores (nunca usar valores crus)
```css
/* Backgrounds */
--bg-primary: #06080d;      /* Fundo principal */
--bg-secondary: #0d1117;    /* Fundo secundário */
--bg-tertiary: #161b22;     /* Fundo elevado */
--bg-card: rgba(13,17,23,0.85);  /* Cards */
--bg-glass: rgba(255,255,255,0.03); /* Glass effect */

/* Borders */
--border-glass: rgba(255,255,255,0.08);  /* Padrão */
--border-glow: rgba(0,240,255,0.15);     /* Hover/active */

/* Accents */
--cyan: #00f0ff;        /* Primary accent */
--purple: #a855f7;      /* Secondary accent */
--magenta: #f472b6;     /* Tertiary accent */
--green: #22c55e;       /* Success/price */
--orange: #f59e0b;      /* Warning/medium */
--red: #ef4444;         /* Error/danger */

/* Text */
--text-1: #f0f6fc;      /* Primary text */
--text-2: #8b949e;      /* Secondary text */
--text-3: #484f58;      /* Muted text */
```

### Tipografia
- **Headings:** `font-family: 'Orbitron', sans-serif;`
- **Body:** `font-family: 'Inter', system-ui, sans-serif;`
- **Sizes:** Usar `clamp()` para responsive: `font-size: clamp(min, preferred, max);`

### Spacing
- **Sections:** `padding: 6rem 2rem;` (desktop), `padding: 4rem 1.5rem;` (mobile)
- **Cards:** `padding: 1.5rem` a `2rem`
- **Gaps:** `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`

### Border Radius
- `--radius-sm: 8px;`
- `--radius-md: 12px;`
- `--radius-lg: 16px;`
- `--radius-xl: 24px;`
- Buttons/badges: `border-radius: 50px;` (pill shape)

---

## COMPONENTES VISUAIS OBRIGATÓRIOS

### Card Glassmórfico (padrão para TUDO)
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
  transition: var(--transition);
}
.card:hover {
  transform: translateY(-6px);
  border-color: var(--border-glow);
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}
```

### Gradient Line no Top do Card (hover)
```css
.card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--cyan), var(--purple));
  opacity: 0; transition: var(--transition);
}
.card:hover::before { opacity: 1; }
```

### Button Primary
```css
background: linear-gradient(135deg, var(--cyan), #0080ff);
color: var(--bg-primary); padding: 14px 32px; border-radius: 50px;
font-weight: 700; /* Sempre bold */
/* Shine effect obrigatório */
```

### Badge/Tag
```css
padding: 6px 16px; border-radius: 50px;
font-size: 0.7rem; font-weight: 600;
text-transform: uppercase; letter-spacing: 1.5px;
```

### Section Header
```
1. Tag/Badge (ex: "🔥 Ofertas")
2. Title (Orbitron, clamp sizing)
3. Subtitle (Inter, var(--text-2))
4. Centrado com max-width: 600px no subtitle
```

---

## ANIMAÇÕES OBRIGATÓRIAS

### Scroll Reveal (em TODA section)
```
- .fade-up: translateY(40px) → 0 com opacity
- .fade-left: translateX(-40px) → 0
- .fade-right: translateX(40px) → 0
- .stagger-N: transition-delay incremental
```

### Hover Effects (em TODO elemento clicável)
```
- Cards: translateY(-6px) + border glow + shadow
- Buttons: translateY(-3px) + box-shadow glow
- Links: underline cyan animation
- Icons: scale(1.1) + rotation slight
```

### Micro-animações
```
- pulse-border: border-color cycling
- float: translateY up/down
- glow-pulse: opacity cycling
- rotate: background rotation (newsletter)
- counter-up: number counting animation
```

---

## CHECKLIST ANTES DE ENTREGAR
- [ ] Todas as cores usam variáveis CSS?
- [ ] Todos os headings usam Orbitron?
- [ ] Todos os cards têm hover effect?
- [ ] Scroll animations em todas as sections?
- [ ] Responsivo testado em 768px e 1024px?
- [ ] Gradients e glows consistentes?
- [ ] Nenhum elemento sem transition?
