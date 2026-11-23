import React, { useEffect, useRef } from 'react';

interface SilentCameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onError: (error: string) => void;
}

export const SilentCameraCapture: React.FC<SilentCameraCaptureProps> = ({ onCapture, onError }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = (stream: MediaStream | null) => {
    try {
      if (!stream) return;
      stream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) { /* ignore */ }
      });
    } finally {
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const captureFrame = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted) {
          // If component unmounted quickly, stop immediately
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setTimeout(() => {
              if (!videoRef.current || !canvasRef.current) {
                stopStream(stream);
                onError("Camera error.");
                return;
              }
              const video = videoRef.current;
              const canvas = canvasRef.current;
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 480;
              const context = canvas.getContext('2d');
              context?.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageDataUrl = canvas.toDataURL('image/jpeg');
              onCapture(imageDataUrl);

              // Stop stream and clear srcObject
              stopStream(stream);
            }, 500);
          };
        }
      } catch (err) {
        console.error("SilentCameraCapture error:", err);
        stopStream(streamRef.current);
        onError("Camera access denied. Cannot perform facial verification.");
      }
    };

    captureFrame();

    return () => {
      mounted = false;
      stopStream(streamRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'none' }}>
      <video ref={videoRef} playsInline />
      <canvas ref={canvasRef} />
    </div>
  );
};
