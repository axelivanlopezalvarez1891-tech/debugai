// =====================================================
// [MOD] APP.JS — Orquestador principal y punto de inicio.
// iniciarApp, efectos visuales, PWA, mic y canvas.
// =====================================================
import { state, DOM, sleep } from './state.js';
import { apiFetch } from './api.js';
import { showAlert, showToast, abrirModal, cerrarModal, autoExpand } from './ui.js';
import { sincronizarHUD, checkGifts, logout } from './auth.js';
import { cargarChats, crearChat, seleccionarChat, enviarMensaje } from './chat.js';

export async function iniciarApp() {
  const splash = DOM.splash;
  const splashStatus = DOM.splashStatus;

  try {
    splashStatus.innerText = "Verificando identidad...";
    const checkRes = await apiFetch("/get-perfil");
    const checkData = await checkRes.json();

    if (!checkData.ok) {
      state.token = null;
      splash.classList.add("fade-out");
      setTimeout(() => { DOM.authBox.style.display = "block"; splash.style.display = "none"; }, 500);
      return;
    }

    splashStatus.innerText = "Cargando motor neuronal...";
    state.token = "cookie_mode";

    if (!state.giftInterval) state.giftInterval = setInterval(checkGifts, 5000);
    if (window.mermaid) mermaid.initialize({ startOnLoad: false, theme: 'default' });

    DOM.authBox.style.display = "none";
    await sincronizarHUD();
    splashStatus.innerText = "Preparando entorno...";
    let chats = await cargarChats();

    if (chats.length === 0) {
      const introBox = DOM.introBox;
      introBox.classList.add("active");
      await sleep(4000);
      introBox.classList.add("fade-out-epic");
      await sleep(1800);
      introBox.classList.remove("active");
      introBox.classList.remove("fade-out-epic");
      DOM.appBox.style.display = "flex";
      await crearChat(true);
      splash.classList.add("fade-out");
      setTimeout(() => splash.style.display = "none", 500);
      return;
    }

    DOM.appBox.style.display = "flex";
    const last = chats[chats.length - 1];
    if (last) { seleccionarChat(last.id, last.mensajes); }

    splash.classList.add("fade-out");
    setTimeout(() => splash.style.display = "none", 500);
  } catch(e) {
    console.error('[iniciarApp] Error crítico al iniciar:', e);
    state.token = null;
    fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    if (splash) { splash.classList.add("fade-out"); setTimeout(() => { splash.style.display = "none"; }, 500); }
    DOM.authBox.style.display = 'block';
    DOM.appBox.style.display = 'none';
    DOM.introBox.classList.remove('active');
    showAlert('Error de conexión o de sesión. Por favor reingresa.', 'error');
  }
}

// === PAGOS ===
export function comprarTokens(qty, priceStr) {
  state.currentTokenQueue = qty;
  state.isProBuying = false;
  document.getElementById('lblTokensComprar').innerText = qty;
  document.getElementById('lblPrecioComprar').innerText = priceStr;
  // Ocultar opción Stripe (solo funciona para suscripciones PRO, no tokens)
  const stripeBtn = document.getElementById('stripePayBtn');
  if (stripeBtn) stripeBtn.style.display = 'none';
  try { fetch('/api/eventos/track', { credentials:"include", method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tipo:'CLICK_PRO', metadata:{origen:'modal_tokens',paquete:qty}}) }); } catch(e){}
  cerrarModal("modalPremium");
  abrirModal("modalMetodoPago");
}

export function comprarPRO() {
  state.isProBuying = true;
  document.getElementById('lblTokensComprar').innerText = "LICENCIA ILIMITADA";
  document.getElementById('lblPrecioComprar').innerText = "$14.99/mes";
  // Mostrar opción Stripe (suscripción recurrente con tarjeta)
  const stripeBtn = document.getElementById('stripePayBtn');
  if (stripeBtn) stripeBtn.style.display = 'block';
  try { fetch('/api/eventos/track', { credentials:"include", method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tipo:'PRO_CLICKED', metadata:{origen:'modal_buy_pro', variant:state.abVariant||'A'}}) }); } catch(e){}
  cerrarModal("modalBuyPro"); cerrarModal("modalSinTokens"); cerrarModal("modalSugerenciaPro"); cerrarModal("modalTrialFin");
  abrirModal("modalMetodoPago");
}

export async function simularPasarela(metodo) {
  cerrarModal("modalMetodoPago");
  const overlay = document.getElementById("epicUnlockOverlay");
  overlay.classList.add("trigger");
  document.body.classList.add("shake-global");
  overlay.querySelector('.epic-blast-text').innerHTML = "CONECTANDO";
  overlay.querySelector('.epic-blast-sub').innerHTML = `Redirigiendo a servidor seguro de ${metodo.toUpperCase()}...`;
  setTimeout(() => { document.body.classList.remove("shake-global"); }, 400);

  if (metodo === 'mercadopago') {
    try {
      const res = await fetch("/api/create-preference", { credentials:"include", method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({amount:state.currentTokenQueue, isPro:state.isProBuying})});
      const data = await res.json();
      if (data.ok && data.init_point) window.location.href = data.init_point;
      else { overlay.classList.remove("trigger"); showAlert("Error Mercado Pago: " + data.msg); }
    } catch(e) { overlay.classList.remove("trigger"); showAlert("Error de servidor."); }
    return;
  }
  if (metodo === 'paypal') {
    try {
      const res = await fetch("/api/create-paypal-order", { credentials:"include", method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({amount:state.currentTokenQueue, isPro:state.isProBuying})});
      const data = await res.json();
      if (data.ok && data.url) window.location.href = data.url;
      else { overlay.classList.remove("trigger"); showAlert("Error PayPal: " + data.msg); }
    } catch(e) { overlay.classList.remove("trigger"); showAlert("Error de servidor."); }
    return;
  }
}

// === CANVAS ===
export function abrirCanvas(htmlCode) {
  if (!state.isPremiumUser) { return abrirModal("modalPremium"); }
  document.getElementById("canvasArea").classList.add("open");
  document.getElementById("canvasFrame").srcdoc = htmlCode;
}
export function cerrarCanvas() { document.getElementById("canvasArea").classList.remove("open"); }

// === PYODIDE ===
let pyodideReadyPromise = null;
export async function runPython(btn, code) {
  if (!state.isPremiumUser) return abrirModal("modalPremium");
  const outputDiv = btn.nextElementSibling;
  outputDiv.style.display = "block"; outputDiv.innerText = "Cargando Motor Python (Pyodide)...";
  btn.innerText = "⏳ Ejecutando..."; btn.disabled = true;
  try {
    if (!pyodideReadyPromise) pyodideReadyPromise = loadPyodide();
    let pyodide = await pyodideReadyPromise;
    pyodide.setStdout({ batched: (msg) => { outputDiv.innerText += msg + "\n"; } });
    outputDiv.innerText = "> Running Code...\n";
    await pyodide.runPythonAsync(code);
    if (outputDiv.innerText === "> Running Code...\n") outputDiv.innerText += "Ejecutado correctamente (sin output).";
  } catch(err) { outputDiv.innerText += "\nError: " + err.message; }
  btn.innerText = "▶️ Run Pyodide"; btn.disabled = false;
}

// === CHART ===
export function graficarTabla(btn) {
  const container = btn.parentElement;
  const table = container.querySelector('table');
  if (!table) return;
  const headers = Array.from(table.querySelectorAll('th')).map(th => th.innerText);
  const rows    = Array.from(table.querySelectorAll('tbody tr'));
  let labels = []; let datasetsData = [];
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText);
    labels.push(cells[0] || '?');
    datasetsData.push(parseFloat((cells[1] || '0').replace(/[^0-9.-]+/g, "")) || 0);
  });
  const canvas = document.createElement('canvas'); canvas.style.cssText = "margin-top:15px; max-height:350px;";
  container.appendChild(canvas);
  new Chart(canvas, { type:'bar', data:{ labels, datasets:[{ label:headers[1]||'Dato Interactivo', data:datasetsData, backgroundColor:'rgba(251,191,36,0.4)', borderColor:'rgba(251,191,36,1)', borderWidth:1, borderRadius:8 }] }, options:{ responsive:true, color:'#f3f4f6', scales:{ y:{beginAtZero:true,ticks:{color:'#9ca3af'},grid:{color:'rgba(255,255,255,0.05)'}}, x:{ticks:{color:'#9ca3af'},grid:{display:false}} }, plugins:{legend:{labels:{color:'#f3f4f6'}}} } });
  btn.style.display = "none";
}

// === MICROFONO ===
let recognition = null; let isRecording = false;
export function toggleMic() {
  if (!state.isPremiumUser) { return abrirModal("modalPremium"); }
  const micBtn = document.getElementById("btnMic");
  if (isRecording) { if (recognition) recognition.stop(); return; }
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return showAlert("Reconocimiento de voz no soportado. Usa Chrome en Localhost / HTTPS.");
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    stream.getTracks().forEach(track => track.stop());
    const SpeechR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechR(); recognition.lang = 'es-ES'; recognition.continuous = true; recognition.interimResults = true;
    recognition.onstart = () => { isRecording = true; micBtn.classList.add("mic-recording"); DOM.inputMsg.setAttribute("placeholder", "Escuchando... Habla ahora."); };
    recognition.onresult = (event) => { let text = ""; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) text += event.results[i][0].transcript + " "; } if (text) { DOM.inputMsg.value += text; autoExpand(DOM.inputMsg); } };
    recognition.onerror = (e) => { showAlert("Error del Micrófono: " + e.error); stopMicUI(); };
    recognition.onend = () => stopMicUI();
    recognition.start();
  }).catch(err => { showAlert("Permiso de micrófono denegado. Error: " + err.message); });
}
function stopMicUI() {
  isRecording = false;
  document.getElementById("btnMic").classList.remove("mic-recording");
  if (DOM.inputMsg.value.trim() !== "") { window.autoVoxFlag = true; enviarMensaje(); }
  else { DOM.inputMsg.setAttribute("placeholder", "Escribe tu consulta, idea, tarea escolar o adjunta documentos..."); }
}

// === EXPORTAR CHAT ===
export function exportarChat() {
  if (!state.isPremiumUser) return abrirModal("modalPremium");
  if (!state.currentChatId) return showAlert("Selecciona un chat primero para exportar.");
  const chatActivo = document.querySelector(".chat-item-wrapper.active .chat-item");
  const title = chatActivo ? chatActivo.innerText : "Historial";
  let htmlCont = `<html><head><meta charset='utf-8'><title>DebugAI - ${title}</title><style>body{font-family:Inter,sans-serif;background:#0a0a0c;color:#f3f4f6;padding:40px;max-width:800px;margin:auto;} .u{background:#6366f1;color:#fff;padding:15px 20px;border-radius:10px;margin-bottom:15px;} .a{background:#111115;padding:15px 20px;border-radius:10px;margin-bottom:30px;border:1px solid rgba(255,255,255,0.1);} pre{background:#0d0d12;padding:15px;border-radius:8px;overflow-x:auto;} img{max-width:100%;border-radius:8px;} strong{color:#fbbf24;}</style></head><body><h2 style='text-align:center;'>DebugAI Pro - Exportación Oficial</h2><hr style='border:1px solid #333;margin-bottom:30px;'>`;
  const msgs = document.querySelectorAll('.msg-wrapper');
  if (msgs.length === 0) return showAlert("El chat está vacío.");
  msgs.forEach(w => { const isUser = w.classList.contains('user'); const roleDiv = `<div class="${isUser ? 'u' : 'a'}"><strong style="font-size:12px;text-transform:uppercase;">${isUser ? 'Tú' : 'DebugAI'}</strong><br><br>`; const clone = w.querySelector('.msg').cloneNode(true); clone.querySelectorAll('button').forEach(b => b.remove()); htmlCont += roleDiv + clone.innerHTML + "</div>"; });
  htmlCont += "</body></html>";
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([htmlCont], { type: "text/html" })); a.download = `Export_DebugAI_${Date.now()}.html`; a.click();
}

export function exportarChatPDF() {
  if (!state.isPremiumUser) return abrirModal("modalPremium");
  const clone = document.getElementById("chatWindow").cloneNode(true);
  clone.style.cssText = "background:#fff; color:#000; padding:20px;";
  clone.querySelectorAll('.user, .ai').forEach(e => { e.style.color = "#000"; e.style.border = "1px solid #ccc"; });
  clone.querySelectorAll('button').forEach(b => b.remove());
  html2pdf().set({ margin: 1, filename: `Reporte_DebugAI_${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } }).from(clone).save().then(() => showToast("PDF Exportado Exitosamente", "success"));
}

// === BACKGROUND ANIMATION ===
let targetMouseX = 50; let targetMouseY = 50; let currentMouseX = 50; let currentMouseY = 50;
export function initBackgroundAnimation() {
  document.addEventListener("mousemove", (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 100;
    targetMouseY = (e.clientY / window.innerHeight) * 100;
  });
  (function animateBackground() {
    currentMouseX += (targetMouseX - currentMouseX) * 0.05;
    currentMouseY += (targetMouseY - currentMouseY) * 0.05;
    if (document.body.classList.contains("is-premium")) {
      document.body.style.backgroundImage = `radial-gradient(circle at ${currentMouseX}% ${currentMouseY}%, rgba(251,191,36,0.18) 0%, transparent 45%), radial-gradient(circle at ${100-currentMouseX}% ${100-currentMouseY}%, rgba(245,158,11,0.1) 0%, transparent 50%)`;
    } else {
      document.body.style.backgroundImage = `radial-gradient(circle at ${currentMouseX}% ${currentMouseY}%, rgba(99,102,241,0.25) 0%, transparent 55%), radial-gradient(circle at ${100-currentMouseX}% ${100-currentMouseY}%, rgba(139,92,246,0.15) 0%, transparent 60%)`;
    }
    requestAnimationFrame(animateBackground);
  })();
}

// === DRAG & DROP ===
export function initDragDrop() {
  let dragTimer;
  window.addEventListener("dragenter", (e) => { e.preventDefault(); if (!state.token) return; document.getElementById("dragOverlay").classList.add("active"); });
  window.addEventListener("dragover", (e) => { e.preventDefault(); });
  window.addEventListener("dragleave", (e) => { e.preventDefault(); clearTimeout(dragTimer); dragTimer = setTimeout(() => { document.getElementById("dragOverlay").classList.remove("active"); }, 100); });
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    document.getElementById("dragOverlay").classList.remove("active");
    if (!state.token) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        if (!state.isPremiumUser) { abrirModal("modalPremium"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => { state.currentImageBase64 = ev.target.result; document.getElementById("imgPreviewTag").src = state.currentImageBase64; document.getElementById("imgPreviewCont").style.display = "block"; document.getElementById("inputMsg").focus(); };
        reader.readAsDataURL(file);
      } else { showAlert("La versión actual de Ultra Visión detecta fotogramas de imágenes. Archivos PDF y Texto vendrán en la V2."); }
    }
  });
}

// === PWA ===
let deferredPrompt;
export function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const btnInstall = document.getElementById("btnInstallPWA");
    if (btnInstall) btnInstall.style.display = "flex";
  });
  window.addEventListener('appinstalled', () => {
    const btnInstall = document.getElementById("btnInstallPWA");
    if (btnInstall) btnInstall.style.display = "none";
    deferredPrompt = null; showAlert('✅ ¡DebugAI instalada como app!', 'success');
  });
}
export async function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') document.getElementById("btnInstallPWA").style.display = "none";
    deferredPrompt = null;
  }
}

// === PAYMENTS (URL RETURN) ===
export function handlePaymentReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('paypal_success') === 'true') {
    const orderId = urlParams.get('token');
    const type    = urlParams.get('type');
    const qty     = urlParams.get('qty');
    const overlay = document.getElementById("epicUnlockOverlay");
    overlay.classList.add("trigger"); document.body.classList.add("shake-global");
    overlay.querySelector('.epic-blast-text').innerHTML = "CONFIRMANDO";
    overlay.querySelector('.epic-blast-sub').innerHTML = "Verificando transacción en la red PayPal...";
    setTimeout(() => { document.body.classList.remove("shake-global"); }, 400);
    fetch("/api/capture-paypal-order", { credentials:"include", method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({orderID:orderId,type,qty}) }).then(r=>r.json()).then(data => {
      if (data.ok) {
        if (type === "pro") { overlay.querySelector('.epic-blast-text').innerHTML = "PRO<br>ACTIVO"; overlay.querySelector('.epic-blast-sub').innerHTML = "👑 Acceso ilimitado desbloqueado. Bienvenido al nivel máximo."; }
        else { overlay.querySelector('.epic-blast-text').innerHTML = "+"+qty+"<br>TOKENS"; overlay.querySelector('.epic-blast-sub').innerHTML = `🎉 ¡Recarga exitosa! Tus ${qty} tokens ya están disponibles.`; }
        setTimeout(() => { overlay.classList.remove("trigger"); window.history.replaceState({}, document.title, "/app"); location.reload(); }, 4000);
      } else { overlay.classList.remove("trigger"); showAlert("Pago no completado o declinado por PayPal.", "error"); window.history.replaceState({}, document.title, "/app"); }
    });
  } else if (urlParams.get('paypal_cancel') === 'true') {
    setTimeout(() => showAlert("Pago de PayPal cancelado por el usuario.", "error"), 1000);
    window.history.replaceState({}, document.title, "/app");
  }
  if (urlParams.get('mp_success') === 'true') {
    const qty = urlParams.get('qty'); const type = urlParams.get('type');
    setTimeout(() => {
      const overlay = document.getElementById("epicUnlockOverlay");
      overlay.classList.add("trigger"); document.body.classList.add("shake-global");
      if (type === 'pro') { overlay.querySelector('.epic-blast-text').innerHTML = "PRO<br>ACTIVO"; overlay.querySelector('.epic-blast-sub').innerHTML = "👑 Acceso ilimitado desbloqueado. Bienvenido al nivel máximo."; }
      else { overlay.querySelector('.epic-blast-text').innerHTML = "+"+qty+"<br>TOKENS"; overlay.querySelector('.epic-blast-sub').innerHTML = `🎉 ¡Recarga exitosa! Tus ${qty} tokens ya están disponibles.`; }
      setTimeout(() => { document.body.classList.remove("shake-global"); }, 400);
      setTimeout(() => { overlay.classList.remove("trigger"); window.history.replaceState({}, document.title, "/app"); location.reload(); }, 4000);
    }, 1000);
  } else if (urlParams.get('mp_pending') === 'true') {
    setTimeout(() => showAlert("⏳ <b>Pago en proceso.</b> MercadoPago está verificando tu transacción. Tu saldo se actualizará automáticamente.", "success"), 1000);
    window.history.replaceState({}, document.title, "/app");
  } else if (urlParams.get('mp_failure') === 'true') {
    setTimeout(() => showAlert("❌ El pago fue rechazado o cancelado por MercadoPago.", "error"), 1000);
    window.history.replaceState({}, document.title, "/app");
  }
}

export function toggleMobileMenu() { document.querySelector('.sidebar').classList.toggle('open'); }
export function toggleMobileSidebar() { document.querySelector('.sidebar').classList.toggle('open'); }
