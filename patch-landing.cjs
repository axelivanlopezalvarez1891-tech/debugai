const fs = require('fs');
const file = 'c:/Users/Lopez/Desktop/mi proyecto/landing.html';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('manifest.json')) {
    content = content.replace('</title>', '</title>\n  <link rel="manifest" href="/manifest.json">\n  <script>if("serviceWorker" in navigator) { window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js"); }); }</script>');
}

content = content.replace(/<a href="\/app" class="cta-btn" style="background:transparent;(.*?)(box-shadow:none;)">💻 App Web \/ Móvil<\/a>/g, '<button id="btn-install-pwa" class="cta-btn" style="background:transparent;$1$2">📲 Instalar App Libre</button>');

const pwaScript = `
<script>
  let deferredPrompt;
  const installBtn = document.getElementById('btn-install-pwa');
  if(installBtn) installBtn.style.display = 'none';
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if(installBtn) {
      installBtn.style.display = 'inline-block';
      installBtn.innerHTML = '📲 Descargar App NATIVA';
    }
  });
  
  if(installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt !== null) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') { installBtn.style.display = 'none'; }
        deferredPrompt = null;
      } else {
        window.location.href = '/app';
      }
    });
  }

  window.addEventListener('appinstalled', () => {
    if(installBtn) installBtn.style.display = 'none';
  });
</script>
`;
if (!content.includes('deferredPrompt')) {
    content = content.replace('</body>', pwaScript + '\n</body>');
}

fs.writeFileSync(file, content);
console.log('Landing PWA script injected');
