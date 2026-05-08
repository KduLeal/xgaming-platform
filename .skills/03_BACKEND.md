# 🔌 SKILL: BACKEND

> Executada quando a tarefa envolve API, dados, scraping ou lógica server-side.

## STACK PLANEJADA
- **Runtime:** Node.js 20+
- **Framework:** Express.js ou Fastify (decidir quando necessário)
- **Scraping:** Puppeteer ou Cheerio
- **Scheduler:** node-cron para atualizações periódicas
- **Cache:** In-memory (Map) ou Redis quando escalar

## ESTRUTURA FUTURA
```
XGaming/
├── server/
│   ├── index.js          → Entry point
│   ├── routes/
│   │   ├── products.js   → CRUD de produtos
│   │   ├── prices.js     → Histórico de preços
│   │   ├── categories.js → Listagem de categorias
│   │   └── compare.js    → Comparação de produtos
│   ├── scrapers/
│   │   ├── kabum.js      → Scraper KaBuM!
│   │   ├── pichau.js     → Scraper Pichau
│   │   ├── terabyte.js   → Scraper Terabyte
│   │   └── patoloco.js   → Scraper Pato Loco
│   ├── services/
│   │   ├── priceService.js    → Lógica de preços
│   │   ├── benchmarkService.js → Cálculo de scores
│   │   └── alertService.js    → Alertas de preço
│   ├── middleware/
│   │   ├── rateLimit.js  → Rate limiting
│   │   ├── cache.js      → Cache middleware
│   │   └── cors.js       → CORS config
│   └── config/
│       └── stores.js     → Configuração de lojas
```

## REGRAS DE API

### Endpoints Padrão
```
GET    /api/categories              → Lista categorias
GET    /api/products?cat=gpu        → Lista produtos por categoria
GET    /api/products/:id            → Detalhe do produto
GET    /api/products/:id/prices     → Histórico de preços
GET    /api/products/:id/stores     → Preços por loja
POST   /api/compare                 → Comparar produtos
GET    /api/deals                   → Melhores ofertas
POST   /api/alerts                  → Criar alerta de preço
```

### Response Pattern
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 24,
    "lastSync": "2026-05-06T19:30:00Z"
  }
}
```

### Error Pattern
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Produto não encontrado"
  }
}
```

## SCRAPING RULES
1. **Rate limit:** Mínimo 2s entre requests para mesma loja
2. **User-Agent:** Rotação de user-agents
3. **Retry:** 3 tentativas com backoff exponencial
4. **Fallback:** Se scraper falha, usar último dado válido
5. **Validation:** Ignorar preços absurdos (< R$50 ou > R$50.000)
6. **Logging:** Log de todo scrape com timestamp e status

## SCORE CALCULATION
```
score = (benchmark / price) * normalizationFactor
- Normalizar para 0-100
- Penalizar TDP > 250W (-5 pontos)
- Bonificar VRAM > 12GB (+3 pontos)
- Score ≥ 70: VERDE (score-high)
- Score 40-69: LARANJA (score-mid)
- Score < 40: VERMELHO (score-low)
```

## MIGRATION PATH
```
Fase 1: Dados estáticos no JS (ATUAL)
Fase 2: JSON files como "database"
Fase 3: SQLite local
Fase 4: PostgreSQL em VPS
Fase 5: Redis cache + PostgreSQL
```
