import { supabase } from "../config/supabase.js";
import { getDB } from "../config/db.js";
import { log } from "../utils/logger.js";
import xss from "xss";

export async function login(req, res) {
  const { user, pass } = req.body; // 'user' is email in Supabase context
  if (!user || !pass) return res.json({ ok: false, msg: "Faltan datos" });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.trim(),
      password: pass.trim(),
    });

    if (error) {
      log.warn('LOGIN_FAILED', { user, error: error.message });
      return res.json({ ok: false, msg: 'Credenciales incorrectas o cuenta no verificada.' });
    }

    // Supabase handles sessions, but for our backend consistency we might still use cookies
    // In Vercel, we can pass the Supabase session token
    res.cookie('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: data.session.expires_in * 1000
    });

    res.json({ ok: true, session: data.session });
  } catch (err) {
    log.error('LOGIN_ERROR', { error: err.message });
    res.status(500).json({ ok: false, msg: "Error de servidor." });
  }
}

export async function register(req, res) {
  const { user, pass } = req.body; // user is email
  if (!user || !pass) return res.json({ ok: false, msg: "Faltan datos" });

  try {
    const { data, error } = await supabase.auth.signUp({
      email: user.trim(),
      password: pass.trim(),
      options: {
        data: {
          username: user.split('@')[0], // Default username
        }
      }
    });

    if (error) {
      log.error('REGISTER_FAILED', { user, error: error.message });
      return res.json({ ok: false, msg: error.message });
    }

    res.json({ 
      ok: true, 
      msg: "¡Cuenta creada! Revisa tu email para confirmar suscripción (si está habilitado) o inicia sesión.",
      user: data.user 
    });
  } catch (err) {
    log.error('REGISTER_ERROR', { error: err.message });
    res.status(500).json({ ok: false, msg: "Error al registrar usuario." });
  }
}

export async function googleLogin(req, res) {
  try {
    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      }
    });

    if (error) throw error;
    res.json({ ok: true, url: data.url });
  } catch (err) {
    res.status(500).json({ ok: false, msg: "Error al iniciar Google OAuth." });
  }
}

export async function getPerfil(req, res) {
  const db = getDB();
  try {
    // req.user should now be the UUID from Supabase (set by auth middleware)
    const profile = await db.profiles.get(req.user);
    
    if (!profile) {
      return res.json({ ok: false, msg: "Perfil no encontrado." });
    }

    res.json({ 
      ok: true, 
      username: profile.username,
      plan: profile.plan || 'free',
      premium: profile.plan === 'pro',
      analyses_count: profile.analyses_count || 0,
      analyses_limit: profile.analyses_limit || 5,
      subscribed_at: profile.subscribed_at,
      subscription_status: profile.subscription_status
    });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
}

export async function logout(req, res) {
  await supabase.auth.signOut();
  res.clearCookie('sb-access-token');
  res.json({ ok: true });
}

export async function updatePerfil(req, res) {
  const db = getDB();
  const { username } = req.body;
  try {
    await db.profiles.update(req.user, { username: xss(username) });
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false });
  }
}

export async function checkGift(req, res) {
  const db = getDB();
  try {
    const profile = await db.profiles.get(req.user);
    if (profile && profile.pending_gift) {
      return res.json({ ok: true, gift: profile.pending_gift });
    }
    res.json({ ok: false });
  } catch (err) {
    res.json({ ok: false });
  }
}

export async function claimGift(req, res) {
  const db = getDB();
  try {
    const profile = await db.profiles.get(req.user);
    if (!profile || !profile.pending_gift) return res.json({ ok: false });

    const gift = profile.pending_gift;
    const updates = { pending_gift: null };

    if (gift.type === 'pro') {
      updates.plan = 'pro';
    } else if (gift.type === 'tokens') {
      updates.creditos = (profile.creditos || 0) + (gift.amount || 1000);
    }

    await db.profiles.update(req.user, updates);
    
    // Log event
    await db.events.track(req.user, 'GIFT_CLAIMED', { gift_type: gift.type });
    
    res.json({ ok: true, msg: "¡Regalo reclamado con éxito!" });
  } catch (err) {
    res.json({ ok: false });
  }
}

export async function deleteAccount(req, res) {
  try {
    // Delete from profiles table
    await supabase.from('profiles').delete().eq('id', req.user);
    
    // Delete from Auth (requires service role / admin api)
    res.clearCookie('sb-access-token');
    res.json({ ok: true, msg: "Cuenta eliminada (perfil borrado)." });
  } catch (err) {
    res.json({ ok: false });
  }
}
