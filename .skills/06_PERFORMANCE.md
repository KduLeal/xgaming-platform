# ⚡ SKILL: PERFORMANCE

> Executada quando a tarefa envolve velocidade, otimização ou UX de carregamento.

## TARGETS
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **Bundle size:** < 100KB JS, < 50KB CSS (gzipped)
- **Lighthouse score:** > 90 em todas as categorias

## OTIMIZAÇÕES IMPLEMENTADAS

### CSS
- [x] Variáveis CSS (zero duplicação)
- [x] Minimal specificity (sem !important)
- [x] `will-change` em elementos animados pesados
- [ ] CSS code-splitting por página
- [ ] Critical CSS inline no `<head>`

### JavaScript
- [x] ES Modules (tree-shaking via Vite)
- [x] IntersectionObserver (lazy loading de animações)
- [x] requestAnimationFrame (partículas)
- [ ] Dynamic imports para páginas pesadas
- [ ] Web Workers para cálculos pesados
- [ ] Service Worker para cache offline

### Imagens (quando adicionadas)
```
- Formato: WebP com fallback PNG
- Lazy loading: loading="lazy"
- Sizes: srcset com múltiplas resoluções
- Compression: < 100KB por imagem
- Dimensões: width/height definidos (evitar CLS)
```

### Network
```
- Preconnect para Google Fonts
- DNS prefetch para CDNs
- Preload de fontes críticas
- Cache headers em assets estáticos (1 ano)
- Gzip/Brotli compression
```

### Rendering
```
- Particles: max 80 partículas (reduzir em mobile para 30)
- Connections: max distance 120px
- Animations: CSS transitions > JS animations
- Scroll handlers: throttled com requestAnimationFrame
- Resize handlers: debounced (250ms)
```

## PADRÕES DE LAZY LOADING

### Componentes abaixo do fold
```javascript
// Só inicializar quando visível
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      initExpensiveComponent(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { rootMargin: '200px' }); // 200px antes de ficar visível
```

### Partículas adaptativas
```javascript
// Reduzir partículas em dispositivos lentos
const isMobile = window.innerWidth < 768;
const isSlowDevice = navigator.hardwareConcurrency <= 4;
const particleCount = isMobile ? 20 : isSlowDevice ? 40 : 80;
```

## CHECKLIST PERFORMANCE
- [ ] Lighthouse score > 90?
- [ ] Sem layout shifts visíveis?
- [ ] Fontes carregam sem flash?
- [ ] Partículas não travam em mobile?
- [ ] Scroll suave sem jank?
- [ ] First paint < 1.5s?
- [ ] Bundle < 100KB gzipped?
