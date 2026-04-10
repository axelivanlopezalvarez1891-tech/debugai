// =====================================================
// [MOD] MAIN.JS — Punto de entrada del módulo ES.
// Conecta todos los módulos y los expone al HTML.
// =====================================================
import { DOM, state } from './state.js';
import { showAlert, showToast, abrirModal, cerrarModal, autoExpand, trackClientEvent } from './ui.js';
import { login, register, logout, abrirPerfil, guardarPerfil, ejecutarEliminarCuenta } from './auth.js';
import {
  cargarChats, crearChat, eliminarChat, seleccionarChat, enviarMensaje,
  detenerGeneracion, regenerarUltimo, deployAgent, toggleWebSearch, toggleAgent,
  filtrarChats, manejarAttachUI, imagenSeleccionada, quitarImagen
} from './chat.js';
import {
  iniciarApp, comprarTokens, comprarPRO, simularPasarela,
  abrirCanvas, cerrarCanvas, runPython, graficarTabla,
  toggleMic, exportarChat, exportarChatPDF,
  initBackgroundAnimation, initDragDrop, initPWA, installPWA,
  handlePaymentReturn, toggleMobileMenu, toggleMobileSidebar
} from './app.js';
import {
  iniciarStripeCheckout, abrirPortalStripe, sincronizarStripe,
  handleStripeReturn, renderizarPlanesStripe
} from './stripe.js';

// ─── Exponer funciones al HTML (onclick="" attrs) ──────────────────────────
// Agrupamos en window.* para evitar polución del scope global:
window.appLogin    = login;
window.appRegister = register;
window.appLogout   = logout;
window.appAbrirModal  = abrirModal;
window.appCerrarModal = cerrarModal;
window.showAlert   = showAlert;
window.showToast   = showToast;
window.autoExpand  = autoExpand;
window.trackClientEvent = trackClientEvent;

// Alias de compatibilidad (el HTML usa estos nombres directamente via onclick)
window.login    = login;
window.register = register;
window.logout   = logout;
window.iniciarApp = iniciarApp;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.crearChat  = crearChat;
window.eliminarChat = eliminarChat;
window.seleccionarChat = seleccionarChat;
window.enviarMensaje  = enviarMensaje;
window.detenerGeneracion = detenerGeneracion;
window.regenerarUltimo   = regenerarUltimo;
window.deployAgent = deployAgent;
window.toggleWebSearch   = toggleWebSearch;
window.toggleAgent = toggleAgent;
window.filtrarChats = filtrarChats;
window.manejarAttachUI  = manejarAttachUI;
window.imagenSeleccionada = imagenSeleccionada;
window.quitarImagen = quitarImagen;
window.comprarTokens = comprarTokens;
window.comprarPRO    = comprarPRO;
window.simularPasarela = simularPasarela;
window.abrirCanvas  = abrirCanvas;
window.cerrarCanvas = cerrarCanvas;
window.runPython    = runPython;
window.graficarTabla = graficarTabla;
window.toggleMic    = toggleMic;
window.exportarChat = exportarChat;
window.exportarChatPDF = exportarChatPDF;
window.installPWA   = installPWA;
window.toggleMobileMenu   = toggleMobileMenu;
window.toggleMobileSidebar = toggleMobileSidebar;
window.abrirPerfil   = abrirPerfil;
window.guardarPerfil = guardarPerfil;
window.ejecutarEliminarCuenta = ejecutarEliminarCuenta;

// ─── Stripe (exponer globalmente para onclick en HTML) ─────────────────────
window.iniciarStripeCheckout = iniciarStripeCheckout;
window.abrirPortalStripe     = abrirPortalStripe;
window.sincronizarStripe     = sincronizarStripe;
window.renderizarPlanesStripe = renderizarPlanesStripe;

// ─── Configurar marked.js renderer ──────────────────────────────────────────
// Espera a que los CDN estén listos antes de inicializar
function configurarMarked() {
  if (!window.marked) { setTimeout(configurarMarked, 100); return; }
  const renderer = new marked.Renderer();
  const origCode = renderer.code.bind(renderer);
  renderer.code = function(code, lang, escaped) {
    const html = origCode(code, lang, escaped);
    const encoded = encodeURIComponent(code).replace(/'/g, "%27");
    let btnP = "";
    if (lang === "mermaid") {
      const id = 'mermaid-' + Date.now() + Math.random().toString(36).substr(2, 9);
      return `<div class="mermaid-container" style="background:#fff; padding:15px; border-radius:8px; margin:15px 0; overflow-x:auto;">
               <div class="mermaid" id="${id}">${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
             </div>`;
    } else if (lang === "html" || lang === "html5") {
      btnP = `<button class="btn-copy-code" style="right: 90px; color:#fbbf24; border-color:rgba(251,191,36,0.3);" onclick="abrirCanvas(decodeURIComponent('${encoded}'))">▶️ Canvas</button>`;
    } else if (lang === "python" || lang === "py") {
      btnP = `<button class="btn-copy-code" style="right: 90px; color:#10b981; border-color:rgba(16,185,129,0.3);" onclick="runPython(this, decodeURIComponent('${encoded}'))">▶️ Run Pyodide</button><div class="pyodide-output" style="display:none; background:#000; color:#10b981; font-family:monospace; padding:10px; margin-top:5px; border-radius:6px; font-size:12px; word-wrap:break-word;"></div>`;
    }
    return `<div class="code-wrapper">
    ${btnP}
    <button class="btn-copy-code" onclick="navigator.clipboard.writeText(decodeURIComponent('${encoded}')).then(()=>{this.innerHTML='✔️ Copiado'; this.style.color='var(--accent-color)'; this.style.borderColor='var(--accent-color)'; setTimeout(()=>{this.innerHTML='📋 Copiar'; this.style.color='#d1d5db'; this.style.borderColor='rgba(255,255,255,0.15)';},2500)});">📋 Copiar</button>
    ${html}
  </div>`;
  };
  const origTable = renderer.table.bind(renderer);
  renderer.table = function(header, body) {
    const html = origTable(header, body);
    return `<div style="position:relative; margin-bottom:15px; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:12px;">
    ${html}
    <button onclick="graficarTabla(this)" style="margin-top:10px; background:var(--accent-color); color:var(--bg-dark); border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:12px; transition:0.2s;">📊 Generar Gráfico Dinámico</button>
  </div>`;
  };
  marked.setOptions({ renderer, highlight: function(code, lang) { if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value; return hljs.highlightAuto(code).value; }, breaks: true });
}

// ─── Setup del input textarea ──────────────────────────────────────────────
function setupInputListeners() {
  const inputMsg = DOM.inputMsg;
  if (!inputMsg) return;
  inputMsg.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(); } });
  inputMsg.addEventListener('input', () => {
    if (inputMsg.value.startsWith('/')) document.getElementById('slashMenu').style.display = "flex";
    else document.getElementById('slashMenu').style.display = "none";
  });
}

// ─── DOMContentLoaded ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  configurarMarked();
  setupInputListeners();
  initBackgroundAnimation();
  initDragDrop();
  initPWA();
  handlePaymentReturn();
  handleStripeReturn(); // ← Maneja retorno desde Stripe Checkout
  
  // Iniciar app con pequeño delay para que CDNs se asienten
  setTimeout(iniciarApp, 400);
  
  // Fail-safe global: si en 10 segundos sigue el splash, quitarlo sí o sí
  setTimeout(() => {
    const s = document.getElementById("splash-screen");
    if (s && s.style.display !== "none") {
      console.warn("Fail-safe: Forzando cierre de splash screen.");
      s.classList.add("fade-out");
      setTimeout(() => s.style.display = "none", 500);
      if (!state.token) DOM.authBox.style.display = "block";
    }
  }, 10000);
});
