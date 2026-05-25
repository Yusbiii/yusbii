import { useState, useEffect } from 'react';
import { Sparkles, StopCircle, RefreshCw, ArrowRightLeft, Radio } from 'lucide-react';

interface VariasiControlProps {
  currentMode: number; // 0 = none, 1 = var 1, 2 = var 2
  onChangeVariasi: (mode: number) => Promise<void>;
  onStop: () => Promise<void>;
}

export default function VariasiControl({ currentMode, onChangeVariasi, onStop }: VariasiControlProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Simple indicator loop simulating the active relay ticks in the frontend
  useEffect(() => {
    if (currentMode === 0) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (currentMode === 1) {
          // Var 1 steps: 1 -> 3 -> 2 -> 4 (represented as index 0, 1, 2, 3)
          return (prev + 1) % 4;
        } else {
          // Var 2 steps: 1 -> 2 -> 3 -> 4 -> 3 -> 2 (total 6 steps)
          return (prev + 1) % 6;
        }
      });
    }, 150); // Matches the 'variasiDelay = 150' in Arduino sketch!

    return () => clearInterval(interval);
  }, [currentMode]);

  // Translate active step to active relay ID (1 to 4) for visualization
  const getSimulatedActiveRelay = () => {
    if (currentMode === 0) return null;
    if (currentMode === 1) {
      // 1->3->2->4
      const order = [1, 3, 2, 4];
      return order[activeStep];
    } else {
      // 1 -> 2 -> 3 -> 4 -> 3 -> 2
      const order = [1, 2, 3, 4, 3, 2];
      return order[activeStep];
    }
  };

  const activeRelay = getSimulatedActiveRelay();

  return (
    <div id="variasi-light-dashboard" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6D5EF5]"></span>
          Lighting Patterns
        </h2>
        
        {currentMode > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-primary font-bold bg-[#6D5EF5]/15 border border-primary/20 px-2.5 py-1 rounded-full">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Pattern {currentMode} Active</span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 font-medium mb-5 leading-relaxed">
        ESP32 Anda mendukung pola kedipan cahaya berkecepatan tinggi (delay 150ms). Pilih salah satu mode di bawah untuk melihat polanya.
      </p>

      {/* Grid of Variations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Variasi 1 Card */}
        <button
          type="button"
          onClick={() => onChangeVariasi(1)}
          className={`w-full text-left p-5 border rounded-2xl group transition-all cursor-pointer ${
            currentMode === 1
              ? 'bg-[#6D5EF5]/5 border-[#6D5EF5]'
              : 'bg-slate-50 hover:bg-[#6D5EF5]/5 border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-bold text-slate-700">Variasi 1</p>
            {currentMode === 1 ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#6D5EF5] animate-ping" />
            ) : (
              <svg className="w-5 h-5 text-slate-300 group-hover:text-[#6D5EF5] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              </svg>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium italic mb-3">Running Light (1➔3➔2➔4)</p>
          
          {/* Visual Step order map */}
          <div className="flex items-center gap-1.5 font-mono text-[9px] bg-white border border-slate-100 rounded-lg p-1.5">
            <span className={`px-1 rounded-sm ${activeRelay === 1 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>Lampu 1</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-1 rounded-sm ${activeRelay === 3 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>3</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-1 rounded-sm ${activeRelay === 2 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>2</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-1 rounded-sm ${activeRelay === 4 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>4</span>
          </div>
        </button>

        {/* Variasi 2 Card */}
        <button
          type="button"
          onClick={() => onChangeVariasi(2)}
          className={`w-full text-left p-5 border rounded-2xl group transition-all cursor-pointer ${
            currentMode === 2
              ? 'bg-[#6D5EF5]/5 border-[#6D5EF5]'
              : 'bg-slate-50 hover:bg-[#6D5EF5]/5 border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-bold text-slate-700">Variasi 2</p>
            {currentMode === 2 ? (
              <span className="w-2.5 h-2.5 rounded-full bg-[#6D5EF5] animate-ping" />
            ) : (
              <svg className="w-5 h-5 text-slate-300 group-hover:text-[#6D5EF5] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              </svg>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium italic mb-3">Ping-Pong Sequence</p>

          {/* Visual Step order map */}
          <div className="flex items-center gap-1 font-mono text-[9px] bg-white border border-slate-100 rounded-lg p-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className={`px-1 rounded-sm ${activeRelay === 1 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>L1</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-1 rounded-sm ${activeRelay === 2 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>2</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-1 rounded-sm ${activeRelay === 3 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>3</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-1 rounded-sm ${activeRelay === 4 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>4</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-1 rounded-sm ${activeStep === 4 && currentMode === 2 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>3</span>
            <span className="text-slate-300">➔</span>
            <span className={`px-1 rounded-sm ${activeStep === 5 && currentMode === 2 ? 'bg-primary text-white font-bold' : 'text-slate-500'}`}>2</span>
          </div>
        </button>
      </div>

      {/* Stop Actions with dashed sleek style */}
      <button
        type="button"
        onClick={onStop}
        disabled={currentMode === 0}
        className={`w-full p-4 border-2 border-dashed rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${
          currentMode > 0
            ? 'border-red-200 text-red-500 hover:bg-red-50'
            : 'border-slate-100 text-slate-300 cursor-not-allowed'
        }`}
      >
        Stop Sequence
      </button>
    </div>
  );
}
