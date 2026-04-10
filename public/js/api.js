// =====================================================
// [MOD] API.JS — Capa de comunicación con el backend.
// Todas las llamadas fetch centralizadas aquí.
// =====================================================

export const API = "";

export const apiFetch = (url, opts = {}) => fetch(API + url, { credentials: "include", ...opts });

export async function apiPost(url, body) {
  return apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

export async function apiGet(url) {
  return apiFetch(url);
}

export async function apiDelete(url) {
  return apiFetch(url, { method: "DELETE" });
}
