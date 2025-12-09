# Testing Documentation - TGS Frontend

> **Comprehensive testing implementation for The Garrison System (Angular Frontend)**

[![Tests](https://github.com/lautaro-peralta/TGS-Frontend/actions/workflows/frontend-tests-parallel.yml/badge.svg)](https://github.com/lautaro-peralta/TGS-Frontend/actions)
[![Coverage](https://img.shields.io/badge/coverage-80.04%25-brightgreen.svg)](./coverage)

---

## 🎯 Quick Links

- **[Main Strategy](../../TESTING-STRATEGY.md)** - Complete testing strategy (1,621 lines)
- **[Quick Start](#-quick-start)** - Get started in 5 minutes
- **[Implementation Summary](#-implementation-summary)** - What's implemented
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and fixes
- **[CI/CD Pipeline](#-cicd-pipeline)** - GitHub Actions overview

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
# Unit tests
npm test              # Watch mode
npm run test:ci       # CI mode (no watch + coverage)

# E2E tests
npm run e2e           # Cypress GUI
npm run e2e:headless  # Headless mode

# All tests
npm run test:all      # Complete suite
```

### 3. View Coverage
```bash
npm run test:coverage
npm run coverage:report  # Opens HTML report
```

---

## 📊 Current Status

### Test Metrics (Updated: 2025-12-09)

```yaml
Total Tests: 500+
Code Coverage: 80.04%
E2E Test Suites: 11
Accessibility Tests: 6
CI/CD Jobs: 43 (100% green)
```

### Coverage Breakdown

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Statements | 80.04% | >80% | ✅ Met |
| Branches | 69.38% | >70% | ⚠️ Close |
| Functions | 72.14% | >70% | ✅ Met |
| Lines | 79.36% | >80% | ⚠️ Close |

---

## 🧪 Test Types

### 1. Unit Tests (Karma + Jasmine)
**Location:** `src/**/*.spec.ts`

```bash
npm test                    # Watch mode
npm run test:ci             # CI mode
npm run test:coverage       # With coverage
npm run test:shard          # Parallel execution
```

### 2. E2E Tests (Cypress)
**Location:** `cypress/e2e/**/*.cy.ts`

```bash
npm run e2e                 # Interactive mode
npm run e2e:headless        # Headless
npm run e2e:chrome          # Chrome browser
npm run e2e:edge            # Edge browser
```

**Test Suites:**
- Authentication (login, register)
- Navigation & smoke tests
- Store & products
- Accessibility (6 suites)

### 3. Integration Tests
**Location:** `tests/integration/**/*.spec.ts`

```bash
npm run test:integration    # Run integration tests
```

### 4. Performance Tests
**Tool:** Lighthouse CI

```bash
npm run test:performance        # CI mode
npm run test:performance:local  # Local
```

**Targets:**
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90
- SEO: ≥90

### 5. Security Tests
**Tools:** npm audit + Snyk

```bash
npm run test:security       # Run security scan
npm run test:security:fix   # Attempt auto-fix
```

### 6. Accessibility Tests
**Tools:** axe-core + Pa11y (WCAG 2.1 AA)

```bash
npm run test:a11y           # Pa11y CI
npm run test:a11y:local     # Local
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

**1. frontend-tests-parallel.yml** (Main Pipeline)
- **Trigger:** Push to main/develop, PRs
- **Jobs:** 43 parallel jobs
- **Status:** ✅ 100% green

**Job Categories:**
1. ✅ Unit Tests (8 shards - parallel)
2. ✅ E2E Tests (Chrome + Edge)
3. ✅ Performance Tests (Lighthouse)
4. ✅ Security Tests (npm audit + Snyk)
5. ✅ Accessibility Tests (Pa11y)
6. ✅ Build Verification
7. ✅ Coverage Upload (Codecov)

**2. integration-tests.yml** (Full Stack)
- **Status:** ❌ Disabled (not needed)
- **Reason:** Backend has 170+ integration tests, E2E tests cover integration

### Pipeline Execution Time
- **Unit Tests (parallel):** ~8 min (8 shards)
- **E2E Tests:** ~15 min
- **Performance:** ~10 min
- **Security:** ~5 min
- **Accessibility:** ~8 min
- **Total:** ~15-20 min (parallel execution)

---

## 📁 Project Structure

```
TGS-Frontend/
├── .github/workflows/              # CI/CD pipelines
│   ├── frontend-tests-parallel.yml # Main test pipeline (43 jobs)
│   └── integration-tests.yml       # Disabled (not needed)
├── cypress/                        # E2E tests
│   ├── e2e/                       # Test specs
│   │   ├── accessibility/         # 6 a11y test suites
│   │   ├── auth/                  # Login, register
│   │   ├── navigation.cy.ts
│   │   ├── smoke.cy.ts
│   │   └── store/
│   ├── fixtures/                  # Test data
│   └── support/                   # Custom commands
├── tests/                         # Integration & regression
│   ├── integration/
│   └── regression/
├── performance-tests/             # Lighthouse & Artillery
│   └── scenarios/
├── .zap/                         # Security (ZAP)
├── docs/testing/                  # Documentation
│   ├── README.md                  # This file
│   ├── TROUBLESHOOTING.md         # Common issues
│   └── archive/                   # Historical docs
├── coverage/                      # Coverage reports (generated)
├── karma.conf.js                  # Karma config
├── cypress.config.ts              # Cypress config
├── .lighthouserc.json             # Lighthouse config
├── .pa11yrc                       # Pa11y config
└── TESTING-STRATEGY.md            # Complete strategy (root)
```

---

## 📝 Available Commands

### Unit Tests
```bash
npm test                    # Watch mode
npm run test:watch          # Alias
npm run test:ci             # CI (headless + coverage)
npm run test:coverage       # Generate coverage
npm run test:debug          # Debug in Chrome
npm run test:shard          # Parallel shards
npm run coverage:report     # Open HTML report
```

### E2E Tests
```bash
npm run e2e                 # Cypress GUI
npm run e2e:headless        # Headless
npm run e2e:ci              # CI with server
npm run e2e:chrome          # Chrome browser
npm run e2e:edge            # Edge browser
npm run e2e:firefox         # Firefox browser
```

### Other Tests
```bash
npm run test:integration    # Integration tests
npm run test:performance    # Lighthouse
npm run test:security       # npm audit + Snyk
npm run test:a11y           # Pa11y
npm run test:all            # All tests
npm run test:quick          # Unit + E2E
```

---

## 🐛 Quick Troubleshooting

### Tests failing?
```bash
# Clear cache and reinstall
rm -rf node_modules .angular coverage
npm ci
```

### Cypress not finding elements?
```html
<!-- Add data-cy attributes -->
<button data-cy="submit-button">Submit</button>
```

### Coverage below threshold?
```bash
# Check detailed report
npm run coverage:report
```

For more troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📚 Additional Resources

- **[Main Testing Strategy](../../TESTING-STRATEGY.md)** - Complete 1,621-line guide
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Solutions to common issues
- **[Archive](./archive/)** - Historical documentation and fixes

---

## 🎯 Implementation Summary

### ✅ What's Working (100%)

- ✅ 500+ Unit tests with 80.04% coverage
- ✅ 11 E2E test suites (Cypress)
- ✅ 6 Accessibility test suites (WCAG 2.1 AA)
- ✅ 43 CI/CD jobs running in parallel
- ✅ Performance testing (Lighthouse CI)
- ✅ Security testing (npm audit + Snyk)
- ✅ Code coverage tracking (Codecov)
- ✅ Automated notifications (Slack)

### 📊 Key Metrics

```
Tests: 500+
Coverage: 80.04%
CI/CD Jobs: 43 (all green)
Pipeline Time: ~15-20 min
E2E Suites: 11
A11y Suites: 6
```

### 🔧 Tools Used

- **Unit:** Karma + Jasmine
- **E2E:** Cypress 13.17.0
- **Performance:** Lighthouse CI
- **Security:** Snyk + npm audit
- **A11y:** axe-core + Pa11y
- **CI/CD:** GitHub Actions
- **Coverage:** Istanbul + Codecov

---

## 🤝 Contributing

### Adding New Tests

1. **Unit tests:** Create `*.spec.ts` next to source file
2. **E2E tests:** Add to `cypress/e2e/`
3. **Run locally:** `npm test` / `npm run e2e`
4. **Verify coverage:** `npm run test:coverage`
5. **Create PR:** All tests must pass in CI

### Test Conventions

- Use `data-cy` attributes for E2E selectors
- Maintain >80% coverage on critical code
- Include accessibility tests for new features
- Document edge cases and error scenarios

---

## 📞 Support

- **Documentation:** [docs/testing/](.)
- **Issues:** [GitHub Issues](https://github.com/lautaro-peralta/TGS-Frontend/issues)
- **Main Strategy:** [TESTING-STRATEGY.md](../../TESTING-STRATEGY.md)

---

**Last Updated:** 2025-12-09
**Status:** ✅ Production Ready
**Maintained by:** TGS Development Team
