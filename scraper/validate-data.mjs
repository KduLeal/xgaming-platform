/**
 * XGaming — Product Data Validator
 * Validates all product data for accuracy and consistency.
 * Run: node scraper/validate-data.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'products.json');

// ========== REFERENCE DATA (verified from official sources) ==========
const GPU_SPECS = {
  'RTX 4090': { tdp: 450, vram: '24GB', memType: 'GDDR6X', brand: 'NVIDIA' },
  'RTX 4080 Super': { tdp: 320, vram: '16GB', memType: 'GDDR6X', brand: 'NVIDIA' },
  'RTX 4070 Ti Super': { tdp: 285, vram: '16GB', memType: 'GDDR6X', brand: 'NVIDIA' },
  'RTX 4070 Super': { tdp: 220, vram: '12GB', memType: 'GDDR6X', brand: 'NVIDIA' },
  'RTX 4070': { tdp: 200, vram: '12GB', memType: 'GDDR6X', brand: 'NVIDIA' },
  'RTX 4060 Ti': { tdp: 160, vram: '8GB', memType: 'GDDR6', brand: 'NVIDIA' },
  'RTX 4060': { tdp: 115, vram: '8GB', memType: 'GDDR6', brand: 'NVIDIA' },
  'RTX 3060': { tdp: 170, vram: '12GB', memType: 'GDDR6', brand: 'NVIDIA' },
  'RTX 3050': { tdp: 115, vram: '6GB', memType: 'GDDR6', brand: 'NVIDIA' },
  'RX 7900 XTX': { tdp: 355, vram: '24GB', memType: 'GDDR6', brand: 'AMD' },
  'RX 7900 XT': { tdp: 315, vram: '20GB', memType: 'GDDR6', brand: 'AMD' },
  'RX 7800 XT': { tdp: 263, vram: '16GB', memType: 'GDDR6', brand: 'AMD' },
  'RX 7700 XT': { tdp: 245, vram: '12GB', memType: 'GDDR6', brand: 'AMD' },
  'RX 7600 XT': { tdp: 190, vram: '16GB', memType: 'GDDR6', brand: 'AMD' },
  'RX 7600': { tdp: 165, vram: '8GB', memType: 'GDDR6', brand: 'AMD' },
  'RX 6700 XT': { tdp: 230, vram: '12GB', memType: 'GDDR6', brand: 'AMD' },
  'RX 6600': { tdp: 132, vram: '8GB', memType: 'GDDR6', brand: 'AMD' },
  'Arc A770': { tdp: 225, vram: '16GB', memType: 'GDDR6', brand: 'INTEL' },
  'Arc A750': { tdp: 225, vram: '8GB', memType: 'GDDR6', brand: 'INTEL' },
};

const CPU_SPECS = {
  'Ryzen 9 7950X': { cores: 16, threads: 32, boost: 5.7, tdp: 170, brand: 'AMD' },
  'Ryzen 9 7900X': { cores: 12, threads: 24, boost: 5.6, tdp: 170, brand: 'AMD' },
  'Ryzen 7 7800X3D': { cores: 8, threads: 16, boost: 5.0, tdp: 120, brand: 'AMD' },
  'Ryzen 7 7700X': { cores: 8, threads: 16, boost: 5.4, tdp: 105, brand: 'AMD' },
  'Ryzen 7 5700X': { cores: 8, threads: 16, boost: 4.6, tdp: 65, brand: 'AMD' },
  'Ryzen 5 7600': { cores: 6, threads: 12, boost: 5.1, tdp: 65, brand: 'AMD' },
  'Ryzen 5 5600': { cores: 6, threads: 12, boost: 4.4, tdp: 65, brand: 'AMD' },
  'Ryzen 5 5500': { cores: 6, threads: 12, boost: 4.2, tdp: 65, brand: 'AMD' },
  'i9-14900K': { cores: 24, threads: 32, boost: 6.0, tdp: 253, brand: 'INTEL' },
  'i7-14700K': { cores: 20, threads: 28, boost: 5.6, tdp: 253, brand: 'INTEL' },
  'i5-14600KF': { cores: 14, threads: 20, boost: 5.3, tdp: 181, brand: 'INTEL' },
  'i5-14400F': { cores: 10, threads: 16, boost: 4.7, tdp: 148, brand: 'INTEL' },
  'i5-13400F': { cores: 10, threads: 16, boost: 4.6, tdp: 148, brand: 'INTEL' },
  'i3-12100F': { cores: 4, threads: 8, boost: 4.3, tdp: 58, brand: 'INTEL' },
};

const DISCONTINUED_PRODUCTS = ['Ballistix', 'GTX 1050', 'GTX 1650 Super', 'RX 580', 'RX 570'];

// ========== VALIDATORS ==========
let errors = 0;
let warnings = 0;
let passes = 0;

function error(msg) { console.error(`  ❌ ERROR: ${msg}`); errors++; }
function warn(msg) { console.warn(`  ⚠️  WARN: ${msg}`); warnings++; }
function pass(msg) { console.log(`  ✅ ${msg}`); passes++; }

function validateGPU(item) {
  // Find matching reference spec
  let refKey = null;
  for (const key of Object.keys(GPU_SPECS)) {
    if (item.name.includes(key)) { refKey = key; break; }
  }

  if (!refKey) {
    warn(`GPU "${item.name}" — sem spec de referência para validar`);
    return;
  }

  const ref = GPU_SPECS[refKey];

  // Validate TDP
  if (item.tdp !== ref.tdp) {
    error(`${item.name}: TDP ${item.tdp}W ≠ referência ${ref.tdp}W`);
  } else {
    pass(`${item.name}: TDP ${item.tdp}W ✓`);
  }

  // Validate brand
  if (item.brand !== ref.brand) {
    error(`${item.name}: Brand "${item.brand}" ≠ referência "${ref.brand}"`);
  }

  // Validate memory in name
  if (!item.name.includes(ref.memType)) {
    error(`${item.name}: Nome deveria incluir "${ref.memType}" (tipo de memória correto)`);
  } else {
    pass(`${item.name}: Tipo de memória ${ref.memType} ✓`);
  }

  // Validate VRAM in name
  if (!item.name.includes(ref.vram)) {
    error(`${item.name}: Nome deveria incluir "${ref.vram}" (VRAM)`);
  }
}

function validateCPU(item) {
  let refKey = null;
  for (const key of Object.keys(CPU_SPECS)) {
    if (item.name.includes(key)) { refKey = key; break; }
  }

  if (!refKey) {
    warn(`CPU "${item.name}" — sem spec de referência`);
    return;
  }

  const ref = CPU_SPECS[refKey];

  // Validate TDP
  if (item.tdp !== ref.tdp) {
    error(`${item.name}: TDP ${item.tdp}W ≠ referência ${ref.tdp}W`);
  } else {
    pass(`${item.name}: TDP ${item.tdp}W ✓`);
  }

  // Validate cores/threads in name
  const coreStr = `${ref.cores}C/${ref.threads}T`;
  if (!item.name.includes(coreStr)) {
    error(`${item.name}: Deveria incluir "${coreStr}" (cores/threads)`);
  } else {
    pass(`${item.name}: ${coreStr} ✓`);
  }

  // Validate boost clock in name (handle .0 decimals with toFixed)
  const boostStr = `${ref.boost.toFixed(1)}GHz`;
  if (!item.name.includes(boostStr)) {
    error(`${item.name}: Deveria incluir "${boostStr}" (boost clock)`);
  } else {
    pass(`${item.name}: Boost ${boostStr} ✓`);
  }

  // Validate brand
  if (item.brand !== ref.brand) {
    error(`${item.name}: Brand "${item.brand}" ≠ referência "${ref.brand}"`);
  }
}

function validateCommon(item, catId) {
  // Required fields
  if (!item.brand) error(`${catId}: item sem brand`);
  if (!item.name) error(`${catId}: item sem name`);
  if (!item.price || item.price <= 0) error(`${item.name}: preço inválido (${item.price})`);
  if (!item.image) error(`${item.name}: sem imagem`);
  if (!item.store) error(`${item.name}: sem store`);

  // Price range validation (per skill 03)
  if (item.price < 50) error(`${item.name}: preço muito baixo R$${item.price} (< R$50)`);
  if (item.price > 50000) error(`${item.name}: preço muito alto R$${item.price} (> R$50.000)`);

  // Score validation
  if (item.score !== null && item.score !== undefined) {
    if (item.score < 0 || item.score > 100) error(`${item.name}: score fora do range (${item.score})`);
  }

  // TDP validation
  if (item.tdp !== null && item.tdp !== undefined) {
    if (item.tdp < 10 || item.tdp > 600) error(`${item.name}: TDP fora do range (${item.tdp}W)`);
  }

  // Check for discontinued products
  for (const disc of DISCONTINUED_PRODUCTS) {
    if (item.name.includes(disc)) {
      error(`${item.name}: produto descontinuado "${disc}"`);
    }
  }

  // Image path validation
  if (item.image && !item.image.startsWith('/images/products/')) {
    warn(`${item.name}: imagem não está no path padrão (${item.image})`);
  }
}

function validateStats(data) {
  console.log('\n📊 VALIDAÇÃO DE ESTATÍSTICAS:');
  
  let totalModels = 0;
  const allBrands = new Set();
  
  for (const [catId, items] of Object.entries(data)) {
    totalModels += items.length;
    items.forEach(i => allBrands.add(i.brand));
    
    // Check for duplicates
    const names = items.map(i => i.name);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      error(`${catId}: tem nomes duplicados!`);
      const dupes = names.filter((name, idx) => names.indexOf(name) !== idx);
      dupes.forEach(d => error(`  → Duplicado: "${d}"`));
    } else {
      pass(`${catId}: ${items.length} produtos sem duplicatas`);
    }

    // Verify sort order (should be by price ascending)
    let isSorted = true;
    for (let i = 1; i < items.length; i++) {
      if (items[i].price < items[i-1].price) {
        isSorted = false;
        break;
      }
    }
    if (!isSorted) {
      warn(`${catId}: produtos não estão ordenados por preço`);
    }
  }

  console.log(`\n  📦 Total: ${totalModels} produtos`);
  console.log(`  🏷️  Marcas: ${allBrands.size} (${[...allBrands].sort().join(', ')})`);
  console.log(`  📂 Categorias: ${Object.keys(data).length}`);
}

// ========== MAIN ==========
function main() {
  console.log('🔍 XGaming — Validador de Dados');
  console.log(`📅 ${new Date().toLocaleString('pt-BR')}\n`);

  const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));

  // Validate GPUs
  console.log('🎮 VALIDANDO GPUs:');
  data.gpu?.forEach(item => { validateCommon(item, 'gpu'); validateGPU(item); });

  // Validate CPUs
  console.log('\n⚡ VALIDANDO CPUs:');
  data.cpu?.forEach(item => { validateCommon(item, 'cpu'); validateCPU(item); });

  // Validate Mobos
  console.log('\n🔧 VALIDANDO PLACAS-MÃE:');
  data.mobo?.forEach(item => validateCommon(item, 'mobo'));

  // Validate RAM
  console.log('\n💾 VALIDANDO RAM:');
  data.ram?.forEach(item => validateCommon(item, 'ram'));

  // Validate SSDs
  console.log('\n💿 VALIDANDO SSDs:');
  data.ssd?.forEach(item => validateCommon(item, 'ssd'));

  // Validate Monitors
  console.log('\n🖥️  VALIDANDO MONITORES:');
  data.monitor?.forEach(item => validateCommon(item, 'monitor'));

  // Stats
  validateStats(data);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📋 RESULTADO FINAL:`);
  console.log(`  ✅ Passes: ${passes}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log(`\n${errors === 0 ? '🎉 VALIDAÇÃO APROVADA!' : '🚫 VALIDAÇÃO REPROVADA — corrigir erros acima'}\n`);

  process.exit(errors > 0 ? 1 : 0);
}

main();
