import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Plus, 
  Sparkles, 
  Code2, 
  GraduationCap, 
  Heart,
  Search,
  Image as ImageIcon,
  Zap,
  MoreVertical,
  History,
  Terminal
} from 'lucide-react';

const ChatHub = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeRole, setActiveRole] = useState('coder'); // coder, tutor, psicologo
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const scrollRef = useRef(null);

  const roles = [
    { id: 'coder', name: 'Architect', icon: Code2, color: '#fbbf24', desc: 'DeepSeek R1 Master' },
    { id: 'tutor', name: 'Mateo', icon: GraduationCap, color: '#6366f1', desc: 'Doctoral Tutor' },
    { id: 'psicologo', name: 'Terapeuta', icon: Heart, color: '#ec4899', desc: 'Mental Health' }
  ];

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChats = async () => {
    try {
      const resp = await fetch('/api/chat/chats');
      const data = await resp.json();
      if (data.chats) {
        setChats(data.chats);
        if (data.chats.length > 0 && !activeChatId) {
          setActiveChatId(data.chats[0].id);
          setMessages(data.chats[0].mensajes || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chats");
    }
  };

  const createNewChat = async () => {
    try {
      const resp = await fetch('/api/chat/crear-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intro: true })
      });
      const data = await resp.json();
      if (data.ok) {
        setChats([data.chat, ...chats]);
        setActiveChatId(data.chat.id);
        setMessages(data.chat.mensajes || []);
      }
    } catch (err) {
      console.error("New chat failed");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChatId) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeChatId,
          mensaje: input,
          rol: activeRole,
          useWebSearch
        })
      });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[END]') {
              setIsTyping(false);
              continue;
            }
            try {
              const content = JSON.parse(dataStr);
              if (content.signal === 'SIN_TOKENS_MODAL') {
                // Handle modal
                continue;
              }
              assistantMsg.content += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMsg };
                return newMessages;
              });
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Chat failed", err);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-4">
      {/* Sidebar de Chats */}
      <div className="w-80 flex flex-col gap-4">
        <button 
          onClick={createNewChat}
          className="w-full py-4 glass-panel rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-[#fbbf24] border-[#fbbf24]/20 hover:bg-[#fbbf24]/5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nueva Sesión
        </button>

        <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Historial</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  setMessages(chat.mensajes || []);
                }}
                className={`w-full p-4 rounded-xl text-left border transition-all group ${
                  activeChatId === chat.id 
                    ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest truncate ${
                    activeChatId === chat.id ? 'text-[#fbbf24]' : 'text-gray-500'
                  }`}>
                    {chat.titulo || 'Nueva Conversación'}
                  </span>
                  <Trash2 className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" />
                </div>
                <p className="text-[11px] text-gray-400 truncate opacity-60">
                  {chat.mensajes?.[chat.mensajes.length - 1]?.content || 'Sin mensajes...'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Role Selector */}
        <div className="glass-panel p-2 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#fbbf24]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Active Engine Specialists</span>
              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Select your master assistant</span>
            </div>
          </div>

          <div className="flex gap-2">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`px-4 py-2 rounded-xl flex items-center gap-3 border transition-all ${
                  activeRole === role.id 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-transparent border-transparent grayscale opacity-50 hover:grayscale-0 hover:opacity-100'
                }`}
              >
                <role.icon className="w-4 h-4" style={{ color: role.color }} />
                <div className="text-left hidden lg:block">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{role.name}</p>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">{role.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pr-2">
            <button 
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${
                useWebSearch ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5 grayscale'
              }`}
            >
              <Search className={`w-4 h-4 ${useWebSearch ? 'text-cyan-400' : 'text-gray-500'}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest hidden sm:block ${useWebSearch ? 'text-cyan-400' : 'text-gray-500'}`}>
                Web Search
              </span>
            </button>
          </div>
        </div>

        {/* Message List */}
        <div 
          ref={scrollRef}
          className="flex-1 glass-card rounded-3xl p-6 overflow-y-auto space-y-6 custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#fbbf24]/20 blur-[60px] rounded-full" />
                <Bot className="w-20 h-20 text-[#fbbf24] relative animate-float" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
                  System Ready. Awaiting Input.
                </h3>
                <p className="text-gray-500 text-sm max-w-sm font-medium">
                  Initialize a conversation with our master core. Expert in code, teaching, and mental performance.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  msg.role === 'user' 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-[#fbbf24]/10 border-[#fbbf24]/20'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-[#fbbf24]" />}
                </div>
                <div className={`max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-white/5 text-gray-200 ml-auto rounded-tr-none' 
                    : 'bg-[#fbbf24]/5 text-white mr-auto rounded-tl-none border border-[#fbbf24]/10'
                }`}>
                  <div className="prose prose-invert prose-yellow max-w-none">
                     {msg.content}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/10 border border-[#fbbf24]/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#fbbf24] animate-pulse" />
              </div>
              <div className="bg-[#fbbf24]/5 p-5 rounded-2xl rounded-tl-none border border-[#fbbf24]/10 flex gap-1 items-center">
                <div className="w-1 h-1 bg-[#fbbf24] rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-[#fbbf24] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-[#fbbf24] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="glass-panel p-4 rounded-[2rem] relative group">
          <div className="flex items-end gap-4">
            <div className="flex gap-2">
              <button className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#fbbf24]/30 hover:bg-[#fbbf24]/5 text-gray-500 hover:text-[#fbbf24] transition-all">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-gray-500 hover:text-cyan-400 transition-all">
                <History className="w-5 h-5" />
              </button>
            </div>
            
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu problema aquí para una solución 100% precisa..."
              className="flex-1 bg-transparent border-none py-3 resize-none focus:outline-none text-white placeholder:text-gray-600 font-medium custom-scrollbar h-[50px] max-h-[200px]"
            />

            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-4 rounded-2xl bg-[#fbbf24] text-black shadow-lg shadow-amber-500/20 hover:scale-[1.05] active:scale-[0.95] disabled:opacity-30 disabled:grayscale transition-all"
            >
              <Zap className="w-5 h-5 fill-current" />
            </button>
          </div>
          
          <div className="mt-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 opacity-50">
                  <Terminal className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Model: {activeRole === 'coder' ? 'DeepSeek-R1' : 'Llama-3.3-70B'}</span>
               </div>
               <div className="flex items-center gap-1.5 opacity-50">
                  <Zap className="w-3 h-3 text-[#fbbf24]" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Ultra Latency Mode</span>
               </div>
            </div>
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Press Enter to dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHub;
