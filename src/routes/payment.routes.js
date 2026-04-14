import { Router } from "express";
import { createMpPreference, mpWebhook, createPaypalOrder, capturePaypalOrder } from "../controllers/payment.controller.js";
import { auth } from "../middlewares/auth.js";
import express from "express";

const router = Router();

// Aliases para compatibilidad con el frontend
router.post(["/api/payment/paypal/create", "/api/create-paypal-order"], auth, createPaypalOrder);
router.post(["/api/payment/paypal/capture", "/api/capture-paypal-order"], auth, capturePaypalOrder);
router.post(["/api/payment/mercadopago/create", "/api/create-preference"], auth, createMpPreference);
router.post("/api/webhook/mercadopago", mpWebhook);

export default router;
