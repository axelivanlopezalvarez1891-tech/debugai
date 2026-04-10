// ============================================================
// [LOG] LOGGER ESTRUCTURADO — Seguro (sin passwords/tokens/keys)
// Uso para auditoría y observabilidad estándar SaaS.
// ============================================================

export const log = {
  info:  (msg, meta = {}) => console.log(JSON.stringify({ level: 'info',  ts: new Date().toISOString(), msg, ...meta })),
  warn:  (msg, meta = {}) => console.warn(JSON.stringify({ level: 'warn',  ts: new Date().toISOString(), msg, ...meta })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), msg, ...meta })),
};
