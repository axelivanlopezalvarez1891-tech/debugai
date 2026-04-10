import { Router } from "express";
import { getChats, createChat, deleteChat, updateChat, regenerateChat, sendMessage } from "../controllers/chat.controller.js";
import { auth } from "../middlewares/auth.js";
import { userRateLimiter } from "../middlewares/usage.js";
import { rateLimiters } from "../config/security.js";

const router = Router();

router.get("/chats", auth, getChats);
router.post("/crear-chat", auth, createChat);
router.post("/update-chat", auth, updateChat);
router.delete("/chat/:id", auth, deleteChat);
router.post("/regenerate-chat/:id", auth, regenerateChat);

// Endpoint crítico (IA)
router.post("/mensaje", rateLimiters.ai, auth, userRateLimiter(), sendMessage);

export default router;
