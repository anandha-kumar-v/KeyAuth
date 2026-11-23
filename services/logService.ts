import { SuspiciousLogEntry } from '../types';

const LOG_KEY = 'aegis_auth_suspicious_logs';

const getLogs = (): SuspiciousLogEntry[] => {
  const logsJson = localStorage.getItem(LOG_KEY);
  return logsJson ? JSON.parse(logsJson) : [];
};

const saveLogs = (logs: SuspiciousLogEntry[]): void => {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
};

export const logService = {
  addLog: (entry: SuspiciousLogEntry): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const logs = getLogs();
        // Add the new entry to the beginning of the array
        logs.unshift(entry); 
        saveLogs(logs);
        resolve();
      }, 100);
    });
  },

  getLogs: (): Promise<SuspiciousLogEntry[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getLogs());
      }, 200);
    });
  },
};
