import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  Coins, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

const TokenPackage = ({ qty, price, popular, onSelect, loading }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`relative p-6 rounded-[2rem] border glass-card transition-all group
      ${popular ? 'border-[#fbbf24]/30 bg-[#fbbf24]/5 shadow-lg shadow-amber-500/5' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}
    `}
  >
    {popular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#fbbf24] text-black text-[10px] font-black uppercase tracking-widest shadow-xl">
        Más Popular
      </div>
    )}
    
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${popular ? 'bg-[#fbbf24]/20 text-[#fbbf24]' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
        <Coins className="w-6 h-6" />
      </div>
      <span className="text-2xl font-black text-white px-2 tracking-tight">${price}</span>
    </div>

    <h3 className="text-xl font-black text-white mb-1 group-hover:text-[#fbbf24] transition-colors">{qty} Tokens</h3>
    <p className="text-gray-500 text-[10px] font-medium uppercase tracking-[0.2em] mb-6">Un solo pago</p>

    <button 
      onClick={() => onSelect(qty)}
      disabled={loading}
      className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2
        ${popular ? 'bg-[#fbbf24] text-black hover:bg-[#f59e0b]' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'}
      `}
    >
      {loading ? 'Procesando...' : 'Adquirir'}
      <ArrowRight className="w-3 h-3" />
    </button>
  </motion.div>
);

const StoreView = ({ user }) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (qty, isPro = false) => {
    setLoading(true);
    try {
      // Defaulting to PayPal order creation for demo, can be switched based on context
      const resp = await fetch('/api/payment/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: qty, isPro })
      });
      const data = await resp.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.msg || "Error al iniciar el pago");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-[#fbbf24]" />
            Master Store
          </h1>
          <p className="text-gray-500 text-sm font-medium">Incrementa tu capacidad de auditoría con créditos premium</p>
        </div>
        
        <div className="bg-white/5 px-6 py-4 rounded-3xl border border-white/10 text-center">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Tu Balance</p>
          <p className="text-2xl font-black text-[#fbbf24]">{user?.creditos || 0} <span className="text-xs text-gray-400 font-bold ml-1">TOKENS</span></p>
        </div>
      </div>

      {/* Pro Section */}
      <section className="relative overflow-hidden rounded-[3rem] border border-[#fbbf24]/30 bg-gradient-to-br from-[#fbbf24]/10 via-[#030303] to-[#fbbf24]/5 p-12 group">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="grid grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#fbbf24] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              OFERTA LEGACY PLUS
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">DebugAI PRO <span className="text-[#fbbf24]">Lifetime</span></h2>
            <div className="space-y-3 mb-8">
              {[
                'Dashboard Maestro Ilimitado',
                'Prioridad en cola de IA Guardian',
                'Auditoría profunda de seguridad activa',
                'Acceso a Master Control (solo admins)',
                'Insignia BadgeCheck exclusiva'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                  <CheckCircle2 className="w-5 h-5 text-green-500/50" />
                  {text}
                </div>
              ))}
            </div>

            <div className="flex items-end gap-4 mb-8">
              <span className="text-5xl font-black text-white leading-none">$14.99</span>
              <span className="text-gray-500 text-lg line-through font-bold mb-1">$49.99</span>
            </div>

            <button 
              onClick={() => handlePurchase(0, true)}
              disabled={loading || user?.plan === 'pro'}
              className="px-10 py-5 rounded-2xl bg-[#fbbf24] text-black font-black text-sm uppercase tracking-[0.3em] hover:bg-[#f59e0b] transition-all hover:scale-[1.02] shadow-2xl shadow-amber-500/20"
            >
              {user?.plan === 'pro' ? 'Ya eres PRO' : 'Subir a PRO Ahora'}
            </button>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-[3rem] border border-white/5 bg-white/[0.02] items-center justify-center flex relative group-hover:scale-[1.02] transition-transform duration-700">
              <ShieldCheck className="w-48 h-48 text-[#fbbf24]/10 absolute animate-pulse" />
              <div className="text-center relative z-10">
                <TrendingUp className="w-20 h-20 text-[#fbbf24] mx-auto mb-6" />
                <p className="text-white font-black text-xl uppercase tracking-widest">+400% Eficiencia</p>
                <p className="text-gray-500 text-sm mt-2">Detección de vulnerabilidades</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Packs */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white tracking-tight">Recargar Tokens</h2>
        <div className="grid grid-cols-5 gap-6">
          <TokenPackage qty={20} price={1} onSelect={handlePurchase} loading={loading} />
          <TokenPackage qty={55} price={2} onSelect={handlePurchase} loading={loading} />
          <TokenPackage qty={140} price={4} popular onSelect={handlePurchase} loading={loading} />
          <TokenPackage qty={380} price={8} onSelect={handlePurchase} loading={loading} />
          <TokenPackage qty={1000} price={15} onSelect={handlePurchase} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default StoreView;
