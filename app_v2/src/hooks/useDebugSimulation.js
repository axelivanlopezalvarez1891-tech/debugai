import { useState, useEffect, useCallback } from 'react';

const LOG_TEMPLATES = [
  { level: 'low', message: 'API Request processed successfully', category: 'network' },
  { level: 'low', message: 'Cache hit for user preferences', category: 'performance' },
  { level: 'medium', message: 'Slow database query detected (340ms)', category: 'database' },
  { level: 'medium', message: 'Rate limit approaching for Client #88', category: 'api' },
  { level: 'high', message: 'Unauthorized access attempt blocked', category: 'security' },
  { level: 'high', message: 'Service worker crash on iOS 16.4', category: 'frontend' },
];

export const useDebugSimulation = () => {
  const [stabilityScore, setStabilityScore] = useState(94);
  const [riskLevel, setRiskLevel] = useState('low'); // low, medium, high
  const [logs, setLogs] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);

  // Smooth score fluctuation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setStabilityScore(prev => {
        const drift = Math.random() > 0.5 ? 1 : -1;
        const next = Math.max(0, Math.min(100, prev + drift));
        
        // Update risk level based on score
        if (next > 85) setRiskLevel('low');
        else if (next > 60) setRiskLevel('medium');
        else setRiskLevel('high');
        
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Log generation
  useEffect(() => {
    if (!isPlaying) return;

    const addLog = () => {
      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        ...template
      };

      setLogs(prev => [newLog, ...prev].slice(0, 50));
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.3) addLog();
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleSimulation = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  return {
    stabilityScore,
    riskLevel,
    logs,
    isPlaying,
    toggleSimulation
  };
};
