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

app.post('/api/add-product', async (req, res) => {
  const { link, category, brand } = req.body;
  if (!link || !category) return res.status(400).json({ error: 'Link e Categoria são obrigatórios' });

  let browser;
  try {
    console.log(`[Admin API] Navegando para: ${link}`);
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Fake human behavior
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
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
      console.log('Tirando print de erro...');
      await page.screenshot({ path: path.resolve('public/images/error.png') });
      throw new Error('Não foi possível encontrar o título ou o preço. Print salvo em public/images/error.png.');
    }

    const price = cleanPrice(data.price);
    const finalBrand = brand || detectBrand(data.title);
    const slug = slugify(data.title.substring(0, 30)); // short slug
    
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
    const newProduct = {
      brand: finalBrand,
      name: data.title.substring(0, 50),
      price: price,
      image: localImagePath,
      link: link,
      store: "Mercado Livre",
      score: 80,
      priceHistory: history
    };

    // Update JSON
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!db[category]) db[category] = [];
    db[category].push(newProduct);
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
app.listen(PORT, () => {
  console.log(`🤖 Admin Server rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:3001/admin.html para adicionar produtos.`);
});
