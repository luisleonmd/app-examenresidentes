# Instrucciones de Despliegue en Railway

Siga estos pasos exactos para publicar su aplicación y que las imágenes funcionen correctamente.

## 1. Preparación del Código (Haga esto en su computadora)
Antes de subir el código a GitHub, necesitamos asegurarnos de que usará la base de datos correcta.

1.  Copie el archivo `railway_setup/schema.prisma` y reemplácelo en `prisma/schema.prisma`.
    *   Esto cambiará la configuración de "sqlite" a "postgresql".
    *   *Nota: Si intenta correr `npm run dev` en su compu después de esto, fallará a menos que tenga Postgres instalado. Puede revertirlo cuando quiera seguir trabajando localmente.*
2.  Suba sus cambios a **GitHub**.

## 2. Creación del Proyecto en Railway
1.  Inicie sesión en [Railway.app](https://railway.app/).
2.  Haga clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Seleccione su repositorio.
4.  Haga clic en **"Add Variables"** pero no agregue nada todavía, solo continúe.

## 3. Configuración de Base de Datos
1.  En la vista de su proyecto en Railway (el lienzo/canvas), haga clic derecho en un espacio vacío -> **"Database"** -> **"Add PostgreSQL"**.
2.  Espere a que se cree.
3.  Una vez creada, Railway conecta automáticamente esta base de datos con su App. Verifique:
    *   Haga clic en su App (el cuadro de su repositorio).
    *   Vaya a la pestaña **"Variables"**.
    *   Debe ver una variable llamada `DATABASE_URL`. Si no está, búsquela en la base de datos (pestaña Connect) y cópiela ahí.

## 4. Configuración de Variables de Entorno
En la pestaña **"Variables"** de su App, agregue las siguientes:

*   `AUTH_SECRET`: Invente una contraseña larga y segura (ej: `k39dk39dk39...`).
*   `AUTH_URL`: La dirección web de su app. Railway le asigna una en **Settings** -> **Networking** -> **Public Domain**. (Ej: `https://web-production-xxxx.up.railway.app`).
    *   *Si aún no tiene dominio, genérelo primero en Settings y luego Agréguelo a Variables.*

## 5. Configuración de Disco Persistente (IMPORTANTE)
Para que las imágenes NO se borren:

1.  Haga clic en su App en Railway.
2.  Vaya a la pestaña **"Volumes"**.
3.  Haga clic en **"Add Volume"**.
4.  En "Mount Path", escriba EXACTAMENTE:
    `/app/public/uploads`
5.  Haga clic en "Add".
    *   *Esto reiniciará la aplicación.*

## 6. Comando de Inicio
Para asegurar que la base de datos se actualice:
1.  Vaya a **"Settings"** -> **"Build & Deploy"**.
2.  En **"Start Command"**, pegue esto:
    ```bash
    npx prisma migrate deploy && npm start
    ```

¡Listo! Su aplicación debería estar funcionando en unos minutos.
