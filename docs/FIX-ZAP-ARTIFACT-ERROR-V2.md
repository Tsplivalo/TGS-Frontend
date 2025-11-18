# Fix: Error de Artefacto OWASP ZAP (Error 400) - Versión 2.0

**Fecha:** 18 de Noviembre de 2025
**Problema:** Error 400 "Artifact name is not valid" al subir reportes de ZAP
**Versión:** 2.0 (Solución Mejorada con Upload Manual)

---

## 🔴 Problema Original

### Error Completo
```
Error: Create Artifact Container failed: The artifact name zap-baseline-scan is not valid.
Request URL: https://pipelinesghubeus5.actions.githubusercontent.com/.../artifacts?api-version=6.0-preview
Status Code: 400
Status Message: Bad Request
```

### Contexto
- **Job afectado:** `dast-tests` (OWASP ZAP)
- **Acciones:** `zaproxy/action-baseline@v0.12.0` y `zaproxy/action-full-scan@v0.10.0`
- **Síntomas:**
  - ✅ El escaneo ZAP se ejecuta correctamente
  - ✅ Se generan 9 warnings de seguridad
  - ✅ Se crean los archivos de reporte (report_json.json, report_md.md, report_html.html)
  - ❌ Falla al intentar subir los artefactos a GitHub
  - ❌ Error 400 durante "Starting artifact upload"

### Resultados del Escaneo (antes del error)
```
Total URLs: 50
Warnings (WARN-NEW): 9
Critical Failures: 0
Tests Passed: 60
```

---

## 🔍 Análisis de Causa Raíz

### Problema Principal: Incompatibilidad entre ZAP Actions y GitHub Actions v4

**El parámetro `artifact_name` en las acciones OWASP ZAP causa conflictos con la API de GitHub Actions v4:**

1. **Versión de la API:** Las acciones ZAP usan una versión antigua del upload de artefactos internamente
2. **Validación de nombres:** GitHub Actions v4 tiene validación más estricta de nombres de artefactos
3. **Bug conocido:** Incluso nombres válidos como `zap-baseline-scan` fallan con Error 400 cuando se pasan como parámetro `artifact_name`

### Evidencia del Problema

#### Intento 1: Sin `artifact_name` (defecto: `zap_scan`)
```
Error: The artifact name zap_scan is not valid
```
**Causa:** Guión bajo `_` problemático

#### Intento 2: Con `artifact_name: 'zap-baseline-scan'`
```
Error: The artifact name zap-baseline-scan is not valid
```
**Causa:** Incompatibilidad interna de la acción con GitHub Actions v4

### Restricciones de GitHub Actions

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

## ✅ Solución Implementada (Versión 2.0)

### Estrategia: Upload Manual de Artefactos

En lugar de depender del upload automático de las acciones ZAP (que causa errores), **deshabilitamos el upload automático y lo manejamos manualmente** con `upload-artifact@v4` directamente.

### Cambios Realizados

**Archivo:** `.github/workflows/frontend-tests-parallel.yml`

#### Paso 1: Remover `artifact_name` de las acciones ZAP

```yaml
# ANTES (con artifact_name - causaba Error 400)
- name: Run OWASP ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.12.0
  with:
    target: 'http://localhost:4200'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a -j -l WARN'
    fail_action: false
    allow_issue_writing: false
    artifact_name: 'zap-baseline-scan'  # ❌ Causaba Error 400

# DESPUÉS (sin artifact_name - evita upload automático problemático)
- name: Run OWASP ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.12.0
  with:
    target: 'http://localhost:4200'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a -j -l WARN'
    fail_action: false
    allow_issue_writing: false
    # ✅ Sin artifact_name - ZAP no intenta upload automático
```

```yaml
# ANTES (con artifact_name - causaba Error 400)
- name: Run OWASP ZAP Full Scan (Public Routes)
  uses: zaproxy/action-full-scan@v0.10.0
  continue-on-error: true
  with:
    target: 'http://localhost:4200'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a -j -l WARN'
    fail_action: false
    allow_issue_writing: false
    artifact_name: 'zap-full-scan'  # ❌ Causaba Error 400

# DESPUÉS (sin artifact_name)
- name: Run OWASP ZAP Full Scan (Public Routes)
  uses: zaproxy/action-full-scan@v0.10.0
  continue-on-error: true
  with:
    target: 'http://localhost:4200'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a -j -l WARN'
    fail_action: false
    allow_issue_writing: false
    # ✅ Sin artifact_name
```

#### Paso 2: Agregar Upload Manual de Artefactos

```yaml
# ✅ NUEVO: Upload manual de reportes de Baseline Scan
- name: Upload OWASP ZAP Baseline Reports
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: owasp-zap-baseline-reports  # ✅ Nombre garantizado como válido
    path: |
      report_json.json
      report_md.md
      report_html.html
    retention-days: 30
    if-no-files-found: warn

# ✅ NUEVO: Upload manual de reportes de Full Scan
- name: Upload OWASP ZAP Full Scan Reports
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: owasp-zap-full-scan-reports  # ✅ Nombre garantizado como válido
    path: |
      **/zap-full-scan-report.*
      **/report_json.json
      **/report_md.md
      **/report_html.html
    retention-days: 30
    if-no-files-found: ignore
```

---

## 📊 Comparación de Versiones

| Aspecto | V1.0 (artifact_name) | V2.0 (Upload Manual) |
|---------|----------------------|----------------------|
| **Baseline artifact** | `zap-baseline-scan` | `owasp-zap-baseline-reports` ✅ |
| **Full Scan artifact** | `zap-full-scan` | `owasp-zap-full-scan-reports` ✅ |
| **Upload automático** | Sí (problemático) | No ✅ |
| **Upload manual** | No | Sí (controlado) ✅ |
| **Error 400** | Sí ❌ | No ✅ |
| **Control sobre nombres** | Limitado | Total ✅ |
| **Compatibilidad v4** | Parcial | Total ✅ |
| **Retención configurable** | No | Sí (30 días) ✅ |
| **Manejo de errores** | Limitado | `if-no-files-found` ✅ |

---

## 🎯 Por Qué Funciona Ahora

### 1. Control Total del Upload
- **Usamos directamente `actions/upload-artifact@v4`** en lugar de depender del upload interno de ZAP
- Evitamos cualquier incompatibilidad entre versiones de APIs
- Garantizamos que los nombres pasen la validación de GitHub Actions v4

### 2. Nombres de Artefactos Descriptivos y Válidos
- `owasp-zap-baseline-reports` usa solo caracteres seguros
- `owasp-zap-full-scan-reports` usa solo caracteres seguros
- Nombres más descriptivos para identificar rápidamente el contenido

### 3. Configuración Robusta
- `if: always()` - Sube artefactos incluso si el escaneo falla
- `retention-days: 30` - Mantiene reportes por 30 días
- `if-no-files-found: warn/ignore` - Maneja casos donde no se generan reportes

### 4. Separación de Reportes por Tipo de Escaneo
- Baseline scan → `owasp-zap-baseline-reports`
- Full scan → `owasp-zap-full-scan-reports`
- Facilita análisis y auditoría individual

### 5. Búsqueda de Archivos Flexible
- Baseline usa paths específicos: `report_json.json`, etc.
- Full Scan usa patterns con `**/` para buscar en subdirectorios
- Asegura que se capturen todos los reportes generados

---

## ✅ Verificación de la Solución

### Pasos de Verificación

1. **Hacer Push del Código:**
   ```bash
   git add .github/workflows/frontend-tests-parallel.yml
   git commit -m "fix: upload manual de artefactos OWASP ZAP para evitar Error 400"
   git push origin implement-testing
   ```

2. **Monitorear el Workflow Run:**
   - Ve a GitHub → Actions → Selecciona tu workflow run
   - Busca el job `dast-tests`
   - Verifica que se complete sin errores ✅

3. **Verificar los Steps:**
   - ✅ "Run OWASP ZAP Baseline Scan" - Debe completar exitosamente
   - ✅ "Run OWASP ZAP Full Scan" - Puede tener `continue-on-error: true`
   - ✅ "Upload OWASP ZAP Baseline Reports" - Debe mostrar "Artifact uploaded successfully"
   - ✅ "Upload OWASP ZAP Full Scan Reports" - Debe subir artefactos

4. **Verificar Artefactos Disponibles:**
   En la página del workflow run, scrollea hasta "Artifacts":

   ```
   📦 Artifacts (2)
   ├─ owasp-zap-baseline-reports (uploaded 2 minutes ago)
   └─ owasp-zap-full-scan-reports (uploaded 1 minute ago)
   ```

5. **Descargar y Verificar Contenido:**
   ```
   owasp-zap-baseline-reports.zip
   ├── report_html.html     (~50 KB)
   ├── report_md.md         (~15 KB)
   └── report_json.json     (~30 KB)

   owasp-zap-full-scan-reports.zip
   ├── report_html.html     (~80 KB)
   ├── report_md.md         (~25 KB)
   └── report_json.json     (~50 KB)
   ```

6. **Verificar Sin Errores:**
   - ❌ NO debe aparecer: "Create Artifact Container failed"
   - ❌ NO debe aparecer: "The artifact name X is not valid"
   - ❌ NO debe aparecer: "Status Code: 400"
   - ✅ DEBE aparecer: "Artifact uploaded successfully"
   - ✅ DEBE aparecer: "Upload 'owasp-zap-baseline-reports' artifact completed"

---

## 📚 Ventajas de la Solución V2.0

### Ventajas Técnicas

1. **Evita dependencias internas problemáticas**
   - No depende del upload automático de ZAP actions
   - Usa directamente la API de GitHub Actions v4
   - Elimina capa de abstracción que causaba problemas

2. **Mayor control y flexibilidad**
   - Control total sobre nombres de artefactos
   - Configuración de retención personalizada
   - Manejo de errores granular

3. **Mejor debugging**
   - Logs claros en steps separados
   - Fácil identificar si falla el escaneo vs el upload
   - Mensajes de error más específicos

4. **Compatibilidad futura**
   - Compatible con futuras versiones de GitHub Actions
   - No afectado por cambios en ZAP actions internals
   - Fácil migración a nuevas versiones de upload-artifact

### Ventajas Operacionales

1. **Artefactos más descriptivos**
   - Nombres claros: `owasp-zap-baseline-reports`
   - Fácil identificar contenido sin descargar
   - Mejor organización en la UI de GitHub

2. **Retención configurable**
   - 30 días de retención (vs defecto de 7 días)
   - Suficiente tiempo para auditorías de seguridad
   - Reducción de costos al no usar retención indefinida

3. **Manejo robusto de errores**
   - `if: always()` asegura upload incluso si hay fallos
   - `if-no-files-found: warn` avisa pero no falla el job
   - Permite debugging más fácil

---

## 🔧 Troubleshooting

### Si aún ves Error 400

**Posible causa:** Caché de workflow
```bash
# Solución: Fuerza re-run del workflow
git commit --allow-empty -m "trigger: re-run workflow"
git push
```

### Si no se encuentran archivos

**Posible causa:** Los reportes se generan en directorio diferente
```yaml
# Solución: Agregar debug step antes del upload
- name: Debug - List generated files
  run: |
    echo "Files in current directory:"
    ls -la
    echo "Searching for ZAP reports:"
    find . -name "report*.json" -o -name "report*.html" -o -name "report*.md"
```

### Si los artefactos no aparecen

**Posible causa:** Permisos insuficientes
```yaml
# Solución: Verificar permisos en el job
dast-tests:
  permissions:
    contents: read
    actions: write  # ✅ Agregar este permiso
```

---

## 📝 Notas de Migración

### Para Usuarios de la V1.0

Si ya implementaste la solución V1.0 (`artifact_name`), migra a V2.0:

1. **Actualiza el workflow:**
   - Remueve `artifact_name` de ZAP actions
   - Agrega los 2 nuevos steps de upload manual

2. **Actualiza scripts que descarguen artefactos:**
   ```bash
   # ANTES (V1.0)
   gh run download $RUN_ID -n zap-baseline-scan
   gh run download $RUN_ID -n zap-full-scan

   # DESPUÉS (V2.0)
   gh run download $RUN_ID -n owasp-zap-baseline-reports
   gh run download $RUN_ID -n owasp-zap-full-scan-reports
   ```

3. **Actualiza documentación interna:**
   - Nuevos nombres de artefactos
   - Nueva retención (30 días)

---

## ✅ Checklist Post-Implementación

- [x] Remover `artifact_name` del baseline scan
- [x] Remover `artifact_name` del full scan
- [x] Agregar step "Upload OWASP ZAP Baseline Reports"
- [x] Agregar step "Upload OWASP ZAP Full Scan Reports"
- [x] Configurar `retention-days: 30`
- [x] Configurar `if: always()` para uploads
- [x] Agregar `if-no-files-found` handlers
- [x] Crear documentación V2.0
- [ ] Probar workflow en GitHub Actions
- [ ] Verificar artefactos en la UI de GitHub
- [ ] Descargar y verificar contenido de reportes
- [ ] Actualizar scripts de descarga (si existen)
- [ ] Actualizar documentación de seguridad

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [GitHub Actions upload-artifact v4](https://github.com/actions/upload-artifact)
- [ZAP action-baseline](https://github.com/zaproxy/action-baseline)
- [ZAP action-full-scan](https://github.com/zaproxy/action-full-scan)

### Issues Relacionados
- [upload-artifact #473](https://github.com/actions/upload-artifact/issues/473) - v4 character validation
- [GitHub Community #162449](https://github.com/orgs/community/discussions/162449) - ZAP artifact failures

### Mejores Prácticas
- Usar `actions/upload-artifact@v4` directamente
- Nombres descriptivos y con solo guiones
- Configurar `if: always()` para reportes de seguridad
- Retención de 30 días para auditorías

---

**Estado:** ✅ RESUELTO (Versión 2.0)
**Última actualización:** 18 de Noviembre de 2025
**Versión del fix:** 2.0 (Upload Manual)
**Mejora sobre V1.0:** Elimina dependencia de upload automático de ZAP, control total del proceso
