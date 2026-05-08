/**
 * XGaming — Mercado Livre Scraper
 * Usa a API pública do ML para buscar hardware com preços e imagens reais.
 * Execução: node scraper/ml-scraper.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// ========== CONFIG ==========
const SEARCHES = {
  gpu: [
    'placa de video RTX 4060',
    'placa de video RTX 4070',
    'placa de video RTX 3060',
    'placa de video RX 7600',
    'placa de video RX 6600',
    'placa de video RTX 4080',
    'placa de video RTX 4090',
    'placa de video RX 7800 XT',
    'placa de video RTX 3050',
    'placa de video RX 7900',
  ],
  cpu: [
    'processador Ryzen 5 5600',
    'processador Ryzen 5 7600',
    'processador Ryzen 7 7700X',
    'processador Ryzen 9 7900X',
    'processador Intel Core i5-14400F',
    'processador Intel Core i5-13400F',
    'processador Intel Core i7-14700K',
    'processador Intel Core i3-12100F',
    'processador Ryzen 7 5800X',
    'processador Intel Core i9-14900K',
  ],
  mobo: [
    'placa mae B650',
    'placa mae B760',
    'placa mae A620',
    'placa mae Z790',
    'placa mae X670E',
    'placa mae B550',
  ],
  ram: [
    'memoria RAM DDR5 32GB',
    'memoria RAM DDR4 16GB 3200MHz',
    'memoria RAM DDR5 16GB',
    'memoria RAM DDR4 32GB',
    'memoria RAM Corsair Vengeance',
    'memoria RAM Kingston Fury',
  ],
  ssd: [
    'SSD NVMe 1TB',
    'SSD NVMe 2TB',
    'SSD Samsung 990 Pro',
    'SSD Kingston NV2',
    'SSD WD Black SN770',
    'SSD Crucial P3',
  ],
  monitor: [
    'monitor gamer 144Hz 24',
    'monitor gamer 165Hz 27',
    'monitor gamer 240Hz',
    'monitor LG UltraGear',
    'monitor Samsung Odyssey',
  ],
};

// Benchmarks reference (approximate scores for known models)
const BENCHMARK_REF = {
  // GPUs
  'RTX 4090': 5800, 'RTX 4080 Super': 4600, 'RTX 4080': 4400, 'RTX 4070 Ti Super': 4100,
  'RTX 4070 Ti': 3900, 'RTX 4070 Super': 3800, 'RTX 4070': 3500, 'RTX 4060 Ti': 2980,
  'RTX 4060': 2500, 'RTX 3060 Ti': 2300, 'RTX 3060': 2000, 'RTX 3050': 1004,
  'RX 7900 XTX': 5200, 'RX 7900 XT': 4800, 'RX 7800 XT': 3400, 'RX 7700 XT': 3000,
  'RX 7600 XT': 2750, 'RX 7600': 2400, 'RX 6800 XT': 3100, 'RX 6700 XT': 2200,
  'RX 6600 XT': 1900, 'RX 6600': 1800, 'RX 6500 XT': 231,
  // CPUs
  'Ryzen 9 7950X': 5500, 'Ryzen 9 7900X': 4800, 'Ryzen 7 7800X3D': 4500,
  'Ryzen 7 7700X': 3400, 'Ryzen 5 7600X': 2700, 'Ryzen 5 7600': 2600,
  'Ryzen 5 5600X': 1900, 'Ryzen 5 5600': 1800, 'Ryzen 7 5800X': 2500,
  'Ryzen 7 5700X': 2300, 'Ryzen 9 5900X': 3200,
  'i9-14900K': 5000, 'i7-14700K': 4200, 'i5-14600K': 3200, 'i5-14400F': 2400,
  'i5-13400F': 2200, 'i3-12100F': 1200, 'i7-13700K': 3800, 'i9-13900K': 4800,
};

const TDP_REF = {
  'RTX 4090': 450, 'RTX 4080 Super': 320, 'RTX 4080': 320, 'RTX 4070 Ti Super': 285,
  'RTX 4070 Ti': 285, 'RTX 4070 Super': 220, 'RTX 4070': 200, 'RTX 4060 Ti': 160,
  'RTX 4060': 115, 'RTX 3060 Ti': 200, 'RTX 3060': 170, 'RTX 3050': 115,
  'RX 7900 XTX': 355, 'RX 7900 XT': 315, 'RX 7800 XT': 263, 'RX 7700 XT': 245,
  'RX 7600 XT': 150, 'RX 7600': 165, 'RX 6800 XT': 300, 'RX 6700 XT': 230,
  'RX 6600 XT': 160, 'RX 6600': 132, 'RX 6500 XT': 107,
  'Ryzen 9 7950X': 170, 'Ryzen 9 7900X': 170, 'Ryzen 7 7800X3D': 120,
  'Ryzen 7 7700X': 105, 'Ryzen 5 7600X': 105, 'Ryzen 5 7600': 65,
  'Ryzen 5 5600X': 65, 'Ryzen 5 5600': 65, 'Ryzen 7 5800X': 105,
  'i9-14900K': 253, 'i7-14700K': 253, 'i5-14600K': 181, 'i5-14400F': 148,
  'i5-13400F': 148, 'i3-12100F': 58,
};

// ========== API HELPERS ==========
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function searchML(query, limit = 15) {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=${limit}&sort=relevance&condition=new`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error(`  ❌ Erro buscando "${query}": ${err.message}`);
    return [];
  }
}

function detectBrand(title) {
  const t = title.toUpperCase();
  if (t.includes('NVIDIA') || t.includes('GEFORCE') || t.includes('RTX') || t.includes('GTX')) return 'NVIDIA';
  if (t.includes('RADEON') || t.includes('RX ')) return 'AMD';
  if (t.includes('RYZEN')) return 'AMD';
  if (t.includes('INTEL') || t.includes('CORE I')) return 'INTEL';
  if (t.includes('ASUS') || t.includes('ROG')) return 'ASUS';
  if (t.includes('GIGABYTE') || t.includes('AORUS')) return 'GIGABYTE';
  if (t.includes('MSI')) return 'MSI';
  if (t.includes('ASROCK')) return 'ASRock';
  if (t.includes('CORSAIR')) return 'CORSAIR';
  if (t.includes('KINGSTON') || t.includes('FURY')) return 'KINGSTON';
  if (t.includes('G.SKILL') || t.includes('GSKILL')) return 'G.SKILL';
  if (t.includes('CRUCIAL')) return 'CRUCIAL';
  if (t.includes('SAMSUNG')) return 'SAMSUNG';
  if (t.includes('WD ') || t.includes('WESTERN')) return 'WD';
  if (t.includes('LG ')) return 'LG';
  if (t.includes('AOC')) return 'AOC';
  if (t.includes('DELL')) return 'DELL';
  return 'OUTRO';
}

function findBenchmark(title) {
  for (const [key, val] of Object.entries(BENCHMARK_REF)) {
    if (title.toUpperCase().includes(key.toUpperCase())) return val;
  }
  return null;
}

function findTDP(title) {
  for (const [key, val] of Object.entries(TDP_REF)) {
    if (title.toUpperCase().includes(key.toUpperCase())) return val;
  }
  return null;
}

function calcScore(price, benchmark, tdp) {
  if (!benchmark || !price) return null;
  let score = (benchmark / price) * 100;
  // Normalize to 0-100 (max expected ratio ~1.5)
  score = Math.min(100, Math.round(score * 0.65));
  if (tdp && tdp > 250) score = Math.max(0, score - 5);
  return score;
}

function cleanTitle(title) {
  // Remove lixo comum dos títulos do ML
  return title
    .replace(/\s+/g, ' ')
    .replace(/\b(NOVO|LACRADO|ORIGINAL|GARANTIA|ENVIO IMEDIATO|NOTA FISCAL|PRONTA ENTREGA)\b/gi, '')
    .trim()
    .substring(0, 80);
}

function getBestImage(item) {
  // Pegar a melhor resolução da thumbnail
  if (item.thumbnail) {
    // ML thumbnails: trocar -I.jpg por -O.jpg para resolução máxima
    return item.thumbnail.replace(/-I\.jpg/, '-O.jpg').replace('http://', 'https://');
  }
  return '';
}

// ========== MAIN SCRAPER ==========
async function scrapeCategory(catId, queries) {
  console.log(`\n📦 Scraping categoria: ${catId.toUpperCase()}`);
  const seen = new Set();
  const items = [];

  for (const query of queries) {
    console.log(`  🔍 Buscando: "${query}"...`);
    const results = await searchML(query, 12);
    console.log(`     → ${results.length} resultados`);

    for (const r of results) {
      // Deduplicar por ID do ML
      if (seen.has(r.id)) continue;
      seen.add(r.id);

      // Validar preço
      const price = Math.round(r.price);
      if (price < 50 || price > 50000) continue;

      const title = cleanTitle(r.title);
      const brand = detectBrand(r.title);
      const benchmark = findBenchmark(r.title);
      const tdp = findTDP(r.title);
      const score = calcScore(price, benchmark, tdp);

      items.push({
        id: r.id,
        brand,
        name: title,
        price,
        image: getBestImage(r),
        link: r.permalink,
        store: 'Mercado Livre',
        condition: r.condition === 'new' ? 'Novo' : 'Usado',
        freeShipping: r.shipping?.free_shipping || false,
        tdp,
        benchmark,
        score,
        scrapedAt: new Date().toISOString(),
      });
    }

    // Rate limit: 1.5s entre buscas (skill 03 - min 2s, mas ML API é mais tolerante)
    await delay(1500);
  }

  // Sort by price
  items.sort((a, b) => a.price - b.price);
  console.log(`  ✅ ${items.length} produtos únicos coletados para ${catId}`);
  return items;
}

async function main() {
  console.log('🚀 XGaming ML Scraper — Iniciando...');
  console.log(`📅 ${new Date().toLocaleString('pt-BR')}\n`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const allData = {};
  let totalProducts = 0;

  for (const [catId, queries] of Object.entries(SEARCHES)) {
    const items = await scrapeCategory(catId, queries);
    allData[catId] = items;
    totalProducts += items.length;
  }

  // Save full data
  const outputPath = join(DATA_DIR, 'products.json');
  writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`\n💾 Dados salvos em: ${outputPath}`);
  console.log(`📊 Total: ${totalProducts} produtos em ${Object.keys(allData).length} categorias`);

  // Generate stats
  const stats = {};
  for (const [cat, items] of Object.entries(allData)) {
    const brands = [...new Set(items.map(i => i.brand))];
    stats[cat] = { total: items.length, brands: brands.length, brandList: brands };
  }
  writeFileSync(join(DATA_DIR, 'stats.json'), JSON.stringify(stats, null, 2), 'utf-8');
  console.log('\n📈 Stats por categoria:');
  for (const [cat, s] of Object.entries(stats)) {
    console.log(`  ${cat}: ${s.total} produtos, ${s.brands} marcas (${s.brandList.join(', ')})`);
  }

  console.log('\n✅ Scraping completo!');
}

main().catch(console.error);
