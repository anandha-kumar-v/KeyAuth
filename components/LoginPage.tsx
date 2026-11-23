import React, { useState, FormEvent, useEffect } from 'react';
import { User, Page, KeystrokeSignature } from '../types';
import { useKeystrokeDynamics } from '../hooks/useKeystrokeDynamics';
import { authService } from '../services/authService';
import { faceApiSimulator } from '../services/faceApiSimulator';
import { SilentCameraCapture } from './SilentCameraCapture';
import { ShieldCheckIcon, ShieldExclamationIcon, FingerPrintIcon, CameraIcon, Spinner, LockClosedIcon, UserCircleIcon, EyeOffIcon, EyeIcon } from './common/Icons';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onHoneypotTrigger: (user: User, reason: string, capturedPhotoUrl: string) => void;
  switchToRegister: () => void;
}

enum LoginStatus {
  Idle,
  CheckingCredentials,
  AnalyzingKeystrokes,
  VerifyingFace,
  AnalyzingFace,
  Success,
  Honeypot,
  Error
}

const statusMessages: Record<LoginStatus, { text: string; icon: React.ReactElement }> = {
    [LoginStatus.Idle]: { text: 'Awaiting login...', icon: <ShieldCheckIcon className="w-6 h-6 text-gray-400" />},
    [LoginStatus.CheckingCredentials]: { text: 'Verifying username and password...', icon: <Spinner className="w-6 h-6 text-cyan-400" />},
    [LoginStatus.AnalyzingKeystrokes]: { text: 'Analyzing typing pattern...', icon: <FingerPrintIcon className="w-6 h-6 text-cyan-400" /> },
    [LoginStatus.VerifyingFace]: { text: 'Suspicious rhythm detected. Initiating stealth verification...', icon: <CameraIcon className="w-6 h-6 text-yellow-400" /> },
    [LoginStatus.AnalyzingFace]: { text: 'Analyzing facial biometrics...', icon: <Spinner className="w-6 h-6 text-yellow-400" /> },
    [LoginStatus.Success]: { text: 'Authentication successful. Access granted.', icon: <ShieldCheckIcon className="w-6 h-6 text-green-400" /> },
    [LoginStatus.Honeypot]: { text: 'Impostor detected. Logging event & deploying honeypot.', icon: <ShieldExclamationIcon className="w-6 h-6 text-red-400" /> },
    [LoginStatus.Error]: { text: 'Error', icon: <ShieldExclamationIcon className="w-6 h-6 text-red-400" />},
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onHoneypotTrigger, switchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [status, setStatus] = useState<LoginStatus>(LoginStatus.Idle);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [simulateFaceMatchFailure, setSimulateFaceMatchFailure] = useState(false);

  const { inputRef, startRecording, stopRecording, calculateSignature, compareSignatures } = useKeystrokeDynamics();

  useEffect(() => {
    // Automatically start recording when the password field gets focus
    const passInput = inputRef.current;
    if (passInput) {
        const handleFocus = () => startRecording();
        const handleBlur = () => stopRecording();
        passInput.addEventListener('focus', handleFocus);
        passInput.addEventListener('blur', handleBlur);
        return () => {
            passInput.removeEventListener('focus', handleFocus);
            passInput.removeEventListener('blur', handleBlur);
        };
    }
  }, [inputRef, startRecording, stopRecording]);

  const handleFaceCapture = async (imageDataUrl: string, user: User) => {
    setStatus(LoginStatus.AnalyzingFace);
    const { match, confidence, failureReason } = await faceApiSimulator.compare(imageDataUrl, user.referencePhotoUrls, simulateFaceMatchFailure);
    
    console.log(`Facial recognition confidence: ${(confidence * 100).toFixed(2)}%`);
    if (failureReason) {
        console.warn(`[Facial Verification] Failure Reason: ${failureReason}`);
    }

    setIsCapturingFace(false);

    if (match) {
        setStatus(LoginStatus.Success);
        setTimeout(() => onLoginSuccess(user), 1000);
    } else {
        setStatus(LoginStatus.Honeypot);
        const reason = `Facial recognition failed. Reason: ${failureReason || 'Confidence below threshold'}`;
        console.error(`[HONEYPOT TRIGGER] ${reason} for user '${user.username}'.`);
        setTimeout(() => onHoneypotTrigger(user, reason, imageDataUrl), 1000);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(LoginStatus.CheckingCredentials);
    setErrorMessage('');

    const user = await authService.getUser(username);

    if (!user || user.passwordHash !== password) {
        setStatus(LoginStatus.Error);
        setErrorMessage('Invalid username or password.');
        return;
    }

    setStatus(LoginStatus.AnalyzingKeystrokes);
    const currentSignature = calculateSignature();

    if (!currentSignature) {
        setStatus(LoginStatus.Error);
        setErrorMessage('Could not analyze typing pattern. Please type your password again.');
        return;
    }

    const keystrokeMatch = compareSignatures(user.keystrokeSignature, currentSignature);

    await new Promise(res => setTimeout(res, 1000)); // Simulate analysis time

    if (keystrokeMatch) {
        setStatus(LoginStatus.Success);
        setTimeout(() => onLoginSuccess(user), 1000);
    } else {
        // Layer 2: Keystroke mismatch, trigger silent facial verification
        console.warn(`[SECURITY ALERT] Keystroke mismatch for user '${user.username}'. Initiating facial verification.`);
        setStatus(LoginStatus.VerifyingFace);
        setIsCapturingFace(true);
    }
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      {isCapturingFace && (
          <SilentCameraCapture 
            onCapture={(img) => authService.getUser(username).then(user => user && handleFaceCapture(img, user))}
            onError={(err) => {
              setIsCapturingFace(false);
              setStatus(LoginStatus.Error);
              setErrorMessage(err);
            }}
          />
      )}
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto text-cyan-400" />
            <h1 className="text-3xl font-bold text-white mt-4">Key Auth Security Suite</h1>
            <p className="text-gray-400">Advanced Biometric Authentication Demo</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleUsernameKeyDown}
                  className="bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-md w-full py-2 px-3 pl-10"
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  ref={inputRef}
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-md w-full py-2 px-3 pl-10 pr-10"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="text-gray-500 hover:text-gray-300"
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    >
                        {isPasswordVisible ? (
                            <EyeOffIcon className="h-5 w-5" />
                        ) : (
                            <EyeIcon className="h-5 w-5" />
                        )}
                    </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <button
                type="submit"
                disabled={status > LoginStatus.Idle && status < LoginStatus.Success}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:bg-gray-600"
              >
                Log In
              </button>
            </div>
            <div className="text-center">
                <p className="text-gray-400 text-sm">
                    Don't have an account?{' '}
                    <button type="button" onClick={switchToRegister} className="font-bold text-cyan-400 hover:underline">
                        Register
                    </button>
                </p>
            </div>
          </form>
        </div>
        
        <div className="mt-6 bg-gray-800 rounded-lg p-4 shadow-lg min-h-[60px] flex items-center justify-center">
            <div className="flex items-center space-x-3">
                {statusMessages[status].icon}
                <span className="text-gray-300">{status !== LoginStatus.Error ? statusMessages[status].text : errorMessage}</span>
            </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-800 border border-cyan-700/50 rounded-lg text-xs text-gray-300 space-y-2">
            <h4 className="font-bold text-sm text-cyan-400">Demo Guide</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><span className="font-bold">Register a new user,</span> completing all photo capture steps.</li>
                <li><span className="font-bold">Log in normally</span> by typing your password with a similar rhythm.</li>
                <li><span className="font-bold">Trigger the honeypot:</span> Log in with the correct password but type it very differently (fast/slow). Then fail the facial scan (e.g., cover the camera).</li>
                <li>On a successful login, the dashboard will show you the <span className="font-bold">Suspicious Activity Log</span> you created.</li>
            </ul>
             <label className="flex items-center cursor-pointer pt-2">
                <input
                type="checkbox"
                checked={simulateFaceMatchFailure}
                onChange={(e) => setSimulateFaceMatchFailure(e.target.checked)}
                className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"
                />
                <span className="ml-2 text-yellow-300">Or, just check this box to force a facial scan failure.</span>
          </label>
        </div>

      </div>
    </div>
  );
};
