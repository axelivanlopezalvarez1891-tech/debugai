import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Code2, 
  Terminal, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  Globe, 
  Mail, 
  ArrowRight,
  Plus,
  Rocket,
  ShieldAlert,
  Menu,
  X,
  CreditCard,
  Target
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[60] border-b border-white/5 bg-black/50 backdrop-blur-2xl">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <span className="font-black text-black text-xl italic">D</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase italic">DebugAI <span className="text-accent-primary">PRO</span></span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-xs font-black uppercase tracking-widest text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#process" className="hover:text-white transition-colors">Process</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="/app" className="hidden sm:inline-flex btn-premium btn-premium-secondary py-2 px-6">
            Log In
          </a>
          <a href="/app" className="btn-premium btn-premium-primary py-2 px-6">
            Try Free
          </a>
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </nav>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card p-8 group overflow-hidden relative active:scale-[0.98]"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-accent-primary/50 group-hover:bg-accent-primary/10 transition-all duration-500">
      <Icon className="w-7 h-7 text-gray-400 group-hover:text-accent-primary transition-colors duration-500" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

const PricingCard = ({ title, price, features, recommended, cta, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className={`p-1 bg-gradient-to-b from-white/10 to-transparent rounded-3xl ${recommended ? 'from-accent-primary/30 to-accent-primary/5' : ''}`}
  >
    <div className="glass-card p-10 h-full flex flex-col items-start bg-dark/80">
      {recommended && (
        <span className="px-3 py-1 bg-accent-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
          Most Popular
        </span>
      )}
      <h3 className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-5xl font-black text-white">{price}</span>
        {price !== 'Free' && <span className="text-gray-500 font-bold">/mo</span>}
      </div>

      <div className="space-y-4 mb-10 flex-1 w-full text-left">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-400">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${recommended ? 'text-accent-primary' : 'text-gray-600'}`} />
            {f}
          </div>
        ))}
      </div>

      <a 
        href="/app"
        className={`w-full btn-premium flex items-center justify-center gap-2 group
          ${recommended ? 'btn-premium-primary' : 'btn-premium-secondary'}
        `}
      >
        {cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  </motion.div>
);

function App() {
  return (
    <div className="bg-dark min-h-screen text-gray-200 mesh-gradient relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-accent-primary mb-8 shadow-inner">
              <Sparkles className="w-3 h-3" />
              Intelligence v4.2 is Live
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 italic uppercase">
              Fix Code <span className="gradient-text">10x Faster</span> <br/> with AI
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
              DebugAI PRO analyzes, detects, and fixes your core code instantly. The "Pre-Deploy Guardian" protecting your high-stakes products.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
              <a href="/app" className="w-full sm:w-auto btn-premium btn-premium-primary text-base px-12 py-5 shadow-2xl shadow-white/5">
                Try it Free
              </a>
              <a href="/app" className="w-full sm:w-auto btn-premium btn-premium-secondary text-base px-12 py-5 flex items-center justify-center gap-3 group">
                <Target className="w-5 h-5 text-accent-primary" />
                Start Debugging
              </a>
            </div>
          </motion.div>

          {/* Product Preview Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
            className="max-w-6xl mx-auto relative group"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-accent-primary/20 via-blue-500/20 to-purple-500/20 blur-[100px] opacity-30 group-hover:opacity-50 transition-opacity duration-1000" />
            <div className="glass-card overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/10 relative">
              <div className="h-12 bg-white/5 border-b border-white/10 flex items-center px-6 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/30" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                  <div className="w-3 h-3 rounded-full bg-green-500/30" />
                </div>
                <div className="flex-1 text-center font-mono text-[10px] text-gray-600 tracking-widest uppercase italic">DebugAI_PRE_DEPLOY_TERMINAL_V4</div>
              </div>
              <div className="p-1 lg:p-4 bg-black/40">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8 bg-white/[0.03] h-[500px] rounded-2xl border border-white/5 p-6 animate-pulse text-left font-mono text-xs text-gray-700 space-y-2">
                    <p className="text-gray-500">{"// Analyzing core business logic..."}</p>
                    <p className="text-white/20">{"const validatePayment = async (amount) => {"}</p>
                    <p className="text-white/20">{"  if (amount < 0) return false;"}</p>
                    <div className="w-3/4 h-2 bg-red-500/20 rounded-full border border-red-500/30 my-4" />
                    <p className="text-white/20">{"  await db.update('user', { balance: balance - amount });"}</p>
                    <p className="text-white/20">{"};"}</p>
                  </div>
                  <div className="col-span-4 space-y-4">
                    <div className="h-32 bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-left">
                       <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 block">Critical Leak</span>
                       <div className="w-full h-1 bg-red-500/20 rounded-full mb-3" />
                       <div className="w-3/4 h-1 bg-red-500/10 rounded-full" />
                    </div>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-white/[0.02] border border-white/5 rounded-2xl p-4 animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
      </section>

      {/* Trust Section */}
      <section className="py-32 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-left space-y-2">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Built for Developers</h2>
              <p className="text-gray-500 font-medium">Standard protection for world-class engineering teams.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-12 lg:gap-24 items-center">
              <div className="text-center group">
                <div className="text-4xl font-black text-white mb-1 tracking-tighter group-hover:text-accent-primary transition-colors italic">10,000+</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Analyses Run</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-black text-white mb-1 tracking-tighter group-hover:text-accent-primary transition-colors italic">95%</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Detection Accuracy</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-black text-white mb-1 tracking-tighter group-hover:text-accent-primary transition-colors italic">2.4s</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Response Speed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-40 bg-[#030303] relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-24 max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">Engineered for <br/> <span className="text-accent-primary">Precision</span></h2>
            <p className="text-gray-500 font-medium text-lg">Every feature is optimized for high-stakes production environments where every line of code matters.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={Cpu} 
              title="AI Code Analysis" 
              desc="Deep neural audit of your business logic, detecting invisible bugs before they runtime." 
              delay={0.1}
            />
            <FeatureCard 
              icon={ShieldAlert} 
              title="Instant Error Detection" 
              desc="Zero lag. Zero false positives. Get precise diagnostics of memory leaks and race conditions." 
              delay={0.2}
            />
            <FeatureCard 
              icon={Sparkles} 
              title="Smart Fix Suggestions" 
              desc="Don't just find bugs - fix them. One-click code enhancements optimized for modern JS/TS." 
              delay={0.3}
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Pre-Deploy Protection" 
              desc="Inject safety into your pipeline. Catch breaking changes at the PR level automatically." 
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="process" className="py-40 border-t border-white/5 mesh-gradient">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                 <div className="space-y-4 text-left">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">How it <span className="text-accent-primary">Works</span></h2>
                    <p className="text-gray-500 font-medium">Simple integration, powerful results in seconds.</p>
                 </div>
                 
                 <div className="space-y-10 relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5 hidden sm:block" />
                    {[
                      { step: 1, title: "Paste your code", desc: "Select any file or snippet from your workspace and drop it into the Guardian terminal.", icon: Code2 },
                      { step: 2, title: "Run AI analysis", desc: "Our senior engineer agents perform a line-by-line audit of your logic cycles.", icon: Zap },
                      { step: 3, title: "Fix issues instantly", desc: "Apply the suggested fixes and ship with absolute confidence.", icon: CheckCircle2 }
                    ].map((s, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 }}
                        key={i} 
                        className="flex gap-8 group"
                      >
                         <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black z-10 group-hover:border-accent-primary transition-all duration-300">
                           <s.icon className="w-5 h-5 text-gray-500 group-hover:text-accent-primary transition-colors" />
                         </div>
                         <div className="pt-1">
                            <h4 className="text-xl font-bold text-white mb-2 italic">Step {s.step}: {s.title}</h4>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">{s.desc}</p>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>

              <div className="relative">
                 <div className="absolute inset-0 bg-accent-primary/20 blur-[120px] rounded-full opacity-20" />
                 <div className="glass-card p-4 rotate-3 group overflow-hidden">
                    <div className="bg-[#030303] rounded-xl overflow-hidden border border-white/10">
                       <div className="bg-white/5 p-4 flex justify-between">
                          <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-red-400" />
                             <div className="w-2 h-2 rounded-full bg-amber-400" />
                          </div>
                          <span className="text-[8px] font-mono text-gray-600">AUDIT_REPORT_LIVE.LOG</span>
                       </div>
                       <div className="p-8 space-y-4">
                          <div className="h-4 w-3/4 bg-red-500/10 rounded-lg animate-pulse" />
                          <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
                          <div className="h-4 w-full bg-white/5 rounded-lg" />
                          <div className="h-4 w-2/3 bg-green-500/10 rounded-lg animate-pulse" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-40 relative">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-24 space-y-4">
             <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">Simple <span className="text-accent-primary">Pricing</span></h2>
             <p className="text-gray-500 font-medium">No hidden fees. Scale as your codebase grows.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              title="Free Plan"
              price="Free"
              features={[
                "5 AI Analyses per day",
                "Basic Error Detection",
                "Community Support",
                "Local Session Storage"
              ]}
              cta="Get Started Free"
              delay={0.1}
            />
            <PricingCard 
              title="PRO Plan"
              price="$14.99"
              recommended={true}
              features={[
                "Unlimited AI Analyses",
                "Priority Audit Kernel",
                "Advanced Security Shield",
                "1000 AI Credits included",
                "Premium Support 24/7",
                "Early Access Features"
              ]}
              cta="Upgrade to PRO"
              delay={0.2}
            />
          </div>

          <div className="mt-20">
             <p className="text-gray-600 text-xs font-bold uppercase tracking-[0.2em] mb-8">Need more power? Check our Token Packs</p>
             <div className="flex flex-wrap justify-center gap-4 opacity-50">
               {["20 Tokens: $1", "140 Tokens: $4", "1000 Tokens: $15"].map((p, i) => (
                 <span key={i} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black">{p}</span>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto glass-card p-12 md:p-24 relative overflow-hidden bg-white/[0.01]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
            
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic uppercase mb-8">Start Debugging <br/> <span className="text-accent-primary">Smarter Today</span></h2>
            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto font-medium">Join 10,000+ developers fixing bugs before they even happen.</p>

            <form className="flex flex-col md:flex-row gap-4 max-w-md mx-auto relative group">
              <div className="relative flex-1">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-accent-primary transition-colors" />
                 <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent-primary/50 transition-all placeholder:text-gray-600 font-bold"
                 />
              </div>
              <button type="submit" className="btn-premium btn-premium-primary py-4 px-8 flex items-center justify-center gap-2 group">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#030303]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="font-black text-white text-base italic uppercase">D</span>
                </div>
                <span className="font-black tracking-tighter text-white italic uppercase text-lg">DebugAI PRO</span>
              </div>
              <p className="text-gray-600 text-sm max-w-xs font-medium">The definitive AI Guardian for high-stakes software production.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
               <div className="space-y-4">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Product</h5>
                 <ul className="space-y-2 text-sm font-medium text-gray-600">
                    <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                    <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                 </ul>
               </div>
               <div className="space-y-4">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Legal</h5>
                 <ul className="space-y-2 text-sm font-medium text-gray-600">
                    <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                 </ul>
               </div>
               <div className="space-y-4 hidden lg:block">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Contact</h5>
                 <ul className="space-y-2 text-sm font-medium text-gray-600">
                    <li><a href="#" className="hover:text-white transition-colors">Twitter (X)</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Github</a></li>
                 </ul>
               </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">
            <span>© 2026 DebugAI Assistant Inc.</span>
            <div className="flex gap-6 items-center">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Systems Operational
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
