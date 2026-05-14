import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const SPECS_FILE = join(DATA_DIR, 'hardware-specs.json');
const PROD_FILE = join(DATA_DIR, 'products.json');
const PENDING_FILE = join(DATA_DIR, 'pending-links.json');

// Caminho do Chrome do sistema (detectado via registro)
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ========== HELPERS ==========
function matchKey(productName, key) {
  if (!productName || !key) return false;
  const normalizedKey = key.replace(/\s+/g, '').toLowerCase();
  const normalizedName = productName.replace(/\s+/g, '').toLowerCase();
  return normalizedName.includes(normalizedKey);
}

const NEGATIVE_KEYWORDS = ['block', 'watercooler', 'water cooler', 'cabo', 'suporte', 'extensor', 'riser', 'backplate', 'parafuso', 'adesivo', 'fan ', 'ventoinha', 'lhr', 'não lhr', 'nao lhr', 'semi-novo', 'seminovo', 'usada', 'usado'];

function cleanTitle(title) {
  let t = title.replace(/\s+/g, ' ')
    .replace(/\b(NOVO|LACRADO|ORIGINAL|GARANTIA|ENVIO IMEDIATO|NOTA FISCAL|PRONTA ENTREGA)\b/gi, '')
    .trim();
  return t.substring(0, 80);
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ========== SCRAPER ENGINE ==========
async function searchMissingItem(page, category, itemName) {
  let query = itemName;
  if (category === 'gpu') query = `placa de video ${itemName}`;
  if (category === 'cpu') query = `processador ${itemName}`;
  if (category === 'mobo') query = `placa mae ${itemName}`;
  if (category === 'ram') query = `memoria RAM ${itemName}`;
  if (category === 'ssd') query = `SSD ${itemName}`;

  console.log(`  🔍 Caçando: "${query}"...`);
  
  // URL filtrando por Lojas Oficiais para maior segurança
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}_Loja_all_NoIndex_True`;
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Pequena espera para carregar conteúdo dinâmico se houver
    await delay(1000);

    const offers = await page.evaluate((category, negativeWords) => {
      const items = Array.from(document.querySelectorAll('.ui-search-result__wrapper'));
      return items.slice(0, 3).map((el, index) => {
        const titleEl = el.querySelector('.ui-search-item__title') || el.querySelector('h2') || el.querySelector('.poly-component__title');
        const priceEl = el.querySelector('.andes-money-amount__fraction') || el.querySelector('.poly-price__current .andes-money-amount__fraction');
        const linkEl = el.querySelector('a.ui-search-link') || el.querySelector('a.poly-component__title') || el.querySelector('a');
        const imgEl = el.querySelector('img.ui-search-result-image__element') || el.querySelector('img.poly-component__picture') || el.querySelector('img');
        const storeEl = el.querySelector('.ui-search-official-store-label') || el.querySelector('.ui-search-item__group__element--seller-reputation') || el.querySelector('.poly-component__seller');
        
        const title = titleEl ? titleEl.innerText.trim() : 'Produto sem nome';
        const titleLower = title.toLowerCase();

        // Filtro de Palavras Negativas (Acessórios/Lixo)
        const isTrash = negativeWords.some(word => titleLower.includes(word));
        if (isTrash) return null;

        // Filtro de Compra Internacional (Texto, Classe ou Nome da Loja)
        const storeName = storeEl ? storeEl.innerText.toLowerCase() : '';
        const isInternationalStore = storeName.includes('nocnoc') || 
                                    storeName.includes('usa') || 
                                    storeName.includes('china') || 
                                    storeName.includes('internacional') ||
                                    storeName.includes('direto de');

        const isInternationalText = el.innerText.toLowerCase().includes('compra internacional') || 
                                   el.innerText.toLowerCase().includes('envio internacional') ||
                                   el.innerText.toLowerCase().includes('frete internacional') ||
                                   !!el.querySelector('.ui-search-item__shipping--cbt') ||
                                   !!el.querySelector('.poly-component__shipping--cbt');

        // Filtro de Itens Usados
        const isUsed = el.innerText.toLowerCase().includes('usado') || 
                      el.innerText.toLowerCase().includes('usada') ||
                      !!el.querySelector('.ui-search-item__group__element--used');

        if (isInternationalStore || isInternationalText || isUsed) return null;

        return {
          id: `ml-${Date.now()}-${index}`,
          category: category,
          name: title,
          price: priceEl ? parseInt(priceEl.innerText.replace(/\./g, ''), 10) : 0,
          image: imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src')) : '',
          originalLink: linkEl ? linkEl.href : '',
          store: storeEl ? storeEl.innerText.trim() : 'Mercado Livre',
          scrapedAt: new Date().toISOString()
        };
      }).filter(item => item !== null && item.price > 50); // Filtra nulos e lixo
    }, category, NEGATIVE_KEYWORDS);

    return offers;

  } catch (err) {
    console.error(`  ❌ Erro ao caçar "${query}": ${err.message}`);
    return [];
  }
}

// ========== MAIN HUNTER ==========
async function main() {
  console.log('🐺 XGaming ML Hunter — Iniciando caçada com Puppeteer...');
  console.log(`📅 ${new Date().toLocaleString('pt-BR')}\n`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  let hwSpecs = {};
  let prodData = {};
  let pendingData = [];

  if (existsSync(SPECS_FILE)) hwSpecs = JSON.parse(readFileSync(SPECS_FILE, 'utf-8'));
  if (existsSync(PROD_FILE)) prodData = JSON.parse(readFileSync(PROD_FILE, 'utf-8'));
  if (existsSync(PENDING_FILE)) pendingData = JSON.parse(readFileSync(PENDING_FILE, 'utf-8'));

  // Lançar navegador
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  let newPendingCount = 0;
  const categories = ['gpu', 'cpu', 'mobo', 'ram', 'ssd'];
  
  for (const cat of categories) {
    if (!hwSpecs[cat]) continue;
    
    const idealItems = Object.keys(hwSpecs[cat]);

    for (const idealItem of idealItems) {
      // RECARREGAR prodData para garantir sincronia com adições manuais no painel
      if (existsSync(PROD_FILE)) prodData = JSON.parse(readFileSync(PROD_FILE, 'utf-8'));
      
      const existingItems = prodData[cat] || [];
      const hasMatch = existingItems.some(prod => matchKey(prod.name, idealItem));
      const isAlreadyPending = pendingData.some(p => p.category === cat && matchKey(p.name, idealItem));

      if (!hasMatch && !isAlreadyPending) {
        const offers = await searchMissingItem(page, cat, idealItem);
        if (offers.length > 0) {
          // Pegar apenas a melhor oferta (menor preço) para não poluir a fila
          const bestOffer = offers[0];
          
          // Verificação DUPLA de duplicatas (Link, Nome exato ou Nome similar)
          const alreadyInQueue = pendingData.some(p => 
            p.originalLink === bestOffer.originalLink || 
            p.name.toLowerCase() === bestOffer.name.toLowerCase() ||
            (p.category === cat && matchKey(p.name, idealItem))
          );
          
          if (!alreadyInQueue) {
            console.log(`     ✅ Melhor oferta encontrada: R$ ${bestOffer.price}`);
            pendingData.push(bestOffer);
            newPendingCount++;
            
            // Salvar progresso imediatamente
            writeFileSync(PENDING_FILE, JSON.stringify(pendingData, null, 2), 'utf-8');
          }
        } else {
          console.log(`     ❌ Nenhuma oferta satisfatória.`);
        }
        await delay(2000); // Delay humanoide
      }
    }
  }

  await browser.close();

  // Salvar a Fila
  writeFileSync(PENDING_FILE, JSON.stringify(pendingData, null, 2), 'utf-8');
  console.log(`\n💾 Caçada concluída!`);
  console.log(`📥 ${newPendingCount} ofertas na Fila de Aprovação.`);
}

main().catch(console.error);
