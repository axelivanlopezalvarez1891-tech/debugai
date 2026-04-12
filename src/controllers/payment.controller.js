import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { supabase } from "../config/supabase.js";
import { getDB } from "../config/db.js";
import { log } from "../utils/logger.js";

const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' });

const PRICE_TO_TOKENS = {
  "1.00": 20, "2.00": 55, "4.00": 140, "8.00": 380, "15.00": 1000
};
const PRO_PRICE = "14.99";

const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET).toString("base64");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  const data = await response.json();
  return data.access_token;
}

export async function createMpPreference(req, res) {
  try {
    const { amount, isPro } = req.body;
    let price = 0;
    let title = "";
    let itemId = "";

    if (isPro) {
      price = 14.99;
      title = "DebugAI PRO - Suscripción Lanzamiento (Oferta)";
      itemId = "pro_subscription";
    } else {
      if(amount === 20) price = 1;
      else if(amount === 55) price = 2;
      else if(amount === 140) price = 4;
      else if(amount === 380) price = 8;
      else if(amount === 1000) price = 15;
      else return res.status(400).json({ok: false, msg: "Paquete inválido"});
      
      title = `Paquete de ${amount} Tokens IA`;
      itemId = "tokens_ia";
    }

    const origin = req.headers.origin && req.headers.origin !== "null" ? req.headers.origin : "http://localhost:3000";
    const preference = new Preference(mpClient);
    const back_url_success = isPro ? `${origin}/app?mp_success=true&type=pro` : `${origin}/app?mp_success=true&qty=${amount}`;

    const result = await preference.create({
      body: {
        items: [{ id: itemId, title: title, quantity: 1, unit_price: price, currency_id: 'USD' }],
        back_urls: { success: back_url_success, failure: `${origin}/app?mp_failure=true`, pending: `${origin}/app?mp_pending=true` },
        external_reference: req.user,
        notification_url: `${origin}/api/webhook/mercadopago` 
      }
    });
    res.json({ ok: true, init_point: result.init_point });
  } catch (error) {
    log.error("MP Preference Error:", { error: error.message });
    res.json({ ok: false, msg: "Error conectando con el banco." });
  }
}

export async function mpWebhook(req, res) {
  try {
    const db = getDB();
    const paymentId = req.body?.data?.id || req.query["data.id"] || req.query.id;
    const topic = req.body?.type || req.query.topic || req.query.type;

    if ((topic === 'payment' || topic === 'mp-payment') && paymentId) {
      const exists = await db.payments.exists(`mp_${paymentId}`);
      if (exists) return res.status(200).send("OK");

      const mpPayment = new Payment(mpClient);
      const pData = await mpPayment.get({ id: paymentId });

      if (pData.status === 'approved') {
        const userId = pData.external_reference; // This should be the UUID from req.user set in preference
        const itemId = pData.additional_info?.items?.[0]?.id || "";
        const title = pData.additional_info?.items?.[0]?.title || "";
        const amountCents = Math.round((pData.transaction_amount || 0) * 100);

        if (userId) {
          if (itemId === "pro_subscription") {
            await db.payments.register({ paymentId: `mp_${paymentId}`, provider: 'mercadopago', userId, type: 'pro', amountCents });
            await db.profiles.update(userId, { plan: 'pro' });
            await db.events.track(userId, 'COMPRA', { provider: 'mercadopago', tipo: 'pro', monto_cents: amountCents, payment_id: paymentId });
          } else {
            const qtyMatch = title.match(/(\d+) Tokens/);
            const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
            if (qty > 0) {
              await db.payments.register({ paymentId: `mp_${paymentId}`, provider: 'mercadopago', userId, type: 'tokens', amountCents, tokensGranted: qty });
              const profile = await db.profiles.get(userId);
              await db.profiles.update(userId, { creditos: (profile?.creditos || 0) + qty });
              await db.events.track(userId, 'COMPRA', { provider: 'mercadopago', tipo: 'tokens', cantidad: qty, monto_cents: amountCents, payment_id: paymentId });
            }
          }
        }
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    log.error('MP_WEBHOOK_ERROR', { error: error.message });
    res.status(500).json({ ok: false });
  }
}

export async function createPaypalOrder(req, res) {
  try {
    const { amount, isPro } = req.body;
    let price = "0.00"; let desc = ""; let return_url_params = "";
    if (isPro) {
      price = "14.99"; desc = "DebugAI PRO - Oferta de Lanzamiento"; return_url_params = "paypal_success=true&type=pro";
    } else {
      let qty = Number(amount) || 0;
      if(qty === 20) price = "1.00"; else if(qty === 55) price = "2.00"; else if(qty === 140) price = "4.00"; else if(qty === 380) price = "8.00"; else if(qty === 1000) price = "15.00";
      else return res.status(400).json({ok: false, msg: "Paquete inválido"});
      desc = `Paquete de ${qty} Tokens IA`; return_url_params = `paypal_success=true&qty=${qty}`;
    }

    const accessToken = await getPayPalAccessToken();
    const origin = req.headers.origin && req.headers.origin !== "null" ? req.headers.origin : "http://localhost:3000";
    
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: price }, description: desc }],
        application_context: { return_url: `${origin}/app?${return_url_params}`, cancel_url: `${origin}/app?paypal_cancel=true`, brand_name: "DebugAI Assistant", user_action: "PAY_NOW" }
      })
    });
    
    const orderData = await response.json();
    if (orderData.id) {
       const approveLink = orderData.links.find(l => l.rel === "approve").href;
       res.json({ ok: true, url: approveLink });
    } else {
       res.json({ ok: false, msg: "Error al crear orden en PayPal." });
    }
  } catch (err) {
    res.json({ ok: false, msg: "Error de servidor contactando a PayPal." });
  }
}

export async function capturePaypalOrder(req, res) {
  try {
    const db = getDB();
    const { orderID } = req.body;
    if (!orderID || typeof orderID !== 'string') return res.status(400).json({ ok: false, msg: "Order ID inválido." });

    const exists = await db.payments.exists(`paypal_${orderID}`);
    if (exists) return res.json({ ok: true });

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` }
    });
    
    const orderData = await response.json();
    if (orderData.status === "COMPLETED") {
       const capturedAmount = orderData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || "0";
       const amountCents = Math.round(parseFloat(capturedAmount) * 100);

       if (capturedAmount === PRO_PRICE) {
         await db.payments.register({ paymentId: `paypal_${orderID}`, provider: 'paypal', userId: req.user, type: 'pro', amountCents });
         await db.profiles.update(req.user, { plan: 'pro' });
         await db.events.track(req.user, 'COMPRA', { provider: 'paypal', tipo: 'pro', monto_cents: amountCents, order_id: orderID });
       } else if (PRICE_TO_TOKENS[capturedAmount]) {
         const tokensToGrant = PRICE_TO_TOKENS[capturedAmount];
         await db.payments.register({ paymentId: `paypal_${orderID}`, provider: 'paypal', userId: req.user, type: 'tokens', amountCents, tokensGranted: tokensToGrant });
         const profile = await db.profiles.get(req.user);
         await db.profiles.update(req.user, { creditos: (profile?.creditos || 0) + tokensToGrant });
         await db.events.track(req.user, 'COMPRA', { provider: 'paypal', tipo: 'tokens', cantidad: tokensToGrant, monto_cents: amountCents, order_id: orderID });
       } else {
         return res.json({ ok: false, msg: "Monto no reconocido." });
       }
       res.json({ ok: true });
    } else {
       res.json({ ok: false });
    }
  } catch (err) {
    log.error('PAYPAL_CAPTURE_ERROR', { error: err.message });
    res.json({ ok: false });
  }
}
