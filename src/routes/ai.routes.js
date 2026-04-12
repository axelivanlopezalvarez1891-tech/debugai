import { Router } from "express";
import { analyzeCode } from "../controllers/ai.controller.js";
import { auth } from "../middlewares/auth.js";
import { rateLimiters } from "../config/security.js";

const router = Router();

router.post("/analyze", rateLimiters.ai, auth, analyzeCode);

export default router;
