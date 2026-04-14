import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Code2, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  ArrowRight,
  Target,
  Smartphone,
  Layout,
  MessageSquareCode
} from 'lucide-react';
import nebulaImg from '../assets/nebula.png';

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/20 backdrop-blur-xl">
    <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#fbbf24] rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)]">
          <span className="font-black text-black text-2xl italic tracking-tighter">D</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight text-white uppercase italic leading-none">DebugAI</span>
          <span className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-[0.3em] mt-0.5">Pro Intelligence</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
        <a href="#features" className="hover:text-white transition-colors cursor-pointer">Capacidades</a>
        <a href="#process" className="hover:text-white transition-colors cursor-pointer">Proceso</a>
        <a href="#pricing" className="hover:text-white transition-colors cursor-pointer">Suscripción</a>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => window.location.href='/app'} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
          Iniciar Sesión
        </button>
        <button onClick={() => window.location.href='/app'} className="px-6 py-2.5 rounded-xl bg-[#fbbf24] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#fcd34d] shadow-lg shadow-amber-500/20 transition-all">
          Probar Gratis
        </button>
      </div>
    </div>
  </nav>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className="glass-card p-8 group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-16 h-16 text-white" />
    </div>
    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#fbbf24]/50 transition-all">
      <Icon className="w-6 h-6 text-gray-400 group-hover:text-[#fbbf24] transition-colors" />
    </div>
    <h3 className="text-xl font-black text-white mb-3 tracking-tight italic uppercase">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed font-medium">{desc}</p>
  </motion.div>
);

const LandingStage = () => {
  return (
    <div className="bg-[#030303] min-h-screen text-gray-200 overflow-x-hidden selection:bg-[#fbbf24]/30">
      <Navbar />
      
      {/* Dynamic Cosmic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="w-full h-full opacity-40 grayscale-[0.3] brightness-[0.6]"
          style={{ 
            backgroundImage: `url(${nebulaImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/40 via-transparent to-[#030303]" />
        <div className="absolute inset-0 noise-overlay opacity-[0.08]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 z-10">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.4em] text-[#fbbf24] mb-10">
              <Sparkles className="w-3 h-3 fill-current" />
              INTELLIGENCE v4.2 MASTER RELOADED
            </span>
            
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] mb-10 italic uppercase">
              Tu Asistente de <br />
              <span className="text-[#fbbf24] drop-shadow-[0_0_30px_rgba(251,191,36,0.2)]">IA Avanzada</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-14 font-medium italic">
              Potencia tu productividad con Inteligencia Artificial de última generación. 
              DebugAI analiza, detecta y soluciona errores complejos en segundos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-32">
              <button onClick={() => window.location.href='/app'} className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-[#fbbf24] text-black font-black text-sm uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(251,191,36,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                Empezar con PRO ($14.99)
              </button>
              <div className="flex items-center gap-4">
                <button onClick={() => window.location.href='/app'} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                  <Layout className="w-4 h-4" />
                  Acceder desde el Navegador
                </button>
                <div className="w-px h-4 bg-white/10" />
                <button onClick={() => window.location.href='/app'} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                  <Smartphone className="w-4 h-4" />
                  App Nativa
                </button>
              </div>
            </div>

            {/* Mockup Preview Area */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="max-w-5xl mx-auto relative px-4"
            >
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[120%] h-[300px] bg-[#fbbf24]/10 blur-[120px] rounded-full opacity-20 pointer-events-none" />
              <div className="glass-panel rounded-[3rem] p-4 lg:p-8 relative overflow-hidden group shadow-2xl">
                <div className="bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden">
                  <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-6 justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Master-Chat-Terminal-v4.log</span>
                    <div className="w-10" />
                  </div>
                  <div className="aspect-video lg:aspect-[21/9] flex items-center justify-center relative bg-[#030303]/40">
                    <div className="text-center space-y-4">
                       <MessageSquareCode className="w-16 h-16 text-[#fbbf24]/20 mx-auto animate-pulse" />
                       <div className="space-y-2">
                          <div className="h-2 w-48 bg-white/5 rounded-full animate-pulse mx-auto" />
                          <div className="h-2 w-32 bg-white/5 rounded-full animate-pulse mx-auto" />
                       </div>
                    </div>
                    {/* Floating HUD elements */}
                    <div className="absolute top-10 right-10 p-4 glass-card rounded-2xl hidden md:block animate-float">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-[#fbbf24]" />
                         </div>
                         <div className="text-left">
                            <p className="text-[8px] font-black text-gray-500 uppercase">Analysis Speed</p>
                            <p className="text-xs font-black text-white">0.4ms</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition Sections Fused from Old Landing */}
      <section id="features" className="py-40 relative z-10 border-t border-white/5 bg-black/40">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Ingeniería para la <span className="text-[#fbbf24]">Precisión</span></h2>
            <p className="text-gray-500 font-medium leading-relaxed">Cada módulo ha sido optimizado para entornos de alta exigencia donde cada línea cuenta.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={Cpu} 
              title="Análisis de Código" 
              desc="Auditoría neuronal profunda de tu lógica de negocio, detectando errores invisibles antes del despliegue." 
              delay={0.1}
            />
            <FeatureCard 
              icon={Target} 
              title="Detección al Instante" 
              desc="Cero lag. Cero falsos positivos. Diagnósticos precisos sobre fugas de memoria y condiciones de carrera." 
              delay={0.2}
            />
            <FeatureCard 
              icon={Sparkles} 
              title="Soluciones Inteligentes" 
              desc="No solo encuentres fallos: soluciónalos. Mejoras de código en un clic optimizadas para JS/TS moderno." 
              delay={0.3}
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Protección Activa" 
              desc="Inyecta seguridad en tu flujo de trabajo. Captura cambios disruptivos a nivel de PR de forma automática." 
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="process" className="py-40 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center max-w-6xl mx-auto text-left">
            <div className="space-y-12">
              <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Cómo <span className="text-[#fbbf24]">Funciona</span></h2>
              
              <div className="space-y-10">
                {[
                  { step: "01", title: "Pega tu código", desc: "Suelta cualquier fragmento o archivo en la terminal maestra de DebugAI.", icon: Code2 },
                  { step: "02", title: "Análisis de Agentes", desc: "Nuestros agentes Senior realizan una auditoría línea por línea de tus ciclos lógicos.", icon: Cpu },
                  { step: "03", title: "Soluciona y Despliega", desc: "Aplica las correcciones sugeridas y despliega con absoluta confianza.", icon: CheckCircle2 }
                ].map((s, i) => (
                  <div key={i} className="flex gap-8 group">
                    <span className="text-4xl font-black text-white/5 transition-colors group-hover:text-[#fbbf24]/20 leading-none">{s.step}</span>
                    <div className="flex-1">
                      <h4 className="text-xl font-black text-white mb-2 italic uppercase tracking-tight">{s.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative glass-card p-4 rotate-2 rounded-[3rem]">
               <div className="aspect-square bg-white/[0.03] rounded-[2.5rem] flex items-center justify-center group overflow-hidden">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-1/2 h-1/2 border-2 border-dashed border-[#fbbf24]/20 rounded-full flex items-center justify-center"
                  >
                    <Search className="w-8 h-8 text-[#fbbf24] animate-pulse" />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#fbbf24]/5 to-transparent" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-40 relative z-10 border-t border-white/5 bg-black/40">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-20">Planes Simples, <span className="text-[#fbbf24]">Poder Ilimitado</span></h2>
          
          <div className="max-w-md mx-auto p-1 bg-gradient-to-b from-[#fbbf24] to-transparent rounded-[3rem]">
            <div className="glass-panel p-12 h-full flex flex-col items-center bg-[#030303]/90 rounded-[2.8rem]">
              <span className="px-4 py-1.5 bg-[#fbbf24] text-black text-[10px] font-black uppercase tracking-widest rounded-full mb-8 shadow-lg shadow-amber-500/20">
                PLAN LEGACY PLUS
              </span>
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-7xl font-black text-white tracking-tighter">$14.99</span>
                <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">/mes</span>
              </div>
              
              <div className="space-y-5 mb-12 w-full text-left">
                {[
                  "Análisis de IA Ilimitados",
                  "Prioridad en Cola de Agentes",
                  "Escaneo de Vulnerabilidades",
                  "Soporte Premium 24/7",
                  "Funciones Beta Exclusivas"
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-4 text-gray-400 text-sm font-medium">
                    <CheckCircle2 className="w-5 h-5 text-[#fbbf24]" />
                    {f}
                  </div>
                ))}
              </div>

              <button onClick={() => window.location.href='/app'} className="w-full py-5 rounded-2xl bg-[#fbbf24] text-black font-black text-xs uppercase tracking-[0.3em] hover:bg-[#fcd34d] transition-all">
                Obtener PRO Ahora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 relative z-10 border-t border-white/5">
        <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
              <span className="font-black text-white text-lg italic tracking-tighter">D</span>
            </div>
            <span className="font-black tracking-tighter text-white italic uppercase text-sm tracking-[0.2em]">DebugAI Assistant</span>
          </div>
          
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
            © 2026 DebugAI Assistant Inc. | Powered by Next-Gen Agents
          </p>

          <div className="flex gap-4">
             {["Twitter", "GitHub", "Discord"].map(social => (
               <a key={social} href="#" className="text-xs font-black uppercase text-gray-500 hover:text-[#fbbf24] transition-colors">{social}</a>
             ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingStage;
