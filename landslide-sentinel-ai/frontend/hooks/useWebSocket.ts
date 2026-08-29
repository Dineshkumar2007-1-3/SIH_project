import { useWebSocket } from '../lib/websocket';
import { useEffect, useState } from 'react';

export const usePredictionsWS = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const { isConnected, sendMessage } = useWebSocket((message) => {
    if (message.type === 'prediction') {
      setPredictions(prev => [message.data, ...prev.slice(0, 49)]); // Keep last 50
    }
  });

  useEffect(() => {
    // Request initial data if needed
    // This would typically be handled by the regular API hook
  }, []);

  return { predictions, isConnected, sendMessage };
};

export const useAlertsWS = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const { isConnected, sendMessage } = useWebSocket((message) => {
    if (message.type === 'alert') {
      if (message.data.is_resolved === 0) {
        // Add new active alert
        setAlerts(prev => [message.data, ...prev.filter(a => a.id !== message.data.id)]);
      } else {
        // Remove resolved alert
        setAlerts(prev => prev.filter(a => a.id !== message.data.id));
      }
    }
  });

  return { alerts, isConnected, sendMessage };
};

export const useReportsWS = () => {
  const [reports, setReports] = useState<any[]>([]);
  const { isConnected, sendMessage } = useWebSocket((message) => {
    if (message.type === 'report') {
      setReports(prev => [message.data, ...prev]);
    }
  });

  return { reports, isConnected, sendMessage };
};