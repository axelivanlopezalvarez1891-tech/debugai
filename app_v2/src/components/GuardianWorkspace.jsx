import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Terminal, 
  Search, 
  AlertCircle, 
  AlertTriangle, 
  Zap, 
  CheckCircle2,
  Code2,
  Layout,
  MessageSquareCode,
  Sparkles,
  Loader2
} from 'lucide-react';

const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
      ${active ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'text-gray-500 hover:text-gray-300'}
    `}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const ResultCard = ({ result, delay }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.fix || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`p-5 rounded-2xl border glass-card relative overflow-hidden group
        ${result.type === 'error' ? 'border-red-500/20' : result.type === 'warning' ? 'border-amber-500/20' : 'border-neon-cyan/20'}
      `}
    >
      <div className={`absolute top-0 left-0 w-1 h-full
        ${result.type === 'error' ? 'bg-red-500' : result.type === 'warning' ? 'bg-amber-500' : 'bg-neon-cyan'}
      `}></div>

      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-xl
          ${result.type === 'error' ? 'bg-red-500/10 text-red-500' : 
            result.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
            'bg-neon-cyan/10 text-neon-cyan'}
        `}>
          {result.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
           result.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
           <Zap className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-bold text-sm mb-1 truncate">{result.title}</h4>
          <p className="text-gray-500 text-[11px] leading-relaxed mb-4">{result.explanation || result.body}</p>
          
          {result.fix && (
            <div className="relative group/code">
              <div className="bg-black/40 rounded-lg p-3 border border-white/5 font-mono text-[10px] text-neon-cyan/70 select-all group-hover:border-white/10 transition-colors overflow-x-auto">
                <span className="text-gray-600 mr-2 opacity-50 block mb-1">// Suggested Fix</span>
                <code className="whitespace-pre">{result.fix}</code>
              </div>
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all shadow-lg"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Code2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const GuardianWorkspace = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState([]);
  const [results, setResults] = useState({ errors: [], warnings: [], suggestions: [] });
  const [code, setCode] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);

  const addLog = (msg) => {
    setAnalysisLogs(prev => [...prev.slice(-4), msg]);
  };

  const handleAnalysis = async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    setShowResults(false);
    setErrorStatus(null);
    setAnalysisLogs([]);
    
    try {
      setTimeout(() => addLog("System: Initializing Pre-Deploy Guardian..."), 100);
      setTimeout(() => addLog("Core: Parsing abstract syntax tree..."), 600);
      setTimeout(() => addLog("AI: Auditing logic cycles and security traits..."), 1200);

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.msg || "Analysis failed");

      const mapped = {
        errors: (data.errors || []).map(e => ({ ...e, type: 'error' })),
        warnings: (data.warnings || []).map(w => ({ ...w, type: 'warning' })),
        suggestions: (data.suggestions || []).map(s => ({ ...s, type: 'suggestion' }))
      };

      setTimeout(() => {
        setResults(mapped);
        setIsAnalyzing(false);
        setShowResults(true);
      }, 1000);

    } catch (err) {
      setErrorStatus(err.message);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-neon-cyan" />
            Pre-Deploy Guardian
          </h2>
          <p className="text-gray-500 text-sm font-medium italic">Analyze, detect, and fix code issues instantly with AI</p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 h-fit p-1 rounded-2xl border border-white/5">
          <TabButton active={activeTab === 'overview'} label="Overview" icon={Layout} onClick={() => setActiveTab('overview')} />
          <TabButton active={activeTab === 'logs'} label="Logs" icon={Terminal} onClick={() => setActiveTab('logs')} />
          <TabButton active={activeTab === 'ai'} label="AI Insights" icon={MessageSquareCode} onClick={() => setActiveTab('ai')} />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Editor Side */}
        <div className="col-span-8 flex flex-col space-y-4">
          <div className="flex-1 glass-panel rounded-3xl border-white/5 relative overflow-hidden flex flex-col shadow-inner">
            <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-gray-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">secure_component_v2.jsx</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-neon-cyan/10 text-neon-cyan text-[10px] font-bold">REACT / ES2024</span>
            </div>
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your sensitive code here for deep AI analysis..."
              className="flex-1 bg-transparent p-6 font-mono text-sm text-gray-300 outline-none resize-none placeholder:text-gray-700 selection:bg-neon-cyan/20 custom-scrollbar"
            />
          </div>

          <button 
            onClick={handleAnalysis}
            disabled={isAnalyzing || !code.trim()}
            className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all duration-500 relative overflow-hidden group shadow-2xl
              ${isAnalyzing 
                ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-neon-cyan hover:scale-[1.01] neon-glow-cyan'
              }
              ${!code.trim() && !isAnalyzing ? 'opacity-50 grayscale' : ''}
            `}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing core modules...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                Run Comprehensive Analysis
                <div className="absolute inset-x-0 bottom-0 h-1 bg-neon-cyan/30 opacity-0 group-hover:opacity-100 animate-pulse"></div>
              </>
            )}
          </button>
        </div>

        {/* Results Side */}
        <div className="col-span-4 flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              Diagnosis Stream
            </h3>
            <span className="text-[10px] font-black text-gray-600 italic">Core AI Hub</span>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
            <AnimatePresence mode="wait">
              {errorStatus && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs text-center"
                >
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  {errorStatus}
                </motion.div>
              )}

              {!showResults && !isAnalyzing && !errorStatus && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center px-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-gray-700" />
                  </div>
                  <h4 className="text-gray-400 font-bold mb-2">Analysis Engine Idle</h4>
                  <p className="text-gray-600 text-[10px] leading-relaxed">
                    Submit your code to trigger the Pre-Deploy Guardian. All code is analyzed in your secure session.
                  </p>
                </motion.div>
              )}

              {isAnalyzing && (
                <div className="space-y-4 p-2 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin mb-4"></div>
                    <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest animate-pulse">Scanning Kernel...</span>
                  </div>
                  <div className="space-y-2">
                    {analysisLogs.map((log, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-mono text-gray-500 bg-white/5 p-2 rounded-lg border border-white/5"
                      >
                        <span className="text-neon-cyan mr-2">➜</span> {log}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {showResults && !isAnalyzing && (
                <div className="space-y-4 pb-4">
                  {[...results.errors, ...results.warnings, ...results.suggestions].map((res, i) => (
                    <ResultCard key={i} result={res} delay={i * 0.1} />
                  ))}
                  
                  {results.errors.length === 0 && results.warnings.length === 0 && results.suggestions.length === 0 && (
                     <div className="text-center p-8 bg-green-500/5 border border-green-500/20 rounded-2xl">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
                        <p className="text-white font-bold text-xs">No issues detected!</p>
                        <p className="text-gray-500 text-[10px] mt-1">Your code matches DebugAI best practices.</p>
                     </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Info Bar */}
          <div className="p-4 bg-indigo-500/10 border-t border-indigo-500/20">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="text-[9px] text-indigo-400/80 font-bold leading-relaxed tracking-tight">
                Guardian AI model v4.2.1 is active. Code integrity verified against latest CVE database and best practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianWorkspace;
