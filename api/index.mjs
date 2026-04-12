import "./polyfills.mjs";
import express from "express";

const diag = express();
diag.get("/api/health", (req, res) => {
  res.json({ 
    status: "BOOT_OK", 
    diagnostic: "If you see this, the server is alive and the error is in src/app.js imports",
    time: new Date().toISOString()
  });
});

console.log("DEBUG: api/index.mjs execution started");

import app from "../src/app.js";

export default (req, res) => {
  if (req.url === "/api/health") {
    return diag(req, res);
  }
  return app(req, res);
};
