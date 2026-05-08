# 💾 SKILL: DATABASE

> Executada quando a tarefa envolve persistência de dados.

## MODELO DE DADOS

### Categories
```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,          -- 'gpu', 'cpu', 'mobo'
  name TEXT NOT NULL,           -- 'Placas de Vídeo'
  slug TEXT UNIQUE NOT NULL,    -- 'placas-de-video'
  icon TEXT,                    -- '🎮'
  description TEXT,
  model_count INTEGER DEFAULT 0,
  brand_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Products
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id TEXT REFERENCES categories(id),
  brand TEXT NOT NULL,           -- 'NVIDIA', 'AMD', 'INTEL'
  name TEXT NOT NULL,            -- 'RTX 4060 Ti 8GB'
  slug TEXT UNIQUE NOT NULL,     -- 'rtx-4060-ti-8gb'
  specs JSONB DEFAULT '{}',     -- { vram: '8GB', tdp: 160, ... }
  benchmark_score INTEGER,
  cost_benefit_score INTEGER,    -- 0-100
  current_best_price INTEGER,    -- em centavos
  current_best_store TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Prices (histórico)
```sql
CREATE TABLE prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  store TEXT NOT NULL,           -- 'kabum', 'pichau'
  price_cash INTEGER NOT NULL,   -- em centavos
  price_installment INTEGER,
  url TEXT,
  is_available BOOLEAN DEFAULT true,
  scraped_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_prices_product ON prices(product_id, scraped_at DESC);
```

### Alerts
```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  target_price INTEGER NOT NULL,  -- preço-alvo em centavos
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## REGRAS DE DADOS
1. **Preços em centavos** — Nunca float para dinheiro
2. **Specs em JSONB** — Flexível para diferentes categorias
3. **Soft delete** — `is_active = false` ao invés de DELETE
4. **Timestamps** — `created_at` e `updated_at` em tudo
5. **Slugs** — Gerados automaticamente, usados nas URLs
6. **Índices** — Em product_id + scraped_at para queries de histórico

## QUERIES FREQUENTES

### Menor preço atual por produto
```sql
SELECT DISTINCT ON (product_id)
  product_id, store, price_cash, scraped_at
FROM prices
WHERE is_available = true
ORDER BY product_id, price_cash ASC;
```

### Histórico de preço (último ano)
```sql
SELECT DATE(scraped_at) as date, MIN(price_cash) as min_price
FROM prices
WHERE product_id = $1
  AND scraped_at > NOW() - INTERVAL '1 year'
GROUP BY DATE(scraped_at)
ORDER BY date;
```

### Top ofertas (custo-benefício)
```sql
SELECT p.*, c.name as category_name
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
  AND p.cost_benefit_score >= 70
ORDER BY p.cost_benefit_score DESC
LIMIT 10;
```
