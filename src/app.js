import express from "express";
import cookieParser from "cookie-parser";
import { log } from "./utils/logger.js";
import { configureHelmet, configureCors, rateLimiters } from "./config/security.js";
import routes from "./routes/index.js";

const app = express();

// Security Config
app.set('trust proxy', 1);
app.use(configureHelmet());
app.use(configureCors());
app.use(rateLimiters.global);

app.use(cookieParser());
app.use(express.json());

// Diagnostic Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Mount modularized API routes
app.use(routes);

// Fallback for unknown /api/* routes — prevents Vercel from crashing trying to find static files
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, msg: "Ruta API no encontrada." });
});

// Global Error Handler
app.use((err, req, res, next) => {
  log.error('UNHANDLED_ERROR', { msg: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
