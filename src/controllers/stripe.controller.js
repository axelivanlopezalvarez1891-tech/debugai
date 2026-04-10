// =================================================================
// [CORE] STRIPE.CONTROLLER.JS — Sistema completo de suscripciones
// Maneja: Checkout, Webhooks, Sync de estado, Portal del cliente
// =================================================================

import Stripe from 'stripe';
import { getDB } from '../config/db.js';
import { log } from '../utils/logger.js';

// Inicializar Stripe solo si la key existe (no rompe en dev sin credenciales)
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null;

// ── Planes disponibles ─────────────────────────────────────────────────────
// Crear en Stripe Dashboard → Products y pegar los Price IDs aquí (env vars)
export const STRIPE_PLANS = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
    name: 'DebugAI PRO',
    price: 14.99,
    currency: 'usd',
    interval: 'month',
    mensajes_diarios: 200,
    features: ['200 mensajes/día', 'Claude 3.5 + DeepSeek R1', 'Visión Artificial', 'Agentes Autónomos', 'Exportar PDF', 'Búsqueda en Internet'],
  },
  pro_annual: {
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL || null,
    name: 'DebugAI PRO Anual',
    price: 99.99,
    currency: 'usd',
    interval: 'year',
    mensajes_diarios: 200,
    features: ['Todo lo de PRO mensual', 'Ahorro de $80/año', 'Soporte Prioritario'],
  },
};

// ── Helper: obtener o crear un Stripe Customer ligado al usuario ───────────
async function getOrCreateCustomer(db, username) {
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) throw new Error('Usuario no encontrado');

  if (user.stripe_customer_id) {
    // Verificar que el customer sigue existiendo en Stripe
    try {
      const customer = await stripe.customers.retrieve(user.stripe_customer_id);
      if (!customer.deleted) return customer;
    } catch (_) { /* customer removed from Stripe, re-create */ }
  }

  // Crear nuevo customer en Stripe
  const customer = await stripe.customers.create({
    name: user.nombre || username,
    metadata: { username, app: 'DebugAI' },
  });

  await db.run('UPDATE users SET stripe_customer_id = ? WHERE username = ?', [customer.id, username]);
  log.info('STRIPE_CUSTOMER_CREATED', { username, customerId: customer.id });
  return customer;
}

// ── Helper: sincronizar estado PRO basado en suscripción Stripe ──────────
async function syncSubscriptionStatus(db, subscription, username) {
  const isActive = ['active', 'trialing'].includes(subscription.status);
  const planId = subscription.items.data[0]?.price?.id || null;
  const periodEnd = subscription.current_period_end || null;

  // Determinar qué plan es
  let planName = 'unknown';
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.priceId === planId) { planName = key; break; }
  }

  await db.run('BEGIN');
  try {
    await db.run(
      `UPDATE users SET
        premium = ?,
        stripe_subscription_id = ?,
        stripe_plan = ?,
        stripe_period_end = ?
       WHERE username = ?`,
      [isActive ? 1 : 0, subscription.id, isActive ? planName : 'free', periodEnd, username]
    );
    await db.run(
      'INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)',
      [username, isActive ? 'STRIPE_ACTIVATED' : 'STRIPE_DEACTIVATED',
       JSON.stringify({ subscription_id: subscription.id, status: subscription.status, plan: planName, period_end: periodEnd })]
    );
    await db.run('COMMIT');
    log.info('STRIPE_SYNC', { username, status: subscription.status, plan: planName, isActive });
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}

// ── FASE 1: Crear sesión de Checkout ──────────────────────────────────────
export async function createCheckoutSession(req, res) {
  if (!stripe) return res.status(503).json({ ok: false, msg: 'Pagos con Stripe no configurados en este servidor.' });

  try {
    const db = getDB();
    const { plan = 'pro_monthly' } = req.body;

    const selectedPlan = STRIPE_PLANS[plan];
    if (!selectedPlan || !selectedPlan.priceId) {
      return res.status(400).json({ ok: false, msg: 'Plan inválido o no configurado. Verifica las variables de entorno STRIPE_PRICE_*.' });
    }

    // Verificar si ya tiene suscripción activa
    const user = await db.get('SELECT * FROM users WHERE username = ?', [req.user]);
    if (user.stripe_subscription_id) {
      try {
        const existing = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        if (['active', 'trialing'].includes(existing.status)) {
          return res.json({ ok: false, msg: 'Ya tienes una suscripción activa. Usa el portal para cambiarla.' });
        }
      } catch (_) { /* suscripción ya no existe */ }
    }

    const customer = await getOrCreateCustomer(db, req.user);
    const origin = (req.headers.origin && req.headers.origin !== 'null') ? req.headers.origin : process.env.APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      success_url: `${origin}/app?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app?stripe_cancel=true`,
      metadata: { username: req.user, plan },
      subscription_data: {
        metadata: { username: req.user, plan },
        trial_period_days: parseInt(process.env.STRIPE_TRIAL_DAYS || '0') || undefined,
      },
      allow_promotion_codes: true,
    });

    log.info('STRIPE_CHECKOUT_CREATED', { username: req.user, plan, sessionId: session.id });
    res.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (err) {
    log.error('STRIPE_CHECKOUT_ERROR', { error: err.message, user: req.user });
    res.status(500).json({ ok: false, msg: 'Error al iniciar el proceso de pago. Intenta de nuevo.' });
  }
}

// ── FASE 2: Portal del cliente (gestionar/cancelar suscripción) ───────────
export async function createPortalSession(req, res) {
  if (!stripe) return res.status(503).json({ ok: false, msg: 'Pagos no configurados.' });

  try {
    const db = getDB();
    const user = await db.get('SELECT stripe_customer_id FROM users WHERE username = ?', [req.user]);

    if (!user?.stripe_customer_id) {
      return res.json({ ok: false, msg: 'No tienes una suscripción de Stripe registrada.' });
    }

    const origin = (req.headers.origin && req.headers.origin !== 'null') ? req.headers.origin : process.env.APP_URL || 'http://localhost:3000';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${origin}/app`,
    });

    res.json({ ok: true, url: portalSession.url });
  } catch (err) {
    log.error('STRIPE_PORTAL_ERROR', { error: err.message });
    res.status(500).json({ ok: false, msg: 'Error al abrir el portal de facturación.' });
  }
}

// ── FASE 3: Sincronización manual desde Stripe ────────────────────────────
export async function syncSubscription(req, res) {
  if (!stripe) return res.status(503).json({ ok: false, msg: 'Pagos no configurados.' });

  try {
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE username = ?', [req.user]);

    if (!user?.stripe_customer_id) {
      return res.json({ ok: true, status: 'free', msg: 'Sin suscripción de Stripe.' });
    }

    // Buscar la suscripción más reciente activa
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      await db.run("UPDATE users SET premium = 0, stripe_plan = 'free', stripe_subscription_id = NULL WHERE username = ?", [req.user]);
      return res.json({ ok: true, status: 'free' });
    }

    const sub = subscriptions.data[0];
    await syncSubscriptionStatus(db, sub, req.user);

    res.json({
      ok: true,
      status: sub.status,
      isPro: ['active', 'trialing'].includes(sub.status),
      plan: sub.items.data[0]?.price?.id,
      periodEnd: sub.current_period_end,
    });
  } catch (err) {
    log.error('STRIPE_SYNC_ERROR', { error: err.message });
    res.status(500).json({ ok: false, msg: 'Error de sincronización con Stripe.' });
  }
}

// ── FASE 2: Webhook de Stripe (corazón del sistema de pagos) ──────────────
// ⚠️ CRÍTICO: Esta función requiere raw body para validar la firma
export async function stripeWebhook(req, res) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    log.error('STRIPE_WEBHOOK_NOT_CONFIGURED');
    return res.status(503).send('Webhook not configured');
  }

  let event;
  try {
    // Validar firma criptográfica de Stripe — nunca confiar solo en el body
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    log.error('STRIPE_WEBHOOK_SIGNATURE_FAIL', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = getDB();
  log.info('STRIPE_WEBHOOK_EVENT', { type: event.type, id: event.id });

  try {
    switch (event.type) {

      // ✅ Pago inicial completado vía Checkout
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const username = session.metadata?.username;
          if (!username) break;

          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscriptionStatus(db, subscription, username);

          // Registrar pago en tabla payments (idempotente)
          const paymentId = `stripe_checkout_${session.id}`;
          const existing = await db.get('SELECT payment_id FROM payments WHERE payment_id = ?', [paymentId]);
          if (!existing) {
            const amountCents = session.amount_total || Math.round(STRIPE_PLANS[session.metadata?.plan]?.price * 100) || 0;
            await db.run(
              'INSERT INTO payments (payment_id, provider, username, type, amount_cents) VALUES (?, ?, ?, ?, ?)',
              [paymentId, 'stripe', username, 'pro_subscription', amountCents]
            );
          }
        }
        break;
      }

      // ✅ Renovación mensual/anual pagada exitosamente
      case 'invoice.paid': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(subscription.customer);
          const username = customer.metadata?.username || subscription.metadata?.username;
          if (username) {
            await syncSubscriptionStatus(db, subscription, username);

            // Registrar renovación (idempotente)
            const paymentId = `stripe_invoice_${invoice.id}`;
            const existing = await db.get('SELECT payment_id FROM payments WHERE payment_id = ?', [paymentId]);
            if (!existing) {
              await db.run(
                'INSERT INTO payments (payment_id, provider, username, type, amount_cents) VALUES (?, ?, ?, ?, ?)',
                [paymentId, 'stripe', username, 'renewal', invoice.amount_paid || 0]
              );
            }
          }
        }
        break;
      }

      // ❌ Pago fallido (tarjeta declinada, etc.)
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(subscription.customer);
          const username = customer.metadata?.username || subscription.metadata?.username;
          if (username) {
            await db.run(
              'INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)',
              [username, 'STRIPE_PAYMENT_FAILED', JSON.stringify({ invoice_id: invoice.id, attempt: invoice.attempt_count })]
            );
            log.error('STRIPE_PAYMENT_FAILED', { username, invoiceId: invoice.id });
          }
        }
        break;
      }

      // 🔄 Suscripción actualizada (upgrade/downgrade, trial, etc.)
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const username = customer.metadata?.username || subscription.metadata?.username;
        if (username) await syncSubscriptionStatus(db, subscription, username);
        break;
      }

      // 🚫 Suscripción cancelada o expirada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const username = customer.metadata?.username || subscription.metadata?.username;
        if (username) {
          await db.run("UPDATE users SET premium = 0, stripe_plan = 'free', stripe_subscription_id = NULL, stripe_period_end = NULL WHERE username = ?", [username]);
          await db.run(
            'INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)',
            [username, 'STRIPE_CANCELED', JSON.stringify({ subscription_id: subscription.id, cancel_reason: subscription.cancellation_details?.reason })]
          );
          log.info('STRIPE_SUBSCRIPTION_CANCELED', { username, subscriptionId: subscription.id });
        }
        break;
      }

      default:
        log.info('STRIPE_WEBHOOK_UNHANDLED', { type: event.type });
    }

    res.json({ received: true });
  } catch (err) {
    log.error('STRIPE_WEBHOOK_HANDLER_ERROR', { type: event.type, error: err.message });
    // Responder 200 igualmente para que Stripe no reintente (el error es nuestro)
    res.json({ received: true, warning: 'Handler error logged' });
  }
}

// ── FASE 4: Endpoint público de planes para el frontend ───────────────────
export function getPlans(req, res) {
  const plans = Object.entries(STRIPE_PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    interval: plan.interval,
    features: plan.features,
    available: !!plan.priceId, // sólo disponible si está configurado
  }));
  res.json({ ok: true, plans });
}
