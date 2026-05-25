import { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff, Settings, Info, CloudLightning } from 'lucide-react';
import { SystemStatus } from '../types';

interface NavbarProps {
  status: SystemStatus;
  onOpenSettings: () => void;
  onTogglePlayground: () => void;
}

export default function Navbar({ status, onOpenSettings, onTogglePlayground }: NavbarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm px-4 py-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Title Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6D5EF5] flex items-center justify-center text-white shadow-lg shadow-[#6D5EF5]/30">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Lumina Home Control</h1>
              <span className="text-[10px] font-mono tracking-wider text-primary border border-primary/20 bg-primary/5 px-1.5 py-0.5 rounded-sm uppercase font-semibold">
                ESP32 BOARD
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              IP: <span className="text-[#6D5EF5] font-mono">{status.ipAddress || 'Not Configured'}</span> • Status:{' '}
              {status.isConnected && !status.isSimulated ? (
                <span className="text-emerald-500 font-bold uppercase">Connected</span>
              ) : status.isSimulated ? (
                <span className="text-[#6D5EF5] font-bold uppercase">Demo Mode</span>
              ) : (
                <span className="text-rose-500 font-bold uppercase">Disconnected</span>
              )}
            </p>
          </div>
        </div>

        {/* Info & Status controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Display */}
          <div className="hidden lg:flex flex-col items-end text-right px-3 py-1 border-r border-slate-155">
            <span className="text-xs font-mono font-bold text-slate-700">{formatTime(time)}</span>
            <span className="text-[10px] text-slate-400 font-medium">{formatDate(time)}</span>
          </div>

          {/* Mode Badge Indicator */}
          <button
            onClick={onTogglePlayground}
            title="Klik untuk mengubah mode simulasi"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              status.isSimulated
                ? 'bg-amber-50 text-amber-700 border border-amber-200/60 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
            }`}
          >
            <CloudLightning className="w-3.5 h-3.5" />
            <span>Mode: {status.isSimulated ? 'Simulasi' : 'Hardware ESP32'}</span>
          </button>

          {/* Connection Badge Indicator */}
          <div
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border ${
              status.isConnected && !status.isSimulated
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                : status.isSimulated
                ? 'bg-purple-50 text-primary border-primary/20'
                : 'bg-red-50 text-red-700 border-red-200/60'
            }`}
          >
            {status.isConnected && !status.isSimulated ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                <span>Terhubung</span>
              </>
            ) : status.isSimulated ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-primary" />
                <span>Simulasi Aktif</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-600" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Settings Trigger button */}
          <button
            onClick={onOpenSettings}
            className="p-2 sm:p-2.5 text-slate-500 hover:text-[#6D5EF5] hover:bg-[#6D5EF5]/5 border border-slate-200 rounded-xl transition-all cursor-pointer"
            title="Konfigurasi IP ESP32"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
