console.log("DEBUG: Loading src/app.js...");
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import { log } from "./utils/logger.js";
import { configureHelmet, configureCors, rateLimiters } from "./config/security.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Config
app.set('trust proxy', 1);
app.use(configureHelmet());
app.use(configureCors());
app.use(rateLimiters.global);

// Note: Stripe Webhook raw middleware is now handled inside stripe.routes.js

app.use(express.json({ limit: '5mb' })); 
app.use(cookieParser());

// Static builds directory
const landingDist = path.join(__dirname, "..", "landing_v2", "dist");
const appDist = path.join(__dirname, "..", "app_v2", "dist");

// Serve frontends based on paths
app.use("/app", express.static(appDist));
app.use("/", express.static(landingDist));

// SPA Routing for Dashboard
app.get("/app/:match(.*)", (req, res) => {
  res.sendFile(path.join(appDist, "index.html"));
});

// Diagnostic Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Mount modularized API routes
app.use(routes);

// Fallback to landing for everything else
app.get("/:match(.*)", (req, res) => {
  res.sendFile(path.join(landingDist, "index.html"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  log.error('UNHANDLED_ERROR', { msg: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
