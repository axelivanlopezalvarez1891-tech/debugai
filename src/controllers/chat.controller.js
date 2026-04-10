import xss from "xss";
import { getDB } from "../config/db.js";
import { log } from "../utils/logger.js";
import { streamAIResponse, enrichPromptWithTools, getRoleTemplate, contieneInsultos, limpiarRespuesta, aiResponseCache } from "../services/ai.service.js";

function registrarEventoSafe(username, tipo, metadata) {
  const db = getDB();
  db.run("INSERT INTO eventos (username, tipo_evento, metadata) VALUES (?, ?, ?)", [username || 'anonimo', tipo, JSON.stringify(metadata)]).catch(()=>{});
}

export async function getChats(req, res) {
  const db = getDB();
  const rows = await db.all("SELECT * FROM chats WHERE username = ?", [req.user]);
  res.json({ chats: rows.map(r => ({ id: r.id, folder: r.folder, titulo: r.titulo, mensajes: JSON.parse(r.mensajes) })) });
}

export async function createChat(req, res) {
  const db = getDB();
  const id = Date.now().toString();
  const { intro } = req.body || {};
  let mensajes = [];
  if (intro) mensajes.push({ role: "assistant", content: "¡Hola! Soy **DebugAI PRO** — IA avanzada para código, documentos y mucho más.\n\nPuedo ayudarte a:\n- 🐛 **Depurar y corregir errores** en cualquier lenguaje\n- 📄 **Resumir o analizar** documentos, PDFs y textos\n- 🎨 **Generar imágenes** con solo describirlas\n- 🌐 **Buscar información** en internet en tiempo real\n- 💡 **Explicar conceptos** técnicos paso a paso\n\n¿Por dónde empezamos?" });
  
  const nuevoChat = { id, folder: "Sin Carpeta", titulo: "Nueva Conversación", mensajes };
  await db.run("INSERT INTO chats (id, username, folder, titulo, mensajes) VALUES (?, ?, ?, ?, ?)", [id, req.user, nuevoChat.folder, nuevoChat.titulo, JSON.stringify(mensajes)]);
  res.json({ ok: true, chat: nuevoChat });
}

export async function deleteChat(req, res) {
  const db = getDB();
  await db.run("DELETE FROM chats WHERE id = ? AND username = ?", [req.params.id, req.user]);
  res.json({ ok: true });
}

export async function updateChat(req, res) {
  const db = getDB();
  const { id, folder, titulo } = req.body;
  const chat = await db.get("SELECT * FROM chats WHERE id = ? AND username = ?", [id, req.user]);
  if (!chat) return res.json({ ok: false });
  
  if (folder !== undefined) await db.run("UPDATE chats SET folder = ? WHERE id = ?", [folder, id]);
  if (titulo !== undefined) await db.run("UPDATE chats SET titulo = ? WHERE id = ?", [titulo, id]);
  res.json({ ok: true });
}

export async function regenerateChat(req, res) {
  const db = getDB();
  const chatId = req.params.id;
  const chatRow = await db.get("SELECT mensajes FROM chats WHERE id = ? AND username = ?", [chatId, req.user]);
  if (!chatRow) return res.json({ ok: false, msg: "Chat no válido." });
  
  let mensajes = JSON.parse(chatRow.mensajes);
  if (mensajes.length === 0) return res.json({ ok: false, msg: "Chat vacío." });

  if (mensajes[mensajes.length - 1].role === "assistant") mensajes.pop();
  
  let lastUserMsg = "...";
  if (mensajes.length > 0 && mensajes[mensajes.length - 1].role === "user") {
      let content = mensajes[mensajes.length - 1].content;
      lastUserMsg = typeof content === "string" ? content : content[0].text;
      mensajes.pop();
  }

  await db.run("UPDATE chats SET mensajes = ? WHERE id = ?", [JSON.stringify(mensajes), chatId]);
  res.json({ ok: true, ultimoMensaje: lastUserMsg });
}

export async function sendMessage(req, res) {
  const db = getDB();
  const { chatId, image, rol, requestedModel, useWebSearch } = req.body;
  let { mensaje } = req.body;

  if (!chatId || typeof chatId !== 'string' || chatId.length > 50) return res.status(400).json({ ok: false, msg: "chatId inválido." });
  if (mensaje && typeof mensaje !== 'string') return res.status(400).json({ ok: false, msg: "Mensaje debe ser texto." });
  if (mensaje && mensaje.length > 8000) return res.status(400).json({ ok: false, msg: "Mensaje demasiado largo (máx. 8000 caracteres)." });

  mensaje = mensaje ? xss(mensaje) : "";

  const cacheKey = `${req.user}_${chatId}_${mensaje.trim()}_${requestedModel || ''}`;
  if (aiResponseCache.has(cacheKey)) {
      log.info('AI_CACHE_HIT', { user: req.user });
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.write("data: " + JSON.stringify(aiResponseCache.get(cacheKey)) + "\n\n");
      res.write("data: [END]\n\n");
      return res.end();
  }

  const chatRow = await db.get("SELECT * FROM chats WHERE id = ? AND username = ?", [chatId, req.user]);
  if (!chatRow) return res.json({ ok: false, msg: "Chat no encontrado" });
  let mensajes = JSON.parse(chatRow.mensajes);

  if (contieneInsultos(mensaje)) {
    res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache");
    res.write("data: " + JSON.stringify("⚠️ **Mensaje censurado:** Hemos detectado lenguaje inapropiado.") + "\n\n"); res.write("data: [END]\n\n");
    return res.end();
  }

  const u = await db.get("SELECT * FROM users WHERE username = ?", [req.user]);
  const userIsAdmin = u.is_admin === 1;

  if (u.premium > 1 && Date.now() > u.premium) {
      await db.run("UPDATE users SET premium = 0 WHERE username = ?", [req.user]);
      registrarEventoSafe(req.user, 'TRIAL_ENDED', { expired_at: new Date().toISOString() });
      res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache");
      res.write("data: " + JSON.stringify({ signal: "TRIAL_ENDED_MODAL" }) + "\n\n"); res.write("data: [END]\n\n");
      return res.end();
  }

  const isActuallyPremium = u.premium === 1 || u.premium > Date.now() || userIsAdmin;
  
  if (!isActuallyPremium) {
    if (image) {
      res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache");
      res.write("data: " + JSON.stringify("💎 **Función Premium:** El análisis avanzado de imágenes (Visión Artificial) es una característica exclusiva de **DebugAI Ultra**. ¡Actualiza tu cuenta para habilitarlo!") + "\n\n"); res.write("data: [END]\n\n");
      return res.end();
    }
    if (u.creditos <= 0) {
      registrarEventoSafe(req.user, 'SIN_TOKENS', { creditos_previos: u.creditos });
      res.setHeader("Content-Type", "text/event-stream"); res.setHeader("Cache-Control", "no-cache");
      res.write("data: " + JSON.stringify({ signal: "SIN_TOKENS_MODAL" }) + "\n\n"); res.write("data: [END]\n\n");
      return res.end();
    }
  }

  let extraContent = await enrichPromptWithTools(mensaje, useWebSearch, isActuallyPremium);
  
  let finalContent = mensaje + extraContent;
  if (image) finalContent = [{ type: "text", text: mensaje || "Analiza esta imagen y dímelo todo en detalle." }, { type: "image_url", image_url: { url: image } }];
  mensajes.push({ role: "user", content: finalContent });

  const isVision = Boolean(image);
  const selectedModel = requestedModel || ((rol === "coder") ? "deepseek-r1-distill-llama-70b" : "llama-3.3-70b-versatile");
  const targetModel = (isVision || mensajes.some(m => Array.isArray(m.content))) ? "llama-3.2-90b-vision-preview" : selectedModel;

  if (!isActuallyPremium && u.creditos > 0) {
    await db.run("UPDATE users SET creditos = creditos - 1 WHERE username = ?", [req.user]);
    
    let flags = {}; try { flags = JSON.parse(u.automation_flags || '{}'); } catch(e) {}
    if (selectedModel.includes("deepseek") || rol === "coder") {
        flags.coder_count = (flags.coder_count || 0) + 1;
        if (flags.coder_count >= 15 && !flags.coder_offer_shown) {
            flags.coder_offer_shown = true;
            registrarEventoSafe(req.user, 'AUTOMATION_TRIGGERED', { rule: 'coder_intensive_offer' });
            await db.run("UPDATE users SET pending_gift = ? WHERE username = ?", [JSON.stringify({type: "message", msg: "Notamos que compilas código velozmente. Usa el nivel PRO para acelerar aún más y quitar límites de contexto.", title: "Oferta para Coders" }), req.user]);
        }
    }
    await db.run("UPDATE users SET automation_flags = ? WHERE username = ?", [JSON.stringify(flags), req.user]);
  }

  registrarEventoSafe(req.user, 'MSG_ENVIADO', { modelo: targetModel, usaWeb: !!useWebSearch, esImagen: isVision, esPremium: isActuallyPremium });

  let txtPerfil = u.nombre ? `\n\nEl usuario al que asistes se llama ${u.nombre}.` : "";
  if (u.rol) txtPerfil += ` Además, su profesión o experiencia actual es: ${u.rol}.`;
  if (isActuallyPremium) txtPerfil += ` Es un Miembro Premium VIP, tratarlo con el máximo respeto.`;

  let mensajesSanitizados = []; let lastRole = null;
  mensajes.forEach(m => {
    if (m.role !== lastRole) { mensajesSanitizados.push(m); lastRole = m.role; }
    else if (m.role === "user") { mensajesSanitizados[mensajesSanitizados.length-1].content += "\n[Continuación]:\n" + (typeof m.content === "string" ? m.content : JSON.stringify(m.content)); }
  });

  const mRows = await db.all("SELECT fact FROM memories WHERE username = ?", [req.user]);
  if(mRows.length > 0) {
    txtPerfil += `\n\n[MEMORIA DE LARGO PLAZO CLASIFICADA - CONOCIMIENTO SOBRE EL USUARIO]:\n`;
    mRows.forEach(m => txtPerfil += `- ${m.fact}\n`);
  }
  
  const rolText = getRoleTemplate(rol);

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = await streamAIResponse(res, targetModel, mensajesSanitizados, rolText, txtPerfil, req.headers.origin);
    if (!reader) return; // Ya se maneja un error en streamAIResponse

    const decoder = new TextDecoder("utf-8");
    let full_respuesta = ""; let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (let line of lines) {
        if (!line.startsWith("data: ")) continue;
        const json_str = line.substring(6).trim();
        if (json_str === "[DONE]") {
          res.write("data: [END]\n\n"); res.end();
          
          let cleanR = limpiarRespuesta(full_respuesta);
          const memoryMatch = cleanR.match(/<memory>(.*?)<\/memory>/si);
          if(memoryMatch && memoryMatch[1]) {
             db.run("INSERT INTO memories (username, fact) VALUES (?, ?)", [req.user, memoryMatch[1].trim()]).catch(()=>{});
             cleanR = cleanR.replace(/<memory>.*?<\/memory>/si, "").trim();
          }

          mensajes.push({ role: "assistant", content: cleanR });
          await db.run("UPDATE chats SET mensajes = ? WHERE id = ?", [JSON.stringify(mensajes), chatId]);
          
          if (cleanR.length < 500) {
             aiResponseCache.set(cacheKey, cleanR);
             setTimeout(() => aiResponseCache.delete(cacheKey), 60 * 1000);
          }
          return;
        }
        try {
          const content = JSON.parse(json_str).choices?.[0]?.delta?.content;
          if (content) { full_respuesta += content; res.write(`data: ${JSON.stringify(content)}\n\n`); }
        } catch {}
      }
    }
  } catch (err) {
    log.error('[ERROR /mensaje]', { msg: err.message });
    if (!res.writableEnded) {
      res.write("data: " + JSON.stringify("⚠️ Error interno del servidor. Intenta de nuevo.") + "\ndata: [END]\n\n");
      res.end();
    }
  }
}
