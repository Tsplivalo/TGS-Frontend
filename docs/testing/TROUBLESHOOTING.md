# Troubleshooting Guide - TGS Frontend Testing

> Common issues and solutions for testing infrastructure

**Last Updated:** 2025-12-09

---

## 📋 Table of Contents

1. [Unit Tests Issues](#unit-tests-issues)
2. [E2E Tests Issues](#e2e-tests-issues)
3. [CI/CD Pipeline Issues](#cicd-pipeline-issues)
4. [Performance & Coverage Issues](#performance--coverage-issues)
5. [Known Resolved Issues](#known-resolved-issues)

---

## Unit Tests Issues

### ❌ Tests Fail to Run

**Symptom:**
```
Error: Cannot find module '@angular/core/testing'
```

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .angular coverage
npm ci

# If still failing, clear npm cache
npm cache clean --force
npm ci
```

---

### ❌ Coverage Below Threshold

**Symptom:**
```
ERROR  Coverage for statements (78%) does not meet global threshold (80%)
```

**Solution:**
```bash
# Check which files are missing coverage
npm run coverage:report

# Focus on critical services/guards
# Add tests to files with low coverage
```

**Files to prioritize:**
- Services (auth, cart, product, sale, stats)
- Guards (auth.guard.ts)
- Core business logic

---

### ❌ Karma Timeout Issues

**Symptom:**
```
Disconnected (1 times), because no message in 30000 ms
```

**Solution:**
1. Increase timeout in [karma.conf.js](../../karma.conf.js):
```javascript
browserNoActivityTimeout: 60000,  // 60s instead of 30s
```

2. Check if tests have infinite loops or async issues

3. Run tests in debug mode:
```bash
npm run test:debug
```

---

### ❌ Sharding Issues

**Symptom:**
```
Error: KARMA_SHARD environment variable not set
```

**Solution:**
```bash
# Set environment variables correctly
export KARMA_SHARD=1
export KARMA_TOTAL_SHARDS=8
npm run test:ci

# Or use the npm script
npm run test:shard
```

---

## E2E Tests Issues

### ❌ Cypress Can't Find Elements

**Symptom:**
```
Timed out retrying: Expected to find element: 'button#login', but never found it
```

**Solution:**
1. Add `data-cy` attributes to elements:
```html
<button data-cy="login-button">Login</button>
```

2. Use custom command:
```typescript
cy.dataCy('login-button').click()
```

3. Increase timeout:
```typescript
cy.dataCy('login-button', { timeout: 10000 }).click()
```

---

### ❌ Cypress Fails with Network Errors

**Symptom:**
```
cy.request() failed: ECONNREFUSED
```

**Solution:**
```bash
# Ensure backend is running
cd ../TGS-Backend
npm run dev &

# Verify backend is accessible
curl http://localhost:3000/health

# Then run E2E tests
npm run e2e
```

---

### ❌ Accessibility Tests Fail

**Symptom:**
```
1 accessibility violation was detected
```

**Solution:**
1. Check the violation details in test output
2. Common fixes:
   - Add `alt` attributes to images
   - Ensure proper heading hierarchy (h1 → h2 → h3)
   - Add `aria-label` to icon buttons
   - Fix color contrast issues

3. Temporarily skip if needed:
```typescript
cy.checkA11y(null, null, null, true) // skipFailures = true
```

---

### ❌ Video Recording Issues

**Symptom:**
```
Error: Failed to record video
```

**Solution:**
```bash
# Ensure video folder exists and has permissions
mkdir -p cypress/videos
chmod 755 cypress/videos

# Or disable video in cypress.config.ts
video: false
```

---

## CI/CD Pipeline Issues

### ❌ GitHub Actions Fail - Dependency Installation

**Symptom:**
```
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /home/runner/work/.../package.json
```

**Solution:**
- **Fixed:** Use `npm ci` instead of `npm install` in workflows
- **Fixed:** Ensure checkout step uses correct path
- **Fixed:** Verify `package-lock.json` is committed

---

### ❌ PNPM Lockfile Issues (Backend)

**Symptom:**
```
ERR_PNPM_NO_LOCKFILE Cannot install with "frozen-lockfile"
```

**Solution:**
✅ **RESOLVED** in commit `44b8e6a`:
- Updated workflow to use pnpm v9 (was v8)
- Backend lockfile uses v9, must match
- See: [.github/PNPM-WORKSPACE-FIX.md](../../.github/PNPM-WORKSPACE-DIAGNOSIS.md)

```yaml
# Correct configuration (already applied):
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9  # Must match backend lockfileVersion
```

---

### ❌ Bundle Size Budget Exceeded

**Symptom:**
```
Error: Bundle size exceeds budget
```

**Solution:**
✅ **RESOLVED** in Nov 2025:
- Adjusted budgets in [angular.json](../../angular.json)
- Configured warnings vs errors appropriately
- See archive: `docs/testing/archive/fixes/BUNDLE-SIZE-FIX-OPTIONS.md`

**Current budgets:**
```json
{
  "type": "initial",
  "maximumWarning": "2mb",
  "maximumError": "3mb"
}
```

---

### ❌ ZAP Artifact Upload Error

**Symptom:**
```
Error: Unable to upload artifact: 404
```

**Solution:**
✅ **RESOLVED** in Nov 2025:
- Updated to `actions/upload-artifact@v4`
- Fixed path specifications
- See archive: `docs/FIX-ZAP-ARTIFACT-ERROR-V2.md`

```yaml
# Correct configuration (already applied):
- uses: actions/upload-artifact@v4
  with:
    name: zap-report
    path: .zap/report.html
    retention-days: 30
```

---

### ❌ Deprecated Workflow Running

**Symptom:**
```
Warning: frontend-tests.yml is deprecated
```

**Solution:**
✅ **RESOLVED:**
- Disabled `frontend-tests.yml`
- Using `frontend-tests-parallel.yml` (43 jobs)
- See: `docs/testing/archive/fixes/FINAL-FIX-DEPRECATED-WORKFLOW.md`

---

### ❌ Coverage Upload Fails

**Symptom:**
```
Error: Failed to upload coverage to Codecov
```

**Solution:**
1. Verify `CODECOV_TOKEN` secret is set in GitHub
2. Check file path:
```yaml
- uses: codecov/codecov-action@v5
  with:
    files: ./coverage/The-Garrison-System/lcov.info
    flags: unittests
    fail_ci_if_error: false  # Don't fail build on upload error
```

---

## Performance & Coverage Issues

### ❌ Lighthouse Fails

**Symptom:**
```
Error: Could not connect to port 4200
```

**Solution:**
```bash
# Ensure server is running before Lighthouse
npm start &
npx wait-on http://localhost:4200

# Then run Lighthouse
npm run test:performance:local
```

---

### ❌ Pa11y Accessibility Scan Fails

**Symptom:**
```
Error: Page did not load correctly
```

**Solution:**
```bash
# Check if server is running
curl http://localhost:4200

# Run with specific URL
npx pa11y http://localhost:4200

# Check .pa11yrc configuration
cat .pa11yrc
```

---

### ❌ OpenTelemetry Warning in Tests

**Symptom:**
```
@opentelemetry/api: Registered a global for trace v1.0.0
```

**Solution:**
✅ **RESOLVED:**
- This is a warning, not an error
- Can be safely ignored in tests
- See: `docs/testing/archive/fixes/FIX-OPENTELEMETRY-GUIDE.md`

**To suppress (if needed):**
```javascript
// In karma.conf.js
client: {
  captureConsole: false  // Suppress console warnings
}
```

---

## Known Resolved Issues

### ✅ Issues Fixed (Nov-Dec 2025)

| Issue | Status | Fixed In | Notes |
|-------|--------|----------|-------|
| PNPM v8/v9 incompatibility | ✅ Fixed | 44b8e6a | Upgraded to pnpm v9 |
| Bundle size budget | ✅ Fixed | Nov 2025 | Adjusted budgets |
| ZAP artifact upload | ✅ Fixed | Nov 2025 | Updated to v4 |
| Deprecated workflow | ✅ Fixed | Nov 2025 | Disabled old workflow |
| Cypress a11y checkA11y | ✅ Fixed | Nov 2025 | Updated axe-core |
| Coverage permissions | ✅ Fixed | Nov 2025 | Fixed PNPM workspace |
| Karma/Cypress conflicts | ✅ Fixed | Nov 2025 | Separated configs |

---

## Common Quick Fixes

### Clear Everything and Start Fresh
```bash
# Nuclear option - clears all caches
rm -rf node_modules
rm -rf .angular
rm -rf coverage
rm -rf cypress/videos
rm -rf cypress/screenshots
npm cache clean --force
npm ci
```

### Reset Cypress
```bash
# Clear Cypress cache
npx cypress cache clear
npx cypress install
```

### Verify Installation
```bash
# Check node/npm versions
node --version  # Should be v20+
npm --version   # Should be v9+

# Verify dependencies
npm list --depth=0
```

---

## Debug Mode

### Run Unit Tests in Debug
```bash
npm run test:debug

# Then open Chrome DevTools
# Set breakpoints in your test files
```

### Run Cypress in Debug
```bash
# Open Cypress GUI
npm run e2e

# Use .pause() in tests
cy.visit('/login').pause()

# Use debugger in test code
debugger;
```

---

## Getting Help

### Check Documentation
1. [Main Testing Strategy](../../TESTING-STRATEGY.md)
2. [Testing README](./README.md)
3. [Archive](./archive/) - Historical fixes

### Check Logs
```bash
# CI/CD logs
# Go to GitHub Actions → Failed workflow → Click on failed job

# Local logs
cat coverage/The-Garrison-System/coverage-summary.json
```

### Report New Issue
1. Check if issue exists in [archive/](./archive/)
2. Search [GitHub Issues](https://github.com/lautaro-peralta/TGS-Frontend/issues)
3. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version, npm version)
   - Relevant logs

---

## Prevention Best Practices

### Before Committing
```bash
# Run all checks locally
npm run test:ci        # Unit tests
npm run e2e:headless   # E2E tests
npm run test:security  # Security scan
npm run build          # Verify build
```

### Before Creating PR
```bash
# Run full test suite
npm run test:all

# Check coverage
npm run test:coverage
npm run coverage:report
```

### Regular Maintenance
```bash
# Weekly: Update dependencies
npm outdated
npm update

# Weekly: Security audit
npm audit
npm run test:security

# Monthly: Clear caches
npm cache clean --force
rm -rf node_modules .angular
npm ci
```

---

**For historical fixes and detailed diagnostics, see:**
- [archive/fixes/](./archive/fixes/) - Detailed fix documentation
- [.github/](../../.github/) - CI/CD fix documentation

**Last Updated:** 2025-12-09
**Maintained by:** TGS Development Team
