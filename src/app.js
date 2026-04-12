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

// ⚠️ STRIPE WEBHOOK — Must be BEFORE express.json()
app.post(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

app.use(express.json({ limit: '5mb' })); 
app.use(cookieParser());

// Static builds directory
const landingDist = path.join(__dirname, "..", "landing_v2", "dist");
const appDist = path.join(__dirname, "..", "app_v2", "dist");

// Serve frontends based on paths
app.use("/app", express.static(appDist));
app.use("/", express.static(landingDist));

// SPA Routing for Dashboard
app.get("/app/*", (req, res) => {
  res.sendFile(path.join(appDist, "index.html"));
});

// Mount modularized API routes
app.use(routes);
app.use(stripeRoutes);

// Fallback to landing for everything else
app.get("*", (req, res) => {
  res.sendFile(path.join(landingDist, "index.html"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  log.error('UNHANDLED_ERROR', { msg: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
