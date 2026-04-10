// =====================================================
// [MOD] STATE.JS — Estado global de la aplicación.
// Variables compartidas entre todos los módulos.
// =====================================================

export const state = {
  token: null,
  currentChatId: null,
  currentImageBase64: null,
  isPremiumUser: false,
  creditosRestantes: 0,
  abVariant: null,
  isProBuying: false,
  currentTokenQueue: 0,
  sessionMessagesCount: 0,
  isAgentMode: false,
  isWebSearchMode: false,
  giftInterval: null,
  currentAbortController: null,
};

// DOM references (populated after DOMContentLoaded)
export const DOM = {
  get authBox()    { return document.getElementById("auth"); },
  get appBox()     { return document.getElementById("app"); },
  get introBox()   { return document.getElementById("intro"); },
  get chatListBox(){ return document.getElementById("chatList"); },
  get chatWindow() { return document.getElementById("chatWindow"); },
  get inputArea()  { return document.getElementById("inputArea"); },
  get inputMsg()   { return document.getElementById("inputMsg"); },
  get btnSend()    { return document.getElementById("btnSend"); },
  get hudCredits() { return document.getElementById("hudCredits"); },
  get splash()     { return document.getElementById("splash-screen"); },
  get splashStatus(){ return document.getElementById("splash-status"); },
  get btnStop()    { return document.getElementById("btnStop"); },
};

export const sleep = ms => new Promise(r => setTimeout(r, ms));
