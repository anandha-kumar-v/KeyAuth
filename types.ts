
export enum Page {
  Login,
  Register,
  RealDashboard,
  HoneypotDashboard,
}

export interface KeystrokeEvent {
  key: string;
  pressTime: number;
  releaseTime: number;
}

export interface KeystrokeSignature {
  avgDwellTime: number;
  avgFlightTime: number;
  totalTime: number;
}

export interface User {
  username: string;
  passwordHash: string; // In a real app, this would be a proper hash
  keystrokeSignature: KeystrokeSignature;
  referencePhotoUrls: string[];
}

export interface SuspiciousLogEntry {
  timestamp: number;
  username: string;
  reason: string;
  capturedPhotoUrl: string;
}
