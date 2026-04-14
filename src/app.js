import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "./utils/logger.js";
import { configureHelmet, configureCors, rateLimiters } from "./config/security.js";
import routes from "./routes/index.js";
import fs from "fs";

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

// Debug route
app.get("/api/debug-files", (req, res) => {
  try {
    const assetsPath = path.join(publicDir, 'app/assets');
    const files = fs.readdirSync(assetsPath);
    res.json({ status: "ok", path: assetsPath, files: files });
  } catch(e) {
    res.json({ status: "error", msg: e.message, path: publicDir });
  }
});

// Debug path
app.get("/api/echo", (req, res) => {
  res.json({ path: req.path, url: req.url, originalUrl: req.originalUrl });
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
  // If the request looks like an asset (has a file extension), return 404 instead of HTML
  // to avoid strict MIME type errors in the browser.
  if (req.path.match(/\.[^\/]+$/)) {
    return res.status(404).send('Not found');
  }

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
