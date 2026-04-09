const fs = require('fs');

const filesToClean = ['c:/Users/Lopez/Desktop/mi proyecto/index.html', 'c:/Users/Lopez/Desktop/mi proyecto/admin.html'];

for (const file of filesToClean) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Remover cabeceras de autorizacion hardcodeadas
    content = content.replace(/\"Authorization\":\s*token\s*,?\s*/g, '');
    content = content.replace(/\'Authorization\':\s*token\s*,?\s*/g, '');
    
    // Algunas veces quitamos Authorization y queda headers: { } o headers: { "Content-Type": ... }
    // Limpiar comas huérfanas si quedaron:
    content = content.replace(/,\s*}/g, ' }');
    content = content.replace(/{\s*,/g, '{ ');
    
    fs.writeFileSync(file, content);
}

// Fix Landing Page: Separar "Instalar App" de "App Web"
let landingFile = 'c:/Users/Lopez/Desktop/mi proyecto/landing.html';
if (fs.existsSync(landingFile)) {
    let landing = fs.readFileSync(landingFile, 'utf8');
    
    // Restaurar el botón original para la App Web, y dejar un boton SEPARADO para PWA.
    if (landing.match(/<button id=\"btn-install-pwa\" class=\"cta-btn\"/)) {
        // Encontrar esa linea y reemplazarla
        landing = landing.replace(
            /<button id=\"btn-install-pwa\" class=\"cta-btn\"[^>]*>📲 Instalar App Libre<\/button>/,
            `<a href="/app" class="cta-btn" style="background:transparent; border:1px solid var(--accent); box-shadow:none;">💻 Acceder (Web)</a>
             <button id="btn-install-pwa" class="cta-btn" style="background:transparent; border:1px solid #10b981; color:#10b981; box-shadow:none; display:none;">📲 Descargar App</button>`
        );
    }
    
    // Fix the deferred prompt logic for PWA so it doesn't hijack UX
    let pwaLogic = `
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt !== null) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') { installBtn.style.display = 'none'; }
          deferredPrompt = null;
        }
      });
    `;
    
    landing = landing.replace(/installBtn\.addEventListener\('click', async \(\) => \{.*?\n\s+\}\);/s, pwaLogic);
    
    fs.writeFileSync(landingFile, landing);
}

// Fix Backend Auth Middleware: si authorization llega vacio o raro, ignorarlo para forzar que lea las cookies
let backendFile = 'c:/Users/Lopez/Desktop/mi proyecto/index.js';
if (fs.existsSync(backendFile)) {
    let backend = fs.readFileSync(backendFile, 'utf8');
    backend = backend.replace(
        /const token = req\.headers\.authorization \|\| req\.cookies\?\.authToken;/g,
        `let token = req.cookies?.authToken;
  if(!token && req.headers.authorization && req.headers.authorization !== 'cookie_mode') {
    token = req.headers.authorization;
  }`
    );
    fs.writeFileSync(backendFile, backend);
}

console.log('HOTFIX APLICADO CORRECTAMENTE');
