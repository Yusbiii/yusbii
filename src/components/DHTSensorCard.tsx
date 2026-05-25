import { useState, useEffect } from 'react';
import { Thermometer, Droplets, TrendingUp, Compass, Sun, Wind } from 'lucide-react';
import { SensorData } from '../types';

interface DHTSensorCardProps {
  currentData: SensorData;
  historicalData: SensorData[];
}

export default function DHTSensorCard({ currentData, historicalData }: DHTSensorCardProps) {
  // Calculate comfort index based on Indonesian weather comfort levels
  const getComfortStatus = (temp: number, hum: number) => {
    if (temp === 0 && hum === 0) return { text: "Menunggu data...", color: "text-slate-400 border-slate-200 bg-slate-50" };
    
    if (temp > 32) {
      return { text: "Sangat Panas (Butuh Pendingin!)", color: "text-red-700 border-red-200 bg-red-50" };
    }
    if (temp < 22) {
      return { text: "Suhu Dingin", color: "text-blue-700 border-blue-200 bg-blue-50" };
    }
    // Comfort is usually 24-28 °C and 40-60% humidity
    if (temp >= 23 && temp <= 29) {
      if (hum >= 40 && hum <= 70) {
        return { text: "Ideal & Sangat Nyaman 🍃", color: "text-emerald-700 border-emerald-200 bg-emerald-50/70" };
      }
      return { text: "Suhu Nyaman, Kelembapan Kurang Ideal", color: "text-amber-700 border-amber-200 bg-amber-50" };
    }
    return { text: "Lingkungan Cukup Hangat", color: "text-amber-700 border-amber-200 bg-amber-50" };
  };

  const comfort = getComfortStatus(currentData.temperature, currentData.humidity);

  // Generate SVG points for sparkline historical graph
  const getSvgPoints = (dataList: SensorData[], key: 'temperature' | 'humidity', width: number, height: number) => {
    if (dataList.length < 2) return '';
    const slice = dataList.slice(-15); // Show last 15 ticks
    const values = slice.map(d => d[key]);
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const range = max - min || 1;

    return slice.map((d, index) => {
      const x = (index / (slice.length - 1)) * width;
      const y = height - ((d[key] - min) / range) * (height - 10) - 5;
      return `${x},${y}`;
    }).join(' ');
  };

  const tempPoints = getSvgPoints(historicalData, 'temperature', 280, 50);
  const humPoints = getSvgPoints(historicalData, 'humidity', 280, 50);

  return (
    <div id="dht-sensor-dashboard" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-primary rotate-12" />
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Sensor DHT11 (Live)</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-primary">Live Sync</span>
        </div>
      </div>

      {/* Comfort Index Status bar */}
      <div className={`mb-6 p-3.5 rounded-2xl border text-center text-xs font-semibold ${comfort.color} transition-all`}>
        Indeks Kenyamanan Ruangan: <span className="underline decoration-wavy underline-offset-2">{comfort.text}</span>
      </div>

      {/* Main Display Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Temperature Card with Gauge UI */}
        <div className="p-5 rounded-3xl border border-slate-100 bg-[#F8F9FF] flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 self-start">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Suhu Ruangan</span>
          </span>

          <div className="relative w-32 h-32 flex items-center justify-center mb-2">
            {/* SVG circle gauge */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="50"
                className="stroke-slate-200 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r="50"
                className="stroke-primary fill-none transition-all duration-1000"
                strokeWidth="8"
                strokeDasharray="314.16"
                // Max temp 50
                strokeDashoffset={314.16 - (314.16 * Math.min(Math.max(currentData.temperature, 0), 50)) / 50}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                {currentData.temperature.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-slate-400 italic">°C</span>
            </div>
          </div>

          <div className="w-full mt-2 text-center text-[10px] text-slate-400 font-mono">
            Rentang Suhu ESP11: 0°C s/d 50°C
          </div>

          {/* Mini Chart Temp */}
          {historicalData.length >= 2 && (
            <div className="w-full mt-4 pt-4 border-t border-slate-200/50">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-primary" /> Tren Suhu</span>
                <span>{historicalData.slice(-15).length} poin data</span>
              </div>
              <svg className="w-full h-12 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#6D5EF5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={tempPoints}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Humidity Card with Gauge UI */}
        <div className="p-5 rounded-3xl border border-slate-100 bg-[#F8F9FF] flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 self-start">
            <Droplets className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Kelembapan Udara</span>
          </span>

          <div className="relative w-32 h-32 flex items-center justify-center mb-2">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="50"
                className="stroke-slate-200 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r="50"
                className="stroke-blue-500 fill-none transition-all duration-1000"
                strokeWidth="8"
                strokeDasharray="314.16"
                strokeDashoffset={314.16 - (314.16 * Math.min(Math.max(currentData.humidity, 0), 100)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                {currentData.humidity.toFixed(0)}
              </span>
              <span className="text-lg font-bold text-slate-400 italic">%</span>
            </div>
          </div>

          <div className="w-full mt-2 text-center text-[10px] text-slate-400 font-mono">
            Rentang Lembap ESP11: 20% s/d 90%
          </div>

          {/* Mini Chart Hum */}
          {historicalData.length >= 2 && (
            <div className="w-full mt-4 pt-4 border-t border-slate-200/50">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-mono">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-blue-500" /> Tren Lembap</span>
                <span>{historicalData.slice(-15).length} poin data</span>
              </div>
              <svg className="w-full h-12 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={humPoints}
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Extra Sensor Specs Info */}
      <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span>Spesifikasi Board dht11:</span>
        </div>
        <div className="font-mono flex gap-3 text-[10px]">
          <span>📍 Pin: <strong className="text-slate-800">GPIO 4</strong></span>
          <span>⚡ Akurasi: <strong className="text-slate-800">±2°C / 5%</strong></span>
        </div>
      </div>
    </div>
  );
}
