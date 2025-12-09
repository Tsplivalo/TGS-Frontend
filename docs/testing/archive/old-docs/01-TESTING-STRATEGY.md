# 📋 Estrategia de Testing - TGS Frontend

## 📖 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Tipos de Tests Implementados](#tipos-de-tests-implementados)
3. [Herramientas y Tecnologías](#herramientas-y-tecnologías)
4. [Umbrales y Métricas](#umbrales-y-métricas)
5. [Pipeline de CI/CD](#pipeline-de-cicd)
6. [Comandos Rápidos](#comandos-rápidos)

---

## 🎯 Visión General

La estrategia de testing del frontend de TGS (The Garrison System) está diseñada para garantizar la **calidad**, **seguridad**, **performance** y **accesibilidad** de la aplicación Angular.

### Objetivos

✅ **Cobertura >80%** en lógica crítica (servicios, guards, componentes principales)
✅ **0 vulnerabilidades críticas** en dependencias
✅ **Lighthouse score >90** en todas las categorías
✅ **100% WCAG 2.1 AA compliance** para accesibilidad
✅ **Integración completa** con backend (API E2E)

---

## 📊 Tipos de Tests Implementados

### 1. Tests Unitarios (Karma + Jasmine) ✅

**Cobertura:** 85%+ en servicios críticos, 70%+ en componentes

**Ubicación:** `src/app/**/*.spec.ts`

**Qué se testea:**
- ✅ Servicios (HTTP, lógica de negocio)
- ✅ Componentes (renderizado, interacciones)
- ✅ Guards (autenticación, autorización)
- ✅ Interceptors (HTTP)
- ✅ Pipes (transformaciones)
- ✅ Modelos y utilidades

**Ejecutar:**
```bash
npm test              # Modo watch
npm run test:ci       # CI (sin watch, con coverage)
npm run test:coverage # Generar reporte de cobertura
```

---

### 2. Tests de Integración ✅

**Ubicación:** `tests/integration/**/*.spec.ts`

**Qué se testea:**
- ✅ Auth Flow (login → dashboard → logout)
- ✅ Product CRUD (crear → editar → eliminar producto)
- ✅ Sales Workflow (crear venta → confirmar → facturar)
- ✅ Role Request Flow (solicitar rol → aprobar/rechazar)

**Ejecutar:**
```bash
npm run test:integration
```

---

### 3. Tests E2E (Cypress) ✅

**Ubicación:** `cypress/e2e/**/*.cy.ts`

**Qué se testea:**
- ✅ **Auth:** Login, Register, Logout, Email Verification
- ✅ **Products:** Listar, crear, editar, eliminar productos
- ✅ **Sales:** Crear venta, reportes
- ✅ **Store:** Navegación, agregar al carrito, checkout
- ✅ **User Flows:** Inbox, role requests, account management

**Ejecutar:**
```bash
npm run e2e               # Modo interactivo (Cypress GUI)
npm run e2e:headless      # Modo headless
npm run e2e:ci            # CI (con start-server-and-test)
npm run cypress:open      # Abrir Cypress Test Runner
```

---

### 4. Tests de Performance (Lighthouse CI) ✅

**Configuración:** `.lighthouserc.json`

**Métricas evaluadas:**
- ⚡ **Performance Score:** >90
- ♿ **Accessibility Score:** >95
- 🛡️ **Best Practices Score:** >90
- 🔍 **SEO Score:** >90

**Web Vitals:**
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

**Ejecutar:**
```bash
npm run test:performance        # CI (autorun)
npm run test:performance:local  # Local con servidor corriendo
```

---

### 5. Tests de Seguridad (npm audit + Snyk) ✅

**Qué se verifica:**
- 🔒 Vulnerabilidades en dependencias (npm audit)
- 🔐 Análisis SAST con Snyk
- 🛡️ Content Security Policy (CSP) headers
- 🔑 Secrets detection

**Ejecutar:**
```bash
npm run test:security      # npm audit + snyk test
npm run test:security:fix  # Intentar auto-fix de vulnerabilidades
```

---

### 6. Tests de Accesibilidad (axe-core + Pa11y) ✅

**Estándar:** WCAG 2.1 AA

**Herramientas:**
- **axe-core:** Integrado en Cypress E2E
- **Pa11y CI:** Análisis automatizado de páginas

**Qué se verifica:**
- ✅ Navegación por teclado
- ✅ Screen reader compatibility
- ✅ Contraste de colores (4.5:1 mínimo)
- ✅ ARIA attributes
- ✅ Form labels y validaciones
- ✅ Landmarks y heading hierarchy

**Ejecutar:**
```bash
npm run test:a11y        # Pa11y CI (todas las URLs configuradas)
npm run test:a11y:local  # Pa11y en una URL específica
```

---

### 7. Tests de Regresión (Snapshots) ✅

**Qué se testea:**
- 📸 Snapshots de componentes críticos
- 🔍 Detección de cambios no intencionales en UI
- 🎨 Regresión visual (opcional con Percy/Chromatic)

**Ubicación:** `tests/regression/**/*.spec.ts`

---

## 🛠️ Herramientas y Tecnologías

| Tipo de Test | Herramienta Principal | Complementos |
|--------------|----------------------|--------------|
| **Unitarios** | Jasmine + Karma | @testing-library/angular |
| **Integración** | Jasmine + TestBed | HttpClientTestingModule |
| **E2E** | Cypress 13+ | cypress-axe, cypress-real-events |
| **Performance** | Lighthouse CI | Web Vitals |
| **Seguridad** | npm audit, Snyk | OWASP Dependency Check |
| **Accesibilidad** | axe-core, Pa11y | Lighthouse accessibility |
| **CI/CD** | GitHub Actions | Codecov, Slack notifications |

---

## 📏 Umbrales y Métricas

### Cobertura de Código

```yaml
Objetivo:
  - Servicios críticos: >85%
  - Componentes: >70%
  - Guards/Interceptors: >80%
  - Global: >75%

Karma Coverage Thresholds:
  global:
    statements: 80%
    branches: 75%
    functions: 80%
    lines: 80%
```

### Performance (Lighthouse)

```yaml
Scores Mínimos:
  - Performance: 90
  - Accessibility: 95
  - Best Practices: 90
  - SEO: 90

Web Vitals:
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1
```

### Seguridad

```yaml
npm audit:
  - 0 vulnerabilidades críticas
  - 0 vulnerabilidades altas
  - <5 vulnerabilidades moderadas

Snyk:
  - Severity threshold: high
  - Auto-fix cuando sea posible
```

---

## 🔄 Pipeline de CI/CD

### GitHub Actions Workflows

**1. frontend-tests.yml** (Tests del Frontend)

Jobs paralelos:
1. ✅ Unit Tests (Karma/Jasmine)
2. ✅ E2E Tests (Cypress)
3. ✅ Performance Tests (Lighthouse)
4. ✅ Security Tests (npm audit + Snyk)
5. ✅ Accessibility Tests (Pa11y)
6. ✅ Build Verification
7. ✅ Test Summary + Notifications

**2. integration-tests.yml** (Frontend + Backend)

- Levanta servicios: PostgreSQL, Redis, Backend, Frontend
- Ejecuta tests E2E completos con API real
- Verifica integración end-to-end

### Ejecución

```bash
# Workflow se ejecuta automáticamente en:
- push a: main, develop, implement-testing
- pull_request a: main, develop
- workflow_dispatch (manual)
```

---

## ⚡ Comandos Rápidos

```bash
# 🧪 Tests Unitarios
npm test                    # Modo watch
npm run test:ci             # CI (headless + coverage)
npm run test:coverage       # Solo coverage

# 🌐 Tests E2E
npm run e2e                 # Cypress GUI
npm run e2e:headless        # Headless
npm run e2e:ci              # CI (start server + test)

# 🚀 Performance
npm run test:performance    # Lighthouse CI

# 🔒 Seguridad
npm run test:security       # npm audit + Snyk

# ♿ Accesibilidad
npm run test:a11y           # Pa11y CI

# 🎯 TODO
npm run test:all            # Todos los tests
npm run test:quick          # Tests rápidos (unit + e2e)

# 🐳 Docker
npm run docker:test         # Levantar stack completo
```

---

## 📚 Documentación Adicional

- [02-UNIT-TESTING-GUIDE.md](./02-UNIT-TESTING-GUIDE.md) - Guía completa de tests unitarios
- [03-E2E-TESTING-GUIDE.md](./03-E2E-TESTING-GUIDE.md) - Guía de Cypress E2E
- [04-PERFORMANCE-TESTING.md](./04-PERFORMANCE-TESTING.md) - Lighthouse + Web Vitals
- [05-SECURITY-TESTING.md](./05-SECURITY-TESTING.md) - Seguridad y vulnerabilidades
- [06-ACCESSIBILITY-TESTING.md](./06-ACCESSIBILITY-TESTING.md) - WCAG 2.1 compliance
- [07-CI-CD-SETUP.md](./07-CI-CD-SETUP.md) - GitHub Actions
- [08-INTEGRATION-BACKEND-FRONTEND.md](./08-INTEGRATION-BACKEND-FRONTEND.md) - Integración completa
- [09-TROUBLESHOOTING.md](./09-TROUBLESHOOTING.md) - Solución de problemas
- [10-CHECKLIST.md](./10-CHECKLIST.md) - Checklist de implementación

---

## 🎯 Próximos Pasos

1. ✅ Ejecutar `npm install` para instalar dependencias
2. ✅ Ejecutar `npm test` para verificar tests unitarios
3. ✅ Ejecutar `npm run e2e` para tests E2E
4. ✅ Configurar secrets en GitHub (CODECOV_TOKEN, SNYK_TOKEN, SLACK_WEBHOOK_URL)
5. ✅ Revisar cobertura en `coverage/The-Garrison-System/index.html`

---

**Última actualización:** 2024-11-07
**Versión:** 1.0.0
**Autor:** TGS Development Team
