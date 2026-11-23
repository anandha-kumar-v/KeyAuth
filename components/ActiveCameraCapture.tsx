import React, { useRef, useEffect, useState } from 'react';
import { Spinner } from './common/Icons';

interface ActiveCameraCaptureProps {
  onComplete: (imageDataUrls: string[]) => void;
  onClose: () => void;
}

const POSES = [
  'Look straight at the camera.',
  'Slowly turn your head to the left.',
  'Slowly turn your head to the right.',
  'Now, please smile.',
];

const CAPTURE_DELAY = 2500; // ms

export const ActiveCameraCapture: React.FC<ActiveCameraCaptureProps> = ({ onComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [poseIndex, setPoseIndex] = useState(0);
  const [countdown, setCountdown] = useState(CAPTURE_DELAY / 1000);
  const countdownIntervalRef = useRef<number | null>(null);
  const captureTimeoutRef = useRef<number | null>(null);
  const capturedImagesRef = useRef<string[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = (stream: MediaStream | null) => {
    try {
      if (!stream) return;
      stream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
    } finally {
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (!mounted) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setError("Camera access is required. Please enable it in your browser settings.");
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
      stopStream(streamRef.current);
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext('2d');
      if (context) {
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      capturedImagesRef.current.push(imageDataUrl);

      if (poseIndex < POSES.length - 1) {
        setPoseIndex(prev => prev + 1);
      } else {
        // All poses captured: stop camera and complete
        stopStream(streamRef.current);
        onComplete(capturedImagesRef.current);
      }
    }
  };

  useEffect(() => {
    if (!isLoading && !error) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);

      setCountdown(CAPTURE_DELAY / 1000);

      countdownIntervalRef.current = window.setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      captureTimeoutRef.current = window.setTimeout(() => {
        handleCapture();
      }, CAPTURE_DELAY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, poseIndex]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-bold text-white mb-2 text-center">Active Liveness Check</h3>
        <p className="text-center text-gray-300 mb-4">{`Pose ${poseIndex + 1} of ${POSES.length}`}</p>

        <div className="relative aspect-video bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
          {isLoading && <Spinner className="w-12 h-12 text-cyan-400" />}
          {error && <div className="text-red-400 p-4 text-center">{error}</div>}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            onCanPlay={() => setIsLoading(false)}
            className={`w-full h-full object-cover transform -scale-x-100 ${isLoading || error ? 'hidden' : ''}`}
          />
          {!isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-4 bg-black/30">
              <div className="text-center bg-black/50 p-2 rounded-md">
                <p className="text-lg font-semibold text-white">{POSES[poseIndex]}</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-white drop-shadow-lg">{countdown > 0 ? countdown : 'SNAP!'}</p>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="mt-4 flex justify-center items-center">
          <button onClick={() => { stopStream(streamRef.current); onClose(); }} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
