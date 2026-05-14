import './style.css';
import './builder.css';
import productsData from './data/products.json';
import hardwareSpecs from './data/hardware-specs.json';

// ========== STATE ==========
const state = {
  selected: {
    cpu: null,
    mobo: null,
    ram: [], // Suporta até 4
    gpu: null,
    ssd: [], // Suporta até 4
    psu: null
  },
  activeModalCategory: null,
  activeModalIndex: null // Usado para RAM/SSD arrays
};

// ========== HELPERS ==========
function matchKey(productName, key) {
  const normalize = (s) => s.replace(/[\s-]/g, '').toLowerCase();
  return normalize(productName).includes(normalize(key));
}

function getDetailedSpecs(category, productName) {
  const dbCat = hardwareSpecs[category] || {};
  for (const [key, specs] of Object.entries(dbCat)) {
    if (matchKey(productName, key)) {
      return specs;
    }
  }
  return null;
}

function formatPrice(value) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ========== ENGINE DE COMPATIBILIDADE ==========
function evaluateCompatibility() {
  const alerts = [];
  let isReady = true;

  const cpu = state.selected.cpu;
  const mobo = state.selected.mobo;
  const rams = state.selected.ram;
  const ssds = state.selected.ssd;
  const psu = state.selected.psu;

  // 1. CPU vs Placa-Mãe (Socket)
  if (cpu && mobo) {
    const cpuSpecs = getDetailedSpecs('cpu', cpu.name);
    const moboSpecs = getDetailedSpecs('mobo', mobo.name);
    
    if (cpuSpecs && moboSpecs) {
      if (cpuSpecs.Socket !== moboSpecs.Socket) {
        alerts.push({
          type: 'danger',
          message: `Incompatível: O processador exige socket ${cpuSpecs.Socket}, mas a placa-mãe é ${moboSpecs.Socket}.`
        });
        isReady = false;
      } else {
        alerts.push({
          type: 'success',
          message: `Compatível: Processador e Placa-Mãe utilizam o mesmo socket (${cpuSpecs.Socket}).`
        });
      }
    }
  } else if (!cpu || !mobo) {
    isReady = false;
  }

  // 2. Placa-Mãe vs RAM (DDR)
  if (mobo && rams.length > 0) {
    const moboSpecs = getDetailedSpecs('mobo', mobo.name);
    let allCompatible = true;
    let conflictType = '';

    if (moboSpecs) {
      rams.forEach(ram => {
        const ramSpecs = getDetailedSpecs('ram', ram.name);
        if (ramSpecs && !moboSpecs['Tipo de Memória'].includes(ramSpecs['Tipo'])) {
          allCompatible = false;
          conflictType = ramSpecs['Tipo'];
        }
      });

      if (!allCompatible) {
        alerts.push({
          type: 'danger',
          message: `Incompatível: A placa-mãe suporta ${moboSpecs['Tipo de Memória']}, mas há pentes de memória ${conflictType} selecionados.`
        });
        isReady = false;
      } else {
        alerts.push({
          type: 'success',
          message: `Compatível: Memórias RAM compatíveis com a Placa-Mãe.`
        });
      }
    }
  } else if (rams.length === 0) {
    isReady = false;
  }

  // 3. Consumo de Energia (Fonte)
  let totalTdp = 0;
  
  // Single parts
  ['cpu', 'mobo', 'gpu', 'psu'].forEach(cat => {
    const part = state.selected[cat];
    if (part) {
      if (part.tdp) {
        totalTdp += part.tdp;
      } else {
        const specs = getDetailedSpecs(cat, part.name);
        if (specs) {
          const tdpStr = specs['TDP Padrão'] || specs['TDP (PBP)'];
          if (tdpStr) totalTdp += parseInt(tdpStr);
        }
      }
    }
  });

  // Arrays (RAM & SSD)
  rams.forEach(ram => {
    totalTdp += 5; // ~5W per RAM stick
  });
  ssds.forEach(ssd => {
    totalTdp += 8; // ~8W per SSD
  });

  // Base motherboard/fans
  if (totalTdp > 0) totalTdp += 30; 

  let psuCapacity = 0;
  if (psu) {
    const psuSpecs = getDetailedSpecs('psu', psu.name);
    if (psuSpecs && psuSpecs['Potência Real']) {
      psuCapacity = parseInt(psuSpecs['Potência Real']);
    }
    
    // Safety margin 20%
    const recommended = totalTdp * 1.2;
    if (psuCapacity < recommended) {
      alerts.push({
        type: 'danger',
        message: `Atenção: A fonte escolhida (${psuCapacity}W) é muito fraca para o consumo estimado do PC (${Math.ceil(recommended)}W recomendados).`
      });
      isReady = false;
    } else {
      alerts.push({
        type: 'success',
        message: `Fonte adequada: Capacidade suficiente para o sistema com margem de segurança.`
      });
    }
  } else {
    isReady = false;
  }

  // Missing essential parts for a full PC
  if (!state.selected.gpu && cpu) {
    const cpuSpecs = getDetailedSpecs('cpu', cpu.name);
    if (cpuSpecs && cpuSpecs['Gráficos'] && cpuSpecs['Gráficos'].includes('Nenhum')) {
      alerts.push({
        type: 'danger',
        message: `Falta GPU: O processador selecionado não possui gráficos integrados. Você precisa adicionar uma Placa de Vídeo.`
      });
      isReady = false;
    }
  }
  if (ssds.length === 0) isReady = false;

  if (alerts.length === 0) {
    alerts.push({
      type: 'neutral',
      message: 'Escolha um Processador e uma Placa-mãe para testar a compatibilidade.'
    });
  }

  return { alerts, totalTdp, psuCapacity, isReady };
}

// ========== UI RENDER ==========
function updateUI() {
  let totalPrice = 0;

  // --- Single Slots (CPU, Mobo, GPU, PSU) ---
  ['cpu', 'mobo', 'gpu', 'psu'].forEach(cat => {
    const part = state.selected[cat];
    const slotEl = document.getElementById(`slot-${cat}`);
    if(!slotEl) return;
    
    const selTextEl = slotEl.querySelector('.slot-selection');
    const btnEl = slotEl.querySelector('.btn-select-part');

    // Remove old remove btn
    const existingRemove = slotEl.querySelector('.btn-remove-part');
    if (existingRemove) existingRemove.remove();

    if (part) {
      totalPrice += part.price;
      slotEl.classList.add('has-item');
      
      let miniSpec = '';
      const specs = getDetailedSpecs(cat, part.name);
      if (specs) {
        if (cat === 'cpu') miniSpec = specs.Socket;
        if (cat === 'mobo') miniSpec = specs.Socket;
      }

      selTextEl.innerHTML = `
        <div style="font-size:0.9rem; line-height:1.2; margin-bottom:0.25rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${part.name}">${part.name}</div>
        <div class="slot-price">${formatPrice(part.price)} ${miniSpec ? `<span style="color:#8b949e; font-size:0.8rem; font-weight:normal; margin-left:0.5rem">${miniSpec}</span>` : ''}</div>
      `;
      btnEl.textContent = 'Trocar';
      btnEl.onclick = () => openModal(cat);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove-part';
      removeBtn.innerHTML = '🗑️';
      removeBtn.onclick = () => {
        state.selected[cat] = null;
        updateUI();
      };
      slotEl.appendChild(removeBtn);

    } else {
      slotEl.classList.remove('has-item');
      const defaultText = {
        cpu: 'Selecionar Processador...', mobo: 'Selecionar Placa-Mãe...',
        gpu: 'Selecionar Placa de Vídeo...', psu: 'Selecionar Fonte...'
      };
      selTextEl.textContent = defaultText[cat];
      btnEl.textContent = 'Escolher';
      btnEl.onclick = () => openModal(cat);
    }
  });

  // --- Multi Slots (RAM, SSD) ---
  const renderMultiSlot = (cat, title, icon) => {
    const container = document.getElementById(`slots-group-${cat}`);
    if(!container) return;
    container.innerHTML = ''; // Clear

    const items = state.selected[cat];
    const maxLimit = 4;

    // Render populated slots
    items.forEach((part, index) => {
      totalPrice += part.price;
      let miniSpec = '';
      const specs = getDetailedSpecs(cat, part.name);
      if (specs) {
        if (cat === 'ram') miniSpec = specs.Tipo;
      }

      const slotHTML = `
        <div class="component-slot has-item">
          <div class="slot-icon">${icon}</div>
          <div class="slot-content">
            <h3 class="slot-title">${title} ${index + 1}</h3>
            <p class="slot-selection">
              <div style="font-size:0.9rem; line-height:1.2; margin-bottom:0.25rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${part.name}">${part.name}</div>
              <div class="slot-price">${formatPrice(part.price)} ${miniSpec ? `<span style="color:#8b949e; font-size:0.8rem; font-weight:normal; margin-left:0.5rem">${miniSpec}</span>` : ''}</div>
            </p>
          </div>
          <button class="btn-select-part" onclick="openModal('${cat}', ${index})">Trocar</button>
          <button class="btn-remove-part" onclick="removeMultiItem('${cat}', ${index})">🗑️</button>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', slotHTML);
    });

    // Render "Add" button if under limit
    if (items.length < maxLimit) {
      const emptySlotHTML = `
        <button class="btn-add-slot" onclick="openModal('${cat}', ${items.length})">
          + Adicionar ${title}
        </button>
      `;
      container.insertAdjacentHTML('beforeend', emptySlotHTML);
    }
  };

  renderMultiSlot('ram', 'Memória RAM', '💾');
  renderMultiSlot('ssd', 'Armazenamento', '💽');


  // Atualiza HUD Preço
  document.getElementById('hud-total-price').textContent = formatPrice(totalPrice);

  // Roda Motor e Atualiza HUD Energia & Alertas
  const { alerts, totalTdp, psuCapacity, isReady } = evaluateCompatibility();
  
  // Barra de Energia
  const powerText = document.getElementById('hud-power-text');
  const powerFill = document.getElementById('power-bar-fill');
  const powerHint = document.getElementById('power-hint');
  
  powerText.textContent = `${totalTdp}W / ${psuCapacity ? psuCapacity+'W' : '---'}`;
  
  if (psuCapacity > 0) {
    const percentage = Math.min((totalTdp / psuCapacity) * 100, 100);
    powerFill.style.width = `${percentage}%`;
    
    powerFill.classList.remove('warning', 'danger');
    if (percentage > 90) {
      powerFill.classList.add('danger');
      powerHint.textContent = 'Risco: Fonte sobrecarregada ou sem margem.';
      powerHint.style.color = '#f85149';
    } else if (percentage > 80) {
      powerFill.classList.add('warning');
      powerHint.textContent = 'Atenção: Margem de segurança baixa.';
      powerHint.style.color = '#ff7b72';
    } else {
      powerHint.textContent = 'Saudável: Fonte trabalhando com boa margem folgada.';
      powerHint.style.color = '#3fb950';
    }
  } else {
    powerFill.style.width = '0%';
    powerHint.textContent = totalTdp > 0 ? `Adicione uma fonte de pelo menos ${Math.ceil(totalTdp*1.2)}W.` : 'Adicione peças para calcular consumo.';
    powerHint.style.color = '#8b949e';
  }

  // Alertas
  const alertsContainer = document.getElementById('hud-alerts');
  alertsContainer.innerHTML = alerts.map(al => `
    <div class="alert-box alert-${al.type}">
      <span>${al.type === 'danger' ? '❌' : al.type === 'success' ? '✅' : '⚠️'}</span>
      <p>${al.message}</p>
    </div>
  `).join('');

  // Botão Comprar
  const btnBuy = document.getElementById('btn-buy-all');
  if (isReady && alerts.every(a => a.type !== 'danger')) {
    btnBuy.disabled = false;
    btnBuy.textContent = 'Finalizar e Comprar';
    btnBuy.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.4)';
  } else {
    btnBuy.disabled = true;
    btnBuy.textContent = 'Resolva as pendências';
    btnBuy.style.boxShadow = 'none';
  }
}

window.removeMultiItem = function(category, index) {
  state.selected[category].splice(index, 1);
  updateUI();
};

// ========== MODAL ==========
window.openModal = function(category, index = null) {
  state.activeModalCategory = category;
  state.activeModalIndex = index;
  const modal = document.getElementById('parts-modal');
  const grid = document.getElementById('parts-grid');
  
  const titles = {
    cpu: 'Processadores', mobo: 'Placas-Mãe', ram: 'Memórias RAM',
    gpu: 'Placas de Vídeo', ssd: 'Armazenamento', psu: 'Fontes de Alimentação'
  };
  document.getElementById('modal-title').textContent = titles[category];

  const items = productsData[category] || [];
  
  grid.innerHTML = items.map((item, idx) => {
    let miniSpecsText = '';
    const specs = getDetailedSpecs(category, item.name);
    if (specs) {
      if (category === 'cpu') miniSpecsText = `${specs.Socket} | ${specs['Cores / Threads']} | ${specs['TDP (PBP)']}`;
      if (category === 'mobo') miniSpecsText = `${specs.Socket} | ${specs['Tipo de Memória']}`;
      if (category === 'ram') miniSpecsText = `${specs.Tipo} | ${specs.Velocidade}`;
      if (category === 'gpu') miniSpecsText = `${specs['VRAM Base']} | ${specs['TDP Padrão']}`;
      if (category === 'psu') miniSpecsText = `${specs['Potência Real']} | ${specs.Certificação}`;
      if (category === 'ssd') miniSpecsText = `${specs.Tecnologia} | ${specs.PCIe || specs.Tipo}`;
    }

    return `
      <div class="part-card" onclick="selectItem(${idx})">
        <div class="part-img-container">
          <img src="${item.image}" alt="Img" class="part-img" onerror="this.src='/images/placeholder.jpg'" />
        </div>
        <div class="part-name">${item.name}</div>
        <div class="part-specs-mini">${miniSpecsText}</div>
        <div class="part-price">${formatPrice(item.price)}</div>
      </div>
    `;
  }).join('');

  modal.classList.add('open');
};

window.selectItem = function(idx) {
  const category = state.activeModalCategory;
  const index = state.activeModalIndex;
  const item = productsData[category][idx];

  if (index !== null) {
    // Array type (RAM, SSD)
    state.selected[category][index] = item;
  } else {
    // Single type
    state.selected[category] = item;
  }
  
  closeModal();
  updateUI();
};

window.closeModal = function() {
  document.getElementById('parts-modal').classList.remove('open');
  state.activeModalCategory = null;
  state.activeModalIndex = null;
};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa Navbar e Particles 
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => navbar?.classList.toggle('scrolled', window.scrollY > 50));
  
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
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

  // Initial bindings for single slots are now handled directly inside updateUI
  // via onclick assignments.

  // Setup Modal Close
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('parts-modal').addEventListener('click', (e) => {
    if (e.target.id === 'parts-modal') closeModal();
  });

  // Inicializa UI
  updateUI();

  // Scroll anims
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
});
