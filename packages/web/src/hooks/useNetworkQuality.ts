import { useState, useEffect } from 'react';
import {
  connectionMonitor,
  getQualitySettings,
  ConnectionQuality,
  QualitySettings,
} from '../services/networkOptimizer';

interface UseNetworkQualityReturn {
  quality: ConnectionQuality;
  isOnline: boolean;
  downlinkMbps: number;
  rtt: number;
  saveData: boolean;
  settings: QualitySettings;
}

export function useNetworkQuality(): UseNetworkQualityReturn {
  const [info, setInfo] = useState(connectionMonitor.info);

  useEffect(() => {
    const unsubscribe = connectionMonitor.onChange((newInfo) => {
      setInfo(newInfo);
    });
    return unsubscribe;
  }, []);

  const settings = getQualitySettings(info.quality, info.saveData);

  return {
    quality: info.quality,
    isOnline: info.quality !== 'offline',
    downlinkMbps: info.downlinkMbps,
    rtt: info.rtt,
    saveData: info.saveData,
    settings,
  };
}
