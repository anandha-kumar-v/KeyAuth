
import { useState, useCallback, useRef, useEffect } from 'react';
import { KeystrokeEvent, KeystrokeSignature } from '../types';

const KEYSTROKE_SIMILARITY_THRESHOLD = 0.25; // 25% tolerance

export const useKeystrokeDynamics = () => {
  const [isRecording, setIsRecording] = useState(false);
  const eventsRef = useRef<KeystrokeEvent[]>([]);
  const pressTimeRef = useRef<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const startRecording = useCallback(() => {
    eventsRef.current = [];
    pressTimeRef.current = {};
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;
    // Prevent recording multiple press times for a held key
    if (!pressTimeRef.current[e.key]) {
      pressTimeRef.current[e.key] = Date.now();
    }
  }, [isRecording]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isRecording || !pressTimeRef.current[e.key]) return;

    const pressTime = pressTimeRef.current[e.key];
    const releaseTime = Date.now();
    
    eventsRef.current.push({
      key: e.key,
      pressTime,
      releaseTime,
    });

    // Clear the press time for this key to allow re-pressing it
    delete pressTimeRef.current[e.key];

  }, [isRecording]);

  useEffect(() => {
    const inputElement = inputRef.current;
    if (inputElement) {
        inputElement.addEventListener('keydown', handleKeyDown);
        inputElement.addEventListener('keyup', handleKeyUp);

        return () => {
            inputElement.removeEventListener('keydown', handleKeyDown);
            inputElement.removeEventListener('keyup', handleKeyUp);
        };
    }
  }, [inputRef, handleKeyDown, handleKeyUp]);


  const calculateSignature = useCallback((): KeystrokeSignature | null => {
    const events = eventsRef.current;
    if (events.length < 2) return null;

    let totalDwellTime = 0;
    let totalFlightTime = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      totalDwellTime += event.releaseTime - event.pressTime;

      if (i > 0) {
        const prevEvent = events[i - 1];
        totalFlightTime += event.pressTime - prevEvent.releaseTime;
      }
    }

    const totalTime = events[events.length - 1].releaseTime - events[0].pressTime;
    
    return {
      avgDwellTime: totalDwellTime / events.length,
      avgFlightTime: totalFlightTime / (events.length - 1),
      totalTime: totalTime,
    };
  }, []);

  const compareSignatures = useCallback((sig1: KeystrokeSignature, sig2: KeystrokeSignature): boolean => {
      const dwellDiff = Math.abs(sig1.avgDwellTime - sig2.avgDwellTime) / sig1.avgDwellTime;
      const flightDiff = Math.abs(sig1.avgFlightTime - sig2.avgFlightTime) / sig1.avgFlightTime;
      const totalDiff = Math.abs(sig1.totalTime - sig2.totalTime) / sig1.totalTime;

      const averageDifference = (dwellDiff + flightDiff + totalDiff) / 3;
      
      console.log(`Keystroke Dynamics Difference: ${(averageDifference * 100).toFixed(2)}%`);

      return averageDifference <= KEYSTROKE_SIMILARITY_THRESHOLD;
  }, []);

  return {
    inputRef,
    startRecording,
    stopRecording,
    calculateSignature,
    compareSignatures,
    isRecording,
  };
};
