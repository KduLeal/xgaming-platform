# 🔍 SKILL: SEO

> Executada em TODA nova página e alteração de conteúdo.

## META TAGS OBRIGATÓRIAS POR PÁGINA

### Template
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="[DESCRITIVO, 150-160 chars]" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="[TÍTULO]" />
  <meta property="og:description" content="[DESCRIÇÃO]" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://xgaming.com.br/[PATH]" />
  <meta property="og:image" content="https://xgaming.com.br/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <title>[TÍTULO] — XGaming</title>
  <link rel="canonical" href="https://xgaming.com.br/[PATH]" />
</head>
```

### Per-Page SEO

| Página | Title | Description |
|--------|-------|-------------|
| Home | XGaming — Comparação de Hardware Premium | Compare preços de GPUs, CPUs e placas-mãe com benchmarks e custo-benefício em tempo real. 31+ lojas brasileiras. |
| GPU | Placas de Vídeo — XGaming | Compare preços e benchmarks das melhores GPUs NVIDIA, AMD e Intel. Encontre o melhor custo-benefício. |
| CPU | Processadores — XGaming | Compare CPUs AMD Ryzen e Intel Core. Preços, benchmarks e scores atualizados em tempo real. |
| Mobo | Placas-mãe — XGaming | Compare motherboards para Intel e AMD. Chipsets B650, B760, Z790, X670E e mais. |
| Produto | [Nome] — Menor Preço e Análise | [Nome]: menor preço R$ X, benchmark Y, score Z/100. Compare preços em 31+ lojas. |
| Comparador | Comparador de Hardware — XGaming | Compare GPUs, CPUs e placas-mãe lado a lado. Specs, preços e benchmarks visuais. |
| Sobre | Sobre — XGaming | Conheça a plataforma #1 de comparação de hardware gamer do Brasil. |

## HEADING HIERARCHY
```
Toda página:
  - 1x <h1> (único, principal)
  - Nx <h2> (seções)
  - Nx <h3> (subseções)
  - NUNCA pular níveis (h1 → h3 sem h2)
```

## SEMANTIC HTML
```html
<nav>     → Navegação principal e breadcrumbs
<main>    → Conteúdo principal (1 por página)
<section> → Seções temáticas
<article> → Card de produto individual
<aside>   → Sidebar de produto
<footer>  → Rodapé
```

## STRUCTURED DATA (JSON-LD)
```html
<!-- Na página de produto -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "RTX 4060 Ti 8GB",
  "category": "Placas de Vídeo",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "2199",
    "highPrice": "3299",
    "priceCurrency": "BRL",
    "offerCount": "12"
  }
}
</script>
```

## URL STRUCTURE
```
/                           → Homepage
/categoria.html?cat=gpu     → Categoria GPU
/categoria.html?cat=cpu     → Categoria CPU
/produto.html?name=rtx-4060 → Produto
/comparador.html            → Comparador
/sobre.html                 → Sobre
```

## CHECKLIST SEO
- [ ] Title tag único por página?
- [ ] Meta description 150-160 chars?
- [ ] Um único <h1> por página?
- [ ] Heading hierarchy sem pulos?
- [ ] alt em todas as imagens?
- [ ] Canonical URL definida?
- [ ] Open Graph tags?
- [ ] JSON-LD em páginas de produto?
- [ ] URLs amigáveis?
- [ ] Sitemap.xml gerado?
