# 🚀 Despliegue de DebugAI PRO en la Nube

¡Felicidades! Todo el código de DebugAI PRO está listo y refactorizado para soportar despliegue en la nube. 
Aquí tienes los pasos exactos para subir este proyecto a **Render**, **Railway**, o cualquier servidor VPS, de forma gratuita o de pago.

## 📦 Preparativos Realizados Automáticamente
Para que el proyecto triunfe en la nube, acabamos de configurar en el código:
1. **Un Script de Inicio:** Se añadió `"start": "node index.js"` al `package.json`.
2. **Puerto Dinámico:** El servidor ahora detecta automáticamente el `process.env.PORT` en lugar de forzar el puerto 3000.
3. **Control de Git (.gitignore):** Se añadió el archivo `.gitignore` para saltar la subida del caché, la base temporal de tu PC (`database.sqlite`) y tu `.env` privado.

---

## 🌩️ Método 1: Despliegue en Render.com (Recomendado)

Render es excelente porque es fácil y permite hospedar aplicaciones conectadas a bases de datos SQLite si usas el sistema de discos (Disk).

### Paso 1: Subir código a GitHub
1. Abre tu terminal de Git en la carpeta del proyecto.
2. Ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Versión final DebugAI PRO"
   ```
3. Crea un repositorio en GitHub vacío y sigue las instrucciones para hacer "Push" de tu código al repositorio.

### Paso 2: Crear el Web Service en Render
1. Entra a [Render.com](https://render.com) y accede con GitHub.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Selecciona tu repositorio de `DebugAI PRO`.

### Paso 3: Configurar el servicio
Llena los campos así:
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Paso 4: Configurar el Disco Persistente (Para que SQLite NO se borre)
*(Atención: Requiere de plan de pago mínimo en Render para discos persistentes)*
1. En la página de configuración técnica baja hasta la sección **Disks**.
2. Dale a **Add Disk**.
3. Ponle de nombre: `sqlite-data`
4. En el `Mount Path` pon: `/opt/render/project/src/data` (Deberás simplemente cambiar en tu `index.js` el path del archivo sqlite a esa carpeta después si eliges esto, ¡o la base se reiniciará cada vez que Render duerma el server!). Si asumes el reinicio por ahora y estás probando, sáltate el Disco.

### Paso 5: Variables de Entorno (Claves API)
Ve a **Environment** y añade tus secretos desde tu archivo `.env`:
- `GROQ_API_KEY`: tu-llave-groq
- `OPENROUTER_API_KEY`: tu-llave-openrouter
- `PORT`: (Render por defecto inyecta este valor, puedes saltarlo).

¡Listo! Dale a **Create Web Service**. ¡Te darán una URL (`tu-app.onrender.com`)!

---

## 🌩️ Método 2: Despliegue en un VPS (DigitalOcean / Linode)

Si usas un servidor propio con Linux y SSH (que es mucho más flexible y te libera del problema del reseteo de SQLite en cuentas gratuitas):

1. Clona el repositorio: `git clone <tu-repo>`
2. Entra al directorio: `cd mi_proyecto`
3. Instala dependencias: `npm install`
4. Crea tus variables: `nano .env` e ingresa allí tus contraseñas Groq/Claude.
5. Instala `pm2` para mantenerlo corriendo 24/7 de fondo: 
   ```bash
   npm install -g pm2
   pm2 start index.js --name "DebugAI"
   ```
6. Opcional: Instalar `nginx` para redirigir el puerto 3000 o 8080 al dominio web final.

### 🎉 ¡Listo a volar!
Si necesitas ayuda con un Dominio (.com) usando `activar_dominio.bat` me dices.
