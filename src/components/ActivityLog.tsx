import { useState } from 'react';
import { ListFilter, Search, Trash2, History, CircleUser, Bot, Mic, Monitor, RefreshCw } from 'lucide-react';
import { ActivityLog, LogSource, LogType } from '../types';

interface ActivityLogProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export default function ActivityLogComponent({ logs, onClearLogs }: ActivityLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<LogType | 'all'>('all');

  const getSourceColor = (source: LogSource) => {
    switch (source) {
      case 'Telegram Bot':
        return 'text-sky-400';
      case 'Voice Command':
        return 'text-rose-400';
      case 'Web Dashboard':
        return 'text-[#6D5EF5]';
      case 'System Sync':
        return 'text-emerald-400';
      default:
        return 'text-slate-300';
    }
  };

  const filteredLogs = logs
    .filter((log) => {
      const typeMatches = selectedType === 'all' || log.type === selectedType;
      const searchMatches =
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatches && searchMatches;
    })
    .reverse(); // Newest first

  return (
    <div id="activity-log-card" className="bg-slate-900 rounded-[32px] p-6 shadow-2xl flex flex-col flex-grow text-slate-350">
      {/* Terminal Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <h3 className="text-xs font-bold text-[#6D5EF5] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-ring"></span>
          Activity System Log
        </h3>
        
        {/* Actions button */}
        <button
          onClick={onClearLogs}
          disabled={logs.length === 0}
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-450 hover:text-red-400 border border-slate-800 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
        >
          Clear Log
        </button>
      </div>

      {/* Internal Controls Container */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-col gap-2">
          {/* Dark styled search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activity log..."
              className="w-full h-9 px-3 pl-9 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-[#6D5EF5] focus:ring-1 focus:ring-[#6D5EF5] transition-colors bg-slate-950/60 text-slate-200 placeholder-slate-600"
            />
          </div>

          {/* Small pills */}
          <div className="flex gap-1 overflow-x-auto whitespace-nowrap py-1 scrollbar-none">
            {(['all', 'relay', 'variasi', 'sensor'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  selectedType === type
                    ? 'bg-[#6D5EF5]/20 text-[#6D5EF5] border border-[#6D5EF5]/30 shadow-inner'
                    : 'bg-slate-800/40 text-slate-450 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                {type === 'all' ? `All (${logs.length})` : `${type} (${logs.filter(l => l.type === type).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Monospace Code Stream */}
      <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/70 p-4 font-mono text-[11px] leading-relaxed space-y-1">
        <div className="max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-none space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-slate-600 italic py-6">
              [No matching event traces found]
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="transition-all hover:bg-white/[0.02] p-1 rounded-sm">
                <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                <span className="text-slate-400 mr-1.5">-</span>
                <span className={`${getSourceColor(log.source)} mr-2 font-bold`}>
                  [{log.source === 'Web Dashboard' ? 'WEB' : log.source.toUpperCase()}]
                </span>
                <span className="text-slate-200">{log.message}</span>
                {log.details && (
                  <span className="block text-[10px] text-slate-600 italic ml-4 mt-0.5">
                    └─ {log.details}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Terminal footer hint */}
      <div className="mt-4 p-3 bg-slate-800/30 rounded-2xl border border-slate-800/50 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#6D5EF5]"></div>
        <p className="text-[10px] text-slate-500 italic">Say &quot;Nyalakan lampu utama&quot; to control hands-free...</p>
      </div>
    </div>
  );
}
