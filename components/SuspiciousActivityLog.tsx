import React, { useState, useEffect } from 'react';
import { SuspiciousLogEntry } from '../types';
import { logService } from '../services/logService';
import { Spinner, ShieldExclamationIcon } from './common/Icons';

export const SuspiciousActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<SuspiciousLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      const allLogs = await logService.getLogs();
      setLogs(allLogs);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
    {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="Captured evidence" className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"/>
        </div>
    )}
    <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-4">
        <ShieldExclamationIcon className="w-6 h-6 text-red-400" />
        <h3 className="text-xl font-semibold text-red-300">Suspicious Activity Log</h3>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner className="w-12 h-12 text-cyan-400" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <ShieldExclamationIcon className="w-16 h-16 text-gray-600 mb-4" />
            <h4 className="font-bold text-lg">No Suspicious Activity Detected</h4>
            <p className="text-sm">Follow the demo guide on the login page to trigger a security event.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => (
              <li key={log.timestamp} className="bg-gray-700/50 p-3 rounded-md flex items-start space-x-4">
                <img 
                    src={log.capturedPhotoUrl} 
                    alt={`Capture for ${log.username}`} 
                    className="w-16 h-16 rounded-md object-cover border-2 border-red-900 cursor-pointer hover:border-red-500 transition-colors"
                    onClick={() => setSelectedImage(log.capturedPhotoUrl)}
                />
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    Login attempt for: <span className="text-yellow-400">{log.username}</span>
                  </p>
                  <p className="text-sm text-red-300 mt-1">
                    <span className="font-bold">Reason:</span> {log.reason}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(log.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </>
  );
};
