// =====================================================
// [MOD] AUTH.JS — Login, Registro, Logout y Perfil.
// =====================================================
import { state, DOM, sleep } from './state.js';
import { apiPost, apiFetch } from './api.js';
import { showAlert, applyABVariant, abrirModal, cerrarModal } from './ui.js';
import { iniciarApp } from './app.js';

export async function login() {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();
  if (!user || !pass) return showAlert("Completa todos los campos");
  const res = await apiPost("/login", { user, pass });
  const data = await res.json();
  if (!data.ok) return showAlert(data.msg);
  iniciarApp();
}

export async function register() {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();
  if (!user || !pass) return showAlert("Completa todos los campos");
  const res = await apiPost("/register", { user, pass });
  const data = await res.json();
  if (!data.ok) return showAlert(data.msg);
  
  document.getElementById("user").value = user;
  document.getElementById("pass").value = "";
  document.getElementById("pass").focus();
  
  showAlert(`${data.msg || "¡Registrado con éxito!"} <br><button onclick="window.appLogin()" style="background:#fbbf24; color:#000; border:none; padding:8px 15px; border-radius:8px; margin-top:10px; font-weight:bold; cursor:pointer; pointer-events:auto;">🔑 INGRESAR AHORA</button>`, "success");
}

export function logout() {
  state.token = null;
  fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  
  const appBox = DOM.appBox;
  const authBox = DOM.authBox;
  if (appBox) appBox.style.display = "none";
  if (authBox) authBox.style.display = "block";
  state.currentChatId = null;
  
  const chatWindow = DOM.chatWindow;
  const chatListBox = DOM.chatListBox;
  if (chatWindow) chatWindow.innerHTML = "";
  if (chatListBox) chatListBox.innerHTML = "";
  
  document.body.classList.remove("is-premium");
}

export async function sincronizarHUD() {
  const res = await apiFetch("/get-perfil");
  const data = await res.json();
  if (!data.ok) return;

  state.isPremiumUser = data.premium;
  state.creditosRestantes = data.creditos;
  if (data.abVariant) applyABVariant(data.abVariant);

  // Mostrar/ocultar botón de gestión de suscripción Stripe
  const stripeManageBtn = document.getElementById('stripeManageBtn');
  if (stripeManageBtn) {
    stripeManageBtn.style.display = (data.stripe_plan && data.stripe_plan !== 'free') ? 'block' : 'none';
  }

  const theHUD = document.getElementById("hudCredits");
  const btnUpgrade = document.getElementById("btnUpgrade");
  const btnUpgradePro = document.getElementById("btnUpgradePro");
  const btnBuy = document.getElementById("btnBuyUltra");
  const btnFree = document.getElementById("btnContinueFree");
  const btnGuia = document.getElementById("btnGuiaComparativa");
  const btnPerfil = document.getElementById("btnMainProfile");

  if (data.is_admin && btnPerfil) {
    btnPerfil.innerHTML = `<svg viewBox="0 0 24 24" style="width:18px; height:18px; stroke:#fbbf24; stroke-width:3; fill:none; filter: drop-shadow(0 0 5px #fbbf24);"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <span class="admin-gold-label">ADMIN</span>`;
    btnPerfil.style.border = "1px solid rgba(251,191,36,0.5)";
    btnPerfil.style.padding = "6px 12px";
    btnPerfil.style.borderRadius = "8px";
    btnPerfil.style.background = "rgba(251,191,36,0.1)";
    btnPerfil.style.boxShadow = "0 0 20px rgba(251,191,36,0.2)";
  } else if (btnPerfil) {
    btnPerfil.innerHTML = `<svg viewBox="0 0 24 24" style="width:16px; height:16px; stroke:currentColor; stroke-width:2; fill:none;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${data.nombre || 'Mi Perfil'}`;
    btnPerfil.style.border = "none";
    btnPerfil.style.background = "transparent";
    btnPerfil.style.boxShadow = "none";
  }

  if (state.isPremiumUser) {
    document.body.classList.add("is-premium");
    if (btnUpgrade) btnUpgrade.style.display = "none";
    if (btnUpgradePro) btnUpgradePro.style.display = "none";
    if (btnGuia) btnGuia.style.display = "none";
    
    if (data.is_admin) {
      theHUD.innerHTML = '<div class="ultra-badge" style="background:linear-gradient(45deg, #fbbf24, #f59e0b); color:#000; font-weight:900; cursor:default;" title="Poder Total CEO">👑 CEO MASTER ENGAGED</div>';
    } else {
      theHUD.innerHTML = '<div class="ultra-badge" style="cursor:default;" title="Licencia Activa">💎 VERSIÓN PRO ACTIVA</div>';
    }
    theHUD.style.background = "transparent";
    theHUD.style.border = "none";
    theHUD.style.padding = "0";
    if (btnBuy) { btnBuy.innerText = "Ya posees este plan 😎"; btnBuy.onclick = () => cerrarModal("modalPremium"); }
    if (btnFree) btnFree.style.display = "none";
    document.getElementById("btnAttach").classList.remove("disabled");
    document.getElementById("btnAttach").title = "Adjuntar Archivos IA";
  } else {
    document.body.classList.remove("is-premium");
    if (btnUpgrade) btnUpgrade.style.display = "flex";
    if (btnUpgradePro) btnUpgradePro.style.display = "flex";
    
    const cred = state.creditosRestantes;
    let hudColor = "#10b981", hudLabel = "CONSULTAS DISPONIBLES", hudText = `⚡ ${cred} restante${cred !== 1 ? 's' : ''}`;
    let hudStyle = "background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05);";
    
    if (cred <= 5) { hudColor = "#fbbf24"; hudLabel = "⚠️ POCAS CONSULTAS"; hudText = `Solo ${cred} consulta${cred !== 1 ? 's' : ''}`; hudStyle = "background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); box-shadow: 0 0 10px rgba(251,191,36,0.1); animation: pulse-warning 2s infinite;"; }
    if (cred <= 2) { hudColor = "#ef4444"; hudLabel = "🚨 CRÍTICO"; hudStyle = "background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); box-shadow: 0 0 15px rgba(239,68,68,0.2); animation: pulse-danger 1s infinite;"; if (!window.upsellTriggered) { showAlert("🔓 <b>¡No pares ahora!</b> Desbloqueá uso ilimitado con PRO y Claude 3.5.", "success"); window.upsellTriggered = true; } }

    theHUD.innerHTML = `<div onclick="window.appAbrirModal('modalPremium')" style="cursor:pointer; display:flex; flex-direction:column; gap:4px; padding:10px; border-radius:8px; ${hudStyle}" title="1 consulta = 1 mensaje de IA. Recarga tokens o activa PRO para uso sin límite.">
      <span style="font-size:10px; font-weight:700; color:${hudColor}; letter-spacing:0.5px;">${hudLabel}</span>
      <strong style="font-size:14px; color:#fff;">${hudText}</strong>
    </div>`;
    theHUD.style.background = "transparent"; theHUD.style.border = "none"; theHUD.style.padding = "0";
    if (btnBuy) { btnBuy.innerText = "Recargar Tokens"; btnBuy.onclick = () => abrirModal('modalPremium'); }
    if (btnFree) btnFree.style.display = "none";
    document.getElementById("btnAttach").classList.add("disabled");
    document.getElementById("btnAttach").title = "Adjuntar Archivos (Requiere Ultra o Uso de Token)";
  }
}

export async function abrirPerfil() {
  const res = await apiFetch("/get-perfil");
  const data = await res.json();
  if (data.ok) {
    document.getElementById("perfilNombre").value = data.nombre || "";
    document.getElementById("perfilRol").value = data.rol || "";
  }
  abrirModal("modalPerfil");
}

export async function guardarPerfil() {
  const nombre = document.getElementById("perfilNombre").value.trim();
  const rol = document.getElementById("perfilRol").value.trim();
  await apiPost("/update-perfil", { nombre, rol });
  cerrarModal("modalPerfil");
}

export async function ejecutarEliminarCuenta() {
  const res = await apiFetch("/account", { method: "DELETE" });
  const data = await res.json();
  if (data.ok) {
    cerrarModal("modalEliminar");
    cerrarModal("modalPerfil");
    document.body.style.transition = "opacity 0.8s";
    document.body.style.opacity = "0";
    setTimeout(() => {
      logout();
      document.body.style.opacity = "1";
      showAlert("Tu cuenta ha sido eliminada correctamente.", "success");
    }, 800);
  } else {
    showAlert("Error al eliminar la cuenta.");
  }
}

export async function checkGifts() {
  if (!state.token) return;
  try {
    const res = await apiFetch("/check-gift");
    const data = await res.json();
    if (data.ok && data.gift) {
      const res2 = await apiPost("/claim-gift", {});
      const d2 = await res2.json();
      if (d2.ok) {
        if (d2.action === "show_pro_modal") { abrirModal("modalSugerenciaPro"); }
        else { showAlert("🎁 " + d2.msg, "success"); }
        sincronizarHUD();
      }
    }
  } catch(e) {}
}
