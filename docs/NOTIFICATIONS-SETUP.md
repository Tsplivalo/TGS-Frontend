# Configuración de Notificaciones CI/CD

Este documento explica cómo configurar las notificaciones de Slack, Discord y Email para los tests del proyecto.

## 📋 Secrets Requeridos

Para que las notificaciones funcionen, debes configurar los siguientes **GitHub Secrets** en tu repositorio:

### Navegación a Secrets
1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**

---

## 🔔 1. Slack Notifications

### SLACK_WEBHOOK_URL

**Cómo obtener el webhook:**

1. Ve a [Slack API Apps](https://api.slack.com/apps)
2. Click en **Create New App** → **From scratch**
3. Ingresa:
   - **App Name:** `TGS Frontend CI`
   - **Workspace:** Selecciona tu workspace
4. Click en **Create App**
5. En el menú lateral, selecciona **Incoming Webhooks**
6. Activa **Activate Incoming Webhooks**
7. Click en **Add New Webhook to Workspace**
8. Selecciona el canal donde quieres recibir notificaciones (ej: `#frontend-tests`)
9. Click en **Allow**
10. Copia la **Webhook URL** que aparece

**Ejemplo de URL:**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Agregar a GitHub Secrets:**
- **Name:** `SLACK_WEBHOOK_URL`
- **Value:** Pega la URL copiada

---

## 💬 2. Discord Notifications

### DISCORD_WEBHOOK_URL

**Cómo obtener el webhook:**

1. Abre Discord y ve al servidor donde quieres recibir notificaciones
2. Click derecho en el canal → **Edit Channel**
3. Ve a **Integrations** → **Webhooks**
4. Click en **New Webhook** o **Create Webhook**
5. Configura:
   - **Name:** `TGS CI/CD`
   - **Channel:** Selecciona el canal
   - (Opcional) Sube un avatar personalizado
6. Click en **Copy Webhook URL**

**Ejemplo de URL:**
```
https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz
```

**Agregar a GitHub Secrets:**
- **Name:** `DISCORD_WEBHOOK_URL`
- **Value:** Pega la URL copiada

---

## 📧 3. Email Notifications

### Secrets Requeridos

#### EMAIL_USERNAME
El email desde el cual se enviarán las notificaciones.

**Para Gmail (recomendado):**
- **Value:** `tu-email@gmail.com`

#### EMAIL_PASSWORD
**⚠️ NO uses tu contraseña real de Gmail**

Debes generar una **App Password** (contraseña de aplicación):

1. Ve a tu [Cuenta de Google](https://myaccount.google.com/)
2. Selecciona **Seguridad** en el menú lateral
3. En **Cómo inicias sesión en Google**, asegúrate de tener **Verificación en 2 pasos** activada
4. Busca **Contraseñas de aplicaciones** y haz click
5. Selecciona:
   - **App:** Correo
   - **Device:** Otro (nombre personalizado) → Ingresa: `GitHub Actions TGS`
6. Click en **Generar**
7. Copia la contraseña de 16 caracteres que aparece

**Agregar a GitHub Secrets:**
- **Name:** `EMAIL_PASSWORD`
- **Value:** Pega la contraseña de aplicación (sin espacios)

#### EMAIL_RECIPIENTS
Los destinatarios de las notificaciones (separados por comas si son varios).

**Formato:**
```
usuario1@example.com,usuario2@example.com,usuario3@example.com
```

**Agregar a GitHub Secrets:**
- **Name:** `EMAIL_RECIPIENTS`
- **Value:** Lista de emails separados por comas

---

## ✅ Verificación de Configuración

### Verificar Secrets
Una vez agregados todos los secrets, deberías ver en **Settings → Secrets → Actions**:

- ✅ `SLACK_WEBHOOK_URL`
- ✅ `DISCORD_WEBHOOK_URL`
- ✅ `EMAIL_USERNAME`
- ✅ `EMAIL_PASSWORD`
- ✅ `EMAIL_RECIPIENTS`

### Probar Notificaciones

Para probar que las notificaciones funcionan:

1. Realiza un push a una rama de prueba
2. Verifica que el workflow se ejecute en **Actions**
3. Si algún test falla, recibirás notificaciones en:
   - Slack (canal configurado)
   - Discord (canal configurado)
   - Email (destinatarios configurados)
4. Si todos los tests pasan, recibirás notificaciones de éxito en Slack y Discord

---

## 🔧 Troubleshooting

### Slack no recibe notificaciones
- Verifica que el webhook URL sea correcto
- Confirma que el bot tiene permisos para postear en el canal
- Revisa los logs del workflow en GitHub Actions

### Discord no recibe notificaciones
- Verifica que el webhook URL sea correcto
- Confirma que el webhook no haya sido eliminado
- Verifica los permisos del canal

### Email no funciona
- Confirma que usaste una **App Password**, no tu contraseña real
- Verifica que la verificación en 2 pasos esté activada en Google
- Revisa los logs del workflow para ver errores de SMTP
- Si usas otro proveedor de email (no Gmail), actualiza:
  ```yaml
  server_address: tu-smtp-server.com
  server_port: 587 (o el puerto SMTP de tu proveedor)
  ```

### Las notificaciones no se activan
- Los secrets son **case-sensitive** (sensibles a mayúsculas/minúsculas)
- Asegúrate de que los nombres coincidan exactamente:
  - `SLACK_WEBHOOK_URL` (no `slack_webhook_url`)
  - `DISCORD_WEBHOOK_URL` (no `discord_webhook`)
  - `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_RECIPIENTS`

---

## 📊 Comportamiento de las Notificaciones

### Notificaciones en Failure (❌)
Se envían cuando **cualquier test falla**:
- Slack: Mensaje detallado con estado de cada job
- Discord: Embed rojo con detalles del fallo
- Email: Email detallado con lista de jobs fallidos

### Notificaciones en Success (✅)
Se envían cuando **todos los tests pasan**:
- Slack: Mensaje de confirmación
- Discord: Embed verde de éxito
- Email: ❌ **NO** se envía (solo en fallos)

---

## 🔐 Seguridad

### Buenas Prácticas
- ✅ **NUNCA** cometas secrets en el código
- ✅ Usa **App Passwords** para email, no contraseñas reales
- ✅ Rota los webhooks periódicamente
- ✅ Limita los permisos de los bots/webhooks al mínimo necesario
- ✅ Revoca webhooks si dejas de usarlos

### Revocar/Regenerar Secrets
Si un secret se compromete:

**Slack:**
1. Ve a [Slack API Apps](https://api.slack.com/apps)
2. Selecciona tu app → **Incoming Webhooks**
3. Elimina el webhook comprometido
4. Crea uno nuevo y actualiza el secret en GitHub

**Discord:**
1. Ve al canal → **Edit Channel** → **Integrations** → **Webhooks**
2. Elimina el webhook comprometido
3. Crea uno nuevo y actualiza el secret en GitHub

**Email:**
1. Ve a [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords)
2. Revoca la contraseña comprometida
3. Genera una nueva y actualiza el secret en GitHub

---

## 📖 Recursos Adicionales

- [Slack Incoming Webhooks Documentation](https://api.slack.com/messaging/webhooks)
- [Discord Webhooks Documentation](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)
- [Google App Passwords Documentation](https://support.google.com/accounts/answer/185833)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Última actualización:** 18 de Noviembre de 2025
