import xss from "xss";
import { supabase } from "../config/supabase.js";
import { getDB } from "../config/db.js";
import { log } from "../utils/logger.js";
import { streamAIResponse, enrichPromptWithTools, getRoleTemplate, contieneInsultos, limpiarRespuesta, aiResponseCache } from "../services/ai.service.js";

// [MIGRATION-2026] Supabase Logic for Chat & Memory
const db = getDB();

export async function getChats(req, res) {
  try {
    const { data: rows, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', req.user)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ 
      chats: rows.map(r => ({ 
        id: r.id, 
        folder: r.folder, 
        titulo: r.titulo, 
        mensajes: typeof r.mensajes === 'string' ? JSON.parse(r.mensajes) : r.mensajes 
      })) 
    });
  } catch (err) {
    log.error('GET_CHATS_ERROR', { error: err.message });
    res.json({ chats: [] });
  }
}

export async function createChat(req, res) {
  try {
    const id = Date.now().toString();
    const { intro } = req.body || {};
    let mensajes = [];
    if (intro) mensajes.push({ role: "assistant", content: "¡Hola! Soy **DebugAI PRO** — IA avanzada para código, documentos y mucho más.\n\nPuedo ayudarte a:\n- 🐛 **Depurar y corregir errores** en cualquier lenguaje\n- 📄 **Resumir o analizar** documentos, PDFs y textos\n- 🎨 **Generar imágenes** con solo describirlas\n- 🌐 **Buscar información** en internet en tiempo real\n- 💡 **Explicar conceptos** técnicos paso a paso\n\n¿Por dónde empezamos?" });
    
    const nuevoChat = { 
      id, 
      user_id: req.user,
      folder: "Sin Carpeta", 
      titulo: "Nueva Conversación", 
      mensajes 
    };

    const { error } = await supabase.from('chats').insert(nuevoChat);
    if (error) throw error;

    res.json({ ok: true, chat: { id, folder: nuevoChat.folder, titulo: nuevoChat.titulo, mensajes } });
  } catch (err) {
    log.error('CREATE_CHAT_ERROR', { error: err.message });
    res.status(500).json({ ok: false });
  }
}

export async function deleteChat(req, res) {
  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user);
    
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false });
  }
}

export async function updateChat(req, res) {
  try {
    const { id, folder, titulo } = req.body;
    const updates = {};
    if (folder !== undefined) updates.folder = folder;
    if (titulo !== undefined) updates.titulo = titulo;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: false });
  }
}

export async function regenerateChat(req, res) {
  try {
    const chatId = req.params.id;
    const { data: chat, error } = await supabase
      .from('chats')
      .select('mensajes')
      .eq('id', chatId)
      .eq('user_id', req.user)
      .single();

    if (error || !chat) return res.json({ ok: false, msg: "Chat no válido." });
    
    let mensajes = typeof chat.mensajes === 'string' ? JSON.parse(chat.mensajes) : chat.mensajes;
    if (mensajes.length === 0) return res.json({ ok: false, msg: "Chat vacío." });

    if (mensajes[mensajes.length - 1].role === "assistant") mensajes.pop();
    
    let lastUserMsg = "...";
    if (mensajes.length > 0 && mensajes[mensajes.length - 1].role === "user") {
        let content = mensajes[mensajes.length - 1].content;
        lastUserMsg = typeof content === "string" ? content : content[0].text;
        mensajes.pop();
    }

    await supabase.from('chats').update({ mensajes }).eq('id', chatId);
    res.json({ ok: true, ultimoMensaje: lastUserMsg });
  } catch (err) {
    res.json({ ok: false });
  }
}

export async function sendMessage(req, res) {
  try {
    const { chatId, image, rol, requestedModel, useWebSearch } = req.body;
    let { mensaje } = req.body;

    if (!chatId) return res.status(400).json({ ok: false, msg: "chatId inválido." });
    mensaje = mensaje ? xss(mensaje) : "";

    const cacheKey = `${req.user}_${chatId}_${mensaje.trim()}_${requestedModel || ''}`;
    if (aiResponseCache.has(cacheKey)) {
        res.setHeader("Content-Type", "text/event-stream");
        res.write("data: " + JSON.stringify(aiResponseCache.get(cacheKey)) + "\n\n");
        res.write("data: [END]\n\n");
        return res.end();
    }

    const profile = await db.profiles.get(req.user);
    if (!profile) return res.json({ ok: false, msg: "Perfil no encontrado" });

    const { data: chat } = await supabase.from('chats').select('mensajes').eq('id', chatId).eq('user_id', req.user).single();
    if (!chat) return res.json({ ok: false, msg: "Chat no encontrado" });
    let mensajes = typeof chat.mensajes === 'string' ? JSON.parse(chat.mensajes) : chat.mensajes;

    if (contieneInsultos(mensaje)) {
      res.setHeader("Content-Type", "text/event-stream");
      res.write("data: " + JSON.stringify("⚠️ **Mensaje censurado:** Lenguaje inapropiado.") + "\n\n");
      res.write("data: [END]\n\n");
      return res.end();
    }

    const isActuallyPremium = profile.plan === 'pro' || profile.plan === 'admin';
    
    if (!isActuallyPremium) {
      if (image) {
        res.setHeader("Content-Type", "text/event-stream");
        res.write("data: " + JSON.stringify("💎 **Función Premium:** El análisis de imágenes es para usuarios PRO.") + "\n\n");
        res.write("data: [END]\n\n");
        return res.end();
      }
      if ((profile.creditos || 0) <= 0) {
        await db.events.track(req.user, 'SIN_TOKENS');
        res.setHeader("Content-Type", "text/event-stream");
        res.write("data: " + JSON.stringify({ signal: "SIN_TOKENS_MODAL" }) + "\n\n");
        res.write("data: [END]\n\n");
        return res.end();
      }
    }

    let extraContent = await enrichPromptWithTools(mensaje, useWebSearch, isActuallyPremium);
    let finalContent = mensaje + extraContent;
    if (image) finalContent = [{ type: "text", text: mensaje || "Analiza esta imagen." }, { type: "image_url", image_url: { url: image } }];
    mensajes.push({ role: "user", content: finalContent });

    const targetModel = image ? "llama-3.2-90b-vision-preview" : (requestedModel || (rol === "coder" ? "deepseek-r1-distill-llama-70b" : "llama-3.3-70b-versatile"));

    if (!isActuallyPremium) {
      await db.profiles.update(req.user, { creditos: (profile.creditos || 0) - 1 });
    }

    await db.events.track(req.user, 'MSG_ENVIADO', { modelo: targetModel, usaWeb: !!useWebSearch });

    let txtPerfil = `Usuario: ${profile.username || 'Desconocido'}. Plan: ${profile.plan}.`;
    const { data: memories } = await supabase.from('memories').select('fact').eq('user_id', req.user);
    if (memories?.length > 0) {
      txtPerfil += "\n\n[MEMORIA]:\n" + memories.map(m => `- ${m.fact}`).join("\n");
    }
    
    const rolText = getRoleTemplate(rol);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    const reader = await streamAIResponse(res, targetModel, mensajes, rolText, txtPerfil, req.headers.origin);
    if (!reader) return;

    const decoder = new TextDecoder("utf-8");
    let full_respuesta = "";
    let buffer = "";

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
          res.write("data: [END]\n\n");
          res.end();
          
          let cleanR = limpiarRespuesta(full_respuesta);
          const memoryMatch = cleanR.match(/<memory>(.*?)<\/memory>/si);
          if (memoryMatch && memoryMatch[1]) {
             await supabase.from('memories').insert({ user_id: req.user, fact: memoryMatch[1].trim() });
             cleanR = cleanR.replace(/<memory>.*?<\/memory>/si, "").trim();
          }

          mensajes.push({ role: "assistant", content: cleanR });
          await supabase.from('chats').update({ mensajes, updated_at: new Date().toISOString() }).eq('id', chatId);
          
          if (cleanR.length < 500) {
             aiResponseCache.set(cacheKey, cleanR);
             setTimeout(() => aiResponseCache.delete(cacheKey), 60 * 1000);
          }
          return;
        }
        try {
          const content = JSON.parse(json_str).choices?.[0]?.delta?.content;
          if (content) { 
            full_respuesta += content; 
            res.write(`data: ${JSON.stringify(content)}\n\n`); 
          }
        } catch {}
      }
    }
  } catch (err) {
    log.error('SEND_MESSAGE_ERROR', { error: err.message });
    if (!res.writableEnded) {
      res.write("data: " + JSON.stringify("⚠️ Error en el servidor AI.") + "\ndata: [END]\n\n");
      res.end();
    }
  }
}
