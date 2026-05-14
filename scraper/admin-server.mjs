import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { exec } from 'child_process';
puppeteer.use(StealthPlugin());

// Helper for Git-Ops Auto Deploy
function autoDeploy(productName) {
  const commitMsg = `feat: adiciona produto "${productName}" via Admin Panel`;
  // Use powershell syntax for safety in Windows
  const cmd = `git add .; git commit -m "${commitMsg}"; git push`;
  
  console.log(`[Git-Ops] 🚀 Iniciando deploy automático para: ${productName}`);
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Git-Ops] ❌ Erro no deploy: ${error.message}`);
      return;
    }
    console.log(`[Git-Ops] ✅ Deploy concluído com sucesso!\n${stdout}`);
  });
}

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.resolve('data/products.json');
const IMAGES_DIR = path.resolve('public/images/products');

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function sanitize(text) {
  if (!text) return '';
  return text.toString()
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[<>\"\'&]/g, s => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[s]));
}

function cleanPrice(text) {
  const str = text.toString();
  if (str.includes('.') && !str.includes(',')) {
    return parseFloat(str);
  }
  const match = str.match(/[\d.]+(,\d{2})?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/\./g, '').replace(',', '.'));
}

function detectBrand(title) {
  const t = title.toLowerCase();
  if (t.includes('rtx') || t.includes('geforce') || t.includes('nvidia')) return 'NVIDIA';
  if (t.includes('rx ') || t.includes('radeon') || t.includes('ryzen') || t.includes('amd')) return 'AMD';
  if (t.includes('intel') || t.includes('core i')) return 'Intel';
  if (t.includes('corsair')) return 'Corsair';
  if (t.includes('kingston')) return 'Kingston';
  if (t.includes('aorus') || t.includes('gigabyte')) return 'Gigabyte';
  if (t.includes('asus')) return 'ASUS';
  return 'Geral';
}

function detectStore(url) {
  if (url.includes('mercadolivre.com') || url.includes('meli.la')) return 'Mercado Livre';
  if (url.includes('kabum.com.br')) return 'KaBuM!';
  if (url.includes('terabyteshop.com.br')) return 'Terabyte';
  if (url.includes('pichau.com.br')) return 'Pichau';
  if (url.includes('amazon.com')) return 'Amazon';
  return 'Loja Parceira';
}

app.post('/api/add-product', async (req, res) => {
  const { link, category, brand, fallbackData } = req.body;
  if (!link || !category) return res.status(400).json({ error: 'Link e Categoria são obrigatórios' });

  let browser;
  try {
    console.log(`[Admin API] Navegando para: ${link}`);
    browser = await puppeteer.launch({ 
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new', 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Fake human behavior
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.mercadolivre.com.br/'
    });
    await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Auto-navigate if it's a Store page with "Ir para produto"
    const hasStoreProduct = await page.evaluate(() => {
       const btn = Array.from(document.querySelectorAll('a, button, span')).find(el => el.textContent && el.textContent.toLowerCase().includes('ir para produto'));
       if (btn) { 
         const clickable = btn.closest('a') || btn.closest('button') || btn;
         clickable.click(); 
         return true; 
       }
       return false;
    });
    if (hasStoreProduct) {
       console.log('[Admin API] Redirecionamento de Loja detectado. Navegando para o produto final...');
       await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
       await new Promise(r => setTimeout(r, 2000)); // wait for DOM to settle
    }

    // Extract info
    const data = await page.evaluate(() => {
      const titleEl = document.querySelector('h1.ui-pdp-title') || document.querySelector('h1');
      const title = titleEl ? titleEl.innerText.trim() : null;
      
      let priceText = null;
      const metaPrice = document.querySelector('meta[itemprop="price"]');
      if (metaPrice) priceText = metaPrice.getAttribute('content');
      if (!priceText) {
        const priceEl = document.querySelector('.ui-pdp-price__second-line .andes-money-amount__fraction') || document.querySelector('.andes-money-amount__fraction');
        if (priceEl) priceText = priceEl.innerText.trim();
      }
      
      let imgUrl = null;
      const metaImg = document.querySelector('meta[property="og:image"]');
      if (metaImg) imgUrl = metaImg.getAttribute('content');
      if (!imgUrl) {
        const imgEl = document.querySelector('.ui-pdp-gallery__figure img') || document.querySelector('.ui-pdp-image');
        if (imgEl) imgUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');
      }
      
      return { title, price: priceText, imgUrl };
    });

    if (!data.title || !data.price) {
      if (fallbackData && fallbackData.name && fallbackData.price) {
        console.log('[Admin API] ⚠️ Bloqueio detectado no ML. Usando dados de fallback...');
        data.title = fallbackData.name;
        data.price = fallbackData.price;
        data.imgUrl = fallbackData.image;
      } else {
        console.log('Tirando print de erro...');
        await page.screenshot({ path: path.resolve('public/images/error.png') });
        throw new Error('Não foi possível encontrar o título ou o preço. Print salvo em public/images/error.png.');
      }
    }

    const price = cleanPrice(data.price);
    const finalBrand = sanitize(brand || detectBrand(data.title));
    const finalTitle = sanitize(data.title.substring(0, 120));
    const slug = slugify(finalTitle.substring(0, 30)); 
    
    // Download Image
    let localImagePath = `/images/products/${category}/${slug}.jpg`;
    if (data.imgUrl) {
      const imgRes = await fetch(data.imgUrl);
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const destDir = path.join(IMAGES_DIR, category);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(path.join(destDir, `${slug}.jpg`), buffer);
      } else {
        localImagePath = data.imgUrl; // fallback
      }
    }

    // Generate a basic 6-month history for the new product to populate the chart
    const months = ['Dez/25', 'Jan/26', 'Fev/26', 'Mar/26', 'Abr/26', 'Mai/26'];
    const history = [];
    let histPrice = price * 1.15;
    for (let i = 0; i < 5; i++) {
      history.push({ month: months[i], price: Math.round(histPrice) });
      histPrice = histPrice * (1 - (Math.random() * 0.05));
    }
    history.push({ month: months[5], price: price });

    // Build Product Object
    const newOffer = {
      store: detectStore(link),
      price: price,
      link: link,
      lastUpdate: new Date().toISOString()
    };

    const newProduct = {
      brand: finalBrand,
      name: finalTitle,
      price: price, // Current best price
      image: localImagePath,
      score: 80, // Default
      priceHistory: history,
      offers: [newOffer]
    };

    // Real "Custo-Benefício" Score Calculation
    try {
      const SPECS_FILE = path.resolve('data/hardware-specs.json');
      const specsDB = JSON.parse(fs.readFileSync(SPECS_FILE, 'utf-8'));
      const catSpecs = specsDB[category] || {};
      let matchedSpec = null;
      for (const [key, spec] of Object.entries(catSpecs)) {
        if (newProduct.name.toLowerCase().includes(key.toLowerCase())) {
          matchedSpec = spec;
          break;
        }
      }
      
      if (matchedSpec && matchedSpec.Benchmark) {
        const bench = parseInt(matchedSpec.Benchmark);
        const multiplier = category === 'gpu' ? 50 : 70;
        let calculatedScore = Math.round((bench / price) * multiplier);
        if (bench > 30000) calculatedScore = Math.max(calculatedScore, 85);
        if (bench > 20000) calculatedScore = Math.max(calculatedScore, 75);
        newProduct.score = Math.min(98, Math.max(40, calculatedScore));
        newProduct.benchmark = bench;
      }
    } catch (e) {
      console.warn('[Admin API] Falha ao calcular score real:', e.message);
    }

    // Update JSON with Multi-Offer Logic
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!db[category]) db[category] = [];
    
    const normalizedNewName = newProduct.name.replace(/\s+/g, '').toLowerCase();
    const existingIndex = db[category].findIndex(p => p.name.replace(/\s+/g, '').toLowerCase() === normalizedNewName);

    if (existingIndex !== -1) {
      console.log(`[Admin API] Produto existente encontrado. Adicionando nova oferta...`);
      const existing = db[category][existingIndex];
      if (!existing.offers) existing.offers = [{ store: existing.store || "Mercado Livre", price: existing.price, link: existing.link }];
      
      // Update or add offer
      const offerIndex = existing.offers.findIndex(o => o.store === newOffer.store && o.link === newOffer.link);
      if (offerIndex !== -1) {
        existing.offers[offerIndex] = newOffer;
      } else {
        existing.offers.push(newOffer);
      }
      
      // Update best price
      existing.price = Math.min(...existing.offers.map(o => o.price));
      existing.lastUpdate = new Date().toISOString();
    } else {
      db[category].push(newProduct);
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

    console.log(`[Admin API] Produto adicionado com sucesso: ${newProduct.name}`);
    
    // Trigger Git-Ops Auto Deploy
    autoDeploy(newProduct.name);

    res.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('[Admin API] Erro:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = 3002;

app.get('/api/data', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const specs = JSON.parse(fs.readFileSync(path.resolve('data/hardware-specs.json'), 'utf-8'));
    res.json({ products, specs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PENDING_FILE = path.resolve('data/pending-links.json');

function cleanPendingQueue() {
  try {
    if (!fs.existsSync(PENDING_FILE) || !fs.existsSync(DATA_FILE)) return;
    
    const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
    const products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    // Normalizar nomes para comparação
    const normalize = (name) => name.replace(/\s+/g, '').toLowerCase();
    
    const allProductNames = Object.values(products).flat().map(p => normalize(p.name));
    
    const filtered = pending.filter(p => {
      const nameInSite = allProductNames.includes(normalize(p.name));
      
      // Filtro Rigoroso de Lojas Internacionais na Fila
      const storeName = p.store ? p.store.toLowerCase() : '';
      const isInternational = storeName.includes('nocnoc') || 
                              storeName.includes('usa') || 
                              storeName.includes('china') || 
                              storeName.includes('internacional');
      
      // Filtro de Usados na Fila
      const nameLower = p.name.toLowerCase();
      const isUsed = nameLower.includes('usado') || 
                    nameLower.includes('usada') || 
                    nameLower.includes('lhr') || 
                    nameLower.includes('semi-novo') ||
                    nameLower.includes('seminovo');
      
      return !nameInSite && !isInternational && !isUsed;
    });
    
    if (filtered.length !== pending.length) {
      console.log(`[Admin] 🧹 Limpeza automática: removidos ${pending.length - filtered.length} itens (duplicatas ou internacionais).`);
      fs.writeFileSync(PENDING_FILE, JSON.stringify(filtered, null, 2));
    }
  } catch (err) {
    console.error('[Admin] Erro na limpeza automática:', err);
  }
}

app.get('/api/pending', (req, res) => {
  cleanPendingQueue(); // Limpar antes de entregar
  if (fs.existsSync(PENDING_FILE)) {
    const data = fs.readFileSync(PENDING_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.json([]);
  }
});

app.post('/api/remove-pending', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID is required' });
  
  try {
    if (!fs.existsSync(PENDING_FILE)) return res.json({ success: true });
    let pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
    pending = pending.filter(p => p.id !== id);
    fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 Admin Server rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:3001/admin.html para adicionar produtos.`);
});
