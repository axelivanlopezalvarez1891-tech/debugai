console.log("DEBUG: Loading src/app.js...");
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import helmet from "helmet";
import cors from "cors";
import { log } from "./utils/logger.js";
import { configureHelmet, configureCors, rateLimiters } from "./config/security.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute paths for local fallback (Vercel uses its own routing)
const appDist = path.resolve(__dirname, "../app_v2/dist");
const landingDist = path.resolve(__dirname, "../landing_v2/dist");

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

// Diagnostic: File System Check (Only for verification)
app.get("/api/debug-files", (req, res) => {
  try {
    const fs = (await import('fs')).default;
    const list = (path) => fs.existsSync(path) ? fs.readdirSync(path) : "NOT FOUND";
    res.json({
      cwd: process.cwd(),
      landing: { path: landingDist, files: list(landingDist) },
      app: { path: appDist, files: list(appDist) }
    });
  } catch (e) { res.json({ error: e.message }); }
});

// Mount modularized API routes
app.use(routes);

// --- FULL PRODUCTION FALLBACKS (Express 5 Protected - NO REGEX) ---

// Serve static assets correctly for Landing
app.use("/assets", express.static(path.join(landingDist, "assets")));

// Dashboard SPA Fallback (Matches anything starting with /app)
app.use("/app", (req, res) => {
  const filePath = path.join(appDist, req.path === "/" ? "index.html" : req.path);
  res.sendFile(path.join(appDist, "index.html"));
});

// Landing SPA Fallback (Matches everything else)
app.use((req, res) => {
  // If requesting an asset that wasn't found, don't return index.html (fixes MIME error)
  if (req.path.includes("/assets/")) return res.status(404).send("Asset not found");
  res.sendFile(path.join(landingDist, "index.html"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  log.error('UNHANDLED_ERROR', { msg: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
