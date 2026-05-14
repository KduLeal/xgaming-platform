import './style.css';
import './comparador.css';
import productsData from './data/products.json';
import hardwareSpecs from './data/hardware-specs.json';

// ========== SECURITY HELPERS ==========
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ========== PARTICLES ==========
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);
  let particles = [];
  for (let i = 0; i < 40; i++) particles.push({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    s: Math.random() * 1.5 + 0.3, sx: (Math.random() - 0.5) * 0.2, sy: (Math.random() - 0.5) * 0.2,
    o: Math.random() * 0.3 + 0.1, c: Math.random() > 0.5 ? '0,240,255' : '168,85,247'
  });
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.sx; p.y += p.sy;
      if (p.x < 0 || p.x > canvas.width) p.sx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.sy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${p.o})`; ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  loop();
}

// ========== NAVBAR ==========
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 50));
  document.getElementById('hamburger')?.addEventListener('click', () =>
    document.getElementById('nav-links')?.classList.toggle('open'));
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  }), { threshold: 0.1 });
  document.querySelectorAll('.fade-up, .fade-left, .fade-right').forEach(el => obs.observe(el));
}

// ========== DATA ==========
const categories = {
  gpu: { name: 'Placas de Vídeo', icon: '🎮' },
  cpu: { name: 'Processadores', icon: '⚡' },
  mobo: { name: 'Placas-mãe', icon: '🔧' },
  ram: { name: 'Memórias', icon: '💾' },
  ssd: { name: 'SSDs', icon: '💿' }
};

const allProducts = [];
for (const [cat, items] of Object.entries(productsData)) {
  items.forEach(i => allProducts.push({ ...i, category: cat }));
}

let selectedCat = 'gpu';

function getBrandClass(brand) {
  const b = brand.toLowerCase();
  if (['nvidia', 'corsair', 'samsung', 'lg', 'wd', 'crucial'].includes(b)) return 'brand-nvidia';
  if (['amd', 'g.skill', 'aoc'].includes(b)) return 'brand-amd';
  return 'brand-intel';
}

function matchKey(productName, key) {
  const normalize = (s) => s.replace(/[\s-]/g, '').toLowerCase();
  return normalize(productName).includes(normalize(key));
}

function getTechnicalSpecs(product) {
  const dbCat = hardwareSpecs[product.category] || {};
  for (const [key, specs] of Object.entries(dbCat)) {
    if (matchKey(product.name, key)) return specs;
  }
  return null;
}

// ========== CATEGORY TABS ==========
function renderCategoryTabs() {
  const container = document.getElementById('comp-cat-tabs');
  if (!container) return;
  container.innerHTML = Object.entries(categories).map(([id, cat]) =>
    `<button class="comp-cat-btn ${id === selectedCat ? 'active' : ''}" data-cat="${id}">${cat.icon} ${cat.name}</button>`
  ).join('');

  container.querySelectorAll('.comp-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCat = btn.dataset.cat;
      container.querySelectorAll('.comp-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      populateSelects();
      clearResults();
      // Update slot icons
      document.querySelector('#slot-1 .comp-slot-icon').textContent = categories[selectedCat].icon;
      document.querySelector('#slot-2 .comp-slot-icon').textContent = categories[selectedCat].icon;
    });
  });
}

// ========== POPULATE SELECTS ==========
function populateSelects() {
  const s1 = document.getElementById('select-1');
  const s2 = document.getElementById('select-2');
  const catItems = allProducts.filter(p => p.category === selectedCat);
  let html = '<option value="">Selecionar produto...</option>';
  catItems.forEach(p => {
    html += `<option value="${escapeHTML(p.name)}">${escapeHTML(p.name)}</option>`;
  });
  if (s1) s1.innerHTML = html;
  if (s2) s2.innerHTML = html;
}

function clearResults() {
  const container = document.getElementById('comp-results');
  if (container) container.innerHTML = '<div class="comp-empty">⚔️ Selecione dois produtos acima para iniciar a batalha.</div>';
  // Reset slots
  ['slot-1', 'slot-2'].forEach(id => {
    const slot = document.getElementById(id);
    if (slot) {
      slot.classList.remove('filled');
      const label = slot.querySelector('.comp-slot-label');
      if (label) label.textContent = id === 'slot-1' ? 'Produto 1' : 'Produto 2';
    }
  });
}

// ========== COMPARE ==========
function compare() {
  const v1 = document.getElementById('select-1').value;
  const v2 = document.getElementById('select-2').value;
  const container = document.getElementById('comp-results');

  if (!v1 || !v2) {
    container.innerHTML = '<div class="comp-empty">⚔️ Selecione dois produtos acima para iniciar a batalha.</div>';
    return;
  }
  if (v1 === v2) {
    container.innerHTML = '<div class="comp-empty">⚠️ Selecione produtos diferentes para comparar.</div>';
    return;
  }

  const g1 = allProducts.find(p => p.name === v1);
  const g2 = allProducts.find(p => p.name === v2);
  if (!g1 || !g2) return;

  const t1 = getTechnicalSpecs(g1);
  const t2 = getTechnicalSpecs(g2);

  // Update slot visuals
  updateSlot('slot-1', g1);
  updateSlot('slot-2', g2);

  // Build comparison specs
  const battles = [];

  // Price (lower is better)
  battles.push({
    label: 'Preço',
    v1: `R$ ${g1.price.toLocaleString('pt-BR')}`,
    v2: `R$ ${g2.price.toLocaleString('pt-BR')}`,
    n1: g1.price, n2: g2.price,
    lowerWins: true
  });

  // TDP (lower is better)
  const tdp1 = g1.tdp || parseInt(t1?.['TDP Padrão'] || t1?.['TDP (PBP)'] || 0);
  const tdp2 = g2.tdp || parseInt(t2?.['TDP Padrão'] || t2?.['TDP (PBP)'] || 0);
  if (tdp1 || tdp2) {
    battles.push({
      label: 'Consumo (TDP)',
      v1: tdp1 ? `${tdp1}W` : '-', v2: tdp2 ? `${tdp2}W` : '-',
      n1: tdp1, n2: tdp2, lowerWins: true
    });
  }

  // Benchmark (higher is better)
  const bench1 = g1.benchmark || (t1?.Benchmark ? parseInt(t1.Benchmark) : 0);
  const bench2 = g2.benchmark || (t2?.Benchmark ? parseInt(t2.Benchmark) : 0);
  if (bench1 || bench2) {
    battles.push({
      label: 'Benchmark',
      v1: bench1 ? bench1.toLocaleString('pt-BR') : '-',
      v2: bench2 ? bench2.toLocaleString('pt-BR') : '-',
      n1: bench1, n2: bench2, lowerWins: false
    });
  }

  // Score (higher is better)
  if (g1.score || g2.score) {
    battles.push({
      label: 'Custo-Benefício',
      v1: g1.score ? `${g1.score}/100` : '-',
      v2: g2.score ? `${g2.score}/100` : '-',
      n1: g1.score || 0, n2: g2.score || 0, lowerWins: false
    });
  }

  // Category-specific specs from hardware-specs.json
  if (t1 && t2) {
    const skipKeys = ['TDP Padrão', 'TDP (PBP)', 'Benchmark'];
    const allKeys = new Set([...Object.keys(t1), ...Object.keys(t2)]);
    allKeys.forEach(key => {
      if (skipKeys.includes(key)) return;
      const val1 = t1[key] || '-';
      const val2 = t2[key] || '-';
      // Try to extract numeric for comparison
      const num1 = parseFloat(String(val1).replace(/[^\d.]/g, ''));
      const num2 = parseFloat(String(val2).replace(/[^\d.]/g, ''));
      battles.push({
        label: key,
        v1: val1, v2: val2,
        n1: isNaN(num1) ? 0 : num1,
        n2: isNaN(num2) ? 0 : num2,
        lowerWins: false,
        noBar: isNaN(num1) || isNaN(num2)
      });
    });
  }

  // Render arena
  let html = '';

  // Header
  html += `<div class="comp-arena fade-up">`;
  html += `<div class="comp-arena-header">`;
  html += `<div class="comp-arena-player"><span class="brand-tag ${getBrandClass(g1.brand)}" style="font-size:0.65rem;padding:3px 10px;">${escapeHTML(g1.brand)}</span><div class="comp-arena-player-name">${escapeHTML(g1.name)}</div></div>`;
  html += `<div class="comp-arena-vs">VS</div>`;
  html += `<div class="comp-arena-player"><span class="brand-tag ${getBrandClass(g2.brand)}" style="font-size:0.65rem;padding:3px 10px;">${escapeHTML(g2.brand)}</span><div class="comp-arena-player-name">${escapeHTML(g2.name)}</div></div>`;
  html += `</div>`;

  // Battle section
  html += `<div class="comp-section-card" style="padding:2rem;border-radius:var(--radius-lg);background:var(--bg-card);border:1px solid var(--border-glass);backdrop-filter:blur(10px);">`;

  let p1Wins = 0, p2Wins = 0;

  battles.forEach(b => {
    let w = 0;
    if (b.n1 > 0 && b.n2 > 0) {
      if (b.lowerWins) w = b.n1 < b.n2 ? 1 : b.n1 > b.n2 ? 2 : 0;
      else w = b.n1 > b.n2 ? 1 : b.n1 < b.n2 ? 2 : 0;
    }
    if (w === 1) p1Wins++;
    if (w === 2) p2Wins++;

    const maxVal = Math.max(b.n1, b.n2) || 1;
    const pct1 = b.noBar ? 50 : Math.round((b.n1 / maxVal) * 100);
    const pct2 = b.noBar ? 50 : Math.round((b.n2 / maxVal) * 100);

    html += `<div class="comp-battle-row">`;
    html += `<div class="comp-battle-bar left">`;
    html += `<span class="comp-bar-value ${w === 1 ? 'winner' : ''}">${b.v1}</span>`;
    if (!b.noBar) html += `<div class="comp-bar-track"><div class="comp-bar-fill cyan ${w === 1 ? 'winner-bar' : ''}" style="width:${pct1}%;margin-left:auto;"></div></div>`;
    html += `</div>`;
    html += `<div class="comp-battle-label">${b.label}</div>`;
    html += `<div class="comp-battle-bar right">`;
    if (!b.noBar) html += `<div class="comp-bar-track"><div class="comp-bar-fill purple ${w === 2 ? 'winner-bar' : ''}" style="width:${pct2}%"></div></div>`;
    html += `<span class="comp-bar-value ${w === 2 ? 'winner' : ''}">${b.v2}</span>`;
    html += `</div>`;
    html += `</div>`;
  });

  html += `</div>`; // section-card

  // Verdict
  const winner = p1Wins > p2Wins ? g1 : p2Wins > p1Wins ? g2 : null;
  const winCount = Math.max(p1Wins, p2Wins);
  const loseCount = Math.min(p1Wins, p2Wins);

  html += `<div class="comp-verdict">`;
  html += `<div class="comp-verdict-title">🏆 Veredicto Final</div>`;
  if (winner) {
    html += `<div class="comp-verdict-name">${escapeHTML(winner.name)}</div>`;
    html += `<div class="comp-verdict-reason">Venceu em ${winCount} de ${battles.length} categorias (${loseCount} derrotas). `;
    if (winner.price < (winner === g1 ? g2 : g1).price) {
      html += `Além de superior, custa menos! Excelente custo-benefício.`;
    } else {
      html += `O investimento maior se justifica pela performance superior.`;
    }
    html += `</div>`;
    html += `<a href="/produto.html?name=${encodeURIComponent(winner.name)}" class="btn-primary" style="display:inline-block;margin-top:1.5rem;">Ver Oferta do Vencedor →</a>`;
  } else {
    html += `<div class="comp-verdict-name">Empate Técnico!</div>`;
    html += `<div class="comp-verdict-reason">Ambos os produtos empataram. Escolha com base no preço e disponibilidade.</div>`;
  }
  html += `</div>`;

  html += `</div>`; // arena

  container.innerHTML = html;

  // Trigger animations
  requestAnimationFrame(() => {
    container.querySelectorAll('.fade-up').forEach(el => {
      setTimeout(() => el.classList.add('visible'), 100);
    });
  });
}

function updateSlot(slotId, product) {
  const slot = document.getElementById(slotId);
  if (!slot) return;
  slot.classList.add('filled');
  const icon = slot.querySelector('.comp-slot-icon');
  if (icon && product.image) {
    icon.innerHTML = `<img src="${product.image}" alt="${escapeHTML(product.name)}" onerror="this.style.display='none'" />`;
  }
  const label = slot.querySelector('.comp-slot-label');
  if (label) {
    label.innerHTML = `<span class="brand-tag ${getBrandClass(product.brand)}" style="padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:bold;">${escapeHTML(product.brand)}</span>`;
  }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  renderCategoryTabs();
  populateSelects();

  document.getElementById('select-1')?.addEventListener('change', compare);
  document.getElementById('select-2')?.addEventListener('change', compare);

  requestAnimationFrame(initScrollAnimations);
});
