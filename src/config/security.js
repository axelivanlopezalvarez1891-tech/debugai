import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { log } from "../utils/logger.js";

// [SEC-1] HEADERS DE SEGURIDAD — Helmet restringido (Cero '*')
const IS_PROD = process.env.RENDER || process.env.NODE_ENV === 'production';

export const configureHelmet = () => helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", // Requerido por Pyodide (WASM)
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://www.paypal.com", 
        "https://sdk.mercadopago.com"
      ],
      "script-src-attr": ["'unsafe-inline'"],
      "style-src": [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com", 
        "https://cdnjs.cloudflare.com"
      ],
      "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https://*", "https://w.wallhaven.cc"], 
      "connect-src": [
        "'self'", 
        "https://api.openai.com", 
        "https://openrouter.ai",
        "https://api.groq.com",
        "https://sdk.mercadopago.com",
        "https://www.paypal.com",
        "wss:"
      ],
      "frame-src": [
        "'self'", 
        "https://www.paypal.com", 
        "https://sdk.mercadopago.com"
      ],
      "object-src": ["'none'"],
      "upgrade-insecure-requests": []
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});

// [SEC-2] CORS RESTRICTIVO
export const configureCors = () => {
  const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'https://debugai-sgew.onrender.com';
  return cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLocal = origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000';
      if (origin === ALLOWED_ORIGIN || isLocal) {
        return callback(null, true);
      }
      log.warn('CORS_BLOCKED', { origin });
      return callback(new Error('CORS: Origen no autorizado'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  });
};

// [SEC-3] RATE LIMITING
export const rateLimiters = {
  global: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, msg: "Límite de solicitudes excedido. Intenta en unos minutos." }
  }),
  ai: rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, msg: "Demasiadas solicitudes a la IA. Espera un momento." }
  }),
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, msg: "Demasiados intentos. Bloqueado temporalmente." }
  }),
  admin: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, msg: "Intrusión detectada. Acceso bloqueado." }
  })
};
