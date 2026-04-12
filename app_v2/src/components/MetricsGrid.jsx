import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Cpu, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, trend, trendValue, color }) => (
  <div className="glass-card rounded-2xl p-5 group flex flex-col justify-between h-32">
    <div className="flex items-start justify-between">
      <div className={`p-2 rounded-lg bg-${color}/10 border border-${color}/20 text-${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'} text-[10px] font-bold`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}%
        </div>
      )}
    </div>
    
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  </div>
);

const MetricsGrid = () => {
  return (
    <div className="grid grid-cols-4 gap-4 mt-6">
      <MetricCard 
        icon={Activity} 
        label="Latencia Promedio" 
        value="124ms" 
        trend="down" 
        trendValue="12" 
        color="indigo-500"
      />
      <MetricCard 
        icon={Cpu} 
        label="Carga del CPU" 
        value="42.8%" 
        trend="up" 
        trendValue="5" 
        color="amber-500"
      />
      <MetricCard 
        icon={Zap} 
        label="Tasa de Éxito" 
        value="99.98%" 
        trend="up" 
        trendValue="0.02" 
        color="green-500"
      />
      <MetricCard 
        icon={Clock} 
        label="Uptime Total" 
        value="34d 12h" 
        color="blue-500"
      />
    </div>
  );
};

export default MetricsGrid;
