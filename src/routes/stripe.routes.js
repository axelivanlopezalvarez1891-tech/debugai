// =================================================================
// [ROUTES] STRIPE.ROUTES.JS
// ⚠️ CRÍTICO: El webhook de Stripe DEBE usar express.raw() antes del
// express.json() global para poder verificar la firma criptográfica.
// Este router lo maneja internamente.
// =================================================================

import { Router } from 'express';
import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  createCheckoutSession,
  createPortalSession,
  syncSubscription,
  stripeWebhook,
  getPlans,
} from '../controllers/stripe.controller.js';

const router = Router();

// ── Endpoints públicos ─────────────────────────────────────────────────────
router.get('/api/stripe/plans', getPlans);

// ── Endpoints autenticados ─────────────────────────────────────────────────
router.post('/api/stripe/checkout', auth, createCheckoutSession);
router.post('/api/stripe/portal', auth, createPortalSession);
router.post('/api/stripe/sync', auth, syncSubscription);

// ── Webhook de Stripe (NO requiere auth de usuario, requiere raw body) ──────
// express.raw() aquí sobreescribe el express.json() global SOLO para esta ruta
router.post(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

export default router;
