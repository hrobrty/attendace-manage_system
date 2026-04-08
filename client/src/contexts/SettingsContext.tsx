import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import type { SystemSettings, ApiResponse } from '../types';

interface SettingsContextType {
  settings: SystemSettings;
  isLoaded: boolean;
  refresh: () => Promise<void>;
  get: (key: string, defaultValue?: string) => string;
  getBool: (key: string, defaultValue?: boolean) => boolean;
  getNumber: (key: string, defaultValue?: number) => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = async () => {
    try {
      const { data } = await api.get<ApiResponse<SystemSettings>>('/settings/public');
      setSettings(data.data);
      setIsLoaded(true);
    } catch {
      console.warn('[Settings] 加载失败');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) refresh();
  }, []);

  const get = (key: string, defaultValue = '') => settings[key] ?? defaultValue;
  const getBool = (key: string, defaultValue = false) => {
    const val = settings[key];
    return val !== undefined ? val === 'true' || val === '1' : defaultValue;
  };
  const getNumber = (key: string, defaultValue = 0) => {
    const val = settings[key];
    if (val === undefined) return defaultValue;
    const num = parseFloat(val);
    return isNaN(num) ? defaultValue : num;
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, refresh, get, getBool, getNumber }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings 必须在 SettingsProvider 内使用');
  return ctx;
}
