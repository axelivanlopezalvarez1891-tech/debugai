// =====================================================
// [MOD] UI.JS — Utilidades de UI y notificaciones.
// showAlert, showToast, cerrarModal, abrirModal, etc.
// =====================================================
import { state } from './state.js';

export function showAlert(msg, type = "error") {
  document.querySelectorAll('.alert-toast-debugai').forEach(el => el.remove());
  const div = document.createElement('div');
  div.className = 'alert-toast-debugai';
  const colors = { error: '#ef4444', success: '#10b981', info: '#6366f1' };
  div.style.cssText = `position:fixed; top:20px; right:20px; background:${colors[type]||colors.error}; color:#fff; padding:14px 20px; border-radius:10px; z-index:99999; font-weight:600; max-width:380px; font-size:14px; box-shadow:0 10px 30px rgba(0,0,0,0.4); pointer-events:auto; line-height:1.5; animation:fadeInToast 0.3s ease-out;`;
  div.innerHTML = msg + `<button onclick="this.parentElement.remove()" style="position:absolute;top:8px;right:10px;background:transparent;border:none;color:rgba(255,255,255,0.8);font-size:16px;cursor:pointer;line-height:1;">✕</button>`;
  document.body.appendChild(div);
  setTimeout(() => { if (div.parentElement) { div.style.opacity = '0'; div.style.transition = 'opacity 0.5s'; setTimeout(() => div.remove(), 500); } }, 5000);
}

export function showToast(msg, type = "info") {
  const div = document.createElement('div');
  const colors = { success: '#10b981', info: '#6366f1', error: '#ef4444' };
  div.style.cssText = `position:fixed; bottom:30px; right:20px; background:${colors[type]||colors.info}; color:#fff; padding:10px 18px; border-radius:8px; z-index:99998; font-size:13px; font-weight:600; box-shadow:0 5px 20px rgba(0,0,0,0.3); animation:fadeInToast 0.3s ease;`;
  div.innerHTML = msg;
  document.body.appendChild(div);
  setTimeout(() => { if(div.parentElement) { div.style.opacity='0'; div.style.transition='opacity 0.4s'; setTimeout(()=>div.remove(),400); } }, 3000);
}

export function abrirModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
  if (id === 'modalBuyPro') {
    trackClientEvent('PRO_MODAL_OPENED', { variant: state.abVariant || 'A', origen: 'modal' });
  }
}

export function cerrarModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Analytics tracker
export async function trackClientEvent(tipo, metadata = {}) {
  if (!state.token) return;
  try {
    await fetch('/api/eventos/track', { 
      credentials: "include", method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, metadata })
    });
  } catch (e) {}
}

export function autoExpand(field) {
  field.style.height = 'inherit';
  const computed = window.getComputedStyle(field);
  const height = parseInt(computed.getPropertyValue('border-top-width'), 10) +
    parseInt(computed.getPropertyValue('padding-top'), 10) + field.scrollHeight +
    parseInt(computed.getPropertyValue('padding-bottom'), 10) +
    parseInt(computed.getPropertyValue('border-bottom-width'), 10);
  field.style.height = height + 'px';
}

export function applyABVariant(variant) {
  state.abVariant = variant;
  const title = document.getElementById('buyProTitle');
  const subtitle = document.getElementById('buyProSubtitle');
  const cta = document.getElementById('buyProCta');
  if (!title || !subtitle || !cta) return;
  if (variant === 'B') {
    title.innerHTML = 'Modo Experto <span style="font-size:14px; opacity:0.7; font-weight:400; color:#fff;">Desbloqueado</span>';
    subtitle.innerHTML = 'Desbloquea capacidades avanzadas: Claude 3.5, DeepSeek R1 y visión artificial sin restricciones. <strong>Alcanza tu potencial máximo.</strong>';
    cta.innerHTML = '🔓 Desbloquear Modo Experto Ahora';
  } else {
    title.innerHTML = 'DebugAI PRO <span style="font-size:14px; opacity:0.7; font-weight:400; color:#fff;">Ultra Edition</span>';
    subtitle.innerHTML = 'Acceso ilimitado a Claude 3.5 Sonnet, DeepSeek R1, Visión Artificial y búsqueda en internet. <strong>Sin límites de tokens.</strong>';
    cta.innerHTML = '🚀 Activar DebugAI PRO Ahora';
  }
}
