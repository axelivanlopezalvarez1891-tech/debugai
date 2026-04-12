const fs = require('fs');

// 1. Añadir el nuevo endpoint a index.js
let backend = fs.readFileSync('index.js', 'utf8');
if (!backend.includes('/api/metrics/update')) {
    const updateEndpoint = `
// [METRICS] Tracking de Actualizaciones PWA OTA
app.post("/api/metrics/update", (req, res) => {
  const isAuth = req.cookies?.authToken || req.headers?.authorization;
  // Solo trackeamos silenciosamente en logs por ahora.
  log.info('PWA_OTA_UPDATED', { userPath: isAuth ? 'AuthUser' : 'Guest' });
  res.json({ ok: true });
});
`;
    // Insert after logout endpoint
    backend = backend.replace(/app\.post\(\"\/api\/auth\/logout\".*?\n\}\);/s, match => match + "\n" + updateEndpoint);
    fs.writeFileSync('index.js', backend);
}

// 2. Modificar sw.js
let sw = fs.readFileSync('sw.js', 'utf8');
// Bump version
sw = sw.replace(/const VERSION = \'debugai\-v[0-9\.]+\';/, "const VERSION = 'debugai-v5.0.0';");
// Change skipWaiting behavior
sw = sw.replace(/self\.skipWaiting\(\);\s*/, '');
if (!sw.includes('SKIP_WAITING')) {
    sw += `
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;
}
fs.writeFileSync('sw.js', sw);

// 3. Modificar Frontend (index.html && landing.html)
const frontendBlock = `
  <div id="pwa-update-toast" style="display:none; position:fixed; bottom:20px; right:20px; background:#fbbf24; color:#000; padding:12px 20px; border-radius:8px; z-index:9999; font-weight:bold; box-shadow:0 10px 25px rgba(0,0,0,0.5); transform: translateY(100px); transition: transform 0.3s ease-out;">
    🚀 Nueva versión disponible. Actualizando...
  </div>
  <script>
    if ("serviceWorker" in navigator) { 
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) { 
          refreshing = true; 
          fetch('/api/metrics/update', { method: 'POST', credentials: 'omit' }).catch(()=>{});
          window.location.reload(); 
        }
      });
      window.addEventListener("load", () => { 
        navigator.serviceWorker.register("/sw.js").then(reg => {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Rollout Progresivo (30%)
                if (Math.random() < 0.3) {
                  const toast = document.getElementById('pwa-update-toast');
                  if(toast) {
                    toast.style.display = 'block';
                    setTimeout(() => { toast.style.transform = 'translateY(0)'; }, 50);
                  }
                  setTimeout(() => {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }, 2000);
                }
              }
            });
          });
        }).catch(()=>{});
      }); 
    }
  </script>
`;

const cleanOldPWA = (html) => {
    let out = html.replace(/<script>.*?serviceWorker.*?<\/script>/s, '');
    out = out.replace(/if \('serviceWorker' in navigator\) \{.*?window\.addEventListener\('beforeinstallprompt'/s, "window.addEventListener('beforeinstallprompt'");
    return out;
};

const integratePWA = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Si ya tiene el toast viejo, quitarlo
    if(content.includes('pwa-update-toast')) {
        content = content.replace(/<div id="pwa-update-toast".*?<\/script>/s, '');
    } else {
        // Remover script PWA anterior solo si es el viejo (para no duplicar)
        content = content.replace(/<script>\s*if\s*\(\"serviceWorker\"\s*in\s*navigator\)\s*\{\s*window\.addEventListener\(\"load\".*?<\/script>/sg, '');
    }
    
    // Quitar el bloque the serviceWorker register in index.html line 3514
    content = content.replace(/if \('serviceWorker' in navigator\) \{.*?window\.addEventListener\('beforeinstallprompt'/s, "window.addEventListener('beforeinstallprompt'");

    // Inyectar el nuevo antes del </head>
    content = content.replace('</head>', frontendBlock + '\n</head>');
    fs.writeFileSync(file, content);
}

integratePWA('landing.html');
integratePWA('index.html');

console.log('OTA Patch V2 applied successfully');
