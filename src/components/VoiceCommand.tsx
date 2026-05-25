import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, CornerDownRight, AlertCircle, Info, Volume2, ShieldAlert } from 'lucide-react';
import { LogSource } from '../types';

interface VoiceCommandProps {
  onVoiceCommandTriggered: (
    commandText: string,
    action: { type: 'relay' | 'all' | 'variasi' | 'stop'; id?: number; state?: boolean; mode?: number }
  ) => void;
}

export default function VoiceCommand({ onVoiceCommandTriggered }: VoiceCommandProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [matchedCommand, setMatchedCommand] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // Stop listening after one phrase
    rec.interimResults = false; // Only final results
    rec.lang = 'id-ID'; // Indonesian voice command parsing

    rec.onstart = () => {
      setIsListening(true);
      setMicError(null);
      setTranscript('Mendengarkan suara Anda...');
      setMatchedCommand(null);
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      parseVoiceCommand(resultText);
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      if (event.error === 'not-allowed') {
        setMicError('Izin mikrofon ditolak. Klik ikon gembok di browser untuk memberi izin.');
      } else {
        setMicError(`Gagal mengenali suara: ${event.error}`);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, []);

  const speakConfirmation = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel outstanding synthesis first
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const parseVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    let actionTriggered = false;

    // Command parser matching Arduino logic parameters
    const onWords = ['nyala', 'hidup', 'on', 'aktif'];
    const offWords = ['mati', 'off', 'stop', 'berhenti', 'padam'];

    const hasOn = onWords.some(w => text.includes(w));
    const hasOff = offWords.some(w => text.includes(w));

    if (hasOn) {
      // Check variety variations
      if (text.includes('variasi 1') || text.includes('variasi satu')) {
        onVoiceCommandTriggered(rawText, { type: 'variasi', mode: 1 });
        setMatchedCommand('Mengaktifkan Lampu Variasi 1');
        speakConfirmation('Variasi satu diaktifkan.');
        actionTriggered = true;
      } else if (text.includes('variasi 2') || text.includes('variasi dua')) {
        onVoiceCommandTriggered(rawText, { type: 'variasi', mode: 2 });
        setMatchedCommand('Mengaktifkan Lampu Variasi 2');
        speakConfirmation('Variasi dua diaktifkan.');
        actionTriggered = true;
      } else if (text.includes('semua') || text.includes('seluruh')) {
        onVoiceCommandTriggered(rawText, { type: 'all', state: true });
        setMatchedCommand('Menyalakan Semua Lampu');
        speakConfirmation('Seluruh lampu dinyalakan.');
        actionTriggered = true;
      } else if (text.includes('satu') || text.includes(' 1')) {
        onVoiceCommandTriggered(rawText, { type: 'relay', id: 1, state: true });
        setMatchedCommand('Menyalakan Lampu 1');
        speakConfirmation('Lampu satu dinyalakan.');
        actionTriggered = true;
      } else if (text.includes('dua') || text.includes(' 2')) {
        onVoiceCommandTriggered(rawText, { type: 'relay', id: 2, state: true });
        setMatchedCommand('Menyalakan Lampu 2');
        speakConfirmation('Lampu dua dinyalakan.');
        actionTriggered = true;
      } else if (text.includes('tiga') || text.includes(' 3')) {
        onVoiceCommandTriggered(rawText, { type: 'relay', id: 3, state: true });
        setMatchedCommand('Menyalakan Lampu 3');
        speakConfirmation('Lampu tiga dinyalakan.');
        actionTriggered = true;
      } else if (text.includes('empat') || text.includes(' 4')) {
        onVoiceCommandTriggered(rawText, { type: 'relay', id: 4, state: true });
        setMatchedCommand('Menyalakan Lampu 4');
        speakConfirmation('Lampu empat dinyalakan.');
        actionTriggered = true;
      }
    } else if (hasOff) {
      if (text.includes('variasi') || text.includes('kedip')) {
        onVoiceCommandTriggered(rawText, { type: 'stop' });
        setMatchedCommand('Menghentikan Pola Variasi');
        speakConfirmation('Pola variasi dihentikan.');
        actionTriggered = true;
      } else if (text.includes('semua') || text.includes('seluruh')) {
        onVoiceCommandTriggered(rawText, { type: 'all', state: false });
        setMatchedCommand('Mematikan Semua Lampu');
        speakConfirmation('Seluruh lampu dimatikan.');
        actionTriggered = true;
      } else if (text.includes('satu') || text.includes(' 1')) {
        onVoiceCommandTriggered(rawText, { type: 'relay', id: 1, state: false });
        setMatchedCommand('Mematikan Lampu 1');
        speakConfirmation('Lampu satu dimatikan.');
        actionTriggered = true;
      } else if (text.includes('dua') || text.includes(' 2')) {
        onVoiceCommandTriggered(rawText, { type: 'relay', id: 2, state: false });
        setMatchedCommand('Mematikan Lampu 2');
        speakConfirmation('Lampu dua dimatikan.');
        actionTriggered = true;
      } else if (text.includes('tiga') || text.includes(' 3')) {
        onVoiceCommandTriggered(rawText, { type: 'relay', id: 3, state: false });
        setMatchedCommand('Mematikan Lampu 3');
        speakConfirmation('Lampu tiga dimatikan.');
        actionTriggered = true;
      } else if (text.includes('empat') || text.includes(' 4')) {
        onVoiceCommandTriggered(rawText, { type: 'relay', id: 4, state: false });
        setMatchedCommand('Mematikan Lampu 4');
        speakConfirmation('Lampu empat dimatikan.');
        actionTriggered = true;
      }
    }

    if (!actionTriggered) {
      // Fallback stop word for general stopping or resetting
      if (text.includes('stop') || text.includes('berhenti') || text.includes('matikan')) {
        onVoiceCommandTriggered(rawText, { type: 'stop' });
        setMatchedCommand('Sistem Berhenti / Padam Total');
        speakConfirmation('Semua sistem dihentikan.');
      } else {
        setMatchedCommand('Perintah suara tidak dikenali. Silakan coba lagi.');
        speakConfirmation('Maaf, perintah kurang jelas.');
      }
    }
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-amber-500 mb-2 font-bold text-sm uppercase tracking-wide">
          <AlertCircle className="w-5 h-5 animate-pulse" />
          <span>Voice Control Unassisted</span>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          Uji fitur kontrol suara menggunakan browser berbasis Chromium seperti Google Chrome, Microsoft Edge, atau Opera.
        </p>
      </div>
    );
  }

  return (
    <div id="voice-control-card" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-[#6D5EF5]" />
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Voice Control</h2>
        </div>
        <span className="text-[10px] font-mono bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full text-slate-400 font-bold uppercase">LOKAL SDK</span>
      </div>

      <div className="flex flex-col items-center justify-center p-5 bg-[#F8F9FF] border border-slate-100 rounded-2xl mb-5 text-center">
        {/* Active Microphone toggle button */}
        <button
          onClick={toggleListen}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse-ring scale-110 shadow-lg shadow-rose-500/25'
              : 'bg-[#6D5EF5] text-white hover:opacity-90 shadow-lg shadow-[#6D5EF5]/30 hover:scale-105'
          }`}
          title={isListening ? 'Klik untuk berhenti mendengar' : 'Klik untuk mulai bicara'}
        >
          {isListening ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
        </button>

        <span className="text-xs font-bold text-slate-600 mt-4">
          {isListening ? '🎙️ Silakan Bicara...' : 'Klik Mic & ucapkan perintah'}
        </span>

        {/* Real-time speech result text bubble */}
        {transcript && (
          <div className="mt-4 px-3.5 py-2.5 bg-white rounded-xl border border-slate-100/80 max-w-xs text-xs italic font-medium text-slate-500 relative shadow-xs">
            &quot;{transcript}&quot;
          </div>
        )}

        {/* Matching status */}
        {matchedCommand && (
          <div className={`mt-3 flex items-center gap-1.5 text-xs font-bold ${matchedCommand.includes('tidak dikenali') ? 'text-amber-500' : 'text-[#6D5EF5]'}`}>
            <CornerDownRight className="w-4 h-4" />
            <span>{matchedCommand}</span>
          </div>
        )}

        {/* Error notifications */}
        {micError && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 inline-flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <ShieldAlert className="w-4 h-4" />
            <span>{micError}</span>
          </div>
        )}
      </div>

      {/* Cheatsheet grid */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4 text-[#6D5EF5]" />
          <span>Panduan Pengucapan</span>
        </span>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-medium">
          <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl">
            <span className="text-[#6D5EF5] font-bold text-[10.5px]">Nyalakan Lampu</span>
            <p className="text-slate-700 italic mt-1 font-semibold">&quot;Nyalakan lampu satu&quot;</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">Pilihan: satu s/d empat</p>
          </div>

          <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl">
            <span className="text-[#6D5EF5] font-bold text-[10.5px]">Matikan Lampu</span>
            <p className="text-slate-700 italic mt-1 font-semibold">&quot;Matikan lampu dua&quot;</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">Pilihan: satu s/d empat</p>
          </div>

          <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl">
            <span className="text-[#6D5EF5] font-bold text-[10.5px]">Semua Lampu</span>
            <p className="text-slate-700 italic mt-1 font-semibold">&quot;Nyalakan semua&quot;</p>
            <p className="text-slate-700 italic font-semibold">&quot;Matikan semua&quot;</p>
          </div>

          <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl">
            <span className="text-[#6D5EF5] font-bold text-[10.5px]">Kedip Variasi</span>
            <p className="text-slate-700 italic mt-1 font-semibold">&quot;Nyalakan variasi 1&quot;</p>
            <p className="text-slate-700 italic font-semibold">&quot;Stop variasi&quot;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
