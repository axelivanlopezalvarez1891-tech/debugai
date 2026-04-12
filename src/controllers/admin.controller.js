import { supabase } from "../config/supabase.js";
import { log } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import xss from "xss";

export async function getStats(req, res) {
  try {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: proUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro');
    
    const { data: usersList } = await supabase
      .from('profiles')
      .select('username, plan, analyses_count, created_at, last_platform')
      .order('created_at', { ascending: false });

    const mobileUsers = usersList.filter(u => u.last_platform === 'Mobile').length;
    
    const { count: totalPayments } = await supabase.from('payments').select('*', { count: 'exact', head: true });
    const { data: revenueData } = await supabase.from('payments').select('amount_cents');
    const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.amount_cents, 0);
    
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    res.json({ 
      ok: true, 
      totalUsers, 
      proUsers,
      mobileUsers,
      users: usersList,
      paymentsCount: totalPayments,
      revenueUsd: (totalRevenue / 100).toFixed(2),
      recentPayments
    });
  } catch (err) {
    log.error('ADMIN_STATS_ERROR', { error: err.message });
    res.status(500).json({ ok: false });
  }
}

export async function getAnalytics(req, res) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    
    const { count: msgsHoy } = await supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('tipo_evento', 'MSG_ENVIADO').gte('timestamp', hoy);
    const { count: msgsTotal } = await supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('tipo_evento', 'MSG_ENVIADO');
    const { count: sinTokensHoy } = await supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('tipo_evento', 'SIN_TOKENS').gte('timestamp', hoy);
    
    const { data: eventosTipoRaw } = await supabase.rpc('get_event_counts_by_type'); // Or manual tally
    
    res.json({
      ok: true,
      dau: 0, // Simplified for now
      msgsHoy, msgsTotal, sinTokensHoy,
      tasaConversion: '0.0', // Requires complex tally
      eventosTipo: [], 
      actividadDiaria: []
    });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
}

export async function getEventos(req, res) {
  const limit = parseInt(req.query.limit) || 100;
  const { data: eventos, error } = await supabase
    .from('eventos')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
    
  if (error) return res.status(500).json({ ok: false });
  res.json({ ok: true, eventos });
}

export async function upgradeUser(req, res) {
  const { targetUser, duration } = req.body;
  const safeUser = xss(targetUser);
  const durationMs = (duration && !isNaN(parseInt(duration))) ? parseInt(duration) : null;
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      pending_gift: { type: "pro", duration: durationMs } 
    })
    .eq('username', safeUser);
    
  if (error) return res.json({ ok: false, msg: "Error al enviar regalo." });
  res.json({ ok: true, msg: `🎁 Regalo PRO enviado a ${safeUser}.` });
}

export async function giftTokens(req, res) {
  const { targetUser, amount } = req.body;
  const safeUser = xss(targetUser);
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      pending_gift: { type: "tokens", amount: amount || 1000 } 
    })
    .eq('username', safeUser);
    
  if (error) return res.json({ ok: false, msg: "Error al enviar tokens." });
  res.json({ ok: true, msg: `🎁 ${amount} tokens enviados a ${safeUser}.` });
}

export async function deleteUser(req, res) {
  const { targetUser } = req.body;
  let usersToDelete = Array.isArray(targetUser) ? targetUser : [targetUser];
  
  // Note: deleting users via Supabase Auth requires Admin API which we might not have exposed here.
  // For now, we delete from the profiles table.
  const { error } = await supabase
    .from('profiles')
    .delete()
    .in('username', usersToDelete);
    
  if (error) return res.json({ ok: false, msg: "Error al eliminar perfiles." });
  res.json({ ok: true, msg: `Perfiles eliminados correctamente.` });
}

export async function makeMeAdmin(req, res) {
  const { secret, user } = req.body;
  const MASTER_KEY = process.env.MASTER_KEY || "UltraMaster99X";
  const SECRET = process.env.JWT_SECRET || "debugai_ultra_secure_secret_2026";
  
  if (secret && secret.trim() === MASTER_KEY) {
    let targetUser = xss(user) || "Axel";
    
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'admin' })
      .eq('username', targetUser);
      
    if (error) return res.status(500).json({ ok: false, msg: "Error al actualizar permisos." });

    const token = jwt.sign({ user: targetUser }, SECRET, { expiresIn: "7d" });
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, { httpOnly: true, secure: isProd, sameSite: isProd ? 'Strict' : 'Lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ ok: true, msg: "¡Identidad Maestra Verificada!", token });
  }
  res.status(403).json({ ok: false, msg: "Llave incorrecta." });
}
