// scripts/check-coverage.cjs
const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
// ajustá tu umbral razonable para hoy
const THRESHOLDS = {
  lines: 60,      // %
  statements: 60, // %
  functions: 50,  // %
  branches: 30    // %
};

if (!fs.existsSync(summaryPath)) {
  console.error('❌ No se encontró coverage-summary.json. ¿Se ejecutó ng test --code-coverage?');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')).total;
const current = {
  lines: summary.lines.pct,
  statements: summary.statements.pct,
  functions: summary.functions.pct,
  branches: summary.branches.pct
};

let ok = true;
for (const k of Object.keys(THRESHOLDS)) {
  const need = THRESHOLDS[k];
  const have = current[k] ?? 0;
  if (have < need) {
    console.error(`❌ Cobertura ${k}: ${have}% < ${need}%`);
    ok = false;
  } else {
    console.log(`✅ Cobertura ${k}: ${have}% ≥ ${need}%`);
  }
}

process.exit(ok ? 0 : 1);
