import './style.css';
import './produto.css';
import productsData from './data/products.json';
import hardwareSpecs from './data/hardware-specs.json';// ========== FIND PRODUCT ==========
function getProductFromURL() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  if (!name) return null;

  for (const [catId, items] of Object.entries(productsData)) {
    const found = items.find(item => item.name === name);
    if (found) {
      // Procura no Mega Banco para extrair TDP
      const dbCat = hardwareSpecs[catId] || {};
      let dbRef = null;
      const n = found.name.replace(/\s+/g, '').toLowerCase();
      for (const [key, specs] of Object.entries(dbCat)) {
        if (n.includes(key.replace(/\s+/g, '').toLowerCase())) {
          dbRef = specs; break;
        }
      }
      
      let tdp = found.tdp;
      if (!tdp && dbRef) {
        const dbTdp = dbRef['TDP Padrão'] || dbRef['TDP (PBP)'];
        if (dbTdp) tdp = parseInt(dbTdp);
      }
      
      let bench = found.benchmark;
      if (!bench && dbRef) {
         bench = dbRef['Benchmark'] ? parseInt(dbRef['Benchmark']) : 0;
      }
      if (!bench) bench = 0; // No more fake benchmarks

      return { ...found, category: catId, tdp, benchmark: bench };
    }
  }
  return null;
}

const CAT_NAMES = {
  gpu: 'Placas de Vídeo',
  cpu: 'Processadores',
  mobo: 'Placas-mãe',
  ram: 'Memórias',
  ssd: 'SSDs'
};

// Specs now loaded from hardware-specs.json

function getScoreLabel(score) {
  if (score >= 85) return { text: 'Excelente', class: 'green' };
  if (score >= 70) return { text: 'Muito Bom', class: 'green' };
  if (score >= 50) return { text: 'Bom', class: 'cyan' };
  if (score >= 30) return { text: 'Razoável', class: '' };
  return { text: 'Baixo', class: 'red' };
}

function getVRAMFromName(name) {
  const match = name.match(/(\d+GB)\s*(GDDR\d+X?)/i);
  return match ? `${match[1]} ${match[2]}` : '-';
}

function matchKey(productName, key) {
  const normalizedKey = key.replace(/\s+/g, '').toLowerCase();
  const normalizedName = productName.replace(/\s+/g, '').toLowerCase();
  return normalizedName.includes(normalizedKey);
}

// ========== RENDER PRODUCT ==========
function renderProduct(product) {
  const catName = CAT_NAMES[product.category] || 'Produtos';
  const scoreInfo = product.score ? getScoreLabel(product.score) : { text: '-', class: '' };

  // Page title
  document.title = `XGaming — ${product.name}`;

  // Breadcrumb
  const breadcrumbCat = document.getElementById('breadcrumb-cat-link');
  if (breadcrumbCat) {
    breadcrumbCat.href = `/categoria.html?cat=${product.category}`;
    breadcrumbCat.textContent = catName;
  }
  const breadcrumbProd = document.getElementById('prod-breadcrumb');
  if (breadcrumbProd) breadcrumbProd.textContent = product.name;

  // Hero
  document.getElementById('prod-title').textContent = product.name;
  document.getElementById('prod-price').textContent = `R$ ${product.price.toLocaleString('pt-BR')}`;
  document.getElementById('prod-price-store').innerHTML = `Oferta atual em <strong>${product.store}</strong>`;
  document.getElementById('prod-score').textContent = product.score ? `${product.score}/100 pts` : '-';
  document.getElementById('prod-score-desc').textContent = scoreInfo.text;

  const heroImg = document.getElementById('prod-hero-img');
  if (heroImg && product.image) {
    heroImg.style.display = 'block';
    heroImg.src = product.image;
    heroImg.alt = product.name;
  }

  // Sidebar
  const sidebarImg = document.getElementById('prod-sidebar-img');
  if (sidebarImg && product.image) {
    sidebarImg.style.display = 'block';
    sidebarImg.src = product.image;
    sidebarImg.alt = product.name;
  }
  document.getElementById('prod-sidebar-name').textContent = product.name;
  document.getElementById('prod-sidebar-price').textContent = `A partir de R$ ${product.price.toLocaleString('pt-BR')}`;
  document.getElementById('prod-sidebar-store').textContent = `Melhor oferta em ${product.store}`;

  const buyLink = document.getElementById('prod-buy-link');
  if (buyLink && product.link && product.link !== '#') {
    buyLink.href = product.link;
    buyLink.target = '_blank';
    buyLink.rel = 'noopener noreferrer';
  }

  // Quick specs sidebar
  const quickSpecs = document.getElementById('quick-specs');
  if (quickSpecs) {
    const specs = [];
    
    // Tenta buscar no Mega Banco para extrair 1 ou 2 specs de destaque
    const dbCat = hardwareSpecs[product.category] || {};
    let detailedRef = null;
    for (const [key, dbSpecs] of Object.entries(dbCat)) {
      if (matchKey(product.name, key)) { detailedRef = dbSpecs; break; }
    }

    if (product.category === 'gpu') {
      const vram = getVRAMFromName(product.name);
      if (vram !== '-') specs.push({ label: 'VRAM', value: vram });
      else if (detailedRef?.['VRAM Base']) specs.push({ label: 'VRAM', value: detailedRef['VRAM Base'] });
      if (detailedRef?.['Arquitetura']) specs.push({ label: 'Arquit.', value: detailedRef['Arquitetura'] });
    } else if (product.category === 'cpu') {
      if (detailedRef?.['Cores / Threads']) specs.push({ label: 'Cores', value: detailedRef['Cores / Threads'] });
      if (detailedRef?.['Socket']) specs.push({ label: 'Socket', value: detailedRef['Socket'] });
    } else if (product.category === 'mobo') {
      if (detailedRef?.['Socket']) specs.push({ label: 'Socket', value: detailedRef['Socket'] });
      if (detailedRef?.['Tipo de Memória']) specs.push({ label: 'Memória', value: detailedRef['Tipo de Memória'] });
    } else if (product.category === 'ram') {
      if (detailedRef?.['Tipo de Memória']) specs.push({ label: 'Tipo', value: detailedRef['Tipo de Memória'] });
      if (detailedRef?.['Velocidade Nominal']) specs.push({ label: 'Speed', value: detailedRef['Velocidade Nominal'] });
    } else if (product.category === 'ssd') {
      if (detailedRef?.['Tecnologia']) specs.push({ label: 'Tecnologia', value: detailedRef['Tecnologia'] });
      if (detailedRef?.['Interface']) specs.push({ label: 'PCIe', value: detailedRef['Interface'] });
    }

    if (product.tdp) specs.push({ label: 'TDP', value: `${product.tdp}W` });
    if (product.benchmark) specs.push({ label: 'Benchmark', value: product.benchmark.toLocaleString('pt-BR') });
    if (product.score) specs.push({ label: 'Score', value: `${product.score}/100`, class: scoreInfo.class });
    if (product.freeShipping) specs.push({ label: 'Frete', value: '✅ Grátis', class: 'green' });

    quickSpecs.innerHTML = specs.map(s => `
      <div class="quick-spec">
        <span>${s.label}</span>
        <strong${s.class ? ` class="${s.class}"` : ''}>${s.value}</strong>
      </div>
    `).join('');
  }

  // Detailed specs table
  renderDetailedSpecs(product);

  // Price monitor description
  const priceDesc = document.getElementById('prod-price-desc');
  if (priceDesc) {
    priceDesc.innerHTML = `O produto <strong>${product.name}</strong> está com melhor oferta por <strong class="green">R$ ${product.price.toLocaleString('pt-BR')}</strong> em ${product.store}. ${product.score >= 70 ? '<strong class="green">Excelente custo-benefício!</strong>' : 'Compare com outros modelos para encontrar a melhor opção.'}`;
  }

  // Brand tag
  const brandTag = document.getElementById('prod-brand-tag');
  if (brandTag) {
    const brandClass = getBrandClass(product.brand);
    brandTag.className = `brand-tag ${brandClass}`;
    brandTag.textContent = product.brand;
  }
}

function getBrandClass(brand) {
  const b = brand.toLowerCase();
  if (['nvidia','corsair','samsung','lg','wd','crucial'].includes(b)) return 'brand-nvidia';
  if (['amd','g.skill','aoc'].includes(b)) return 'brand-amd';
  return 'brand-intel';
}

function renderDetailedSpecs(product) {
  const specsTable = document.getElementById('specs-table-body');
  if (!specsTable) return;

  let rows = [];
  const dbCat = hardwareSpecs[product.category] || {};
  let detailedRef = null;

  // Encontra a melhor correspondência no mega banco de dados
  for (const [key, specs] of Object.entries(dbCat)) {
    if (matchKey(product.name, key)) {
      detailedRef = specs;
      break; // O primeiro que bater (mais geral) ganha
    }
  }

  if (detailedRef) {
    // Se encontrou as specs detalhadas no JSON, joga tudo pra tabela
    for (const [label, value] of Object.entries(detailedRef)) {
      rows.push([label, value]);
    }
    
    // Adiciona valores específicos do produto (TDP custom, VRAM detectado do nome)
    if (product.category === 'gpu' || product.category === 'cpu') {
      const vram = getVRAMFromName(product.name);
      if (vram !== '-' && !rows.find(r => r[0] === 'VRAM Base')) rows.push(['VRAM Específica', vram]);
    }
    if (product.tdp) rows.push(['TDP Informado', `${product.tdp}W`]);

  } else {
    // Fallback genérico se não achou no banco
    rows = [
      ['Produto', product.name],
      ['Marca', product.brand],
    ];
    if (product.category === 'gpu' || product.category === 'cpu') {
      const vram = getVRAMFromName(product.name);
      if (vram !== '-') rows.push(['Memória Específica', vram]);
    }
    if (product.tdp) rows.push(['TDP', `${product.tdp}W`]);
    if (product.benchmark) rows.push(['Benchmark', product.benchmark.toLocaleString('pt-BR')]);
  }

  specsTable.innerHTML = rows.map(([label, value]) => `
    <tr><td>${label}</td><td>${value}</td></tr>
  `).join('');
}

// ========== SIMILAR PRODUCTS ==========
function renderSimilar(product) {
  const container = document.getElementById('similar-products');
  if (!container) return;

  const categoryItems = productsData[product.category] || [];
  const similar = categoryItems
    .filter(item => item.name !== product.name)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, 4);

  container.innerHTML = similar.map(item => `
    <a href="/produto.html?name=${encodeURIComponent(item.name)}" class="similar-card">
      <img class="similar-img" src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'" />
      <span class="brand-tag ${getBrandClass(item.brand)}">${item.brand}</span>
      <div class="similar-name">${item.name}</div>
      <div class="similar-price">R$ ${item.price.toLocaleString('pt-BR')}</div>
      ${item.score ? `<div class="similar-score ${item.score >= 70 ? 'green' : item.score >= 40 ? 'orange' : 'red'}">${item.score}/100</div>` : ''}
    </a>
  `).join('');
}

// ========== PRICE CHART ==========
function initChart(product) {
  const ctx = document.getElementById('price-chart');
  if (!ctx || typeof Chart === 'undefined') return;

  // Use real price history from the product data
  let labels = [];
  let prices = [];
  
  if (product.priceHistory && product.priceHistory.length > 0) {
    labels = product.priceHistory.map(h => h.month);
    prices = product.priceHistory.map(h => h.price);
  } else {
    // Fallback if no history exists (just current price)
    labels = ['Atual'];
    prices = [product.price];
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Menor Preço (R$)',
        data: prices,
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0,240,255,0.05)',
        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 8,
        pointBackgroundColor: '#00f0ff', pointBorderColor: '#06080d', pointBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1117', titleColor: '#f0f6fc', bodyColor: '#00f0ff',
          borderColor: 'rgba(0,240,255,0.2)', borderWidth: 1, padding: 12,
          callbacks: { label: (c) => `R$ ${c.parsed.y.toLocaleString('pt-BR')}` }
        }
      },
      scales: {
        x: { ticks: { color: '#8b949e', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8b949e', font: { size: 11 }, callback: v => `R$ ${v.toLocaleString('pt-BR')}` }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

// ========== PARTICLES ==========
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);
  let particles = [];
  class P {
    constructor() { this.reset(); }
    reset() { this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height; this.s=Math.random()*1.5+0.3; this.sx=(Math.random()-0.5)*0.2; this.sy=(Math.random()-0.5)*0.2; this.o=Math.random()*0.3+0.1; this.c=Math.random()>0.5?'0,240,255':'168,85,247'; }
    update() { this.x+=this.sx; this.y+=this.sy; if(this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.reset(); }
    draw() { ctx.beginPath(); ctx.arc(this.x,this.y,this.s,0,Math.PI*2); ctx.fillStyle=`rgba(${this.c},${this.o})`; ctx.fill(); }
  }
  for(let i=0;i<40;i++) particles.push(new P());
  function loop() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p=>{p.update();p.draw();}); requestAnimationFrame(loop); }
  loop();
}

// ========== NAVBAR ==========
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 50));
  hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up, .fade-left, .fade-right').forEach(el => observer.observe(el));
}

// ========== 404 PAGE ==========
function renderNotFound() {
  document.title = 'XGaming — Produto não encontrado';
  const hero = document.querySelector('.prod-hero .section-container');
  if (hero) {
    hero.innerHTML = `
      <nav class="breadcrumb"><a href="/">Home</a> <span>›</span> <span>Produto não encontrado</span></nav>
      <h1 class="prod-title fade-up">Produto não encontrado</h1>
      <p class="prod-tagline fade-up">O produto que você procura não existe no nosso catálogo.</p>
      <div style="margin-top: 2rem;">
        <a href="/" class="btn-primary">← Voltar para Home</a>
        <a href="/categoria.html?cat=gpu" class="btn-secondary" style="margin-left: 1rem;">Ver GPUs</a>
      </div>
    `;
  }
  const details = document.querySelector('.prod-details');
  if (details) details.style.display = 'none';
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();

  const product = getProductFromURL();

  if (!product) {
    renderNotFound();
  } else {
    renderProduct(product);
    renderSimilar(product);
    if (typeof Chart !== 'undefined') { initChart(product); }
    else { window.addEventListener('load', () => initChart(product)); }
  }

  requestAnimationFrame(initScrollAnimations);
});
