const fs = require('fs');

// 1. Modificar el Backend (index.js)
let backend = fs.readFileSync('index.js', 'utf8');

if (!backend.includes('/api/config')) {
    const configEndpoint = `
// [OTA] Kill Switch de Actualizaciones
let disableUpdates = false; // Variable global (se puede mutar externamente)
app.get("/api/config", (req, res) => {
  // Cache breve de 30s
  res.setHeader("Cache-Control", "public, max-age=30");
  res.json({ disableUpdates });
});
`;
    backend = backend.replace(/(\/\/ \[METRICS\] Tracking de Actualizaciones PWA OTA)/, configEndpoint + "\n$1");
}

// Actualizar en el request original de api/metrics/update para que loggee objetos del frontend
if(backend.includes("log.info('PWA_OTA_UPDATED', { userPath: isAuth ? 'AuthUser' : 'Guest' });")) {
   backend = backend.replace(
      "log.info('PWA_OTA_UPDATED', { userPath: isAuth ? 'AuthUser' : 'Guest' });", 
      "const data = req.body || {}; log.info('PWA_OTA_UPDATED', { userPath: isAuth ? 'AuthUser' : 'Guest', body: data });"
   );
}
fs.writeFileSync('index.js', backend);

// 2. Aumentar la version del SW
let sw = fs.readFileSync('sw.js', 'utf8');
sw = sw.replace(/const VERSION = 'debugai-v5.0.0';/, "const VERSION = 'debugai-v6.0.0';");
fs.writeFileSync('sw.js', sw);

// 3. Modificar Frontend (index.html && landing.html)
const newFrontendBlock = `
  <div id="pwa-update-toast" style="display:none; position:fixed; bottom:20px; right:20px; background:#fbbf24; color:#000; padding:12px 20px; border-radius:8px; z-index:9999; font-weight:bold; box-shadow:0 10px 25px rgba(0,0,0,0.5); transform: translateY(100px); transition: transform 0.3s ease-out;">
    🚀 Nueva versión disponible. Actualizando...
  </div>
  <script>
    if ("serviceWorker" in navigator) { 
      // Almacenamos la version conocida para trackear
      if(!localStorage.getItem('pwa_version')) localStorage.setItem('pwa_version', 'v5.0.0');
      
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) { 
          refreshing = true; 
          fetch('/api/metrics/update', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              credentials: 'omit',
              body: JSON.stringify({
                  from: localStorage.getItem('pwa_version'),
                  to: 'v6.0.0', // nueva version
                  timestamp: Date.now()
              })
          }).catch(()=>{});
          localStorage.setItem('pwa_version', 'v6.0.0');
          window.location.reload(); 
        }
      });
      
      // UX Pro: Retry update if user is typing
      async function trySafeUpdate(newWorker) {
          if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.isContentEditable)) {
              setTimeout(() => trySafeUpdate(newWorker), 3000);
              return;
          }
          try {
              const res = await fetch('/api/config');
              const conf = await res.json();
              if (conf.disableUpdates) return; // Kill switch triggered
          } catch(e) {}
          
          const toast = document.getElementById('pwa-update-toast');
          if(toast) {
            toast.style.display = 'block';
            setTimeout(() => { toast.style.transform = 'translateY(0)'; }, 50);
          }
          setTimeout(() => {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }, 2000);
      }

      window.addEventListener("load", () => { 
        navigator.serviceWorker.register("/sw.js").then(reg => {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Rollout Progresivo (30%)
                if (Math.random() < 0.3) {
                    trySafeUpdate(newWorker);
                }
              }
            });
          });
        }).catch(()=>{});
      }); 
    }
  </script>
`;

const replacePWABlock = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    // Remove the previous <div id="pwa-update-toast"> completely and its accompanying <script>
    if(content.includes('<div id="pwa-update-toast"')) {
        content = content.replace(/<div id="pwa-update-toast".*?<\/script>/s, newFrontendBlock);
        fs.writeFileSync(file, content);
    }
}

replacePWABlock('landing.html');
replacePWABlock('index.html');

console.log('OTA Advanced Pro Patch applied');
