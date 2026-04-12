import Stripe from 'stripe';
import { getDB } from '../config/db.js';
import { log } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null;

export const STRIPE_PLANS = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
    name: 'DebugAI PRO',
    price: 14.99,
    currency: 'usd',
    interval: 'month',
    analyses_limit: 99999,
  },
};

async function getOrCreateCustomer(userId, email) {
  const db = getDB();
  const profile = await db.profiles.get(userId);
  if (!profile) throw new Error('Perfil no encontrado');

  if (profile.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      if (!customer.deleted) return customer;
    } catch (_) {}
  }

  const customer = await stripe.customers.create({
    email: email,
    metadata: { userId, app: 'DebugAI' },
  });

  await db.profiles.update(userId, { stripe_customer_id: customer.id });
  return customer;
}

async function syncSubscriptionStatus(userId, subscription) {
  const db = getDB();
  const isActive = ['active', 'trialing'].includes(subscription.status);
  const planId = subscription.items.data[0]?.price?.id || null;
  
  let planName = 'free';
  if (isActive) {
    for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
      if (plan.priceId === planId) { planName = 'pro'; break; }
    }
  }

  await db.profiles.update(userId, {
    plan: planName,
    analyses_limit: planName === 'pro' ? 99999 : 5,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscribed_at: new Date().toISOString()
  });

  log.info('STRIPE_SYNC', { userId, status: subscription.status, plan: planName });
}

export async function createCheckoutSession(req, res) {
  if (!stripe) return res.status(503).json({ ok: false, msg: 'Stripe no configurado.' });

  try {
    const db = getDB();
    const profile = await db.profiles.get(req.user);
    if (profile?.plan === 'pro') {
      return res.json({ ok: false, msg: 'Ya eres PRO.' });
    }

    // Getting email from Supabase session context (or passed in body)
    const { email } = req.body; 
    const customer = await getOrCreateCustomer(req.user, email);
    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PLANS.pro_monthly.priceId, quantity: 1 }],
      success_url: `${origin}/app?stripe_success=true`,
      cancel_url: `${origin}/app?stripe_cancel=true`,
      metadata: { userId: req.user },
    });

    res.json({ ok: true, url: session.url });
  } catch (err) {
    log.error('STRIPE_CHECKOUT_ERROR', { error: err.message });
    res.status(500).json({ ok: false, msg: 'Error al iniciar pago.' });
  }
}

export async function stripeWebhook(req, res) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        if (userId) {
          const subscriptionId = session.subscription || session.id;
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionStatus(userId, sub);
        }
        break;
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ received: true, error: err.message });
  }
}
