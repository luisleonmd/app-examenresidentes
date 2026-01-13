# Guía de Despliegue a Producción

Esta aplicación utiliza tecnologías estándar (Next.js, Prisma, SQLite/Postgres) que facilitan su despliegue. Sin embargo, hay una consideración crítica respecto a los archivos subidos.

## ⚠️ AVISO IMPORTANTE SOBRE ARCHIVOS ⚠️
Actualmente, el sistema guarda las imágenes y documentos subidos en la carpeta `public/uploads` del servidor.
*   **Si usa Vercel / Netlify:** Estos servicios "borran" el disco cada vez que actualiza la web. **Las imágenes subidas se perderán.**
*   **Si usa Railway / Render / VPS:** Debe configurar un "Volumen Persistente" o disco para evitar perder datos.

---

## Opción Recomendada: Railway (Más Compatible)
Railway es excelente porque permite bases de datos y persistencia de archivos fácilmente.

### Pasos Previos
1.  Suba su código a **GitHub**.
2.  Cree una cuenta en [Railway.app](https://railway.app/).

### Configuración en Railway
1.  **Nuevo Proyecto:** Seleccione "Deploy from GitHub repo" y elija su repositorio.
2.  **Base de Datos:**
    *   Railway le sugerirá agregar una base de datos PostgreSQL. Acéptelo.
    *   Esto creará automáticamente la variable `DATABASE_URL`.
3.  **Cambio de Código (Importante):**
    *   Railway usa Postgres, pero su código actual usa SQLite.
    *   Vaya a `prisma/schema.prisma` y cambie:
        ```prisma
        datasource db {
          provider = "postgresql" // Antes "sqlite"
          url      = env("DATABASE_URL")
        }
        ```
    *   Guarde y suba este cambio a GitHub.
4.  **Variables de Entorno:**
    *   En Railway, vaya a la pestaña "Variables".
    *   Agregue `AUTH_SECRET`: Genere uno comando en terminal local `openssl rand -base64 32` o invente una cadena larga y segura.
    *   Agregue `AUTH_URL`: La dirección web que Railway le asigne (ej: `https://mi-examen.up.railway.app`).
5.  **Comando de Inicio (Start Command):**
    *   En "Settings" > "Build & Deploy" > "Start Command", ponga:
        ```bash
        npx prisma migrate deploy && npm start
        ```
    *   Esto asegura que la base de datos se actualice automáticamente.

### Persistencia de Archivos en Railway
Para que las imágenes no se borren:
1.  En su servicio en Railway, vaya a "Volumes".
2.  Cree un volumen y móntelo en `/app/public/uploads`.
3.  Esto asegura que esa carpeta sobreviva a los reinicios.

---

## Opción 2: VPS (DigitalOcean, AWS, Hospedaje Propio)
Si tiene un servidor Linux (Ubuntu/Debian):

1.  **Instalar Node.js 18+ y Git.**
2.  **Clonar el repositorio.**
3.  **Configurar .env:**
    ```bash
    cp .env.example .env
    # Edite .env con sus datos reales
    ```
4.  **Construir y Correr:**
    ```bash
    npm install
    npx prisma generate
    npx prisma db push
    npm run build
    npm start
    ```
5.  **Usar PM2 (para mantenerla viva):**
    ```bash
    npm install -g pm2
    pm2 start npm --name "examen-app" -- start
    ```
6.  **Nginx (Proxy Inverso):** Configure Nginx para apuntar al puerto 3000 si desea usar un dominio propio con HTTPS.

---

## Opción 3: Vercel (Requiere cambios de código)
Si prefiere Vercel (el hosting por defecto de Next.js):

1.  **Base de Datos:** Debe usar Vercel Postgres o Neon (cambiar provider a `postgresql` en schema).
2.  **Archivos:** DEBE cambiar el sistema de subida de archivos (en `src/app/lib/questions.ts` y `claims.ts`) para usar **Vercel Blob** o **AWS S3** en lugar de guardar en disco local (`fs/promises`).
    *   *Si no hace esto, las imágenes subidas desaparecerán.*

---

## Resumen
Para su configuración actual (guardando archivos en disco), **Railway** con un Volumen o un **VPS** son las opciones más directas que no requieren re-programar la lógica de subida de archivos.
