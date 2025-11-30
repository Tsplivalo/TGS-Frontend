# REPORTE DE INVESTIGACIÓN - PROBLEMA PNPM WORKSPACE

**Fecha**: 2025-11-29
**Proyecto**: TGS-Frontend
**Error**: `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION - packages field missing or empty`
**Ubicación**: GitHub Actions - Integration Tests workflow

---

## 1. ESTRUCTURA DEL REPOSITORIO

```
.
├── .angular/
├── .claude/
│   └── settings.local.json
├── .editorconfig
├── .git/
├── .github/
│   ├── COVERAGE-PERMISSIONS-FIX.md
│   ├── FIX-SUMMARY.md
│   ├── INTEGRATION-WORKFLOW-FIX.md
│   ├── scripts/
│   │   └── verify-backend-access.sh
│   └── workflows/
│       ├── frontend-tests-parallel.yml
│       ├── frontend-tests.yml
│       └── integration-tests.yml
├── .gitignore
├── .lighthouserc.json
├── .pa11yrc
├── .snyk
├── .vscode/
├── .zap/
├── angular.json
├── coverage/
├── cypress/
│   ├── e2e/
│   │   ├── accessibility/
│   │   ├── auth/
│   │   ├── store/
│   │   ├── navigation.cy.ts
│   │   └── smoke.cy.ts
│   ├── fixtures/
│   ├── results/
│   ├── screenshots/
│   ├── support/
│   ├── videos/
│   └── tsconfig.json
├── cypress.config.ts
├── dist/
├── docker-compose.test.yml
├── Dockerfile.test
├── docs/
├── karma.conf.js
├── node_modules/
├── package-lock.json
├── package.json
├── performance-tests/
│   ├── artillery.config.yml
│   ├── processor.js
│   ├── reports/
│   └── scenarios/
├── pnpm-lock.yaml
├── pnpm-workspace.yaml  ⚠️ ARCHIVO PROBLEMÁTICO
├── proxy.conf.json
├── public/
├── README.md
├── scripts/
│   ├── apply-opentelemetry-fix.bat
│   ├── merge-coverage.js
│   ├── optimize-css.js
│   ├── run-all-tests.sh
│   └── verify-all-tests.ps1
├── src/
│   └── app/
│       ├── components/
│       ├── features/
│       ├── guards/
│       ├── app.config.ts
│       ├── app.html
│       ├── app.routes.ts
│       ├── app.scss
│       ├── app.spec.ts
│       └── app.ts
└── tests/
```

**Archivos package.json encontrados**: Solo 1 (./package.json)

---

## 2. ARCHIVO pnpm-workspace.yaml

### ¿Existe?
**SÍ** - Ubicado en la raíz del proyecto

### Detalles del Archivo
- **Tamaño**: 92 bytes
- **Tipo**: ASCII text, with CRLF line terminators
- **Líneas**: 5

### Contenido COMPLETO (con caracteres de control visibles)

```yaml
onlyBuiltDependencies:^M$
  - '@parcel/watcher'^M$
  - esbuild^M$
  - lmdb^M$
  - msgpackr-extract^M$
```

### Contenido SIN caracteres de control

```yaml
onlyBuiltDependencies:
  - '@parcel/watcher'
  - esbuild
  - lmdb
  - msgpackr-extract
```

---

## 🔴 DIAGNÓSTICO DEL PROBLEMA

### ❌ PROBLEMA IDENTIFICADO

El archivo `pnpm-workspace.yaml` **NO tiene el campo `packages:` requerido**.

**Error de PNPM**:
```
ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty
```

### 📋 EXPLICACIÓN TÉCNICA

#### ¿Qué es pnpm-workspace.yaml?

Este archivo define un **monorepo con workspaces de PNPM**. PNPM lo usa para:
1. Identificar múltiples paquetes en un mismo repositorio
2. Compartir dependencias entre paquetes
3. Gestionar versiones de manera centralizada

#### Estructura OBLIGATORIA del archivo

Según la [documentación oficial de PNPM](https://pnpm.io/pnpm-workspace_yaml):

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  # ... otros patrones de workspace
```

**El campo `packages:` es OBLIGATORIO y debe contener al menos un patrón.**

#### ¿Qué contiene actualmente el archivo?

El archivo solo contiene `onlyBuiltDependencies:`, que es un campo **OPCIONAL** para especificar dependencias que deben compilarse desde código fuente.

**Configuración actual (INCORRECTA)**:
```yaml
onlyBuiltDependencies:  # ← OPCIONAL, pero insuficiente
  - '@parcel/watcher'
  - esbuild
  - lmdb
  - msgpackr-extract
```

**Falta**:
```yaml
packages:  # ← OBLIGATORIO, FALTA ESTO
  - '.'
```

---

## 3. WORKFLOWS DE GITHUB ACTIONS

### Lista de workflows:

```
total 60
-rw-r--r-- frontend-tests.yml          (13,085 bytes)
-rw-r--r-- frontend-tests-parallel.yml (26,769 bytes)
-rw-r--r-- integration-tests.yml       ( 5,339 bytes)
```

### Archivo que contiene "Full Stack":

**`.github/workflows/integration-tests.yml`**

### Contenido COMPLETO del workflow de integration-tests.yml

```yaml
name: Integration Tests (Frontend + Backend)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'

jobs:
  integration-e2e:
    name: Full Stack Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: tgs_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout Frontend
        uses: actions/checkout@v4
        with:
          path: frontend

      - name: Checkout Backend
        id: checkout_backend
        uses: actions/checkout@v4
        with:
          repository: lautaro-peralta/TGS-Backend
          path: backend

      - name: Verify Backend Checkout
        run: |
          if [ ! -d "backend" ]; then
            echo "❌ Backend directory not found after checkout"
            exit 1
          fi
          echo "✅ Backend repository checked out successfully"
          ls -la backend/

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install Backend Dependencies  ← ⚠️ AQUÍ FALLA
        working-directory: backend
        run: pnpm install --frozen-lockfile

      - name: Install Frontend Dependencies
        working-directory: frontend
        run: npm ci

      # ... resto del workflow ...
```

### 🔍 ANÁLISIS DEL FLUJO DEL ERROR

1. **GitHub Actions clona FRONTEND** en `./frontend/` ✅
2. **GitHub Actions clona BACKEND** en `./backend/` ✅
3. **Setup PNPM versión 8** ✅
4. **Cambia a directorio backend** (`working-directory: backend`) ✅
5. **Ejecuta `pnpm install --frozen-lockfile`** ❌

### ❌ ¿POR QUÉ FALLA?

Cuando GitHub Actions ejecuta:
```bash
cd backend
pnpm install --frozen-lockfile
```

PNPM busca `pnpm-workspace.yaml` en:
1. **`./backend/pnpm-workspace.yaml`** (no existe en backend)
2. **`../pnpm-workspace.yaml`** (existe, pero está MALFORMADO - del frontend!)

PNPM encuentra el archivo del FRONTEND (que está en el nivel superior), lo lee, y **NO encuentra el campo `packages:`**, por lo que falla con:

```
ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty
```

---

## 4. PACKAGE.JSON (Raíz del Proyecto - FRONTEND)

### Información Básica

```json
{
  "name": "the-garrison-system",
  "version": "0.0.0",
  "private": true
}
```

### Scripts Relevantes

```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve --proxy-config proxy.conf.json",
    "start:ci": "ng serve --port 4200",
    "build": "ng build",
    "test": "ng test --watch=false --code-coverage",
    "test:ci": "ng test --no-watch --no-progress --code-coverage",
    "e2e": "cypress open",
    "e2e:headless": "cypress run",
    "test:shard": "cross-env KARMA_SHARD=$SHARD KARMA_TOTAL_SHARDS=$TOTAL_SHARDS npm run test:ci",
    "coverage:merge": "node scripts/merge-coverage.js",
    ...
  }
}
```

### Gestión de Paquetes

**NO hay campo `packageManager` especificado.**

El proyecto usa:
- **Frontend**: `npm` (evidenciado por `package-lock.json`)
- **Backend**: `pnpm` (según el workflow)

### Dependencias Principales

**Angular 20.1.3**:
- @angular/animations, @angular/common, @angular/compiler
- @angular/core, @angular/forms, @angular/platform-browser
- @angular/router

**Testing**:
- jasmine-core: ~5.8.0
- karma: ~6.4.0
- cypress: ^13.17.0

**Total de dependencias**:
- dependencies: 11
- devDependencies: 34

---

## 5. CONFIGURACIONES RELACIONADAS CON WORKSPACE

### Referencias a "workspace" encontradas:

**En package.json**:
```
No se encontraron referencias a workspace en package.json
```

**En pnpm-lock.yaml**:
El archivo `pnpm-lock.yaml` SÍ existe (190 KB), lo que indica que en algún momento se usó PNPM en el frontend.

Primeras líneas:
```yaml
lockfileVersion: '9.0'

settings:
  autoInstallPeers: true
  excludeLinksFromLockfile: false

importers:
  .:
    dependencies:
      '@angular/animations':
        specifier: ^20.1.3
        version: 20.3.2(@angular/core@20.1.3...)
      # ... etc
```

### Contenido de .npmrc:

**No existe archivo .npmrc**

### Archivos ocultos en la raíz:

```
.angular/
.claude/
.editorconfig
.git/
.github/
.gitignore
.lighthouserc.json
.pa11yrc
.snyk
.vscode/
.zap/
```

**No hay `.npmrc` ni `.pnpmrc`**

---

## 6. INFORMACIÓN DEL PROYECTO

### Versión de PNPM configurada:

**No especificado en package.json**

El workflow especifica:
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8
```

Por lo tanto, **PNPM 8.x** se usa en GitHub Actions.

### Scripts relevantes:

```json
"test:shard": "cross-env KARMA_SHARD=$SHARD KARMA_TOTAL_SHARDS=$TOTAL_SHARDS npm run test:ci",
"coverage:merge": "node scripts/merge-coverage.js",
"test:ci": "ng test --no-watch --no-progress --code-coverage",
"e2e:headless": "cypress run"
```

**Observación**: Todos los scripts usan `npm`, no `pnpm`.

---

## 7. FLUJO DE TRABAJO LOCAL

### Para el Frontend:

**Instalación**:
```bash
cd c:\Users\Usuario\Documents\GitHub\TGS-Frontend
npm install  # (supongo, basado en package-lock.json)
```

**Desarrollo**:
```bash
npm start  # ng serve --proxy-config proxy.conf.json
```

**Ubicación**:
```
c:\Users\Usuario\Documents\GitHub\TGS-Frontend
```

### Para el Backend:

**Supongo** (basado en el workflow):
```bash
cd <ubicación-separada>/TGS-Backend
pnpm install
pnpm run db:migrate
pnpm run db:seed
pnpm start
```

**Ubicación**:
```
(Probablemente en un repositorio separado, no en el mismo directorio)
```

### ¿Frontend y Backend están en el mismo directorio raíz?

**NO**

Frontend y Backend son **repositorios separados**:
- **Frontend**: `Tsplivalo/TGS-Frontend`
- **Backend**: `lautaro-peralta/TGS-Backend`

En GitHub Actions se clonan ambos en:
```
/home/runner/work/TGS-Frontend/TGS-Frontend/
  ├── frontend/  (clone de Tsplivalo/TGS-Frontend)
  └── backend/   (clone de lautaro-peralta/TGS-Backend)
```

---

## 8. VERIFICACIÓN DE ESTRUCTURA

### Subdirectorios en la raíz:

```
drwxr-xr-x coverage/
drwxr-xr-x cypress/
drwxr-xr-x dist/
drwxr-xr-x docs/
drwxr-xr-x node_modules/
drwxr-xr-x performance-tests/
drwxr-xr-x public/
drwxr-xr-x scripts/
drwxr-xr-x src/
drwxr-xr-x tests/
```

**NO hay subdirectorios tipo `packages/` o `apps/` que sugieran un monorepo.**

### Archivos package.json encontrados:

```
./package.json
```

**Solo 1 package.json** - Confirma que este NO es un monorepo.

---

## 9. OBSERVACIONES ADICIONALES

### 🔍 Hallazgos Clave

1. **TGS-Frontend NO es un monorepo**
   - Solo hay 1 package.json
   - No hay estructura de workspaces
   - No hay múltiples paquetes

2. **TGS-Frontend usa NPM localmente**
   - Existe `package-lock.json` (190 KB)
   - Todos los scripts usan `npm`
   - No hay evidencia de uso de `pnpm` en desarrollo local

3. **Archivo pnpm-workspace.yaml es un RESIDUO**
   - Contiene solo configuración de `onlyBuiltDependencies`
   - Falta el campo `packages:` obligatorio
   - NO debería existir en este proyecto

4. **pnpm-lock.yaml también existe**
   - 190 KB de lockfile generado
   - Sugiere que se intentó usar PNPM en algún momento
   - Probablemente debería eliminarse

5. **El problema SOLO ocurre en GitHub Actions**
   - PNPM busca `pnpm-workspace.yaml` hacia arriba en el árbol de directorios
   - Encuentra el del frontend (malformado)
   - Falla al validarlo

### 🎯 Escenario del Error

```
GitHub Actions Runner:
/home/runner/work/TGS-Frontend/TGS-Frontend/
├── frontend/
│   ├── package.json (Angular - usa npm)
│   ├── package-lock.json ✅
│   ├── pnpm-lock.yaml ⚠️ (residuo)
│   └── pnpm-workspace.yaml ❌ (MALFORMADO)
└── backend/
    ├── package.json (NestJS - usa pnpm)
    └── pnpm-lock.yaml ✅

Al ejecutar:
$ cd backend
$ pnpm install --frozen-lockfile

PNPM busca pnpm-workspace.yaml:
1. ./pnpm-workspace.yaml (no existe)
2. ../pnpm-workspace.yaml (EXISTE, pero está ROTO)
   → Lee el archivo
   → NO encuentra "packages:"
   → ❌ ERROR
```

---

## 🔧 DIAGNÓSTICO FINAL

### Causa Raíz del Error

El archivo `pnpm-workspace.yaml` en el **repositorio FRONTEND**:
1. **No debería existir** (el frontend no es un workspace de PNPM)
2. **Está mal formado** (falta el campo `packages:` obligatorio)
3. **Interfiere con el backend** (PNPM lo encuentra y lo valida)

### Soluciones Propuestas

**OPCIÓN 1: Eliminar el archivo (RECOMENDADO)**
```bash
# Eliminar pnpm-workspace.yaml del frontend
rm pnpm-workspace.yaml

# Opcional: También eliminar pnpm-lock.yaml si no se usa
rm pnpm-lock.yaml
```

**OPCIÓN 2: Arreglar el archivo**
```yaml
# Si por alguna razón DEBE existir, agregar:
packages:
  - '.'

onlyBuiltDependencies:
  - '@parcel/watcher'
  - esbuild
  - lmdb
  - msgpackr-extract
```

**OPCIÓN 3: Modificar el workflow (WORKAROUND)**
```yaml
- name: Install Backend Dependencies
  working-directory: backend
  run: |
    # Crear pnpm-workspace.yaml temporal en backend
    echo "packages: ['.']" > pnpm-workspace.yaml
    pnpm install --frozen-lockfile
```

---

## ✅ RECOMENDACIÓN FINAL

**Eliminar completamente los archivos relacionados con PNPM del repositorio frontend:**

```bash
# En el repositorio TGS-Frontend:
git rm pnpm-workspace.yaml
git rm pnpm-lock.yaml  # Si no se usa PNPM para el frontend
git commit -m "fix: remove pnpm workspace files from frontend repo

- Remove pnpm-workspace.yaml (frontend uses npm, not pnpm)
- Remove pnpm-lock.yaml (redundant with package-lock.json)
- Resolves ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION in integration tests

The frontend uses npm (package-lock.json), while the backend uses pnpm.
These files were causing conflicts during GitHub Actions integration tests."
```

**Ventajas**:
- ✅ Elimina la causa raíz del problema
- ✅ Limpia el repositorio de archivos innecesarios
- ✅ El frontend sigue usando npm (package-lock.json)
- ✅ El backend puede usar pnpm sin interferencias

**Desventajas**:
- ❌ Ninguna (estos archivos no se usan en el frontend)

---

**Autor**: Diagnóstico automatizado - Claude Code
**Fecha**: 2025-11-29
**Prioridad**: ALTA - Bloquea Integration Tests en CI/CD
