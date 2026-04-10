import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import { log } from "./utils/logger.js";
import { configureHelmet, configureCors, rateLimiters } from "./config/security.js";
import routes from "./routes/index.js";
import stripeRoutes from "./routes/stripe.routes.js";
import { stripeWebhook } from "./controllers/stripe.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Config
app.set('trust proxy', 1);
app.use(configureHelmet());
app.use(configureCors());
app.use(rateLimiters.global);

// ── UTF-8 Hardening Middleware ─────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const oldSetHeader = res.setHeader;
  res.setHeader = function(name, value) {
    if (name && name.toLowerCase() === 'content-type') {
      if (value && (value.includes('text/html') || value.includes('application/javascript') || value.includes('text/css'))) {
        if (!value.includes('charset')) {
          value += '; charset=utf-8';
        }
      }
    }
    return oldSetHeader.apply(this, [name, value]);
  };
  next();
});

// ⚠️ STRIPE WEBHOOK — Debe ir ANTES de express.json() para preservar raw body
// Stripe verifica la firma criptográfica sobre el cuerpo RAW sin parsear
app.post(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Application Middlewares (after stripe webhook)
app.use(express.json({ limit: '5mb' })); 
app.use(cookieParser());

// Anti-Abuse Middlewares (Payload checks)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (req.body !== undefined && typeof req.body !== 'object') {
      return res.status(400).json({ ok: false, msg: 'Payload inválido.' });
    }
    if (Array.isArray(req.body)) {
      return res.status(400).json({ ok: false, msg: 'Se esperaba un objeto, no un array.' });
    }
  }
  next();
});

// Static files route (Servir Frontend)
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir, { index: false }));

// HTML Frontend Routes
app.get("/", (req, res) => { res.sendFile(path.join(publicDir, "landing.html")); });
app.get("/app", (req, res) => { res.sendFile(path.join(publicDir, "index.html")); });
app.get("/admin", (req, res) => { 
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private'); 
  res.sendFile(path.join(publicDir, "admin.html")); 
});

// Mount modularized API routes
app.use(routes);
app.use(stripeRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  log.error('UNHANDLED_ERROR', { msg: err.message, path: req.path, method: req.method });
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ ok: false, msg: 'Acceso no permitido.' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
