// =================================================================
// [MOD] STRIPE.JS — Módulo frontend de pagos con Stripe
// Maneja: checkout, portal, éxito/cancelación, visualización de planes
// =================================================================
import { state } from './state.js';
import { showAlert, showToast, abrirModal, cerrarModal } from './ui.js';

// ── Iniciar checkout de Stripe (redirige a Stripe Hosted Page) ─────────────
export async function iniciarStripeCheckout(plan = 'pro_monthly') {
  try {
    showToast('Conectando con Stripe...', 'info');

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();

    if (data.ok && data.url) {
      // Guardar estado para mostrar mensaje al volver
      sessionStorage.setItem('stripe_checkout_plan', plan);
      window.location.href = data.url;
    } else {
      showAlert(data.msg || 'Error al iniciar el pago con Stripe.', 'error');
    }
  } catch (e) {
    showAlert('Error de conexión. Verifica tu internet e intenta de nuevo.', 'error');
  }
}

// ── Abrir portal de Stripe (gestionar suscripción/cancelar) ───────────────
export async function abrirPortalStripe() {
  try {
    showToast('Abriendo portal de facturación...', 'info');
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data.ok && data.url) {
      window.open(data.url, '_blank');
    } else {
      showAlert(data.msg || 'No se pudo abrir el portal de facturación.', 'error');
    }
  } catch (e) {
    showAlert('Error de conexión con Stripe.', 'error');
  }
}

// ── Sincronizar estado PRO desde Stripe (recuperación) ────────────────────
export async function sincronizarStripe() {
  try {
    const res = await fetch('/api/stripe/sync', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (e) {
    return { ok: false };
  }
}

// ── Manejar retorno desde Stripe Checkout ────────────────────────────────
export function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('stripe_success') === 'true') {
    const sessionId = params.get('session_id');
    window.history.replaceState({}, document.title, '/app');

    // Mostrar overlay de éxito épico
    const overlay = document.getElementById('epicUnlockOverlay');
    if (overlay) {
      overlay.classList.add('trigger');
      document.body.classList.add('shake-global');
      overlay.querySelector('.epic-blast-text').innerHTML = 'PRO<br>ACTIVO';
      overlay.querySelector('.epic-blast-sub').innerHTML = '💳 Stripe confirmó tu pago. ¡Bienvenido al nivel máximo!';
      setTimeout(() => { document.body.classList.remove('shake-global'); }, 400);

      // El webhook ya procesó el pago — solo recargar para reflejar el estado
      setTimeout(async () => {
        // Sync extra por si el webhook llegó rápido
        await sincronizarStripe();
        overlay.classList.remove('trigger');
        location.reload();
      }, 4000);
    }
  } else if (params.get('stripe_cancel') === 'true') {
    window.history.replaceState({}, document.title, '/app');
    setTimeout(() => showAlert('Pago con Stripe cancelado. Puedes intentarlo cuando quieras.', 'error'), 800);
  }
}

// ── Cargar y renderizar planes desde el backend ────────────────────────────
export async function renderizarPlanesStripe(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch('/api/stripe/plans');
    const data = await res.json();
    if (!data.ok) return;

    const planesHTML = data.plans.map(plan => {
      const isAnual = plan.interval === 'year';
      const color = isAnual ? '#10b981' : '#6366f1';
      const badge = isAnual ? '<div style="position:absolute;top:-10px;right:15px;background:#10b981;color:#000;font-size:10px;font-weight:900;padding:2px 10px;border-radius:20px;">AHORRA $80</div>' : '';
      const disponible = plan.available;

      return `
        <div style="position:relative; background:rgba(255,255,255,0.03); border:2px solid ${color}33;
          border-radius:16px; padding:22px; display:flex; flex-direction:column; gap:12px;
          transition:0.2s; ${isAnual ? 'box-shadow:0 0 25px ' + color + '22;' : ''}">
          ${badge}
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="color:${color}; font-size:18px; font-weight:800;">${plan.name}</h4>
            <div style="font-size:22px; font-weight:900;">${plan.interval === 'year' ? '$8.33' : '$' + plan.price}<span style="font-size:12px;color:#9ca3af;font-weight:400;">/${plan.interval === 'year' ? 'mes' : 'mes'}</span></div>
          </div>
          ${plan.interval === 'year' ? '<div style="font-size:11px;color:#10b981;font-weight:700;">Facturado anualmente ($' + plan.price + '/año)</div>' : ''}
          <ul style="list-style:none;padding:0;font-size:13px;color:#d1d5db;display:flex;flex-direction:column;gap:7px;">
            ${plan.features.map(f => `<li>✅ ${f}</li>`).join('')}
          </ul>
          <button
            onclick="window.iniciarStripeCheckout('${plan.id}')"
            ${!disponible ? 'disabled title="No configurado aún"' : ''}
            style="padding:13px; border-radius:10px; font-weight:900; font-size:14px; cursor:${disponible ? 'pointer' : 'not-allowed'};
              background:${disponible ? color : 'rgba(255,255,255,0.05)'}; color:${disponible ? '#fff' : '#9ca3af'};
              border:none; transition:0.2s; margin-top:auto;">
            ${disponible ? '💳 Suscribirme con Stripe' : '🔧 Próximamente'}
          </button>
        </div>`;
    }).join('');

    container.innerHTML = planesHTML;
  } catch (e) {
    container.innerHTML = '<p style="color:#9ca3af;font-size:13px;text-align:center;">No se pudieron cargar los planes.</p>';
  }
}
