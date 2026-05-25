import React, { useState } from 'react';
import { Settings, HelpCircle, CheckCircle2, AlertTriangle, PlayCircle, RefreshCw, Layers } from 'lucide-react';
import { SystemStatus } from '../types';

interface ESP32ConfigProps {
  status: SystemStatus;
  onUpdateConfig: (ip: string, isSimulated: boolean) => void;
  onTestConnection: () => Promise<boolean>;
}

export default function ESP32Config({ status, onUpdateConfig, onTestConnection }: ESP32ConfigProps) {
  const [ipInput, setIpInput] = useState(status.ipAddress);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [showHelper, setShowHelper] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(ipInput, status.isSimulated);
  };

  const handleModeToggle = (simulated: boolean) => {
    onUpdateConfig(ipInput, simulated);
  };

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestConnection();
      setTestResult(ok ? 'success' : 'failed');
    } catch {
      setTestResult('failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div id="esp32-config-card" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Koneksi Hardware ESP32</h2>
        </div>
        <button
          onClick={() => setShowHelper(!showHelper)}
          className="text-xs text-primary hover:text-primary-dark font-bold flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Bantuan?</span>
        </button>
      </div>

      {showHelper && (
        <div className="mb-5 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-slate-600 space-y-2.5 animate-fade-in">
          <h3 className="font-bold text-primary flex items-center gap-1 text-[12px]">
            <AlertTriangle className="w-4 h-4 text-primary" /> Mengatasi Masalah Koneksi (Mixed Content Block):
          </h3>
          <p className="leading-relaxed">
            Karena website ini berjalan di protokol <strong>HTTPS</strong> sedangkan ESP32 menggunakan <strong>HTTP</strong> lokal, browser Anda secara default memblokir pengiriman data karena aturan keamanan browser (<em>Mixed Content</em>).
          </p>
          <div className="bg-white p-3 rounded-xl border border-primary/13 mt-2 space-y-1.5 font-sans">
            <p className="font-semibold text-slate-800 text-[11px]">👉 Langkah Cepat Mengizinkan Koneksi local di Chrome / Edge:</p>
            <ol className="list-decimal pl-4 space-y-1 text-[11px]">
              <li>Klik ikon <strong>Gembok/Kelola (Lock Icon)</strong> di sebelah kiri kolom alamat URL browser Anda.</li>
              <li>Pilih menu <strong>Setelan Situs / Site Settings</strong>.</li>
              <li>Cari opsi <strong>Konten Tidak Aman / Insecure Content</strong> di daftar setelan.</li>
              <li>Ubah pengaturannya dari <strong>Blokir (Default)</strong> menjadi <strong>Izinkan (Allow)</strong>.</li>
              <li>Kembali ke tab dashboard ini, lalu **Refresh (F5)** halaman website!</li>
            </ol>
          </div>
          <p className="text-[10.5px] text-slate-500 italic">
            *Catatan: Jika tidak ingin menerapkan aturan di atas, Anda dapat menggunakan <strong>Mode Simulasi</strong> di bawah untuk mencoba seluruh interface secara instan!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dynamic Mode Switcher Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleModeToggle(true)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              status.isSimulated
                ? 'bg-[#6D5EF5]/5 border-[#6D5EF5] shadow-xs'
                : 'bg-slate-50 border-slate-105 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${status.isSimulated ? 'text-primary' : 'text-slate-700'}`}>
                Mode Demo
              </span>
              <div className={`w-2 h-2 rounded-full ${status.isSimulated ? 'bg-primary' : 'bg-slate-300'}`} />
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">Mencoba seluruh fitur tanpa device ESP32 fisik.</p>
          </button>

          <button
            type="button"
            onClick={() => handleModeToggle(false)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              !status.isSimulated
                ? 'bg-emerald-50/70 border-emerald-400/50 shadow-xs'
                : 'bg-slate-50 border-slate-105 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${!status.isSimulated ? 'text-emerald-800' : 'text-slate-700'}`}>
                Hardware IoT
              </span>
              <div className={`w-2 h-2 rounded-full ${!status.isSimulated ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">Menghubungkan langsung ke IP Address lokal ESP32.</p>
          </button>
        </div>

        {/* IP Field */}
        <div>
          <label htmlFor="ip-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            ESP32 IP Address lokal
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="ip-input"
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="cth: 192.168.1.15"
                disabled={status.isSimulated}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-primary disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
              />
              {!status.isSimulated && (
                <div className="absolute top-3.5 right-3 flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full ${status.isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={status.isSimulated || ipInput === status.ipAddress}
              className="bg-[#6D5EF5] text-white text-xs px-4 rounded-xl font-bold hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </div>
      </form>

      {/* Connection Test Flow */}
      {!status.isSimulated && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Uji Ping Sinkronisasi:</span>
            <span className="text-[10px] text-slate-400">Panggil GET rute ESP32 (/sync)</span>
          </div>

          <div className="flex items-center gap-3">
            {testResult === 'success' && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sukses!
              </span>
            )}
            {testResult === 'failed' && (
              <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-500" /> RTO / Gagal
              </span>
            )}

            <button
              onClick={runConnectionTest}
              disabled={isTesting}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs rounded-xl font-bold flex items-center gap-2 border border-slate-150 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Memanggil...' : 'Cek Rute'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Info API routes display */}
      <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>Rute API Komunikasi ESP32 Terdaftar:</span>
        </div>
        <div className="grid grid-cols-1 gap-1 font-mono text-[9.5px] text-slate-500">
          <div>🔄 <span className="font-semibold text-slate-700">GET /sync</span> - Sinkron dht & relay</div>
          <div>🔌 <span className="font-semibold text-slate-700">GET /relay</span> - Atur status relay [1-4]</div>
          <div>⚡ <span className="font-semibold text-slate-700">GET /all</span> - Atur serentak semua relay</div>
          <div>🎨 <span className="font-semibold text-slate-700">GET /variasi</span> - Aktifkan mode variasi [1-2]</div>
          <div>⛔ <span className="font-semibold text-slate-700">GET /stop</span> - Hentikan mode variasi</div>
        </div>
      </div>
    </div>
  );
}
