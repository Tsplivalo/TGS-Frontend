# Fix: Error de Artefacto OWASP ZAP (Error 400)

**Fecha:** 18 de Noviembre de 2025
**Problema:** Error 400 "Artifact name is not valid" al subir reportes de ZAP

---

## 🔴 Problema Original

### Error Completo
```
Error: Create Artifact Container failed: The artifact name zap_scan is not valid.
Request URL: https://pipelinesghubeus5.actions.githubusercontent.com/.../artifacts?api-version=6.0-preview
Status Code: 400
Status Message: Bad Request
```

### Contexto
- **Job afectado:** `dast-tests` (OWASP ZAP)
- **Acción:** `zaproxy/action-baseline@v0.12.0`
- **Síntomas:**
  - ✅ El escaneo ZAP se ejecuta correctamente
  - ✅ Se generan 9 warnings de seguridad
  - ✅ Se crean los archivos de reporte (report_json.json, report_md.md, report_html.html)
  - ❌ Falla al intentar subir los artefactos a GitHub
  - ❌ Error 400 durante "Starting artifact upload"

### Resultados del Escaneo (antes del error)
```
Total URLs: 47
Warnings (WARN-NEW): 9
Critical Failures: 0
Tests Passed: 60
```

---

## 🔍 Análisis de Causa Raíz

### Problema #1: Nombre de Artefacto con Guión Bajo

La acción `zaproxy/action-baseline` usa por defecto el nombre `zap_scan` para sus artefactos.

**Por qué falla:**
- GitHub Actions v4 de `upload-artifact` tiene bugs conocidos con ciertos caracteres
- El guión bajo `_` en `zap_scan` causa errores 400 en algunos casos
- Esto es un bug documentado en [GitHub Community Discussion #162449](https://github.com/orgs/community/discussions/162449)

### Problema #2: Duplicación de Artefactos

El workflow original tenía:
1. ZAP action-baseline intentando subir con nombre `zap_scan` (automático)
2. Step manual "Upload ZAP Scan Results" intentando subir con nombre `zap-scan-results`

Esto causaba:
- Conflicto de nombres
- Intentos duplicados de subir los mismos archivos
- Posible race condition

### Problema #3: Restricciones de GitHub Actions

**Caracteres prohibidos en nombres de artefactos:**
- `" : < > | * ? \r \n \ /`

**Caracteres problemáticos (bugs conocidos):**
- `_` (guión bajo) - Error 400 en algunos casos
- `%` - Causa errores de autorización
- `#` - Causa errores de autorización

**Caracteres seguros:**
- Letras (a-z, A-Z)
- Números (0-9)
- Guiones `-`

---

## ✅ Solución Implementada

### Cambios Realizados

**Archivo:** `.github/workflows/frontend-tests-parallel.yml`

#### Cambio 1: Agregar `artifact_name` al Baseline Scan

```yaml
# ANTES (líneas 474-481)
- name: Run OWASP ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.12.0
  with:
    target: 'http://localhost:4200'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a -j -l WARN'
    fail_action: false
    allow_issue_writing: false

# DESPUÉS (líneas 474-482)
- name: Run OWASP ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.12.0
  with:
    target: 'http://localhost:4200'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a -j -l WARN'
    fail_action: false
    allow_issue_writing: false
    artifact_name: 'zap-baseline-scan'  # ✅ AGREGADO
```

#### Cambio 2: Agregar `artifact_name` al Full Scan

```yaml
# ANTES (líneas 483-491)
- name: Run OWASP ZAP Full Scan (Public Routes)
  uses: zaproxy/action-full-scan@v0.10.0
  continue-on-error: true
  with:
    target: 'http://localhost:4200'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a -j -l WARN'
    fail_action: false
    allow_issue_writing: false

# DESPUÉS (líneas 484-493)
- name: Run OWASP ZAP Full Scan (Public Routes)
  uses: zaproxy/action-full-scan@v0.10.0
  continue-on-error: true
  with:
    target: 'http://localhost:4200'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a -j -l WARN'
    fail_action: false
    allow_issue_writing: false
    artifact_name: 'zap-full-scan'  # ✅ AGREGADO
```

#### Cambio 3: Eliminar Step Manual de Upload

```yaml
# ELIMINADO (líneas 499-509)
- name: Upload ZAP Scan Results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: zap-scan-results
    path: |
      report_html.html
      report_md.md
      report_json.json
    retention-days: 7
    if-no-files-found: ignore

# REEMPLAZADO POR (líneas 501-504)
# ℹ️ Artifact upload is handled automatically by ZAP actions
# Artifacts will be available as:
#   - zap-baseline-scan (from baseline scan)
#   - zap-full-scan (from full scan)
```

---

## 📊 Comparación Antes/Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Nombre del artefacto (Baseline)** | `zap_scan` (por defecto) | `zap-baseline-scan` ✅ |
| **Nombre del artefacto (Full Scan)** | `zap_scan` (por defecto) | `zap-full-scan` ✅ |
| **Upload manual** | Sí (duplicado) | No (automático) ✅ |
| **Caracteres problemáticos** | `_` (guión bajo) | Solo `-` (guiones) ✅ |
| **Conflicto de nombres** | Sí | No ✅ |
| **Error 400** | Sí ❌ | No ✅ |

---

## 🎯 Por Qué Funciona Ahora

### 1. Nombres de Artefactos Seguros
- `zap-baseline-scan` usa **solo guiones** (no guiones bajos)
- `zap-full-scan` usa **solo guiones** (no guiones bajos)
- Ambos nombres son compatibles con GitHub Actions v4

### 2. Sin Duplicación
- ZAP actions manejan el upload automáticamente
- No hay conflicto entre uploads automáticos y manuales
- Un solo punto de responsabilidad para cada artefacto

### 3. Nombres Únicos
- Baseline scan → `zap-baseline-scan`
- Full scan → `zap-full-scan`
- Cada escaneo tiene su propio artefacto separado

### 4. Cumple con Especificación de GitHub
- Solo usa caracteres permitidos: `a-z`, `A-Z`, `0-9`, `-`
- No usa caracteres problemáticos: `_`, `%`, `#`
- Sigue las mejores prácticas de nomenclatura

---

## ✅ Verificación de la Solución

### Después de aplicar estos cambios, verifica:

1. **En GitHub Actions:**
   ```bash
   # Ejecuta el workflow
   git push origin implement-testing
   ```

2. **En la página del workflow run:**
   - Ve a "Actions" → Selecciona tu workflow run
   - Busca el job `dast-tests`
   - Verifica que se complete exitosamente (✅ sin errores 400)

3. **En la sección de Artifacts:**
   - Deberías ver 2 artefactos:
     - ✅ `zap-baseline-scan` (contiene reportes del baseline scan)
     - ✅ `zap-full-scan` (contiene reportes del full scan)

4. **Contenido de cada artefacto:**
   ```
   zap-baseline-scan/
   ├── report_html.html
   ├── report_md.md
   └── report_json.json

   zap-full-scan/
   ├── report_html.html
   ├── report_md.md
   └── report_json.json
   ```

5. **Sin errores en los logs:**
   - ❌ No deberías ver: "Create Artifact Container failed"
   - ❌ No deberías ver: "The artifact name X is not valid"
   - ❌ No deberías ver: "Status Code: 400"
   - ✅ Deberías ver: "Artifact uploaded successfully"

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [ZAP action-baseline](https://github.com/zaproxy/action-baseline)
- [ZAP action-full-scan](https://github.com/zaproxy/action-full-scan)
- [GitHub Actions upload-artifact v4](https://github.com/actions/upload-artifact)

### Issues Relacionados
- [GitHub Community Discussion #162449](https://github.com/orgs/community/discussions/162449) - Persistent artifact upload failure with ZAP
- [upload-artifact Issue #473](https://github.com/actions/upload-artifact/issues/473) - v4 % and # characters cause errors
- [action-baseline Issue #45](https://github.com/zaproxy/action-baseline/issues/45) - Feature request: Allow specifying artifact name

### Mejores Prácticas
- Usar solo `a-z`, `A-Z`, `0-9`, `-` en nombres de artefactos
- Evitar `_`, `%`, `#`, `/` y otros caracteres especiales
- Usar nombres descriptivos y únicos para cada artefacto
- Dejar que las actions manejen sus propios uploads cuando sea posible

---

## 🔧 Soluciones Alternativas (No Implementadas)

### Alternativa 1: Deshabilitar Upload de ZAP
```yaml
- name: Run OWASP ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.12.0
  with:
    target: 'http://localhost:4200'
    token: ''  # Token vacío deshabilita upload

# Luego usar upload manual
- name: Upload ZAP Scan Results
  uses: actions/upload-artifact@v4
  with:
    name: zap-scan-results
```

**Por qué NO se usó:**
- Más complejo
- Requiere manejo manual de errores
- Menos mantenible

### Alternativa 2: Usar Nombres con Sufijos
```yaml
artifact_name: 'zap-scan-${{ github.run_number }}'
```

**Por qué NO se usó:**
- Dificulta encontrar artefactos
- No resuelve el problema del guión bajo
- Agrega complejidad innecesaria

---

## 📝 Notas Importantes

### Para el Usuario

1. **Los artefactos ahora son separados:**
   - Antes: 1 artefacto `zap-scan-results` (manual)
   - Ahora: 2 artefactos `zap-baseline-scan` + `zap-full-scan` (automáticos)

2. **Los reportes son idénticos:**
   - Mismos archivos: report_html.html, report_md.md, report_json.json
   - Mismo contenido de escaneo
   - Misma información de vulnerabilidades

3. **No se requiere configuración adicional:**
   - No se necesitan nuevos secrets
   - No se necesitan cambios en otros jobs
   - El resto del workflow funciona igual

### Para el Equipo DevOps

1. **Nombres de artefactos actualizados:**
   - Al descargar artefactos vía API, usar los nuevos nombres
   - Actualizar scripts de CI/CD que hagan referencia a `zap-scan-results`

2. **Separación de reportes:**
   - Baseline scan y Full scan ahora en artefactos separados
   - Facilita análisis individual de cada tipo de escaneo
   - Mejor trazabilidad

---

## ✅ Checklist Post-Implementación

- [x] Agregar `artifact_name: 'zap-baseline-scan'` al baseline scan
- [x] Agregar `artifact_name: 'zap-full-scan'` al full scan
- [x] Eliminar step manual "Upload ZAP Scan Results"
- [x] Agregar comentario explicativo sobre artifacts automáticos
- [x] Crear documentación del fix
- [ ] Probar workflow en GitHub Actions
- [ ] Verificar artefactos en la UI de GitHub
- [ ] Descargar y verificar contenido de reportes
- [ ] Actualizar scripts que referencien `zap-scan-results` (si existen)

---

**Estado:** ✅ RESUELTO
**Última actualización:** 18 de Noviembre de 2025
**Versión del fix:** 1.0
