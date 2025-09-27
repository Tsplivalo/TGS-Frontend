# 📖 README – The Garrison System (Frontend)

## ⚙️ Requisitos previos
- [Node.js](https://nodejs.org/) (versión recomendada: **18+**)  
- [PNPM](https://pnpm.io/) o [NPM](https://www.npmjs.com/)  

> ⚠️ Si no tenés `pnpm`, podés instalarlo con:  
> ```bash
> npm install -g pnpm
> ```

---

## 🚀 Instalación de dependencias
En la carpeta raíz del proyecto, ejecutar:

```bash
pnpm install
```
o, si usás npm:
```bash
npm install
```

---

## ▶️ Levantar el servidor en modo desarrollo
Para iniciar el servidor local:

```bash
pnpm start
```
o:
```bash
npm start
```

Esto abrirá la aplicación en [http://localhost:4200](http://localhost:4200).

---

## 🛠️ Otros scripts útiles
- **Build producción**  
  ```bash
  pnpm build
  ```
  Genera la carpeta `/dist` lista para deploy.  

- **Servidor en modo desarrollo con recarga en vivo**  
  ```bash
  pnpm run ng serve
  ```

- **Lint (chequeo de estilo/código)**  
  ```bash
  pnpm lint
  ```

---

## 📂 Estructura principal
```
src/
 ├── app/               # Componentes principales
 ├── assets/            # Recursos estáticos (logo, imágenes…)
 ├── styles.scss        # Estilos globales
 ├── index.html         # Entrada principal
 └── main.ts            # Bootstrap de la app
```

---

## 📌 Notas
- El backend debe estar corriendo en paralelo (Express + MySQL) para que el frontend funcione correctamente.  
- La URL de la API se configura vía `proxy.conf.json` y el puerto del backend se define ahí.  
- Si se modifica el backend, asegurarse de que el proxy apunte al puerto correcto.  
