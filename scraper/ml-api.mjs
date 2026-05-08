/**
 * XGaming — Mercado Livre Puppeteer Scraper
 * Usa o Puppeteer para navegar no Mercado Livre simulando um usuário real,
 * buscando produtos, preços reais e imagens em alta definição.
 * 
 * USO:
 *   node scraper/ml-api.mjs --scrape    → coleta todos os produtos + imagens
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const IMG_DIR = join(ROOT, 'public', 'images', 'products');
const PRODUCTS_PATH = join(DATA_DIR, 'products.json');

// ========== CONFIG ==========
const SEARCH_QUERIES = {
  gpu: [
    { q: 'placa de video rtx 4090', match: 'RTX 4090' },
    { q: 'placa de video rtx 4080 super', match: 'RTX 4080 Super' },
    { q: 'placa de video rtx 4070 ti super', match: 'RTX 4070 Ti Super' },
    { q: 'placa de video rtx 4070 super', match: 'RTX 4070 Super' },
    { q: 'placa de video rtx 4070 12gb', match: 'RTX 4070 12GB' },
    { q: 'placa de video rtx 4060 ti', match: 'RTX 4060 Ti' },
    { q: 'placa de video rtx 4060 8gb', match: 'RTX 4060 8GB' },
    { q: 'placa de video rtx 3060 12gb', match: 'RTX 3060 12GB' },
    { q: 'placa de video rtx 3050 6gb', match: 'RTX 3050 6GB' },
    { q: 'placa de video rx 7900 xtx', match: 'RX 7900 XTX' },
    { q: 'placa de video rx 7900 xt', match: 'RX 7900 XT' },
    { q: 'placa de video rx 7800 xt', match: 'RX 7800 XT' },
    { q: 'placa de video rx 7700 xt', match: 'RX 7700 XT' },
    { q: 'placa de video rx 7600 xt', match: 'RX 7600 XT' },
    { q: 'placa de video rx 7600 8gb', match: 'RX 7600 8GB' },
    { q: 'placa de video rx 6700 xt', match: 'RX 6700 XT' },
    { q: 'placa de video rx 6600 8gb', match: 'RX 6600 8GB' },
    { q: 'placa de video intel arc a770', match: 'Arc A770' },
    { q: 'placa de video intel arc a750', match: 'Arc A750' },
  ],
  cpu: [
    { q: 'processador ryzen 9 7950x', match: 'Ryzen 9 7950X' },
    { q: 'processador ryzen 9 7900x', match: 'Ryzen 9 7900X' },
    { q: 'processador ryzen 7 7800x3d', match: 'Ryzen 7 7800X3D' },
    { q: 'processador ryzen 7 7700x', match: 'Ryzen 7 7700X' },
    { q: 'processador ryzen 7 5700x', match: 'Ryzen 7 5700X' },
    { q: 'processador ryzen 5 7600', match: 'Ryzen 5 7600' },
    { q: 'processador ryzen 5 5600', match: 'Ryzen 5 5600' },
    { q: 'processador ryzen 5 5500', match: 'Ryzen 5 5500' },
    { q: 'processador intel core i9 14900k', match: 'i9-14900K' },
    { q: 'processador intel core i7 14700k', match: 'i7-14700K' },
    { q: 'processador intel core i5 14600kf', match: 'i5-14600KF' },
    { q: 'processador intel core i5 14400f', match: 'i5-14400F' },
    { q: 'processador intel core i5 13400f', match: 'i5-13400F' },
    { q: 'processador intel core i3 12100f', match: 'i3-12100F' },
  ],
  mobo: [
    { q: 'placa mae gigabyte a620m gaming', match: 'A620M' },
    { q: 'placa mae asrock b760m pro rs', match: 'B760M Pro RS' },
    { q: 'placa mae gigabyte b650m ds3h', match: 'B650M DS3H' },
    { q: 'placa mae asus prime b760m-a ddr5', match: 'PRIME B760M-A' },
    { q: 'placa mae msi pro b760m-a wifi', match: 'PRO B760M-A WiFi' },
    { q: 'placa mae msi mag b650 tomahawk', match: 'MAG B650 TOMAHAWK' },
    { q: 'placa mae asus rog strix b650e-f', match: 'ROG STRIX B650E' },
    { q: 'placa mae gigabyte aorus z790 elite', match: 'AORUS Z790' },
  ],
  ram: [
    { q: 'memoria kingston fury beast ddr4 16gb 3200', match: 'Fury Beast DDR4 16GB' },
    { q: 'memoria crucial pro ddr4 16gb 3600', match: 'Pro DDR4 16GB' },
    { q: 'memoria kingston fury beast ddr5 16gb 5600', match: 'Fury Beast DDR5 16GB' },
    { q: 'memoria corsair vengeance ddr4 32gb', match: 'Vengeance DDR4 32GB' },
    { q: 'memoria corsair vengeance ddr5 32gb 5600', match: 'Vengeance DDR5 32GB' },
    { q: 'memoria gskill trident z5 ddr5 32gb 6000', match: 'Trident Z5 DDR5' },
    { q: 'memoria kingston fury renegade ddr5 32gb', match: 'Fury Renegade DDR5' },
  ],
  ssd: [
    { q: 'ssd kingston nv2 1tb', match: 'NV2 1TB' },
    { q: 'ssd crucial p3 plus 1tb', match: 'P3 Plus 1TB' },
    { q: 'ssd wd blue sn580 1tb', match: 'Blue SN580 1TB' },
    { q: 'ssd wd black sn770 1tb', match: 'Black SN770 1TB' },
    { q: 'ssd kingston nv2 2tb', match: 'NV2 2TB' },
    { q: 'ssd samsung 990 pro 1tb', match: '990 Pro 1TB' },
    { q: 'ssd samsung 990 evo plus 2tb', match: '990 EVO Plus 2TB' },
  ],
  monitor: [
    { q: 'monitor aoc 24g2 144hz', match: '24G2' },
    { q: 'monitor lg ultragear 24gs60f', match: '24GS60F' },
    { q: 'monitor aoc 27g2se', match: '27G2SE' },
    { q: 'monitor samsung odyssey g5 27', match: 'Odyssey G5' },
    { q: 'monitor dell s2722dgm', match: 'S2722DGM' },
    { q: 'monitor lg ultragear 27gp850', match: '27GP850' },
  ],
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== IMAGE DOWNLOAD ==========
async function downloadImage(url, destPath) {
  try {
    const hiResUrl = url
      .replace(/-I\./, '-O.')  
      .replace(/-V\./, '-O.')
      .replace(/-F\./, '-O.')
      .replace(/^http:/, 'https:');
    
    const res = await fetch(hiResUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.mercadolivre.com.br/',
      }
    });
    
    if (!res.ok) {
      console.error(`  ❌ Download falhou: HTTP ${res.status} URL: ${hiResUrl}`);
      return false;
    }
    
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(destPath, buffer);
    const sizeKB = Math.round(buffer.length / 1024);
    return true;
  } catch (err) {
    console.error(`  ❌ Erro no download: ${err.message}`);
    return false;
  }
}

function detectBrand(title) {
  const t = title.toUpperCase();
  if (t.includes('NVIDIA') || t.includes('GEFORCE') || t.includes('RTX') || t.includes('GTX')) return 'NVIDIA';
  if (t.includes('AMD') || t.includes('RADEON') || t.includes('RYZEN')) return 'AMD';
  if (t.includes('INTEL') || t.includes('CORE I') || t.includes('ARC ')) return 'INTEL';
  if (t.includes('GIGABYTE') || t.includes('AORUS')) return 'GIGABYTE';
  if (t.includes('ASUS') || t.includes('ROG')) return 'ASUS';
  if (t.includes('MSI') || t.includes('MAG ')) return 'MSI';
  if (t.includes('ASROCK')) return 'ASRock';
  if (t.includes('KINGSTON') || t.includes('FURY')) return 'KINGSTON';
  if (t.includes('CORSAIR') || t.includes('VENGEANCE')) return 'CORSAIR';
  if (t.includes('CRUCIAL')) return 'CRUCIAL';
  if (t.includes('G.SKILL') || t.includes('TRIDENT')) return 'G.SKILL';
  if (t.includes('SAMSUNG')) return 'SAMSUNG';
  if (t.includes('WESTERN') || t.includes('WD ')) return 'WD';
  if (t.includes('AOC')) return 'AOC';
  if (t.includes('LG') || t.includes('ULTRAGEAR')) return 'LG';
  if (t.includes('DELL')) return 'DELL';
  return 'OUTRO';
}

async function scrapeCategory(catId, queries, existingProducts, page) {
  console.log(`\n📦 ${catId.toUpperCase()} — ${queries.length} produtos`);
  const imgDir = join(IMG_DIR, catId);
  if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });
  
  const results = [];
  
  for (const { q, match } of queries) {
    process.stdout.write(`  🔍 "${match}"... `);
    const existing = existingProducts[catId]?.find(p => p.name.includes(match));
    
    // Pesquisando produto na ML list page
    const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}_ITEM*CONDITION_2230284_NoIndex_True`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    
    let data = await page.evaluate(() => {
      const firstItem = document.querySelector('.ui-search-result__wrapper');
      if (!firstItem) return null;
      
      const titleEl = firstItem.querySelector('h2');
      const priceEl = firstItem.querySelector('.andes-money-amount__fraction');
      const linkEl = firstItem.querySelector('a.ui-search-link');
      const imgEl = firstItem.querySelector('img.ui-search-result-image__element') || firstItem.querySelector('img');
      const shippingEl = firstItem.querySelector('.ui-search-item__shipping--free');
      
      let imgUrl = '';
      if (imgEl) {
        imgUrl = imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '';
      }
      
      return {
        title: titleEl ? titleEl.innerText : '',
        price: priceEl ? parseInt(priceEl.innerText.replace(/\./g, '').replace(/,/g, ''), 10) : 0,
        permalink: linkEl ? linkEl.href : '',
        thumbnail: imgUrl,
        free_shipping: !!shippingEl
      };
    });
    
    // Fallback: se não encontrou, pode ser CAPTCHA. Dá um tempo extra pra resolver.
    if (!data || !data.price) {
      console.log('⚠️ Possível CAPTCHA ou página vazia. Aguardando 15s para resolução manual...');
      await delay(15000);
      // Tenta de novo após 15s
      data = await page.evaluate(() => {
        const firstItem = document.querySelector('.ui-search-result__wrapper');
        if (!firstItem) return null;
        const titleEl = firstItem.querySelector('h2');
        const priceEl = firstItem.querySelector('.andes-money-amount__fraction');
        const linkEl = firstItem.querySelector('a.ui-search-link');
        const imgEl = firstItem.querySelector('img.ui-search-result-image__element') || firstItem.querySelector('img');
        return {
          title: titleEl ? titleEl.innerText : '',
          price: priceEl ? parseInt(priceEl.innerText.replace(/\./g, '').replace(/,/g, ''), 10) : 0,
          permalink: linkEl ? linkEl.href : '',
          thumbnail: imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '') : '',
          free_shipping: !!firstItem.querySelector('.ui-search-item__shipping--free')
        };
      });
    }

    if (!data || !data.price) {
      console.log('❌ Sem resultados reais (Pode estar bloqueado). Mantendo dados antigos.');
      if (existing) results.push(existing); 
      await delay(2000);
      continue;
    }
    
    const slug = match.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const imgExt = 'jpg';
    const localImgPath = `/images/products/${catId}/${slug}.${imgExt}`;
    const absImgPath = join(ROOT, 'public', localImgPath);
    
    let imageOk = false;
    if (data.thumbnail) {
      imageOk = await downloadImage(data.thumbnail, absImgPath);
    }
    
    const product = {
      brand: existing?.brand || detectBrand(data.title),
      name: existing?.name || match,
      price: data.price || existing?.price,
      image: imageOk ? localImgPath : (existing?.image || localImgPath),
      link: data.permalink || existing?.link || '#',
      store: 'Mercado Livre',
      tdp: existing?.tdp || null,
      benchmark: existing?.benchmark || null,
      score: existing?.score || null,
      freeShipping: data.free_shipping,
      mlThumb: data.thumbnail,
    };
    
    console.log(`✅ R$${product.price} | img:${imageOk ? '✓' : '✗'}`);
    results.push(product);
    
    // Delay aleatório humanoide (3 a 6 segundos)
    const randomDelay = Math.floor(Math.random() * 3000) + 3000;
    await delay(randomDelay);
  }
  
  return results;
}

// ========== MAIN COMMANDS ==========
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  
  console.log('🎮 XGaming — Mercado Livre Puppeteer Scraper');
  console.log(`📅 ${new Date().toLocaleString('pt-BR')}\n`);
  
  if (cmd === '--auth' || cmd === '--token') {
    console.log('⚠️ A API oficial do ML agora bloqueia buscas públicas com erro 403.');
    console.log('🔄 O scraper foi migrado para Puppeteer para navegar livremente sem bloqueios!');
    console.log('👉 Use apenas: node scraper/ml-api.mjs --scrape\n');
    return;
  }
  
  if (cmd === '--scrape') {
    let existingProducts = {};
    if (existsSync(PRODUCTS_PATH)) {
      existingProducts = JSON.parse(readFileSync(PRODUCTS_PATH, 'utf-8'));
    }
    
    console.log('🚀 Iniciando Chrome (modo visível com Stealth)...');
    const browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const updatedProducts = {};
    let totalImages = 0;
    let totalProducts = 0;
    
    for (const [catId, queries] of Object.entries(SEARCH_QUERIES)) {
      const results = await scrapeCategory(catId, queries, existingProducts, page);
      updatedProducts[catId] = results;
      totalProducts += results.length;
      totalImages += results.filter(r => r.image?.endsWith('.jpg')).length;
    }
    
    await browser.close();
    
    writeFileSync(PRODUCTS_PATH, JSON.stringify(updatedProducts, null, 2));
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`\n✅ SCRAPING COMPLETO COM PUPPETEER!`);
    console.log(`   📦 ${totalProducts} produtos`);
    console.log(`   🖼️  ${totalImages} imagens baixadas`);
    console.log(`   💾 products.json atualizado`);
    console.log(`\n🚀 Rode: npm run dev — para ver no site\n`);
    return;
  }
  
  console.log(`
COMANDOS:
  --scrape            Coleta todos os produtos + imagens do ML via Puppeteer

USO:
  node scraper/ml-api.mjs --scrape
`);
}

main().catch(console.error);
