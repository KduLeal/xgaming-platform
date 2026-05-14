import './style.css';
import './categoria.css';
import productsData from './data/products.json';
import hardwareSpecs from './data/hardware-specs.json';

// ========== SECURITY HELPERS ==========
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========== PRICE ANALYSIS ==========
function isLowestPrice(product) {
  if (!product.priceHistory || product.priceHistory.length < 2) return false;
  const historicalPrices = product.priceHistory.map(h => h.price);
  const minHistorical = Math.min(...historicalPrices);
  return product.price <= minHistorical;
}
// ========== PARTICLES ==========
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3; this.speedX = (Math.random()-0.5)*0.2; this.speedY = (Math.random()-0.5)*0.2;
      this.opacity = Math.random()*0.4+0.1; this.color = Math.random()>0.5?'0,240,255':'168,85,247';
    }
    update() { this.x+=this.speedX; this.y+=this.speedY; if(this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.reset(); }
    draw() { ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fillStyle=`rgba(${this.color},${this.opacity})`; ctx.fill(); }
  }
  for(let i=0;i<50;i++) particles.push(new Particle());
  function animate() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p=>{p.update();p.draw();}); requestAnimationFrame(animate); }
  animate();
}

// ========== CATEGORY CONFIG ==========
const CAT_CONFIG = {
  gpu: {
    title: 'Placas de Vídeo',
    subtitle: 'Compare preços, benchmarks e custo-benefício das melhores GPUs do mercado.',
    infoCards: [
      '<strong>Gaming:</strong> RTX 4060, RX 7600, RTX 4070 Super — melhores custo-benefício para 1080p e 1440p.',
      '<strong>Produtividade:</strong> NVIDIA tem vantagem em CUDA e NVENC. AMD oferece mais VRAM pelo preço.',
      '<strong>Score acima de 70</strong> indica excelente relação desempenho/preço atual.',
    ],
  },
  cpu: {
    title: 'Processadores',
    subtitle: 'Compare CPUs AMD Ryzen e Intel Core com preços atualizados e benchmarks.',
    infoCards: [
      '<strong>Gaming:</strong> Ryzen 5 7600 e i5-14400F dominam o custo-benefício.',
      '<strong>Workstation:</strong> Ryzen 9 e i9 para renderização e compilação pesada.',
      '<strong>Eficiência:</strong> Compare TDP para saber o consumo real de cada CPU.',
    ],
  },
  mobo: {
    title: 'Placas-mãe',
    subtitle: 'Compare motherboards Intel e AMD com os melhores chipsets disponíveis.',
    infoCards: [
      '<strong>Intel:</strong> B760 para custo-benefício, Z790 para overclock.',
      '<strong>AMD:</strong> B650 para Ryzen 7000, A620 para entrada, X670E para entusiastas.',
    ],
  },
  ram: {
    title: 'Memórias RAM',
    subtitle: 'Compare módulos DDR4 e DDR5 de alta performance.',
    infoCards: ['<strong>DDR5:</strong> Mais rápida, ideal para AM5 e LGA1700.', '<strong>DDR4:</strong> Melhor custo-benefício para builds AM4.'],
  },
  ssd: {
    title: 'SSDs',
    subtitle: 'Compare SSDs NVMe e SATA com velocidades e preços atualizados.',
    infoCards: ['<strong>NVMe Gen4:</strong> Até 7000MB/s para gaming e produtividade.', '<strong>SATA:</strong> Boa opção para armazenamento secundário.'],
  },
  monitor: {
    title: 'Monitores',
    subtitle: 'Compare monitores gaming com taxa de atualização, resolução e HDR.',
    infoCards: ['<strong>1080p 144Hz+:</strong> Ideal para e-sports competitivo.', '<strong>1440p 165Hz:</strong> Melhor equilíbrio para gaming premium.'],
  },
};

// ========== INIT STATE ==========
let currentData = null;
let currentConfig = null;
let sortKey = 'price';
let sortAsc = true;
let filterBrand = '';
let filterSearch = '';
let filterPriceMin = null;
let filterPriceMax = null;
let filterSpec = '';
let viewMode = 'table';

// Spec filter config per category
const SPEC_FILTERS = {
  gpu: { label: 'VRAM', key: 'VRAM Base' },
  cpu: { label: 'Socket', key: 'Socket' },
  mobo: { label: 'Socket', key: 'Socket' },
  ram: { label: 'Tipo', key: 'Tipo' },
  ssd: { label: 'Tecnologia', key: 'Tecnologia' }
};

function getCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get('cat') || 'gpu';
}

function loadCategory() {
  const cat = getCategory();
  const dbCat = hardwareSpecs[cat] || {};
  
  const rawItems = productsData[cat] || productsData.gpu || [];
  const items = rawItems.map(item => {
    // Procura no Mega Banco para extrair TDP e spec filterable
    let dbRef = null;
    const n = item.name.replace(/\s+/g, '').toLowerCase();
    for (const [key, specs] of Object.entries(dbCat)) {
      if (n.includes(key.replace(/\s+/g, '').toLowerCase())) {
        dbRef = specs; break;
      }
    }
    
    let tdp = item.tdp;
    if (!tdp && dbRef) {
      const dbTdp = dbRef['TDP Padrão'] || dbRef['TDP (PBP)'];
      if (dbTdp) tdp = parseInt(dbTdp);
    }
    
    let bench = item.benchmark;
    if (!bench) {
       bench = Math.floor(item.price * (cat === 'cpu' ? 4.2 : 2.8));
    }

    // Extract the filterable spec value
    let specValue = null;
    const specConfig = SPEC_FILTERS[cat];
    if (specConfig && dbRef && dbRef[specConfig.key]) {
      specValue = dbRef[specConfig.key];
    }
    
    return { ...item, tdp, benchmark: bench, specValue };
  });

  currentConfig = CAT_CONFIG[cat] || CAT_CONFIG.gpu;
  currentData = {
    items,
    brands: [...new Set(items.map(i => i.brand))].sort(),
    specValues: [...new Set(items.map(i => i.specValue).filter(Boolean))].sort()
  };

  document.title = `XGaming — ${currentConfig.title}`;
  document.getElementById('breadcrumb-cat').textContent = currentConfig.title;
  document.getElementById('cat-title').textContent = currentConfig.title;
  document.getElementById('cat-subtitle').textContent = currentConfig.subtitle;

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.href.includes(`cat=${cat}`));
  });

  document.getElementById('cat-info-cards').innerHTML = currentConfig.infoCards.map(c => `<div class="info-card">${c}</div>`).join('');

  const brandSelect = document.getElementById('filter-brand');
  brandSelect.innerHTML = '<option value="">Todas as Marcas</option>' +
    currentData.brands.map(b => `<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`).join('');

  // Populate spec filter
  const specSelect = document.getElementById('filter-spec');
  const specConfig = SPEC_FILTERS[cat];
  if (specSelect) {
    if (specConfig && currentData.specValues.length > 0) {
      specSelect.innerHTML = `<option value="">Todos: ${specConfig.label}</option>` +
        currentData.specValues.map(v => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join('');
      specSelect.closest('.filter-group').style.display = '';
    } else {
      specSelect.innerHTML = '<option value="">Todas as Specs</option>';
      specSelect.closest('.filter-group').style.display = 'none';
    }
  }

  renderProducts();
}

function getFilteredSorted() {
  let items = [...currentData.items];
  if (filterBrand) items = items.filter(i => i.brand === filterBrand);
  if (filterSearch) items = items.filter(i => i.name.toLowerCase().includes(filterSearch.toLowerCase()));
  if (filterPriceMin !== null) items = items.filter(i => i.price >= filterPriceMin);
  if (filterPriceMax !== null) items = items.filter(i => i.price <= filterPriceMax);
  if (filterSpec) items = items.filter(i => i.specValue && i.specValue === filterSpec);
  items.sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (va === null || va === undefined) va = sortAsc ? Infinity : -Infinity;
    if (vb === null || vb === undefined) vb = sortAsc ? Infinity : -Infinity;
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? va - vb : vb - va;
  });
  return items;
}

function getScoreClass(s) { if (!s) return ''; if (s >= 70) return 'score-high'; if (s >= 40) return 'score-mid'; return 'score-low'; }
function getBrandClass(b) {
  const bl = b.toLowerCase();
  if (['nvidia','corsair','samsung','lg','wd','crucial'].includes(bl)) return 'brand-nvidia';
  if (['amd','g.skill','aoc'].includes(bl)) return 'brand-amd';
  return 'brand-intel';
}

function renderProducts() {
  const items = getFilteredSorted();
  document.getElementById('cat-count').innerHTML = `Mostrando <strong>${items.length}</strong> de <strong>${currentData.items.length}</strong> modelos`;

  if (viewMode === 'table') {
    const tbody = document.getElementById('product-tbody');
    tbody.innerHTML = items.map(item => {
      const lowest = isLowestPrice(item);
      return `
      <tr>
        <td>
          <div class="model-cell">
            ${item.image ? `<img class="model-thumb" src="${item.image}" alt="${escapeHTML(item.name)}" loading="lazy" onerror="this.style.display='none'" />` : ''}
            <span class="brand-tag ${getBrandClass(item.brand)}">${escapeHTML(item.brand)}</span>
            <span class="model-name">${escapeHTML(item.name)}</span>
          </div>
        </td>
        <td>
          <span class="price-cell">R$ ${item.price.toLocaleString('pt-BR')}</span>
          ${lowest ? '<span class="lowest-price-badge" style="margin-left:8px;">\uD83D\uDD25 Menor</span>' : ''}
          <a href="/produto.html?name=${encodeURIComponent(item.name)}" class="price-link">Ver mais \u2192</a>
        </td>
        <td>${item.tdp != null ? item.tdp + 'W' : '-'}</td>
        <td>${item.benchmark != null ? item.benchmark.toLocaleString('pt-BR') : '-'}</td>
        <td>${item.score != null ? `<span class="score-badge ${getScoreClass(item.score)}">${item.score}/100</span>` : '-'}</td>
      </tr>
    `;}).join('');
    document.getElementById('table-view').classList.remove('hidden');
    document.getElementById('grid-view').classList.add('hidden');
  } else {
    const grid = document.getElementById('grid-view');
    grid.innerHTML = items.map(item => {
      const lowest = isLowestPrice(item);
      return `
      <a href="/produto.html?name=${encodeURIComponent(item.name)}" class="product-grid-card">
        ${lowest ? '<div class="lowest-price-badge badge-lg" style="margin-bottom:0.75rem;">\uD83D\uDD25 Menor pre\u00E7o em 6 meses!</div>' : ''}
        ${item.image ? `<img class="grid-card-img" src="${item.image}" alt="${escapeHTML(item.name)}" loading="lazy" onerror="this.style.display='none'" />` : ''}
        <div class="card-brand"><span class="brand-tag ${getBrandClass(item.brand)}">${escapeHTML(item.brand)}</span></div>
        <div class="card-name">${escapeHTML(item.name)}</div>
        <div class="card-price">R$ ${item.price.toLocaleString('pt-BR')}</div>
        <div class="card-specs">
          ${item.tdp ? `<span>TDP: ${item.tdp}W</span>` : ''}
          ${item.benchmark ? `<span>Bench: ${item.benchmark.toLocaleString('pt-BR')}</span>` : ''}
        </div>
        ${item.score != null ? `<div class="card-score"><span class="score-badge ${getScoreClass(item.score)}">${item.score}/100 pts</span></div>` : ''}
      </a>
    `;}).join('');
    document.getElementById('grid-view').classList.remove('hidden');
    document.getElementById('table-view').classList.add('hidden');
  }
}

function initEvents() {
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortAsc = !sortAsc;
      else { sortKey = key; sortAsc = true; }
      renderProducts();
    });
  });
  document.getElementById('filter-brand').addEventListener('change', e => { filterBrand = e.target.value; renderProducts(); });
  document.getElementById('filter-search').addEventListener('input', e => { filterSearch = e.target.value; renderProducts(); });
  document.getElementById('filter-spec')?.addEventListener('change', e => { filterSpec = e.target.value; renderProducts(); });
  
  // Price range filters with debounce
  let priceTimeout;
  const handlePriceFilter = () => {
    clearTimeout(priceTimeout);
    priceTimeout = setTimeout(() => {
      const minVal = document.getElementById('filter-price-min').value;
      const maxVal = document.getElementById('filter-price-max').value;
      filterPriceMin = minVal ? parseInt(minVal) : null;
      filterPriceMax = maxVal ? parseInt(maxVal) : null;
      renderProducts();
    }, 400);
  };
  document.getElementById('filter-price-min')?.addEventListener('input', handlePriceFilter);
  document.getElementById('filter-price-max')?.addEventListener('input', handlePriceFilter);

  document.getElementById('view-table').addEventListener('click', () => { viewMode='table'; document.getElementById('view-table').classList.add('active'); document.getElementById('view-grid').classList.remove('active'); renderProducts(); });
  document.getElementById('view-grid').addEventListener('click', () => { viewMode='grid'; document.getElementById('view-grid').classList.add('active'); document.getElementById('view-table').classList.remove('active'); renderProducts(); });
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 50));
  hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up, .fade-left, .fade-right').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  loadCategory();
  initEvents();
  requestAnimationFrame(initScrollAnimations);
});
