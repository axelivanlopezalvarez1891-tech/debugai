import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "./utils/logger.js";
import { configureHelmet, configureCors, rateLimiters } from "./config/security.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In Vercel Lambda: __dirname = /var/task/src/, so ../public = /var/task/public/
const publicDir = path.resolve(__dirname, "../public");

const app = express();

// Security Config
app.set('trust proxy', 1);
app.use(configureHelmet());
app.use(configureCors());
app.use(rateLimiters.global);
app.use(cookieParser());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", routes);

// Unknown /api/* routes
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, msg: "Ruta API no encontrada." });
});

// Static files from /public (landing + dashboard assets)
app.use(express.static(publicDir));

// SPA catch-all: unknown paths serve the correct HTML
app.use((req, res, next) => {
  const isAppRoute = req.path === "/app" || req.path.startsWith("/app/");
  const targetFile = isAppRoute
    ? path.join(publicDir, "app/index.html")
    : path.join(publicDir, "index.html");

  res.sendFile(targetFile, (err) => {
    if (err) next(err);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  log.error('UNHANDLED_ERROR', { msg: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
