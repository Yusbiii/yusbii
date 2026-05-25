export interface RelayState {
  id: number;
  name: string;
  isOn: boolean;
  pin: number;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

export interface SystemStatus {
  ipAddress: string;
  isSimulated: boolean;
  isConnected: boolean;
  variasiMode: number; // 0 = none, 1 = running light, 2 = bolak balik
}

export type LogSource = 'Web Dashboard' | 'Telegram Bot' | 'Voice Command' | 'System Sync';
export type LogType = 'relay' | 'variasi' | 'sensor' | 'system';

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  source: LogSource;
  type: LogType;
  details?: string;
}
