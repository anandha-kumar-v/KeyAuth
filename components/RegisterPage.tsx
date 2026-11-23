import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { KeystrokeSignature } from '../types';
import { useKeystrokeDynamics } from '../hooks/useKeystrokeDynamics';
import { authService } from '../services/authService';
import { ShieldCheckIcon, LockClosedIcon, UserCircleIcon, CameraIcon, Spinner, EyeIcon, EyeOffIcon } from './common/Icons';
import { PasswordStrengthIndicator } from './common/PasswordStrengthIndicator';
import { ActiveCameraCapture } from './ActiveCameraCapture';

interface RegisterPageProps {
  switchToLogin: () => void;
}

const PASSWORD_ENTRIES = 4;
const TOTAL_STEPS = 4;

const stepDetails = [
    { title: 'Username', description: 'Choose a unique username.' },
    { title: 'Set Password', description: 'Create a strong, secure password.' },
    { title: 'Calibrate Typing Rhythm', description: `Confirm your password ${PASSWORD_ENTRIES - 1} more times.` },
    { title: 'Reference Photos', description: 'Provide live photos for facial verification.' },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ switchToLogin }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [username, setUsername] = useState('');
  const [passwordEntries, setPasswordEntries] = useState(Array(PASSWORD_ENTRIES).fill(''));
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [currentTypingEntry, setCurrentTypingEntry] = useState(0);
  const [referencePhotos, setReferencePhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const collectedSignatures = useRef<KeystrokeSignature[]>([]);

  const { inputRef, startRecording, stopRecording, calculateSignature } = useKeystrokeDynamics();

  useEffect(() => {
    if (currentStep === 2 || currentStep === 3) {
      // Auto-focus password field when moving to step 2 or on new entry in step 3
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    
    const passInput = inputRef.current;
    if (passInput) {
        const handleFocus = () => {
            if (currentStep === 2 || currentStep === 3) startRecording();
        };
        const handleBlur = () => {
             const sig = calculateSignature();
             if (sig) {
                if(currentStep === 2) collectedSignatures.current[0] = sig;
                if(currentStep === 3) collectedSignatures.current[currentTypingEntry + 1] = sig;
             }
             stopRecording();
        };
        passInput.addEventListener('focus', handleFocus);
        passInput.addEventListener('blur', handleBlur);
        return () => {
            passInput.removeEventListener('focus', handleFocus);
            passInput.removeEventListener('blur', handleBlur);
        };
    }
  }, [inputRef, startRecording, stopRecording, calculateSignature, currentStep, currentTypingEntry]);
  
  const handlePasswordChange = (text: string, index: number) => {
    const newEntries = [...passwordEntries];
    newEntries[index] = text;
    setPasswordEntries(newEntries);
  };
  
  const handleNextStep = () => {
    setMessage(null);
    if (currentStep === 1 && !username.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }
    if (currentStep === 2) {
      if (!passwordEntries[0]) {
        setMessage({ type: 'error', text: 'Password cannot be empty.' });
        return;
      }
      // You could add a strength check here if desired
    }
    if (currentStep === 3) {
      if (collectedSignatures.current.filter(Boolean).length < PASSWORD_ENTRIES) {
          setMessage({ type: 'error', text: `Please complete all ${PASSWORD_ENTRIES} typing entries.` });
          return;
      }
      const firstPassword = passwordEntries[0];
      if (!passwordEntries.every(p => p === firstPassword && p !== '')) {
          setMessage({ type: 'error', text: 'Passwords do not match. Please go back and re-enter.' });
          return;
      }
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setMessage(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleNextTypingEntry = () => {
      setMessage(null);
      if (passwordEntries[currentTypingEntry+1] === '') {
          setMessage({type: 'error', text: 'Password cannot be empty.'});
          return;
      }
      if (currentTypingEntry < PASSWORD_ENTRIES - 2) {
          setCurrentTypingEntry(prev => prev + 1);
      }
  }
  
  const averageSignatures = (signatures: KeystrokeSignature[]): KeystrokeSignature => {
    const avg = signatures.reduce((acc, sig) => {
        acc.avgDwellTime += sig.avgDwellTime;
        acc.avgFlightTime += sig.avgFlightTime;
        acc.totalTime += sig.totalTime;
        return acc;
    }, { avgDwellTime: 0, avgFlightTime: 0, totalTime: 0 });

    avg.avgDwellTime /= signatures.length;
    avg.avgFlightTime /= signatures.length;
    avg.totalTime /= signatures.length;

    return avg;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (referencePhotos.length === 0) {
        setMessage({type: 'error', text: 'Please complete the active photo capture.'});
        return;
    }

    setIsSubmitting(true);
    
    try {
        const finalSignature = averageSignatures(collectedSignatures.current);

        const result = await authService.register({
            username,
            passwordHash: passwordEntries[0], // Should be hashed in a real app
            keystrokeSignature: finalSignature,
            referencePhotoUrls: referencePhotos
        });

        if (result.success) {
            setMessage({type: 'success', text: result.message + ' Redirecting to login...'});
            setTimeout(switchToLogin, 2000);
        } else {
            setMessage({type: 'error', text: result.message});
        }

    } catch(err) {
        setMessage({type: 'error', text: 'An unexpected error occurred.'});
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNextStep();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Manually calculate and store signature before proceeding, as blur event won't fire.
      const sig = calculateSignature();
      if (sig) {
          if (currentStep === 2) collectedSignatures.current[0] = sig;
          if (currentStep === 3) collectedSignatures.current[currentTypingEntry + 1] = sig;
      }
      stopRecording();

      if (currentStep === 2) {
        handleNextStep();
      } else if (currentStep === 3) {
        if (currentTypingEntry < PASSWORD_ENTRIES - 2) {
          handleNextTypingEntry();
        } else {
          handleNextStep();
        }
      }
    }
  };

  const StepIndicator = () => (
    <div className="mb-8">
        <div className="flex items-center">
            {Array.from({length: TOTAL_STEPS}).map((_, index) => (
                <React.Fragment key={index}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep > index ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {index + 1}
                    </div>
                    {index < TOTAL_STEPS - 1 && (
                        <div className={`flex-1 h-1 ${currentStep > index + 1 ? 'bg-cyan-500' : 'bg-gray-700'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
        <div className="text-center mt-3">
            <h2 className="text-lg font-semibold text-white">{stepDetails[currentStep-1].title}</h2>
            <p className="text-sm text-gray-400">{stepDetails[currentStep-1].description}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      {isCameraOpen && (
        <ActiveCameraCapture
            onComplete={(imageDataUrls) => {
                setReferencePhotos(imageDataUrls);
                setIsCameraOpen(false);
            }}
            onClose={() => setIsCameraOpen(false)}
        />
      )}
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto text-cyan-400" />
            <h1 className="text-3xl font-bold text-white mt-4">Create Your Secure Account</h1>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8">
          <StepIndicator />
          <form onSubmit={handleSubmit} noValidate>
            <div className="min-h-[180px]">
                {currentStep === 1 && (
                    <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserCircleIcon className="h-5 w-5 text-gray-500" /></div>
                            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={handleUsernameKeyDown} className="bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-md w-full py-2 px-3 pl-10" required />
                        </div>
                    </div>
                )}
                {currentStep === 2 && (
                    <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">Set Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockClosedIcon className="h-5 w-5 text-gray-500" /></div>
                            <input id="password" ref={inputRef} type={isPasswordVisible ? 'text' : 'password'} value={passwordEntries[0]} onChange={(e) => handlePasswordChange(e.target.value, 0)} onKeyDown={handlePasswordKeyDown} className="bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-md w-full py-2 px-3 pl-10 pr-10" required />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="text-gray-500 hover:text-gray-300" aria-label={isPasswordVisible ? "Hide password" : "Show password"}>
                                    {isPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <PasswordStrengthIndicator password={passwordEntries[0]} />
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password-confirm">
                            Confirm Password (Entry {currentTypingEntry + 1} of {PASSWORD_ENTRIES - 1})
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockClosedIcon className="h-5 w-5 text-gray-500" /></div>
                            <input id="password-confirm" ref={inputRef} key={`password-entry-${currentTypingEntry}`} type={isPasswordVisible ? 'text' : 'password'} value={passwordEntries[currentTypingEntry + 1]} onChange={(e) => handlePasswordChange(e.target.value, currentTypingEntry + 1)} onKeyDown={handlePasswordKeyDown} className="bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-md w-full py-2 px-3 pl-10 pr-10" required />
                             <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="text-gray-500 hover:text-gray-300" aria-label={isPasswordVisible ? "Hide password" : "Show password"}>
                                    {isPasswordVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        {currentTypingEntry < PASSWORD_ENTRIES - 2 && (
                            <button type="button" onClick={handleNextTypingEntry} className="text-sm mt-2 w-full text-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded-md">
                                Confirm and Type Again
                            </button>
                        )}
                    </div>
                )}
                {currentStep === 4 && (
                    <div className="mb-6 text-center">
                        <div className="mt-1 flex justify-center items-center space-x-2 mb-4">
                            {referencePhotos.length > 0 ? (
                                referencePhotos.map((photo, index) => (
                                    <img key={index} src={photo} alt={`Pose ${index+1}`} className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500"/>
                                ))
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center"><CameraIcon className="w-8 h-8 text-gray-500" /></div>
                            )}
                        </div>
                        <button type="button" onClick={() => setIsCameraOpen(true)} className="w-full text-center bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-md">
                           {referencePhotos.length > 0 ? 'Retake Photos' : 'Start Active Capture'}
                        </button>
                         <p className="text-xs text-gray-500 mt-2">This is required for enhanced security.</p>
                    </div>
                )}
            </div>
            
            {message && (
                <div className={`mb-4 text-center text-sm p-3 rounded-md ${message.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                    {message.text}
                </div>
            )}
            
            <div className="flex items-center justify-between">
                {currentStep > 1 && (
                    <button type="button" onClick={handlePrevStep} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
                        Back
                    </button>
                )}
                {currentStep < TOTAL_STEPS && (
                    <button type="button" onClick={handleNextStep} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md ml-auto">
                        Next
                    </button>
                )}
                {currentStep === TOTAL_STEPS && (
                    <button type="submit" disabled={referencePhotos.length === 0 || isSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isSubmitting ? <Spinner className="w-5 h-5 mx-auto" /> : "Create Secure Account"}
                    </button>
                )}
            </div>
          </form>
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button type="button" onClick={switchToLogin} className="font-bold text-cyan-400 hover:underline">
                    Log In
                </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
