import './style.css';
import productsData from './data/products.json';

// ========== PARTICLES ==========
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.5 ? '0,240,255' : '168,85,247';
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
      ctx.fill();
    }
  }
  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function connectParticles() {
    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,240,255,${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(animate);
  }
  animate();
}

// ========== NAVBAR SCROLL ==========
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
  });
  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
    hamburger.classList.toggle('active');
  });
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up, .fade-left, .fade-right').forEach(el => observer.observe(el));
}

// ========== COUNTER ANIMATION ==========
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.counter);
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { el.textContent = target; clearInterval(timer); }
          else el.textContent = Math.floor(current);
        }, 16);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

// ========== COMPUTE STATS FROM DATA ==========
function computeStats() {
  let totalModels = 0;
  const allBrands = new Set();
  for (const [, items] of Object.entries(productsData)) {
    totalModels += items.length;
    items.forEach(i => allBrands.add(i.brand));
  }
  return { totalModels, totalBrands: allBrands.size, totalCategories: Object.keys(productsData).length };
}

// ========== DATA ==========
const stats = computeStats();

const CATEGORIES = [
  { id: 'gpu', icon: '🎮', name: 'Placas de Vídeo', desc: 'GPUs NVIDIA, AMD e Intel para gaming e produtividade.', models: productsData.gpu?.length || 0, brands: new Set(productsData.gpu?.map(i=>i.brand)).size },
  { id: 'cpu', icon: '⚡', name: 'Processadores', desc: 'CPUs AMD Ryzen e Intel Core para todos os workloads.', models: productsData.cpu?.length || 0, brands: new Set(productsData.cpu?.map(i=>i.brand)).size },
  { id: 'mobo', icon: '🔧', name: 'Placas-mãe', desc: 'Motherboards para Intel e AMD com os melhores chipsets.', models: productsData.mobo?.length || 0, brands: new Set(productsData.mobo?.map(i=>i.brand)).size },
  { id: 'ram', icon: '💾', name: 'Memórias RAM', desc: 'Kits DDR4 e DDR5 de alta performance para seu build.', models: productsData.ram?.length || 0, brands: new Set(productsData.ram?.map(i=>i.brand)).size },
  { id: 'ssd', icon: '💿', name: 'SSDs', desc: 'NVMe e SATA para armazenamento ultrarrápido.', models: productsData.ssd?.length || 0, brands: new Set(productsData.ssd?.map(i=>i.brand)).size }
];

// Build deals from best scores across all categories
function buildDeals() {
  const allItems = [];
  for (const [, items] of Object.entries(productsData)) {
    items.forEach(item => {
      if (item.score && item.score >= 70) allItems.push(item);
    });
  }
  allItems.sort((a, b) => b.score - a.score);
  return allItems.slice(0, 8).map((d, i) => ({
    ...d,
    badge: i < 2 ? 'best' : d.score >= 90 ? 'hot' : '',
    scoreClass: d.score >= 70 ? 'high' : d.score >= 40 ? 'mid' : 'low',
    brandClass: detectBrandClass(d.brand),
  }));
}

function detectBrandClass(brand) {
  const b = brand.toLowerCase();
  if (['nvidia','corsair','samsung','lg','wd','crucial'].includes(b)) return 'brand-nvidia';
  if (['amd','g.skill','aoc'].includes(b)) return 'brand-amd';
  return 'brand-intel';
}

const DEALS = buildDeals();

const FEATURES = [
  { icon: '📊', title: 'Benchmark Score', desc: 'Score de performance integrado para cada produto, facilitando a comparação técnica.' },
  { icon: '📈', title: 'Histórico de Preço', desc: 'Gráficos interativos mostrando a evolução do preço ao longo do tempo.' },
  { icon: '⚖️', title: 'Custo-Benefício', desc: 'Índice inteligente que cruza preço, performance e consumo de energia.' },
  { icon: '🔔', title: 'Alertas de Preço', desc: 'Receba notificações quando o produto atingir o preço desejado.' },
  { icon: '🛒', title: 'Multi-Lojas', desc: 'Compare preços de 31+ lojas brasileiras em um único lugar.' },
  { icon: '⚔️', title: 'Comparador Visual', desc: 'Compare até 3 produtos lado a lado com gráficos de specs.' },
];

// ========== RENDER FUNCTIONS ==========
function renderCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map((cat, i) => `
    <a href="/categoria.html?cat=${cat.id}" class="category-card fade-up stagger-${i + 1}">
      <div class="category-icon">${cat.icon}</div>
      <div class="category-name">${cat.name}</div>
      <div class="category-desc">${cat.desc}</div>
      <div class="category-meta">
        <span><strong>${cat.models}</strong> modelos</span>
        <span><strong>${cat.brands}</strong> marcas</span>
      </div>
      <div class="category-arrow">→</div>
    </a>
  `).join('');
}

function renderDeals() {
  const scroll = document.getElementById('deals-scroll');
  if (!scroll) return;
  scroll.innerHTML = DEALS.map(d => `
    <a href="/produto.html?name=${encodeURIComponent(d.name)}" class="deal-card">
      ${d.badge ? `<span class="deal-badge ${d.badge}">${d.badge === 'hot' ? '🔥 Hot' : '👑 Best'}</span>` : ''}
      <span class="deal-brand ${d.brandClass}">${d.brand}</span>
      <img class="deal-img" src="${d.image}" alt="${d.name}" loading="lazy" onerror="this.style.display='none'" />
      <div class="deal-name">${d.name}</div>
      <div class="deal-prices">
        <span class="deal-price">R$ ${d.price.toLocaleString('pt-BR')}</span>
      </div>
      <div class="deal-store">Melhor oferta em ${d.store}</div>
      <div class="deal-score score-${d.scoreClass}">${d.score}/100 pts</div>
    </a>
  `).join('');
}

function renderFeatures() {
  const grid = document.getElementById('features-grid');
  if (!grid) return;
  grid.innerHTML = FEATURES.map((f, i) => `
    <div class="feature-card fade-up stagger-${i + 1}">
      <div class="feature-icon">${f.icon}</div>
      <div class="feature-title">${f.title}</div>
      <div class="feature-desc">${f.desc}</div>
    </div>
  `).join('');
}

// ========== NEWSLETTER ==========
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.textContent = '✅ Inscrito!';
    btn.style.background = 'var(--green)';
    setTimeout(() => { btn.textContent = 'Inscrever ⚡'; btn.style.background = ''; }, 3000);
  });
}

// ========== UPDATE DYNAMIC COUNTERS ==========
function updateHeroStats() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach(el => {
    const label = el.closest('.stat-card')?.querySelector('.stat-label')?.textContent || '';
    if (label.includes('Modelos')) el.dataset.counter = stats.totalModels;
    else if (label.includes('Categorias')) el.dataset.counter = stats.totalCategories;
  });
}

// ========== INTERACTIVE PIXILA-STYLE EFFECTS ==========
function initInteractiveEffects() {
  if (window.innerWidth <= 768) return; // Disable on mobile

  // 1. Custom Cursor
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  document.body.appendChild(cursor);

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function renderCursor() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // 2. Hover states for cursor
  // Use event delegation to handle dynamically added elements
  document.body.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, input, select, .category-card, .deal-card')) {
      cursor.classList.add('hovering');
    }
  });
  document.body.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, input, select, .category-card, .deal-card')) {
      cursor.classList.remove('hovering');
    }
  });

  // 3. Magnetic Elements (Buttons)
  const magneticEls = document.querySelectorAll('.btn-primary, .nav-cta, .footer-social');
  magneticEls.forEach(el => {
    el.classList.add('magnetic');
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const h = rect.width / 2;
      const w = rect.height / 2;
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - w;
      el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = `translate(0px, 0px)`;
    });
  });

  // 4. Tilt Effect for Cards
  // Applying directly to elements might conflict with hover states, but CSS transition makes it smooth
  const tiltEls = document.querySelectorAll('.category-card, .deal-card, .feature-card');
  tiltEls.forEach(el => {
    el.style.transition = 'transform 0.2s ease-out, border-color 0.3s';
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPct = (x / rect.width - 0.5) * 2;
      const yPct = (y / rect.height - 0.5) * 2;
      el.style.transform = `perspective(1000px) rotateX(${yPct * -5}deg) rotateY(${xPct * 5}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
    });
  });
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  updateHeroStats();
  renderCategories();
  renderDeals();
  renderFeatures();
  initNewsletter();
  requestAnimationFrame(() => {
    initScrollAnimations();
    initCounters();
    initInteractiveEffects();
  });
});


// ========== COOKIE BANNER ==========
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('cookieConsent')) {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner fade-up visible';
    banner.innerHTML = `
      <div class="cookie-content">
        <p>Utilizamos cookies para melhorar sua experiência, personalizar anúncios e analisar nosso tráfego. Ao continuar navegando, você concorda com a nossa <a href="/privacidade.html">Política de Privacidade</a>.</p>
      </div>
      <button id="accept-cookies" class="btn-primary" style="white-space: nowrap;">Aceitar Cookies</button>
    `;
    document.body.appendChild(banner);
    document.getElementById('accept-cookies').addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'true');
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 300);
    });
  }
});

// ========== ADBLOCK DETECTOR ==========
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adblockSkipped')) return;

  // Create a bait element
  const bait = document.createElement('div');
  bait.className = 'ad-banner ad-container ad-slot textads';
  bait.style.height = '10px';
  bait.style.width = '10px';
  bait.style.position = 'absolute';
  bait.style.left = '-9999px';
  bait.style.top = '-9999px';
  document.body.appendChild(bait);

  setTimeout(() => {
    // Check if bait is hidden or removed
    const isBlocked = bait.offsetHeight === 0 || bait.style.display === 'none' || !document.body.contains(bait);
    
    if (isBlocked) {
      const adBanner = document.createElement('div');
      adBanner.className = 'adblock-banner fade-up visible';
      adBanner.innerHTML = `
        <div class="adblock-content">
          <p><strong>Ops! AdBlocker detectado.</strong> 🛑<br>A XGaming se mantém através de links de afiliados e anúncios seguros. Por favor, considere desativar seu bloqueador para nos apoiar!</p>
        </div>
        <button id="skip-adblock" class="btn-secondary" style="white-space: nowrap;">Continuar Assim Mesmo</button>
      `;
      document.body.appendChild(adBanner);
      
      document.getElementById('skip-adblock').addEventListener('click', () => {
        sessionStorage.setItem('adblockSkipped', 'true'); // Only skip for current session
        adBanner.style.opacity = '0';
        setTimeout(() => adBanner.remove(), 300);
      });
    }
    
    // Cleanup
    if (document.body.contains(bait)) bait.remove();
  }, 500);
});