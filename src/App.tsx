import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  WifiOff, 
  Terminal, 
  HelpCircle, 
  PhoneCall, 
  Layers, 
  Cpu, 
  Server, 
  Share2, 
  RefreshCw,
  MessageSquareOff
} from 'lucide-react';

import { ActivityLog, RelayState, SensorData, SystemStatus } from './types';
import Navbar from './components/Navbar';
import ESP32Config from './components/ESP32Config';
import RelayControl from './components/RelayControl';
import DHTSensorCard from './components/DHTSensorCard';
import VariasiControl from './components/VariasiControl';
import VoiceCommand from './components/VoiceCommand';
import ActivityLogComponent from './components/ActivityLog';

export default function App() {
  // --- 1. CONFIGURATION AND LOCAL STORAGE LOAD ---
  const [status, setStatus] = useState<SystemStatus>(() => {
    const savedIp = localStorage.getItem('esp32_ip') || '';
    const savedSim = localStorage.getItem('esp32_is_simulated') !== 'false'; // Default to true for demo
    return {
      ipAddress: savedIp,
      isSimulated: savedSim,
      isConnected: false,
      variasiMode: 0,
    };
  });

  const [relays, setRelays] = useState<RelayState[]>([
    { id: 1, name: 'Lampu 1 (Teras)', isOn: false, pin: 23 },
    { id: 2, name: 'Lampu 2 (Ruang Tamu)', isOn: false, pin: 19 },
    { id: 3, name: 'Lampu 3 (Kamar Mandi)', isOn: false, pin: 18 },
    { id: 4, name: 'Lampu 4 (Dapur)', isOn: false, pin: 5 },
  ]);

  const [sensor, setSensor] = useState<SensorData>({
    temperature: 27.2,
    humidity: 65,
    timestamp: new Date().toLocaleTimeString('id-ID'),
  });

  // Keep a running list of sensor history for chart drawing (last 30 ticks)
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('esp32_activity_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback below
      }
    }
    
    // Initial friendly logs to welcome the user
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('id-ID', { hour12: false });
    return [
      {
        id: 'init-1',
        timestamp: formattedTime,
        message: 'Sistem ESP32 Smart IoT berhasil di-booting!',
        source: 'System Sync',
        type: 'system',
        details: 'Firmware loaded on cores [0, 1]. IP address notified successfully.'
      },
      {
        id: 'init-2',
        timestamp: formattedTime,
        message: 'Dashboard Web telah berhasil diinisialisasi dalam browser.',
        source: 'Web Dashboard',
        type: 'system',
        details: 'Aplikasi berjalan dalam mode Aman. Menunggu instruksi pengguna.'
      },
      {
        id: 'init-3',
        timestamp: formattedTime,
        message: 'Memuat Mode Simulasi Demo secara instan.',
        source: 'Web Dashboard',
        type: 'system',
        details: 'Cobalah saklar, tombol variasi, dan tombol microphone kontrol suara secara bebas!'
      }
    ];
  });

  // State to manage dynamic alert messages
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Reference hooks
  const previousMode = useRef<number>(0);

  // --- 2. PERSISTENCE PERSIST SYNCHRONIZERS ---
  useEffect(() => {
    localStorage.setItem('esp32_ip', status.ipAddress);
    localStorage.setItem('esp32_is_simulated', String(status.isSimulated));
  }, [status.ipAddress, status.isSimulated]);

  useEffect(() => {
    localStorage.setItem('esp32_activity_logs', JSON.stringify(logs));
  }, [logs]);

  // Alert message automatic dismission
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => setAlertMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  // --- 3. HELPER UTILS - TIME & EVENT LOGGING ---
  const getCurrentTimeShort = () => {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const addLogEntry = (message: string, source: ActivityLog['source'], type: ActivityLog['type'], details?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: getCurrentTimeShort(),
      message,
      source,
      type,
      details,
    };
    setLogs((prev) => {
      // Retain max 200 logs to prevent memory exhaustion
      const keep = prev.length > 199 ? prev.slice(-19).concat([newLog]) : [...prev, newLog];
      return keep;
    });
  };

  const showAlert = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setAlertMsg({ text, type });
  };

  // Safe HTTP Fetch client with reasonable timeout
  const espRequest = async (path: string, options: RequestInit = {}): Promise<any> => {
    const cleanIp = status.ipAddress.replace(/^(hw|http:\/\/)/, '').trim();
    if (!cleanIp) throw new Error('IP Address belum terkonfigurasi');

    const url = `http://${cleanIp}${path.startsWith('/') ? path : '/' + path}`;
    
    const controller = new AbortController();
    const selectTimeout = setTimeout(() => controller.abort(), 2000); // 2 seconds timeout for fast IoT feedback

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(selectTimeout);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (err: any) {
      clearTimeout(selectTimeout);
      throw err;
    }
  };

  // --- 4. HARDWARE STATUS SINKRONISASI (POLLING) ---
  const handleSyncData = async (): Promise<boolean> => {
    if (status.isSimulated) {
      // 4a. SIMULATION MODE - DRIFT SENSORS & SEQUENCE RUNNERS
      setSensor((prev) => {
        // Mock a delicate temperature drift
        const deltaT = (Math.random() - 0.5) * 0.4;
        const newTemp = Math.min(Math.max(prev.temperature + deltaT, 25.1), 31.8);

        // Mock a delicate humidity drift
        const deltaH = (Math.random() - 0.5) * 1.5;
        const newHum = Math.min(Math.max(prev.humidity + deltaH, 45), 85);
        
        const nextData = {
          temperature: parseFloat(newTemp.toFixed(1)),
          humidity: parseFloat(newHum.toFixed(0)),
          timestamp: getCurrentTimeShort(),
        };

        // Add to historical trend array
        setSensorHistory((history) => {
          const updated = [...history, nextData];
          if (updated.length > 50) updated.shift(); // Max 50 points
          return updated;
        });

        return nextData;
      });

      // Simulation mode automatic state feedback loop for active var mode
      if (status.variasiMode > 0) {
        // Flash visualization order ticker
        // (Visual steps are already animated beautifully inside VariasiControl.tsx)
      }
      return true;
    }

    // 4b. REAL HARDWARE IOT MODE
    try {
      const data = await espRequest('/sync');
      
      // Parse sync response from ESP32:
      // {"temperature": [float], "humidity": [float], "variasiMode": [int], "r1": [0|1], "r2": [0|1], "r3": [0|1], "r4": [0|1]}
      if (data && typeof data === 'object') {
        const temp = parseFloat(data.temperature) || 0.0;
        const hum = parseFloat(data.humidity) || 0;
        const varMode = parseInt(data.variasiMode) || 0;
        
        // Match state low (1 meaning relay active / LOW in C++ sketch, 0 meaning inactive / HIGH)
        const parsedRelays = [
          { id: 1, name: 'Lampu 1 (Teras)', isOn: data.r1 === 1, pin: 23 },
          { id: 2, name: 'Lampu 2 (Ruang Tamu)', isOn: data.r2 === 1, pin: 19 },
          { id: 3, name: 'Lampu 3 (Kamar Mandi)', isOn: data.r3 === 1, pin: 18 },
          { id: 4, name: 'Lampu 4 (Dapur)', isOn: data.r4 === 1, pin: 5 },
        ];

        setSensor({
          temperature: temp,
          humidity: hum,
          timestamp: getCurrentTimeShort(),
        });

        setSensorHistory((prev) => {
          const nextData = { temperature: temp, humidity: hum, timestamp: getCurrentTimeShort() };
          const updated = [...prev, nextData];
          if (updated.length > 50) updated.shift();
          return updated;
        });

        setRelays(parsedRelays);
        
        if (status.variasiMode !== varMode) {
          setStatus(prev => ({ ...prev, variasiMode: varMode, isConnected: true }));
          if (varMode > 0) {
            addLogEntry(`Mode Variasi ${varMode} terdeteksi aktif di hardware.`, 'System Sync', 'variasi');
          } else if (previousMode.current > 0) {
            addLogEntry('Mode Variasi dinonaktifkan di hardware.', 'System Sync', 'variasi');
          }
          previousMode.current = varMode;
        } else {
          setStatus(prev => ({ ...prev, isConnected: true }));
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Sync failed', err);
      setStatus(prev => ({ ...prev, isConnected: false }));
      return false;
    }
  };

  // Primary Polling controller
  useEffect(() => {
    // Initial sync
    handleSyncData();

    const interval = setInterval(() => {
      handleSyncData();
    }, 3000); // Polls every 3 seconds to match sensor and status variations

    return () => clearInterval(interval);
  }, [status.isSimulated, status.ipAddress, status.variasiMode]);

  // --- 5. INTERFACE ACTION HANDLERS ---

  // Triggered when manual relay click is fired
  const handleToggleRelay = async (id: number, targetState: boolean): Promise<void> => {
    const actor: ActivityLog['source'] = 'Web Dashboard';
    const stateStr = targetState ? 'on' : 'off';
    const stateVisual = targetState ? 'NYALA' : 'MATI';

    // Update locally instantly for maximum responsiveness
    const updatedRelays = relays.map((r) => (r.id === id ? { ...r, isOn: targetState } : r));
    
    // Changing standard relay manually stops variations in ESP32 logic
    const nextStatus = {
      ...status,
      variasiMode: 0,
    };

    if (status.isSimulated) {
      setRelays(updatedRelays);
      setStatus(nextStatus);
      addLogEntry(`Lampu ${id} diubah menjadi ${targetState ? 'NYALA' : 'MATI'}.`, actor, 'relay', `Relay CH${id} set GPIO to ${targetState ? 'LOW' : 'HIGH'}`);
      if (status.variasiMode > 0) {
        addLogEntry('Variasi dihentikan otomatis karena perubahan manual.', 'Web Dashboard', 'variasi');
      }
      showAlert(`Lampu ${id} berhasil di-${stateStr}!`);
      return;
    }

    // Hardware IoT call
    try {
      await espRequest(`/relay?id=${id}&state=${stateStr}`);
      setRelays(updatedRelays);
      setStatus(nextStatus);
      addLogEntry(`Lampu ${id} diubah menjadi ${targetState ? 'NYALA' : 'MATI'} via dashboard.`, actor, 'relay', `Endpoint GET /relay?id=${id}&state=${stateStr} sukses!`);
      showAlert(`Lampu ${id} berhasil di-${stateStr}!`);
    } catch (err: any) {
      console.error(err);
      showAlert(`Gagal mengubah Lampu ${id}. Periksa rute IP!`, 'error');
      addLogEntry(`Gagal merubah Lampu ${id}: Terputus dari hardware.`, 'Web Dashboard', 'system', err.message);
    }
  };

  // Triggered when toggle all is fired
  const handleToggleAll = async (targetState: boolean): Promise<void> => {
    const stateStr = targetState ? 'on' : 'off';
    const verbalState = targetState ? 'DINYALAKAN' : 'DIMATIKAN';

    const updatedRelays = relays.map((r) => ({ ...r, isOn: targetState }));
    const nextStatus = { ...status, variasiMode: 0 };

    if (status.isSimulated) {
      setRelays(updatedRelays);
      setStatus(nextStatus);
      addLogEntry(`Semua Lampu ${verbalState} serentak.`, 'Web Dashboard', 'relay');
      showAlert(`Semua lampu berhasil ${targetState ? 'dinyalakan' : 'dimatikan'}!`);
      return;
    }

    try {
      await espRequest(`/all?state=${stateStr}`);
      setRelays(updatedRelays);
      setStatus(nextStatus);
      addLogEntry(`Semua Lampu ${verbalState} serentak via dashboard.`, 'Web Dashboard', 'relay', `Endpoint GET /all?state=${stateStr} sukses!`);
      showAlert(`Semua lampu berhasil ${targetState ? 'dinyalakan' : 'dimatikan'}!`, 'success');
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal mengubah semua lampu serentak.', 'error');
    }
  };

  // Triggered when Variasi mode is selected
  const handleChangeVariasi = async (mode: number): Promise<void> => {
    if (status.isSimulated) {
      setStatus(prev => ({ ...prev, variasiMode: mode }));
      addLogEntry(`Mode Variasi ${mode} diaktifkan. Pola kedip berjalan.`, 'Web Dashboard', 'variasi');
      showAlert(`Variasi ${mode} berhasil diaktifkan!`);
      return;
    }

    try {
      await espRequest(`/variasi?mode=${mode}`);
      setStatus(prev => ({ ...prev, variasiMode: mode }));
      addLogEntry(`Mode Variasi ${mode} diaktifkan via dashboard.`, 'Web Dashboard', 'variasi', `Endpoint GET /variasi?mode=${mode} dipanggil!`);
      showAlert(`Variasi ${mode} berhasil diaktifkan!`, 'success');
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal mengaktifkan mode variasi.', 'error');
    }
  };

  // Triggered when Stop variasi is clicked
  const handleStopVariasi = async (): Promise<void> => {
    const updatedRelays = relays.map((r) => ({ ...r, isOn: false }));
    const nextStatus = { ...status, variasiMode: 0 };

    if (status.isSimulated) {
      setRelays(updatedRelays);
      setStatus(nextStatus);
      addLogEntry('Modus variasi dihentikan. Semua lampu dimatikan.', 'Web Dashboard', 'variasi');
      showAlert('Pola variasi berhasil dihentikan!');
      return;
    }

    try {
      await espRequest('/stop');
      setRelays(updatedRelays);
      setStatus(nextStatus);
      addLogEntry('Modus variasi dihentikan via dashboard.', 'Web Dashboard', 'variasi', 'Endpoint GET /stop sukses dipanggil!');
      showAlert('Pola variasi berhasil dihentikan!', 'success');
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal mematikan mode variasi.', 'error');
    }
  };

  // Triggered on local voice command matching
  const handleVoiceCommand = async (
    rawText: string,
    action: { type: 'relay' | 'all' | 'variasi' | 'stop'; id?: number; state?: boolean; mode?: number }
  ) => {
    if (action.type === 'relay' && action.id && action.state !== undefined) {
      const stateStr = action.state ? 'on' : 'off';
      const updatedRelays = relays.map((r) => (r.id === action.id ? { ...r, isOn: action.state! } : r));
      const nextStatus = { ...status, variasiMode: 0 };

      if (status.isSimulated) {
        setRelays(updatedRelays);
        setStatus(nextStatus);
        addLogEntry(`[Voice Match] Terbaca: "${rawText}" -> Mengubah Lampu ${action.id} ke ${action.state ? 'NYALA' : 'MATI'}`, 'Voice Command', 'relay');
        showAlert(`Lampu ${action.id} di-${stateStr} via Suara!`);
        return;
      }

      try {
        await espRequest(`/relay?id=${action.id}&state=${stateStr}`);
        setRelays(updatedRelays);
        setStatus(nextStatus);
        addLogEntry(`[Voice Match] Terbaca: "${rawText}" -> Lampu ${action.id} diubah ke ${action.state ? 'NYALA' : 'MATI'}`, 'Voice Command', 'relay');
        showAlert(`Lampu ${action.id} di-${stateStr} via Suara!`);
      } catch {
        showAlert('Sambungan ESP32 gagal pada perintah suara', 'error');
      }
    } 
    else if (action.type === 'all' && action.state !== undefined) {
      const stateStr = action.state ? 'on' : 'off';
      const verbalState = action.state ? 'DINYALAKAN' : 'DIMATIKAN';
      const updatedRelays = relays.map((r) => ({ ...r, isOn: action.state! }));
      const nextStatus = { ...status, variasiMode: 0 };

      if (status.isSimulated) {
        setRelays(updatedRelays);
        setStatus(nextStatus);
        addLogEntry(`[Voice Match] Terbaca: "${rawText}" -> Semua Lampu ${verbalState}`, 'Voice Command', 'relay');
        showAlert(`Semua lampu ${verbalState.toLowerCase()} via suara!`);
        return;
      }

      try {
        await espRequest(`/all?state=${stateStr}`);
        setRelays(updatedRelays);
        setStatus(nextStatus);
        addLogEntry(`[Voice Match] Terbaca: "${rawText}" -> Semua Lampu ${verbalState}`, 'Voice Command', 'relay');
        showAlert(`Semua lampu ${verbalState.toLowerCase()} via suara!`);
      } catch {
        showAlert('Sambungan ESP32 gagal pada perintah suara', 'error');
      }
    } 
    else if (action.type === 'variasi' && action.mode !== undefined) {
      if (status.isSimulated) {
        setStatus(prev => ({ ...prev, variasiMode: action.mode! }));
        addLogEntry(`[Voice Match] Terbaca: "${rawText}" -> Mengaktifkan Variasi ${action.mode}`, 'Voice Command', 'variasi');
        showAlert(`Variasi ${action.mode} aktif via suara!`);
        return;
      }

      try {
        await espRequest(`/variasi?mode=${action.mode}`);
        setStatus(prev => ({ ...prev, variasiMode: action.mode! }));
        addLogEntry(`[Voice Match] Terbaca: "${rawText}" -> Mengaktifkan Variasi ${action.mode}`, 'Voice Command', 'variasi');
        showAlert(`Variasi ${action.mode} aktif via suara!`);
      } catch {
        showAlert('Sambungan ESP32 gagal pada perintah suara', 'error');
      }
    } 
    else if (action.type === 'stop') {
      const updatedRelays = relays.map((r) => ({ ...r, isOn: false }));
      const nextStatus = { ...status, variasiMode: 0 };

      if (status.isSimulated) {
        setRelays(updatedRelays);
        setStatus(nextStatus);
        addLogEntry(`[Voice Match] Terbaca: "${rawText}" -> Menghentikan Pola Variast`, 'Voice Command', 'variasi');
        showAlert('Pola dihentikan via suara!');
        return;
      }

      try {
        await espRequest('/stop');
        setRelays(updatedRelays);
        setStatus(nextStatus);
        addLogEntry(`[Voice Match] Terbaca: "${rawText}" -> Menghentikan Pola Variasi`, 'Voice Command', 'variasi');
        showAlert('Pola dihentikan via suara!');
      } catch {
        showAlert('Sambungan ESP32 gagal pada perintah suara', 'error');
      }
    }
  };

  // Helper tester to verify connection physically
  const handleTestConnection = async (): Promise<boolean> => {
    try {
      const working = await handleSyncData();
      if (working) {
        addLogEntry(`Tes Ping Koneksi Sukses! Terbaca node IP: ${status.ipAddress}`, 'Web Dashboard', 'system');
        showAlert('Koneksi ke ESP32 Berhasil Terverifikasi!', 'success');
        return true;
      } else {
        throw new Error('Endpoint /sync mengembalikan data kosong atau server putus.');
      }
    } catch (err: any) {
      addLogEntry(`Tes Ping Koneksi Gagal di IP: ${status.ipAddress}`, 'Web Dashboard', 'system', err.message);
      showAlert('Uji koneksi gagal! Silakan buka bantuan setelan.', 'error');
      return false;
    }
  };

  // Trigger toggling IP Settings screen
  const handleOpenSettings = () => {
    const section = document.getElementById('esp32-config-card');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      section.classList.add('ring-2', 'ring-primary', 'duration-300');
      setTimeout(() => section.classList.remove('ring-2', 'ring-primary'), 2000);
    }
  };

  // Toggle Playground mode directly
  const handleTogglePlayground = () => {
    const isSimState = !status.isSimulated;
    setStatus(prev => ({ ...prev, isSimulated: isSimState }));
    addLogEntry(
      `Sistem beralih ke mode ${isSimState ? 'Simulasi (Demo)' : 'Hardware Real IP'}`,
      'Web Dashboard',
      'system'
    );
    showAlert(`Beralih ke Mode ${isSimState ? 'Simulasi' : 'Hardware ESP32'}!`);
  };

  // Clear all log stacks
  const handleClearLogs = () => {
    setLogs([]);
    showAlert('Semua log aktivitas telah dibersihkan!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-12 select-none">
      <Navbar 
        status={status} 
        onOpenSettings={handleOpenSettings} 
        onTogglePlayground={handleTogglePlayground} 
      />

      {/* Dynamic Pop-Up Alerts */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 pointer-events-none"
          >
            <div className={`shadow-lg rounded-xl px-4 py-3 border text-xs font-semibold text-slate-800 flex items-center gap-2 ${
              alertMsg.type === 'success' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : alertMsg.type === 'warning' 
                ? 'bg-amber-50 border-amber-300 text-amber-800' 
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                alertMsg.type === 'success' ? 'bg-emerald-500' : alertMsg.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span>{alertMsg.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        
        {/* Connection Notice Header of Demo mode */}
        {status.isSimulated && (
          <div className="mb-6 p-4 rounded-2xl bg-[linear-gradient(135deg,#6D5EF5,#5849df)] text-white shadow-md shadow-primary/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Cpu className="w-5 h-5 animate-pulse" />
                Aplikasi Berjalan dalam Mode Simulasi Aktif
              </h2>
              <p className="text-xs text-primary-light max-w-2xl leading-relaxed">
                Hardware ESP32 fisik sedang disimulasikan. Anda dapat secara leluasa melatih perintah suara, menyalakan saklar,
                atau mengaktifkan kedipan variasi. Matikan mode simulasi pada tombol di atas jika ingin menyambungkannya ke board ESP32 Anda!
              </p>
            </div>
            <button
              onClick={handleTogglePlayground}
              className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-xl shadow-xs hover:bg-slate-100 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Sambungkan ESP32 Fisik
            </button>
          </div>
        )}

        {/* Dashboard Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Action area: 2 Columns Wide */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            
            {/* Relays switch board */}
            <RelayControl 
              relays={relays} 
              variasiRunning={status.variasiMode > 0} 
              onToggleRelay={handleToggleRelay} 
              onToggleAll={handleToggleAll} 
            />

            {/* Variasi modes widget */}
            <VariasiControl 
              currentMode={status.variasiMode} 
              onChangeVariasi={handleChangeVariasi} 
              onStop={handleStopVariasi} 
            />

            {/* Live DHT11 Sensor Displays */}
            <DHTSensorCard 
              currentData={sensor} 
              historicalData={sensorHistory} 
            />

          </div>

          {/* Configs, Logs and Voice controller: 1 Column Wide */}
          <div className="space-y-6">
            
            {/* ESP32 Config Bar */}
            <ESP32Config 
              status={status} 
              onUpdateConfig={(ip, isSimulated) => {
                setStatus(prev => ({ ...prev, ipAddress: ip, isSimulated }));
                showAlert('Konfigurasi berhasil disimpan!');
                addLogEntry(`IP Address diperbarui menjadi '${ip}'`, 'Web Dashboard', 'system');
              }} 
              onTestConnection={handleTestConnection}
            />

            {/* Web Voice Commands input wrapper */}
            <VoiceCommand 
              onVoiceCommandTriggered={handleVoiceCommand} 
            />

            {/* Activities Logs */}
            <ActivityLogComponent 
              logs={logs} 
              onClearLogs={handleClearLogs} 
            />

          </div>

        </div>

        {/* Footer info map */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400 space-y-1.5">
          <p className="font-medium">⚡ ESP32 & Web Integration Dashboard • IoT Solutions ⚡</p>
          <p className="leading-relaxed">
            Terintegrasi dengan FreeRTOS Telegram Polling di Core 0 dan Asynchronous Service WebServer di Core 1.<br />
            Gunakan warna aksen <span className="font-mono text-primary font-bold">#6D5EF5</span> • Menggunakan browser Microphone Local Voice SDK.
          </p>
        </footer>

      </main>
    </div>
  );
}
