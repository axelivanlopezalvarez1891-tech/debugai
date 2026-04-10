// =====================================================
// [MOD] CHAT.JS — Gestión de chats y mensajería SSE.
// =====================================================
import { state, DOM } from './state.js';
import { apiPost, apiFetch, apiDelete } from './api.js';
import { showAlert, showToast, abrirModal, cerrarModal, autoExpand } from './ui.js';
import { sincronizarHUD } from './auth.js';

// Renderer de Markdown (depende de marked global)
export function renderContentArray(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    let html = "";
    const textObj = content.find(x => x.type === "text");
    const imgObj  = content.find(x => x.type === "image_url");
    if (textObj) html += textObj.text;
    if (imgObj)  html += `<br><img src="${imgObj.image_url.url}" style="max-width:260px; max-height:260px; border-radius:10px; margin-top:10px; border:1px solid rgba(255,255,255,0.1);">`;
    return html;
  }
  return "";
}

export function agregarMensajeDOM(texto, tipo, isHTML = false) {
  const chatWindow = DOM.chatWindow;
  if (chatWindow.children.length === 1 && (chatWindow.children[0].className === "empty-state" || chatWindow.children[0]?.className.includes("pro-empty-chat"))) { chatWindow.innerHTML = ""; }
  const wrapper = document.createElement("div"); wrapper.className = `msg-wrapper ${tipo}`;
  const div     = document.createElement("div"); div.className = `msg ${tipo}`;
  if (tipo === "ai") { div.innerHTML = marked.parse(texto || ""); }
  else { if (isHTML) div.innerHTML = texto; else div.innerText = texto; }
  wrapper.appendChild(div); chatWindow.appendChild(wrapper);
  
  const isScrolledNear = (chatWindow.scrollHeight - chatWindow.scrollTop - chatWindow.clientHeight) < 400;
  if (tipo === "user" || isScrolledNear) chatWindow.scrollTop = chatWindow.scrollHeight;
  
  if (window.mermaid) { setTimeout(() => { try { mermaid.run(); } catch(e){} }, 100); }
  return div;
}

export function aniadirBotonesAI(aiMsgDiv) {
  if (!aiMsgDiv.parentElement) return;
  const actionsWrap = document.createElement("div");
  actionsWrap.style.cssText = "margin-top:10px; display:flex; gap:8px; opacity:0.7; flex-wrap:wrap;";
  
  const copyBtn = document.createElement("button");
  copyBtn.innerHTML = "📋 Copiar Todo";
  copyBtn.style.cssText = "background:transparent; border:1px solid rgba(255,255,255,0.1); color:#9ca3af; padding:4px 8px; border-radius:6px; font-size:11px; cursor:pointer;";
  copyBtn.onclick = () => { navigator.clipboard.writeText(aiMsgDiv.innerText); copyBtn.innerHTML = "✔️ Copiado"; setTimeout(() => copyBtn.innerHTML = "📋 Copiar Todo", 2000); };

  const readBtn = document.createElement("button");
  readBtn.innerHTML = "🗣️ Escuchar (Voz Mágica)";
  readBtn.style.cssText = "background:transparent; border:1px solid rgba(255,255,255,0.1); color:#6366f1; padding:4px 8px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:bold;";
  readBtn.onclick = () => {
    if (!state.isPremiumUser) return abrirModal("modalPremium");
    const utterance = new SpeechSynthesisUtterance(aiMsgDiv.innerText.replace(/[^\w\s\u00C0-\u017F.,!?]/gi, ''));
    utterance.lang = 'es-ES'; utterance.pitch = 1.1; utterance.rate = 1.05;
    speechSynthesis.speak(utterance);
  };

  const regenBtn = document.createElement("button");
  regenBtn.innerHTML = "🔄 Regenerar";
  regenBtn.style.cssText = "background:transparent; border:1px solid rgba(255,255,255,0.1); color:#9ca3af; padding:4px 8px; border-radius:6px; font-size:11px; cursor:pointer;";
  regenBtn.onclick = () => regenerarUltimo();

  actionsWrap.appendChild(copyBtn); actionsWrap.appendChild(readBtn); actionsWrap.appendChild(regenBtn);
  aiMsgDiv.parentElement.appendChild(actionsWrap);
}

export async function cargarChats() {
  const chatListBox = DOM.chatListBox;
  const res = await apiFetch("/chats");
  const data = await res.json();
  chatListBox.innerHTML = "";
  if (data.chats && data.chats.length > 0) {
    let folders = {};
    data.chats.slice().reverse().forEach(chat => {
      let f = chat.folder || "Sin Carpeta";
      if (!folders[f]) folders[f] = [];
      folders[f].push(chat);
    });

    for (let f in folders) {
      let isNoFolder = (f === "Sin Carpeta" && Object.keys(folders).length === 1);
      let container = chatListBox;
      if (!isNoFolder) {
        const details = document.createElement("details"); details.className = "folder-details"; details.open = true;
        const summary = document.createElement("summary");
        summary.innerHTML = `<span style="font-weight:600; color:#cbd5e1; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">📂 ${f}</span>`;
        details.appendChild(summary); chatListBox.appendChild(details); container = details;
      }
      folders[f].forEach(chat => {
        const wrapper = document.createElement("div"); wrapper.className = "chat-item-wrapper" + (chat.id === state.currentChatId ? " active" : "");
        let titulo = chat.titulo || "Nueva Conversación";
        if (titulo === "Nueva Conversación" && chat.mensajes && chat.mensajes.length > 0) {
          const firstUserMsg = chat.mensajes.find(m => m.role === 'user');
          if (firstUserMsg) { let t = firstUserMsg.content; if (Array.isArray(t)) { const tObj = t.find(x => x.type === 'text'); t = tObj ? tObj.text : "🖼️ Imagen adjunta"; } titulo = t.substring(0, 22) + "..."; }
          else { titulo = "Introducción..."; }
        }
        const div = document.createElement("div"); div.className = "chat-item"; div.innerText = titulo;
        div.onclick = () => seleccionarChat(chat.id, chat.mensajes);
        
        const moveBtn = document.createElement("button"); moveBtn.className = "btn-delete-chat"; moveBtn.innerHTML = '📁'; moveBtn.style.padding = "4px"; moveBtn.title = "Mover a Carpeta";
        moveBtn.onclick = (e) => {
          e.stopPropagation();
          const fName = prompt("Nombre de la carpeta (vacío para quitar):", chat.folder || "");
          if (fName !== null) apiPost("/update-chat", { id: chat.id, folder: fName }).then(() => cargarChats());
        };
        const delBtn = document.createElement("button"); delBtn.className = "btn-delete-chat";
        delBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
        delBtn.onclick = (e) => { e.stopPropagation(); eliminarChat(chat.id); };
        
        wrapper.appendChild(div); wrapper.appendChild(moveBtn); wrapper.appendChild(delBtn);
        if (container === chatListBox || container.tagName === "DETAILS") container.appendChild(wrapper);
      });
    }
  } else { chatListBox.innerHTML = '<div style="color:var(--border-glass);font-size:13px;padding:12px;text-align:center;">Vacio.</div>'; }
  return data.chats || [];
}

export async function crearChat(conIntro = false) {
  const res = await apiPost("/crear-chat", { intro: conIntro });
  const data = await res.json();
  if (data.ok) { await cargarChats(); seleccionarChat(data.chat.id, data.chat.mensajes); }
}

export async function eliminarChat(id) {
  const res = await apiDelete("/chat/" + id);
  const data = await res.json();
  if (data.ok) {
    if (state.currentChatId === id) {
      state.currentChatId = null;
      const inputArea = DOM.inputArea;
      inputArea.style.opacity = "0.5"; inputArea.style.pointerEvents = "none";
      DOM.chatWindow.innerHTML = '<div class="empty-state"><svg style="width:54px;height:54px;margin-bottom:15px;stroke:var(--accent-color);" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><h3>Bienvenido</h3><p style="margin-top:8px;font-size:14px;">Selecciona o crea un chat para hablar.</p></div>';
    }
    await cargarChats();
  }
}

export function seleccionarChat(id, mensajes) {
  state.currentChatId = id;
  const inputArea = DOM.inputArea;
  const inputMsg  = DOM.inputMsg;
  inputArea.style.opacity = "1"; inputArea.style.pointerEvents = "all"; inputMsg.disabled = false;
  document.querySelector('.sidebar').classList.remove('open');
  
  if (mensajes && mensajes.length > 0) {
    cargarChats().then(() => {
      DOM.chatWindow.innerHTML = "";
      mensajes.forEach(m => {
        const div = agregarMensajeDOM(renderContentArray(m.content), m.role === "user" ? "user" : "ai", m.role === "user");
        if (m.role !== "user") aniadirBotonesAI(div);
      });
    });
  } else {
    cargarChats().then(() => {
      DOM.chatWindow.innerHTML = `
        <div class="pro-empty-chat">
          <div class="pro-icon-pulse"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg></div>
          <h3 class="pro-empty-title">¿En qué te ayudo hoy?</h3>
          <p class="pro-empty-subtitle" style="max-width:400px;">Resuelve código, analiza documentos, redacta textos, genera imágenes y mucho más — todo con IA avanzada en segundos.</p>
          <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:24px; justify-content:center; width:100%; max-width:480px;">
             <button onclick="document.getElementById('inputMsg').value='Tengo este error en mi código: '; document.getElementById('inputMsg').focus();" style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); color:#a5b4fc; padding:9px 16px; border-radius:10px; font-size:13px; cursor:pointer; font-weight:600;">💻 Depurar código</button>
             <button onclick="document.getElementById('inputMsg').value='Resume el siguiente texto en 5 puntos clave: '; document.getElementById('inputMsg').focus();" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); color:#6ee7b7; padding:9px 16px; border-radius:10px; font-size:13px; cursor:pointer; font-weight:600;">📄 Resumir texto</button>
             <button onclick="document.getElementById('inputMsg').value='Imagina y genera una foto ultra realista de: '; document.getElementById('inputMsg').focus();" style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.25); color:#c4b5fd; padding:9px 16px; border-radius:10px; font-size:13px; cursor:pointer; font-weight:600;">🎨 Generar imagen</button>
             <button onclick="window.appAbrirModal('modalAgentes')" style="background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.2); color:#fbbf24; padding:9px 16px; border-radius:10px; font-size:13px; cursor:pointer; font-weight:600;">🤖 Agentes especializados</button>
          </div>
          <p style="font-size:11px; color:rgba(156,163,175,0.6); margin-top:20px; letter-spacing:0.3px;">Usa el micrófono, adjunta archivos o escribe directo en el campo de abajo</p>
        </div>`;
    });
  }
  setTimeout(() => { inputMsg.focus(); inputMsg.value = ""; autoExpand(inputMsg); }, 100);
}

export function detenerGeneracion() {
  if (state.currentAbortController) {
    state.currentAbortController.abort();
    DOM.btnStop.style.display = "none";
    DOM.btnSend.style.display = "flex";
    DOM.btnSend.disabled = false;
    DOM.inputMsg.disabled = false;
    DOM.inputMsg.focus();
  }
}

export async function enviarMensaje(textoForce = null) {
  const inputMsg = DOM.inputMsg;
  const btnSend  = DOM.btnSend;
  const texto    = textoForce !== null ? textoForce : inputMsg.value.trim();
  if ((!texto && !state.currentImageBase64) || !state.currentChatId) return;
  
  btnSend.disabled = true; inputMsg.disabled = true;
  if (!textoForce) { inputMsg.value = ""; inputMsg.style.height = "auto"; }
  
  DOM.btnStop.style.display = "flex"; btnSend.style.display = "none";

  let contentDOM = texto;
  if (state.currentImageBase64 && !textoForce) { contentDOM += `<br><img src="${state.currentImageBase64}" style="max-width:260px; max-height:260px; border-radius:10px; margin-top:10px; border:1px solid rgba(255,255,255,0.1);">`; }

  if (!textoForce) agregarMensajeDOM(contentDOM, "user", true);
  const aiMsgDiv = agregarMensajeDOM("", "ai");
  aiMsgDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

  const payload = {
    chatId: state.currentChatId,
    mensaje: texto,
    rol: document.getElementById('rolSelector').value,
    requestedModel: document.getElementById('modelSelector')?.value || null,
    useWebSearch: state.isWebSearchMode || false
  };
  if (state.currentImageBase64) { payload.image = state.currentImageBase64; quitarImagen(); }

  state.currentAbortController = new AbortController();

  try {
    const res = await fetch("/mensaje", {
      credentials: "include", method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: state.currentAbortController.signal
    });
    
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
       const data = await res.json();
       if (data.upgradeRequired) {
         detenerGeneracion();
         if (aiMsgDiv && aiMsgDiv.parentElement) aiMsgDiv.parentElement.remove();
         btnSend.disabled = false; inputMsg.disabled = false;
         DOM.btnStop.style.display = "none"; btnSend.style.display = "flex";
         return abrirModal("modalSinTokens");
       }
    }

    if (res.status === 429) {
      btnSend.disabled = false; inputMsg.disabled = false;
      DOM.btnStop.style.display = "none"; btnSend.style.display = "flex";
      if (aiMsgDiv.parentElement) aiMsgDiv.parentElement.remove();
      if (!window._rateLimitToastActive) {
        window._rateLimitToastActive = true;
        showAlert('⚠️ Límite de mensajes alcanzado. Espera unos minutos e intenta de nuevo.', 'error');
        setTimeout(() => { window._rateLimitToastActive = false; }, 15000);
      }
      return;
    }
    
    const reader = res.body.getReader(); const decoder = new TextDecoder();
    let buffer = ""; let contentAccumulator = ""; aiMsgDiv.innerHTML = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n"); buffer = parts.pop();
      for (let part of parts) {
        if (part.startsWith("data: ")) {
          const json_str = part.substring(6).trim();
          if (json_str === "[END]") {
            state.sessionMessagesCount++;
            if (state.sessionMessagesCount === 5 && !state.isPremiumUser) { abrirModal("modalSugerenciaPro"); }
            cargarChats(); btnSend.disabled = false; inputMsg.disabled = false; inputMsg.focus(); sincronizarHUD();
            DOM.btnStop.style.display = "none"; btnSend.style.display = "flex";
            aniadirBotonesAI(aiMsgDiv);
            if (window.autoVoxFlag) {
              const utterance = new SpeechSynthesisUtterance(aiMsgDiv.innerText);
              utterance.lang = 'es-ES'; speechSynthesis.speak(utterance);
              window.autoVoxFlag = false;
            }
            return;
          }
          try {
            const str = JSON.parse(json_str);
            if (str && typeof str === "object" && str.signal) {
               btnSend.disabled = false; inputMsg.disabled = false;
               DOM.btnStop.style.display = "none"; btnSend.style.display = "flex";
               if (!contentAccumulator && aiMsgDiv.parentElement) aiMsgDiv.parentElement.remove();
               try { reader.cancel(); } catch(_) {}
               if (str.signal === "SIN_TOKENS_MODAL") { abrirModal("modalSinTokens"); return; }
               if (str.signal === "TRIAL_ENDED_MODAL") { abrirModal("modalTrialFin"); return; }
            }
            contentAccumulator += str;
            let prepContent = contentAccumulator
              .replace(/<think>/g, '<div style="background:rgba(255,255,255,0.05); padding:10px; border-left:4px solid var(--accent-color); font-size:13px; color:#9ca3af; margin-bottom:10px; border-radius:6px;"><strong>🧠 Pensamiento Profundo (DeepSeek):</strong><br>')
              .replace(/<\/think>/g, '</div>');
            let eliteContent = prepContent.replace(/<memory>[\s\S]*?<\/memory>/g, "").replace(/<memory>[\s\S]*?$/g, "");
            aiMsgDiv.innerHTML = marked.parse(eliteContent);
            aiMsgDiv.querySelectorAll("img").forEach(img => { img.onerror = function() { this.style.display='none'; }; if(img.src === "" || img.src.includes("null") || img.getAttribute("src") === null) img.style.display = "none"; });
            const chatWindow = DOM.chatWindow;
            if ((chatWindow.scrollHeight - chatWindow.scrollTop - chatWindow.clientHeight) < 400) chatWindow.scrollTop = chatWindow.scrollHeight;
          } catch(e) {}
        }
      }
    }
  } catch(e) {
    if (e.name === 'AbortError') { aiMsgDiv.innerHTML += "<br><br><span style='color:var(--text-muted);font-size:12px;'>[Generación detenida manualmente]</span>"; }
    else { aiMsgDiv.innerText = "Error crítico de conexión o moderación."; }
    aniadirBotonesAI(aiMsgDiv);
  }
  btnSend.disabled = false; inputMsg.disabled = false;
  DOM.btnStop.style.display = "none"; DOM.btnSend.style.display = "flex";
}

export async function regenerarUltimo() {
  const res = await apiPost(`/regenerate-chat/${state.currentChatId}`, {});
  const data = await res.json();
  if (data.ok) {
    const msgs = document.querySelectorAll('.msg-wrapper');
    if (msgs.length > 0) msgs[msgs.length - 1].remove();
    enviarMensaje(data.ultimoMensaje);
  }
}

export async function deployAgent(agentId) {
  if (!state.isPremiumUser) { cerrarModal('modalAgentes'); return abrirModal("modalPremium"); }
  cerrarModal('modalAgentes');
  const rolesMap = {
    "researcher":      { rol: "universal", web: true,  model: "llama-3.3-70b-versatile", folder: "🌐 Investigaciones", prompt: "Agente Investigador inicializado. Acceso a Internet activado. Escribe el tema que debo investigar." },
    "data_scientist":  { rol: "universal", web: false, model: "llama-3.3-70b-versatile", folder: "📊 Datos", prompt: "Agente Data Scientist inicializado. Dame los datos y los graficaré interactivo." },
    "coder":           { rol: "coder",     web: false, model: "llama-3.3-70b-versatile", folder: "💻 Proyectos", prompt: "Ingeniero Activo. Describe el componente a construir y lo inyectaré en el Live Canvas." },
    "writer":          { rol: "universal", web: false, model: "llama-3.3-70b-versatile", folder: "✍️ Redacción", prompt: "Copywriter listo. ¿Qué tipo de contenido (blog, ads, web) creamos hoy?" },
    "ceo":             { rol: "universal", web: true,  model: "deepseek-r1-distill-llama-70b", folder: "👔 Estrategia", prompt: "Consultor Estratégico (Razonamiento Profundo) activo. Planteen el escenario." },
    "claude_architect":{ rol: "coder",     web: false, model: "anthropic/claude-3.5-sonnet", folder: "🟣 Claude 3.5", prompt: "Arquitecto de Software en línea. Claude 3.5 Sonnet inicializado. ¿Qué sistema perfecto de alta ingeniería deseas diseñar hoy?" }
  };
  const config = rolesMap[agentId];
  document.getElementById('rolSelector').value = config.rol;
  document.getElementById('modelSelector').value = config.model;
  state.isWebSearchMode = config.web;
  const btnWebSearch = document.getElementById("btnWebSearch");
  btnWebSearch.style.background = state.isWebSearchMode ? "var(--bg-glass-hover)" : "transparent";
  btnWebSearch.style.borderColor = state.isWebSearchMode ? "#10b981" : "var(--border-glass)";
  await crearChat(true);
  if (state.currentChatId) {
    await apiPost("/update-chat", { id: state.currentChatId, folder: config.folder });
    document.getElementById('inputMsg').value = config.prompt;
    autoExpand(document.getElementById('inputMsg'));
  }
  await cargarChats();
  showToast("Agente Desplegado.", "success");
}

export function toggleWebSearch() {
  if (!state.isPremiumUser) return abrirModal("modalPremium");
  state.isWebSearchMode = !state.isWebSearchMode;
  const btn = document.getElementById("btnWebSearch");
  btn.style.background   = state.isWebSearchMode ? "var(--bg-glass-hover)" : "transparent";
  btn.style.borderColor  = state.isWebSearchMode ? "#10b981" : "var(--border-glass)";
  if (state.isWebSearchMode) showToast("Búsqueda en Internet Activada", "success");
  else showToast("Búsqueda en Internet Desactivada", "info");
}

export function toggleAgent() {
  if (!state.isPremiumUser) return abrirModal("modalPremium");
  state.isAgentMode = !state.isAgentMode;
  const btn      = document.getElementById("btnAgent");
  const inputMsg = DOM.inputMsg;
  btn.style.background   = state.isAgentMode ? "var(--bg-glass-hover)" : "transparent";
  btn.style.borderColor  = state.isAgentMode ? "var(--accent-color)" : "var(--border-glass)";
  inputMsg.placeholder   = state.isAgentMode ? "Modo Agente Automático: Dime qué objetivo debo lograr paso a paso..." : "Escribe tu consulta, idea, tarea escolar o adjunta documentos...";
  if (state.isAgentMode) { inputMsg.value = "Eres un Agente Autónomo. Desglosa paso por paso lo que vas a hacer. Escribe cada paso de forma estructurada. Aplica acciones. Mi misión es: "; autoExpand(inputMsg); }
  else { inputMsg.value = ""; autoExpand(inputMsg); }
}

export function filtrarChats() {
  const query = document.getElementById("searchChatInput").value.toLowerCase();
  document.querySelectorAll(".chat-item-wrapper").forEach(wrapper => {
    const text = wrapper.querySelector(".chat-item").innerText.toLowerCase();
    wrapper.style.display = text.includes(query) ? "flex" : "none";
  });
}

export function quitarImagen() {
  state.currentImageBase64 = null;
  document.getElementById("imgPreviewCont").style.display = "none";
  document.getElementById("fileAttach").value = "";
}

export function manejarAttachUI() {
  if (state.isPremiumUser) { document.getElementById('fileAttach').click(); }
  else { abrirModal("modalPremium"); }
}

export function imagenSeleccionada(event) {
  const file = event.target.files[0];
  if (!file) return;
  const validImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (validImages.includes(file.type)) {
    const reader = new FileReader();
    reader.onload = (e) => {
      state.currentImageBase64 = e.target.result;
      document.getElementById("imgPreviewTag").src = state.currentImageBase64;
      document.getElementById("imgPreviewCont").style.display = "block";
    };
    reader.readAsDataURL(file);
  } else if (file.name.endsWith(".pdf") || file.name.endsWith(".docx")) {
    if (!state.isPremiumUser) return abrirModal("modalPremium");
    const formData = new FormData(); formData.append("document", file);
    showToast("Extrayendo texto interactivo...", "info");
    fetch("/upload-document", { credentials: "include", method: "POST", body: formData }).then(r => r.json()).then(data => {
      if (data.ok) {
        const inputMsg = DOM.inputMsg;
        if (inputMsg.value.trim() !== '') inputMsg.value += '\n\n';
        inputMsg.value += `[Contenido estructurado de ${file.name}]:\n${data.text.substring(0, 50000)}`;
        autoExpand(inputMsg);
        showToast(`Documento listo para Chat: ${file.name}`, "success");
      } else { showAlert("Error leyendo doc: " + data.msg); }
    });
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      const inputMsg = DOM.inputMsg;
      if (inputMsg.value.trim() !== '') inputMsg.value += '\n\n';
      inputMsg.value += `[Contenido archivo ${file.name}]:\n${e.target.result}`;
      autoExpand(inputMsg);
      showToast(`Archivo leido: ${file.name}`, "success");
    };
    reader.readAsText(file);
  }
}
