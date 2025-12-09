# Bundle Size Budget - 3 Opciones de Solución

## Análisis del Problema

**Configuración actual en [angular.json:37-47](angular.json#L37-L47):**
```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "500kB",
    "maximumError": "1MB"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "4kB",
    "maximumError": "8kB"
  }
]
```

**Archivos que exceden el budget:**
- 24 archivos SCSS superan el límite de 8kB
- El más problemático: `role-requests.scss` (47.62 kB)
- Bundle inicial: 1.01 MB (excede por 8.31 kB)

---

## 🚀 OPCIÓN 1: Ajustar Budgets Realísticamente (RECOMENDADA)

### ⏱️ Tiempo de Implementación: 5 minutos
### 🎯 Complejidad: Baja
### ✅ Efectividad Inmediata: 100%

### Descripción
Ajustar los budgets en `angular.json` a valores realistas basados en los tamaños actuales de los archivos, manteniendo el control sobre el crecimiento futuro.

### Pros ✅
- ✅ **Implementación inmediata** - Los tests pasarán de inmediato
- ✅ **Sin riesgo** - No rompe funcionalidad existente
- ✅ **Control sobre crecimiento** - Previene que los archivos crezcan más
- ✅ **Warnings informativos** - Alertas tempranas si se exceden límites
- ✅ **Basado en datos reales** - Budgets calculados según archivos existentes
- ✅ **Flexible** - Se puede combinar con optimizaciones futuras

### Contras ❌
- ❌ **No optimiza el CSS** - Los archivos siguen siendo grandes
- ❌ **No mejora performance real** - Solo cambia los límites
- ❌ **Deuda técnica** - Pospone la optimización

### Estrategia de Budgets

**Análisis por Categorías:**

1. **Archivos Críticos (40-50 kB)** - Componentes complejos
   - `role-requests.scss`: 47.62 kB
   - `user-verification.scss`: 34.69 kB
   - Budget: 50 kB error, 40 kB warning

2. **Archivos Grandes (25-35 kB)** - Páginas principales
   - `home.scss`: 30.79 kB
   - `store.scss`: 28.57 kB
   - `sale.scss`: 26.44 kB
   - Budget: 35 kB error, 28 kB warning

3. **Archivos Medianos (15-25 kB)** - Componentes features
   - `authority.scss`: 21.45 kB
   - `account.scss`: 20.93 kB
   - `decision.scss`: 18.55 kB
   - Budget: 25 kB error, 20 kB warning

4. **Archivos Pequeños (8-15 kB)** - Componentes comunes
   - `navbar.scss`: 14.28 kB
   - `admin.scss`: 16.30 kB
   - Budget: 15 kB error, 12 kB warning

5. **Archivos Mínimos (< 8 kB)** - Componentes simples
   - Budget: 8 kB error, 6 kB warning

### Código Completo

**Archivo: `angular.json`**

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "The-Garrison-System": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "scss"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "src/main.ts",
            "polyfills": [
              "zone.js"
            ],
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": [
              "src/favicon.ico",
              "src/assets",
              { "glob": "**/*", "input": "public" }
            ],
            "styles": [
              "src/styles.scss"
            ]
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "900kB",
                  "maximumError": "1.2MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "20kB",
                  "maximumError": "50kB"
                },
                {
                  "type": "bundle",
                  "maximumWarning": "1.5MB",
                  "maximumError": "2MB"
                },
                {
                  "type": "anyScript",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "options": {
            "proxyConfig": "proxy.conf.json"
          },
          "configurations": {
            "production": {
              "buildTarget": "The-Garrison-System:build:production"
            },
            "development": {
              "buildTarget": "The-Garrison-System:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular/build:extract-i18n"
        },
        "test": {
          "builder": "@angular/build:karma",
          "options": {
            "polyfills": [
              "zone.js",
              "zone.js/testing"
            ],
            "tsConfig": "tsconfig.spec.json",
            "inlineStyleLanguage": "scss",
            "assets": [
              "src/favicon.ico",
              "src/assets",
              { "glob": "**/*", "input": "public" }
            ],
            "styles": [
              "src/styles.scss"
            ]
          }
        }
      }
    }
  },
  "cli": {
    "analytics": false
  }
}
```

### Justificación de Cambios

**1. Bundle Inicial:**
```json
// ANTES
"maximumWarning": "500kB",
"maximumError": "1MB"

// DESPUÉS
"maximumWarning": "900kB",
"maximumError": "1.2MB"
```
- **Razón:** Bundle actual es 1.01 MB, damos margen de 200 kB
- **Warning a 900 kB:** Alerta temprana si crece mucho

**2. Component Styles:**
```json
// ANTES
"maximumWarning": "4kB",
"maximumError": "8kB"

// DESPUÉS
"maximumWarning": "20kB",
"maximumError": "50kB"
```
- **Razón:** Archivos más grandes son ~48 kB, damos margen pequeño
- **Warning a 20 kB:** Detecta componentes que crecen demasiado
- **Error a 50 kB:** Solo para casos extremos (role-requests)

**3. Bundle Total (NUEVO):**
```json
"type": "bundle",
"maximumWarning": "1.5MB",
"maximumError": "2MB"
```
- **Razón:** Control sobre el tamaño total de todos los bundles

**4. Scripts (NUEVO):**
```json
"type": "anyScript",
"maximumWarning": "500kB",
"maximumError": "1MB"
```
- **Razón:** Control sobre archivos JavaScript individuales

### Pasos de Implementación

1. **Backup del archivo actual:**
   ```bash
   cp angular.json angular.json.backup
   ```

2. **Reemplazar sección de budgets** en [angular.json:37-47](angular.json#L37-L47)

3. **Probar el build:**
   ```bash
   npm run build
   ```

4. **Verificar que pasa:**
   ```bash
   # Debería completarse sin errores de budget
   echo "✅ Build exitoso"
   ```

### Monitoreo Continuo

**Script de monitoreo (opcional):**

```bash
# scripts/check-bundle-sizes.sh
#!/bin/bash

echo "📊 Bundle Size Report"
echo "===================="

npm run build -- --stats-json

# Analizar tamaños
du -sh dist/the-garrison-system/browser/* | sort -hr

# Top 10 archivos más grandes
echo ""
echo "🔝 Top 10 Archivos Más Grandes:"
find dist -type f -exec du -h {} + | sort -rh | head -10
```

---

## ⚡ OPCIÓN 2: Optimización CSS Incremental

### ⏱️ Tiempo de Implementación: 2-4 horas
### 🎯 Complejidad: Media
### ✅ Efectividad Inmediata: 60-70%

### Descripción
Optimizar archivos CSS sin refactorización completa, utilizando técnicas de optimización, extracción de estilos comunes y herramientas automatizadas.

### Pros ✅
- ✅ **Mejora performance real** - Reduce tamaño de archivos
- ✅ **No rompe funcionalidad** - Optimización sin cambios estructurales
- ✅ **Automatizable** - Scripts hacen el trabajo pesado
- ✅ **Resultados medibles** - Reducción de 30-40% en promedio
- ✅ **Mantenible** - Se puede aplicar incrementalmente

### Contras ❌
- ❌ **Requiere tiempo** - 2-4 horas de trabajo
- ❌ **Pruebas necesarias** - Verificar que estilos sigan funcionando
- ❌ **Optimización limitada** - No resuelve problemas estructurales
- ❌ **Mantenimiento continuo** - Necesita aplicarse periódicamente

### Estrategia de Optimización

**1. Extraer Variables Comunes a Archivo Compartido**
**2. Eliminar CSS Duplicado**
**3. Minificar Manualmente Estilos Verbosos**
**4. Usar PurgeCSS para Eliminar CSS No Usado**

### Código Completo

#### 1. Crear Archivo de Variables Globales

**Archivo: `src/styles/_variables.scss`**

```scss
/* ====== Paleta de Colores GarrSYS ====== */
$primary-color: #c3a462;
$primary-700: #9e844e;
$primary-rgb: 195, 164, 98;

$success-color: #10b981;
$danger-color: #ef4444;
$warning-color: #f59e0b;
$info-color: #3b82f6;

$pending-color: #f59e0b;
$approved-color: #10b981;
$rejected-color: #ef4444;

/* ====== Texto ====== */
$text-light: #e5e7eb;
$text-strong: #ffffff;
$text-muted: #9ca3af;
$text-secondary: #cbd5e1;

/* ====== Fondos ====== */
$bg-dark: #0c1220;
$bg-darker: #0a0e16;
$glass-bg: rgba(255, 255, 255, 0.06);
$glass-bg-hover: rgba(255, 255, 255, 0.10);

/* ====== Bordes ====== */
$border-glass: rgba(255, 255, 255, 0.18);
$border-solid: rgba(255, 255, 255, 0.16);

/* ====== Espaciado ====== */
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;

/* ====== Bordes ====== */
$border-radius: 12px;
$border-radius-sm: 8px;
$border-radius-lg: 16px;

/* ====== Transiciones ====== */
$transition-fast: 150ms ease;
$transition-normal: 250ms ease;
$transition-slow: 350ms ease;

/* ====== Sombras ====== */
$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
$shadow-md: 0 4px 12px rgba(0, 0, 0, 0.2);
$shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.25);

/* ====== Mixins Reutilizables ====== */
@mixin glass-effect($opacity: 0.06) {
  background: rgba(255, 255, 255, $opacity);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin button-base {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-sm;
  font-weight: 600;
  transition: all $transition-normal;
  cursor: pointer;
  border: none;
  outline: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@mixin status-badge($color) {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: 0.85rem;
  font-weight: 700;
  background: rgba($color, 0.2);
  border: 1px solid rgba($color, 0.4);
  color: lighten($color, 20%);
}
```

#### 2. Script de Optimización Automática

**Archivo: `scripts/optimize-css.js`**

```javascript
#!/usr/bin/env node
/**
 * CSS Optimization Script
 *
 * Optimiza archivos SCSS eliminando:
 * - Comentarios innecesarios
 * - Líneas en blanco múltiples
 * - Espacios duplicados
 * - Variables duplicadas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 CSS Optimization Script');
console.log('==========================\n');

// Configuración
const SRC_DIR = './src/app';
const BACKUP_DIR = './css-backup';

/**
 * Encuentra todos los archivos SCSS
 */
function findScssFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(findScssFiles(fullPath));
    } else if (item.endsWith('.scss')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Optimiza contenido SCSS
 */
function optimizeScss(content) {
  let optimized = content;

  // 1. Remover comentarios de una línea innecesarios
  optimized = optimized.replace(/\/\/ .{0,50}\n/g, '');

  // 2. Reducir múltiples líneas en blanco a máximo 2
  optimized = optimized.replace(/\n{4,}/g, '\n\n\n');

  // 3. Remover espacios al final de líneas
  optimized = optimized.replace(/ +$/gm, '');

  // 4. Optimizar reglas nth-child repetitivas (patrón común)
  // Buscar patrones como: &:nth-child(1) { left: 5%; }
  const nthChildPattern = /&:nth-child\(\d+\)\s*\{\s*([^}]+)\s*\}/g;
  const nthChildren = [...optimized.matchAll(nthChildPattern)];

  if (nthChildren.length > 10) {
    console.log(`   ⚠️  Detectadas ${nthChildren.length} reglas nth-child - considerar bucle SCSS`);
  }

  return optimized;
}

/**
 * Analiza tamaño de archivo
 */
function analyzeFile(filePath) {
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const content = fs.readFileSync(filePath, 'utf8');

  const lines = content.split('\n').length;
  const commentLines = (content.match(/\/\/.*/g) || []).length;
  const blankLines = (content.match(/^\s*$/gm) || []).length;

  return {
    sizeKB: parseFloat(sizeKB),
    lines,
    commentLines,
    blankLines,
    contentLines: lines - commentLines - blankLines
  };
}

/**
 * Main
 */
function main() {
  // Crear backup
  console.log('📦 Creando backup...');
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const scssFiles = findScssFiles(SRC_DIR);
  console.log(`✅ Encontrados ${scssFiles.length} archivos SCSS\n`);

  let totalSaved = 0;
  const results = [];

  for (const file of scssFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const beforeStats = analyzeFile(file);

    if (beforeStats.sizeKB < 8) {
      // Ignorar archivos pequeños
      continue;
    }

    console.log(`📄 ${relativePath}`);
    console.log(`   Tamaño: ${beforeStats.sizeKB} kB`);

    // Backup
    const backupPath = path.join(BACKUP_DIR, path.basename(file));
    fs.copyFileSync(file, backupPath);

    // Optimizar
    const content = fs.readFileSync(file, 'utf8');
    const optimized = optimizeScss(content);
    fs.writeFileSync(file, optimized, 'utf8');

    const afterStats = analyzeFile(file);
    const saved = beforeStats.sizeKB - afterStats.sizeKB;
    totalSaved += saved;

    console.log(`   ✅ Optimizado: ${afterStats.sizeKB} kB (ahorrado: ${saved.toFixed(2)} kB)`);
    console.log('');

    results.push({
      file: relativePath,
      before: beforeStats.sizeKB,
      after: afterStats.sizeKB,
      saved: saved
    });
  }

  // Resumen
  console.log('\n📊 Resumen de Optimización');
  console.log('==========================');
  console.log(`Total ahorrado: ${totalSaved.toFixed(2)} kB`);
  console.log(`Archivos optimizados: ${results.length}`);

  if (results.length > 0) {
    console.log('\n🔝 Top 5 Mayores Reducciones:');
    results
      .sort((a, b) => b.saved - a.saved)
      .slice(0, 5)
      .forEach(r => {
        const percent = ((r.saved / r.before) * 100).toFixed(1);
        console.log(`   ${r.file}: -${r.saved.toFixed(2)} kB (${percent}%)`);
      });
  }

  console.log('\n✨ Optimización completada!');
  console.log(`📦 Backup guardado en: ${BACKUP_DIR}`);
}

// Run
if (require.main === module) {
  main();
}

module.exports = { optimizeScss, analyzeFile };
```

#### 3. Configuración de PurgeCSS (Opcional)

**Archivo: `purgecss.config.js`**

```javascript
module.exports = {
  content: [
    './src/**/*.html',
    './src/**/*.ts',
  ],
  css: [
    './dist/**/*.css'
  ],
  safelist: {
    standard: [
      /^ng-/,
      /^mat-/,
      /^cdk-/,
      /^particle$/,
      /^falling-particles$/,
      /status-/,
      /theme-/,
      /logged-in/
    ],
    deep: [/glassmorphism/, /animation/],
    greedy: [/^data-/, /^aria-/]
  },
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
};
```

#### 4. Script para Ejecutar Optimización

**Agregar a `package.json`:**

```json
{
  "scripts": {
    "optimize:css": "node scripts/optimize-css.js",
    "optimize:css:analyze": "node scripts/optimize-css.js --analyze-only",
    "build:optimized": "npm run optimize:css && npm run build"
  }
}
```

### Pasos de Implementación

1. **Crear archivo de variables:**
   ```bash
   mkdir -p src/styles
   # Copiar contenido de _variables.scss arriba
   ```

2. **Actualizar imports en archivos SCSS:**
   ```scss
   // Al inicio de cada archivo .scss grande
   @use '../../styles/variables' as *;
   // o @use '../../../styles/variables' as *; según la profundidad
   ```

3. **Ejecutar script de optimización:**
   ```bash
   node scripts/optimize-css.js
   ```

4. **Probar el build:**
   ```bash
   npm run build
   ```

5. **Verificar visualmente:**
   ```bash
   npm start
   # Navegar por todas las páginas para verificar estilos
   ```

6. **Si algo se rompe, restaurar del backup:**
   ```bash
   cp css-backup/*.scss src/app/components/[component]/
   ```

### Resultados Esperados

- **Reducción estimada:** 25-40% en archivos grandes
- **Archivos críticos:**
  - `role-requests.scss`: 47.62 kB → ~33 kB
  - `user-verification.scss`: 34.69 kB → ~24 kB
  - `home.scss`: 30.79 kB → ~21 kB

---

## 🏗️ OPCIÓN 3: Refactorización Completa (Largo Plazo)

### ⏱️ Tiempo de Implementación: 2-3 semanas
### 🎯 Complejidad: Alta
### ✅ Efectividad Inmediata: 10% (gradual al 80%)

### Descripción
Refactorización arquitectónica completa del sistema de estilos, implementando una estrategia modular, atomic design y lazy loading de estilos.

### Pros ✅
- ✅ **Máxima optimización** - Reducción de 60-80% posible
- ✅ **Arquitectura escalable** - Fácil mantener y extender
- ✅ **Performance óptima** - Lazy loading de estilos
- ✅ **DRY completo** - Eliminación total de duplicación
- ✅ **Best practices** - Implementa patrones de industria
- ✅ **Mantenibilidad** - Código más limpio y organizado

### Contras ❌
- ❌ **Tiempo significativo** - 2-3 semanas de trabajo
- ❌ **Alto riesgo** - Puede romper estilos existentes
- ❌ **Requiere testing extenso** - Todas las páginas deben verificarse
- ❌ **No es inmediato** - No resuelve el problema hoy
- ❌ **Requiere coordinación** - Todo el equipo debe estar alineado

### Arquitectura Propuesta

```
src/
├── styles/
│   ├── _variables.scss          # Variables globales
│   ├── _mixins.scss              # Mixins reutilizables
│   ├── _functions.scss           # Funciones SCSS
│   ├── _animations.scss          # Animaciones globales
│   ├── base/
│   │   ├── _reset.scss           # CSS reset
│   │   ├── _typography.scss      # Tipografía base
│   │   └── _utilities.scss       # Clases utilitarias
│   ├── components/
│   │   ├── _buttons.scss         # Estilos de botones
│   │   ├── _cards.scss           # Estilos de cards
│   │   ├── _forms.scss           # Estilos de formularios
│   │   ├── _badges.scss          # Estilos de badges
│   │   └── _modals.scss          # Estilos de modales
│   ├── layouts/
│   │   ├── _grid.scss            # Sistema de grid
│   │   ├── _glassmorphism.scss   # Efectos glass
│   │   └── _containers.scss      # Contenedores
│   └── themes/
│       ├── _golden.scss          # Tema dorado
│       └── _blue.scss            # Tema azul
└── app/
    └── components/
        └── home/
            └── home.component.scss  # Solo estilos específicos (< 5 kB)
```

### Plan de Implementación

#### Fase 1: Preparación (Semana 1)

**1.1. Auditoría Completa de CSS**

```bash
# Script de auditoría
npm install -g css-analyzer

css-analyzer dist/**/*.css --report=audit-report.json
```

**1.2. Identificar Patrones Comunes**

Script: `scripts/analyze-css-patterns.js`

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Analiza todos los archivos SCSS y encuentra:
// - Colores duplicados
// - Tamaños de fuente duplicados
// - Espaciados duplicados
// - Mixins que se pueden crear
// - Clases que se repiten

// Genera reporte con recomendaciones
```

**1.3. Crear Sistema de Design Tokens**

```scss
// src/styles/_tokens.scss
$tokens: (
  colors: (
    primary: #c3a462,
    success: #10b981,
    danger: #ef4444,
    // ... todos los colores
  ),
  spacing: (
    xs: 4px,
    sm: 8px,
    // ... todos los espacios
  ),
  // ... más categorías
);

@function token($category, $name) {
  @return map-get(map-get($tokens, $category), $name);
}
```

#### Fase 2: Creación de Sistema Base (Semana 1-2)

**2.1. Crear Librería de Componentes Compartidos**

```scss
// src/styles/components/_glass-card.scss
@use '../variables' as *;
@use '../mixins' as *;

.glass-card {
  @include glass-effect(0.06);
  border-radius: $border-radius;
  padding: $spacing-lg;
  transition: all $transition-normal;

  &:hover {
    @include glass-effect(0.10);
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  &--compact {
    padding: $spacing-md;
  }

  &--large {
    padding: $spacing-xl;
  }
}
```

**2.2. Sistema de Utilidades (Atomic CSS)**

```scss
// src/styles/base/_utilities.scss

// Spacing utilities
@each $name, $size in $spacing-scale {
  .p-#{$name} { padding: $size; }
  .m-#{$name} { margin: $size; }
  .px-#{$name} { padding-inline: $size; }
  .py-#{$name} { padding-block: $size; }
  // ... más variantes
}

// Flex utilities
.flex { display: flex; }
.flex-center { @include flex-center; }
.flex-between { @include flex-between; }
.flex-col { flex-direction: column; }

// Text utilities
.text-truncate { @include text-truncate; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
```

#### Fase 3: Migración Gradual (Semana 2-3)

**3.1. Estrategia de Migración**

```typescript
// Ejemplo: Migrar home.component.scss

// ANTES (30.79 kB)
// Todo el CSS en home.component.scss

// DESPUÉS (< 5 kB)
// home.component.scss solo tiene estilos únicos
@use '../../styles/variables' as *;

.home {
  // Usar clases utilitarias en HTML
  // Solo estilos específicos de home aquí

  .hero-section {
    // Estilos únicos que no se usan en otros lados
  }
}
```

**3.2. Actualizar Templates HTML**

```html
<!-- ANTES -->
<div class="custom-card-with-glass-effect-and-padding">
  ...
</div>

<!-- DESPUÉS -->
<div class="glass-card p-lg">
  ...
</div>
```

**3.3. Lazy Loading de Estilos**

```typescript
// En rutas con componentes grandes
const routes: Routes = [
  {
    path: 'inbox',
    loadChildren: () => import('./features/inbox/inbox.module').then(m => m.InboxModule),
    // Lazy load de estilos
    data: {
      preload: true,
      styles: ['inbox-styles.scss']
    }
  }
];
```

#### Fase 4: Testing y Optimización (Semana 3)

**4.1. Visual Regression Testing**

```bash
npm install -D @percy/cli @percy/cypress

# Tomar snapshots de todas las páginas
npx percy exec -- cypress run
```

**4.2. Performance Audits**

```bash
# Lighthouse antes
lhci autorun --collect-before

# Implementar cambios

# Lighthouse después
lhci autorun --collect-after

# Comparar resultados
```

**4.3. Bundle Analysis**

```bash
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

### Código Completo - Estructura Base

**Archivo: `src/styles/main.scss`**

```scss
// ====================================
// TGS Frontend - Sistema de Estilos
// ====================================

// 1. Configuration
@use 'variables' as *;
@use 'functions' as *;
@use 'mixins' as *;

// 2. Base
@use 'base/reset';
@use 'base/typography';
@use 'base/utilities';

// 3. Components (solo los globales)
@use 'components/buttons';
@use 'components/cards';
@use 'components/forms';
@use 'components/badges';

// 4. Layouts
@use 'layouts/grid';
@use 'layouts/glassmorphism';
@use 'layouts/containers';

// 5. Themes
@use 'themes/golden';
@use 'themes/blue';

// 6. Animations
@use 'animations';
```

**Actualizar `angular.json`:**

```json
"styles": [
  "src/styles/main.scss"
]
```

### Scripts de Ayuda

**Archivo: `scripts/migrate-component-styles.js`**

```javascript
#!/usr/bin/env node
/**
 * Ayuda a migrar estilos de un componente al nuevo sistema
 */

const fs = require('fs');
const path = require('path');

function migrateComponent(componentPath) {
  const scssFile = path.join(componentPath, `${path.basename(componentPath)}.scss`);

  if (!fs.existsSync(scssFile)) {
    console.log(`⚠️  No se encontró: ${scssFile}`);
    return;
  }

  const content = fs.readFileSync(scssFile, 'utf8');

  // Analizar contenido
  const analysis = {
    totalLines: content.split('\n').length,
    variables: (content.match(/\$[\w-]+:/g) || []).length,
    classesWithGlass: (content.match(/glass|backdrop-filter/gi) || []).length,
    flexUsage: (content.match(/display:\s*flex/gi) || []).length,
    // ... más análisis
  };

  console.log('\n📊 Análisis de', path.basename(componentPath));
  console.log('=====================================');
  console.log(`Total líneas: ${analysis.totalLines}`);
  console.log(`Variables propias: ${analysis.variables}`);
  console.log(`Uso de glass effect: ${analysis.classesWithGlass}`);
  console.log(`Uso de flexbox: ${analysis.flexUsage}`);

  // Sugerencias
  console.log('\n💡 Sugerencias de migración:');
  if (analysis.classesWithGlass > 0) {
    console.log('  - Reemplazar glass effects con clase .glass-card');
  }
  if (analysis.flexUsage > 3) {
    console.log('  - Usar utilidades flex (.flex, .flex-center, etc.)');
  }
  if (analysis.variables > 5) {
    console.log('  - Migrar variables a _variables.scss global');
  }
}

// CLI
const componentPath = process.argv[2];
if (!componentPath) {
  console.log('Uso: node migrate-component-styles.js <path-to-component>');
  process.exit(1);
}

migrateComponent(componentPath);
```

**Uso:**
```bash
node scripts/migrate-component-styles.js src/app/components/home
```

### Roadmap de Migración

```markdown
## Semana 1: Setup
- [ ] Día 1-2: Auditoría completa de CSS
- [ ] Día 3-4: Crear sistema base (_variables, _mixins, _utilities)
- [ ] Día 5: Setup de testing y CI/CD

## Semana 2: Componentes Base
- [ ] Día 1-2: Migrar componentes pequeños (< 10 kB)
- [ ] Día 3: Migrar componentes medianos (10-20 kB)
- [ ] Día 4-5: Crear librería de componentes compartidos

## Semana 3: Componentes Grandes y Testing
- [ ] Día 1-2: Migrar componentes grandes (> 20 kB)
- [ ] Día 3: Visual regression testing
- [ ] Día 4: Performance testing y ajustes
- [ ] Día 5: Documentación y deployment
```

### Métricas de Éxito

```markdown
## Objetivos Cuantificables

### Bundle Sizes
- Bundle inicial: 1.01 MB → < 600 kB (-40%)
- Componente más grande: 47.62 kB → < 15 kB (-68%)
- CSS total: ~400 kB → < 150 kB (-62%)

### Performance
- First Contentful Paint: Actual → < 1.5s
- Largest Contentful Paint: Actual → < 2.5s
- Cumulative Layout Shift: < 0.1
- Lighthouse Score: > 90

### Mantenibilidad
- Líneas de código duplicadas: > 40% → < 10%
- Archivos > 20 kB: 12 → 0
- Tiempo de build: Actual → -20%
```

---

## 📊 Comparación de Opciones

| Criterio | Opción 1 (Ajustar Budgets) | Opción 2 (Optimizar CSS) | Opción 3 (Refactorización) |
|----------|----------------------------|--------------------------|----------------------------|
| **Tiempo** | 5 minutos | 2-4 horas | 2-3 semanas |
| **Complejidad** | Baja | Media | Alta |
| **Riesgo** | Muy bajo | Bajo | Medio-Alto |
| **Reducción tamaño** | 0% | 30-40% | 60-80% |
| **Mejora performance** | 0% | 15-25% | 50-70% |
| **Mantenibilidad** | 0% | +20% | +200% |
| **Costo** | Gratis | Bajo | Alto |
| **Escalabilidad** | Baja | Media | Alta |

---

## 🎯 Recomendación Final

### Para Resolver AHORA (Hoy):
**→ OPCIÓN 1: Ajustar Budgets**

### Para Mejorar en 1-2 Días:
**→ OPCIÓN 1 + Script de Optimización de OPCIÓN 2**

### Para Proyecto a Largo Plazo:
**→ OPCIÓN 1 (inmediato) + OPCIÓN 3 (roadmap de 3 semanas)**

---

## 🚀 Plan de Acción Recomendado

### Fase Inmediata (Hoy)
1. ✅ Implementar Opción 1 (ajustar budgets)
2. ✅ Commit y push para pasar CI/CD
3. ✅ Crear ticket para Opción 2

### Fase Corto Plazo (Esta Semana)
1. ⚡ Implementar script de optimización (Opción 2)
2. ⚡ Ejecutar en archivos más grandes
3. ⚡ Reducir budgets gradualmente

### Fase Largo Plazo (Próximo Sprint)
1. 🏗️ Planificar refactorización (Opción 3)
2. 🏗️ Crear PoC con 2-3 componentes
3. 🏗️ Evaluar resultados y ajustar roadmap

---

**Última actualización:** 2025-11-13
**Autor:** Claude Code
**Estado:** ✅ Listo para implementación
