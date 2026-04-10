import { Router } from "express";
import { createMpPreference, mpWebhook, createPaypalOrder, capturePaypalOrder } from "../controllers/payment.controller.js";
import { auth } from "../middlewares/auth.js";
import express from "express";

const router = Router();

router.post("/api/create-preference", auth, createMpPreference);
router.post("/api/webhook/mercadopago", mpWebhook);

router.post("/api/create-paypal-order", auth, createPaypalOrder);
router.post("/api/capture-paypal-order", auth, capturePaypalOrder);

export default router;
