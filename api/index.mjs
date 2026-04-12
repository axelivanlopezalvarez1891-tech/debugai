import "./polyfills.mjs";
import express from "express";

const debugApp = express();

debugApp.all("*", (req, res) => {
  res.json({ 
    status: "RADICAL_ISOLATION_ACTIVE", 
    message: "If you see this, Vercel IS finally updating. The issue is purely inside your src/ folder.",
    timestamp: new Date().toISOString()
  });
});

console.log("DEBUG: Radical isolation mode started.");

export default debugApp;
