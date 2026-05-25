import { Lightbulb, Power, Layers, ArrowUpRight } from 'lucide-react';
import { RelayState } from '../types';

interface RelayControlProps {
  relays: RelayState[];
  variasiRunning: boolean;
  onToggleRelay: (id: number, targetState: boolean) => Promise<void>;
  onToggleAll: (targetState: boolean) => Promise<void>;
}

export default function RelayControl({ relays, variasiRunning, onToggleRelay, onToggleAll }: RelayControlProps) {
  return (
    <div id="relay-control-dashboard" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Power className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Kontrol Saklar Relay</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">Status 4 Channel Relay aktif LOW. Klik kartu untuk mengatur kelistrikan rumah.</p>
        </div>

        {/* Sync global actions */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 self-start sm:self-auto">
          <button
            onClick={() => onToggleAll(false)}
            className="px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 border border-slate-100 transition-all cursor-pointer shadow-xs"
          >
            Master Off
          </button>
          
          <button
            onClick={() => onToggleAll(true)}
            className="px-4 py-2 bg-[#6D5EF5] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-md shadow-[#6D5EF5]/25"
          >
            Master On
          </button>
        </div>
      </div>

      {variasiRunning && (
        <div className="mb-5 px-4 py-3 bg-[#6D5EF5]/5 border border-primary/20 rounded-2xl text-[#6D5EF5] text-xs font-semibold flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#6D5EF5]" />
          <span>Sistem variasi otomatis aktif. Mengontrol Relay secara manual akan mematikan sequence otomatis.</span>
        </div>
      )}

      {/* Relays Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relays.map((relay) => (
          <div
            key={relay.id}
            onClick={() => onToggleRelay(relay.id, !relay.isOn)}
            className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex items-center justify-between select-none ${
              relay.isOn
                ? 'bg-white border-slate-100 shadow-md shadow-[#6D5EF5]/5'
                : 'bg-white border-slate-100 shadow-xs opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Icon Holder */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  relay.isOn
                    ? 'bg-[#6D5EF5]/10 text-[#6D5EF5]'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <Lightbulb className={`w-6 h-6 ${relay.isOn ? 'animate-pulse' : ''}`} />
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{relay.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${relay.isOn ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  <span className={`text-[9.5px] uppercase font-bold tracking-wider ${relay.isOn ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {relay.isOn ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[9px] text-slate-300">•</span>
                  <span className="text-[9px] font-mono font-medium text-slate-400">GPIO {relay.pin}</span>
                </div>
              </div>
            </div>

            {/* Custom Premium Switch Selector */}
            <div
              className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${
                relay.isOn ? 'bg-[#6D5EF5]' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  relay.isOn ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Connection Wiring Hint */}
      <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>Kabel Fisik Relay ke ESP32:</span>
        </span>
        <div className="font-mono text-[10px] flex flex-wrap gap-2.5">
          <span>R1 👉 <strong className="text-slate-700">D23</strong></span>
          <span>R2 👉 <strong className="text-slate-700">D19</strong></span>
          <span>R3 👉 <strong className="text-slate-700">D18</strong></span>
          <span>R4 👉 <strong className="text-slate-700">D5</strong></span>
        </div>
      </div>
    </div>
  );
}
