#!/usr/bin/env node
// =================================================================
// STRIPE AUTO-SETUP — DebugAI PRO
// 
// USO:
//   node scripts/stripe-setup.js sk_test_XXXXXXXXXXXXXXXXXXXXXXXXX
//
// Qué hace este script:
//  1. Crea el producto "DebugAI PRO" en Stripe
//  2. Crea el precio mensual ($14.99/mes)
//  3. Crea el precio anual ($99.99/año)
//  4. Configura el webhook con todos los eventos necesarios
//  5. Escribe automáticamente las variables en tu .env local
// =================================================================

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Obtener la key del argumento ─────────────────────────────────
const secretKey = process.argv[2];
if (!secretKey || (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_'))) {
  console.error('\n❌ Uso correcto:\n   node scripts/stripe-setup.js sk_test_XXXXXXXXXXXX\n');
  console.error('📌 Obtén tu key en: https://dashboard.stripe.com/apikeys\n');
  process.exit(1);
}

const isLive = secretKey.startsWith('sk_live_');
console.log(`\n🚀 Iniciando configuración de Stripe (modo: ${isLive ? '🔴 LIVE (REAL)' : '🟡 TEST'})\n`);

const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

// ── Leer .env existente ───────────────────────────────────────────
const envPath = path.join(ROOT, '.env');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Archivo .env encontrado');
} catch {
  console.log('📝 Creando nuevo .env');
}

function setEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  return content + `\n${key}=${value}`;
}

async function main() {
  try {
    // ── PASO 1: Verificar cuenta Stripe ────────────────────────────
    console.log('🔍 Verificando acceso a Stripe...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Cuenta: ${account.email || account.id} (${account.country})\n`);

    // ── PASO 2: Buscar o crear Producto ───────────────────────────
    console.log('📦 Configurando producto "DebugAI PRO"...');
    let product;
    const existingProducts = await stripe.products.list({ limit: 20 });
    const found = existingProducts.data.find(p => p.name === 'DebugAI PRO' && p.active);
    
    if (found) {
      product = found;
      console.log(`✅ Producto existente reutilizado: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: 'DebugAI PRO',
        description: 'Acceso ilimitado a DebugAI: Claude 3.5 Sonnet, DeepSeek R1, Agentes Autónomos, Visión Artificial, Búsqueda en Internet y más.',
        metadata: { app: 'DebugAI', plan: 'pro' },
        images: [],
      });
      console.log(`✅ Producto creado: ${product.id}`);
    }

    // ── PASO 3: Precio mensual ─────────────────────────────────────
    console.log('\n💰 Configurando precio mensual ($14.99/mes)...');
    let priceMonthly;
    const existingPrices = await stripe.prices.list({ product: product.id, limit: 20 });
    const monthlyFound = existingPrices.data.find(p => 
      p.recurring?.interval === 'month' && p.unit_amount === 1499 && p.active
    );
    
    if (monthlyFound) {
      priceMonthly = monthlyFound;
      console.log(`✅ Precio mensual existente reutilizado: ${priceMonthly.id}`);
    } else {
      priceMonthly = await stripe.prices.create({
        product: product.id,
        unit_amount: 1499, // $14.99 en centavos
        currency: 'usd',
        recurring: { interval: 'month' },
        nickname: 'PRO Mensual',
        metadata: { plan: 'pro_monthly' },
      });
      console.log(`✅ Precio mensual creado: ${priceMonthly.id}`);
    }

    // ── PASO 4: Precio anual ───────────────────────────────────────
    console.log('\n💰 Configurando precio anual ($99.99/año)...');
    let priceAnnual;
    const annualFound = existingPrices.data.find(p => 
      p.recurring?.interval === 'year' && p.unit_amount === 9999 && p.active
    );
    
    if (annualFound) {
      priceAnnual = annualFound;
      console.log(`✅ Precio anual existente reutilizado: ${priceAnnual.id}`);
    } else {
      priceAnnual = await stripe.prices.create({
        product: product.id,
        unit_amount: 9999, // $99.99 en centavos
        currency: 'usd',
        recurring: { interval: 'year' },
        nickname: 'PRO Anual',
        metadata: { plan: 'pro_annual' },
      });
      console.log(`✅ Precio anual creado: ${priceAnnual.id}`);
    }

    // ── PASO 5: Configurar Webhook ─────────────────────────────────
    console.log('\n🔔 Configurando webhook...');
    
    // Detectar URL del app desde .env
    const appUrlMatch = envContent.match(/APP_URL=(.+)/);
    const renderUrlMatch = envContent.match(/RENDER_EXTERNAL_URL=(.+)/);
    let appUrl = (appUrlMatch?.[1] || renderUrlMatch?.[1] || '').trim();
    
    if (!appUrl) {
      // Buscar en variables de entorno del sistema
      appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || '';
    }

    let webhookSecret = 'PENDIENTE_CONFIGURAR_MANUALMENTE';
    
    if (appUrl && appUrl.startsWith('https://')) {
      const webhookUrl = `${appUrl}/api/webhook/stripe`;
      const events = [
        'checkout.session.completed',
        'invoice.paid',
        'invoice.payment_failed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
      ];

      // Buscar webhook existente para esa URL
      const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 20 });
      const existingWebhook = existingWebhooks.data.find(w => w.url === webhookUrl && w.status === 'enabled');

      if (existingWebhook) {
        console.log(`✅ Webhook existente para ${webhookUrl}`);
        console.log('⚠️  El secret del webhook existente no se puede recuperar. Verifica en el Dashboard.');
      } else {
        // Crear nuevo webhook
        const webhook = await stripe.webhookEndpoints.create({
          url: webhookUrl,
          enabled_events: events,
          description: 'DebugAI PRO - Webhook de suscripciones',
        });
        webhookSecret = webhook.secret;
        console.log(`✅ Webhook creado: ${webhookUrl}`);
        console.log(`✅ Secret del webhook obtenido`);
      }
    } else {
      console.log(`⚠️  No se configuró webhook automáticamente.`);
      console.log(`   APP_URL no encontrada en .env. Configura manualmente en:`);
      console.log(`   https://dashboard.stripe.com/webhooks`);
    }

    // ── PASO 6: Escribir .env ──────────────────────────────────────
    console.log('\n📝 Actualizando .env...');
    
    envContent = setEnvVar(envContent, 'STRIPE_SECRET_KEY', secretKey);
    envContent = setEnvVar(envContent, 'STRIPE_PRICE_PRO_MONTHLY', priceMonthly.id);
    envContent = setEnvVar(envContent, 'STRIPE_PRICE_PRO_ANNUAL', priceAnnual.id);
    if (webhookSecret !== 'PENDIENTE_CONFIGURAR_MANUALMENTE') {
      envContent = setEnvVar(envContent, 'STRIPE_WEBHOOK_SECRET', webhookSecret);
    }
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env actualizado correctamente\n');

    // ── RESUMEN FINAL ──────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 STRIPE CONFIGURADO CORRECTAMENTE');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\nProducto ID:       ${product.id}`);
    console.log(`Price Mensual ID:  ${priceMonthly.id}`);
    console.log(`Price Anual ID:    ${priceAnnual.id}`);
    
    if (webhookSecret !== 'PENDIENTE_CONFIGURAR_MANUALMENTE') {
      console.log(`Webhook Secret:    whsec_... (guardado en .env)`);
    } else {
      console.log(`\n⚠️  PENDIENTE: Configurar webhook manualmente`);
      console.log(`   1. Ve a: https://dashboard.stripe.com/webhooks`);
      console.log(`   2. Add endpoint → URL: https://TU-APP.onrender.com/api/webhook/stripe`);
      console.log(`   3. Selecciona eventos: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted`);
      console.log(`   4. Copia el "Signing secret" y agrégalo a Render como STRIPE_WEBHOOK_SECRET`);
    }
    
    console.log('\n📋 Variables para Render (copia y pega en tu servicio):');
    console.log('─────────────────────────────────────────────────────');
    console.log(`STRIPE_SECRET_KEY       = ${secretKey.substring(0, 12)}...`);
    console.log(`STRIPE_PRICE_PRO_MONTHLY = ${priceMonthly.id}`);
    console.log(`STRIPE_PRICE_PRO_ANNUAL  = ${priceAnnual.id}`);
    if (webhookSecret !== 'PENDIENTE_CONFIGURAR_MANUALMENTE') {
      console.log(`STRIPE_WEBHOOK_SECRET   = ${webhookSecret.substring(0, 10)}...`);
    }

    if (isLive) {
      console.log('\n🔴 MODO LIVE ACTIVO — Los pagos son REALES');
    } else {
      console.log('\n🟡 MODO TEST — Usa la tarjeta 4242 4242 4242 4242 para probar');
      console.log('   Cuando estés listo para cobrar real, corre con sk_live_...');
    }
    console.log('');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.type === 'StripeAuthenticationError') {
      console.error('   La clave de Stripe es inválida o caducó.');
      console.error('   Obtén una nueva en: https://dashboard.stripe.com/apikeys');
    }
    process.exit(1);
  }
}

main();
