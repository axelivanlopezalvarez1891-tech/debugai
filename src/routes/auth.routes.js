import { Router } from "express";
import { login, register, logout, getPerfil, updatePerfil, checkGift, claimGift, deleteAccount } from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { rateLimiters } from "../config/security.js";

const router = Router();

router.post(["/login", "/api/auth/login"], rateLimiters.auth, validate({
  user: { required: true, type: 'string', minLen: 2, maxLen: 50, isArray: false },
  pass: { required: true, type: 'string', minLen: 4, maxLen: 100, isArray: false },
}), login);

router.post(["/register", "/api/auth/register"], rateLimiters.auth, validate({
  user: { required: true, type: 'string', minLen: 2, maxLen: 50, isArray: false },
  pass: { required: true, type: 'string', minLen: 4, maxLen: 100, isArray: false },
}), register);

router.post("/api/auth/logout", logout); // Mantuve la URL de api por compatibilidad frontend
router.get(["/get-perfil", "/api/auth/get-perfil"], auth, getPerfil);
router.post(["/update-perfil", "/api/auth/update-perfil"], auth, updatePerfil);

router.get(["/check-gift", "/api/auth/check-gift"], auth, checkGift);
router.post(["/claim-gift", "/api/auth/claim-gift"], auth, claimGift);
router.delete(["/account", "/api/auth/account"], auth, deleteAccount);

export default router;
