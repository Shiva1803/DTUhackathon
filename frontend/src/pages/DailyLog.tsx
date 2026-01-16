import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import { uploadAudioLog } from '../lib/api';
import { AxiosError } from 'axios';

type RecordingState = 'idle' | 'recording' | 'uploading' | 'success' | 'error';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function DailyLog() {
  const navigate = useNavigate();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const [state, setState] = useState<RecordingState>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [toast, setToast] = useState<Toast | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check if backend is available on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Backend health endpoint is at /health, not /api/health
        // This goes through Vite proxy to localhost:3001/health
        const response = await fetch('/health', { method: 'GET' });
        setBackendAvailable(response.ok);
      } catch {
        setBackendAvailable(false);
      }
    };
    checkBackend();
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
  }, []);

  const uploadAudio = async (blob: Blob) => {
    setState('uploading');

    try {
      if (!isAuthenticated) {
        throw new Error('Not authenticated');
      }

      // Get auth token with audience
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        }
      });

      // Determine the actual MIME type from the blob
      const mimeType = blob.type || 'audio/webm';
      const extension = mimeType.includes('webm') ? 'webm' :
        mimeType.includes('mp3') ? 'mp3' :
          mimeType.includes('wav') ? 'wav' : 'webm';

      const file = new File([blob], `log-${Date.now()}.${extension}`, { type: mimeType });
      const formData = new FormData();
      formData.append('audio', file);

      await uploadAudioLog(formData, token);

      setState('success');
      showToast('Log uploaded successfully!', 'success');

      // Navigate to success page after brief delay
      setTimeout(() => {
        navigate('/success');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setState('error');

      let message = 'Upload failed. Please try again.';

      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (status === 401) {
          message = 'Session expired. Please log in again.';
        } else if (status === 400) {
          message = errorData?.error?.message || 'Invalid audio file format.';
        } else if (status === 404) {
          message = 'Server not available. Please ensure backend is running.';
          setBackendAvailable(false);
        } else if (status === 413) {
          message = 'File too large. Maximum size is 10MB.';
        } else if (status === 500) {
          message = 'Server error. Please try again later.';
        } else if (!error.response) {
          message = 'Network error. Check your connection and ensure backend is running.';
          setBackendAvailable(false);
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      showToast(message, 'error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);

    animationRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = async () => {
    if (!backendAvailable) {
      showToast('Backend server is not available. Please start it first.', 'warning');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      streamRef.current = stream;

      // Set up audio analyser for waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Use webm as it's universally supported in browsers
      const mimeType = 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Clean up stream but keep other refs for upload
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => { });
          audioContextRef.current = null;
        }

        uploadAudio(blob);
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        cleanup();
        showToast('Recording error. Please try again.', 'error');
        setState('idle');
      };

      // Request data every second
      mediaRecorder.start(1000);
      setState('recording');
      setTimeLeft(60);

      // Start audio level monitoring
      animationRef.current = requestAnimationFrame(updateAudioLevel);

      // Countdown timer
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Microphone error:', error);
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          showToast('Microphone access denied. Please allow microphone access in your browser settings.', 'error');
        } else if (error.name === 'NotFoundError') {
          showToast('No microphone found. Please connect a microphone.', 'error');
        } else {
          showToast('Could not access microphone: ' + error.message, 'error');
        }
      } else {
        showToast('Microphone error. Please try again.', 'error');
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const handleMicClick = () => {
    if (state === 'idle') {
      startRecording();
    } else if (state === 'recording') {
      stopRecording();
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Backend warning banner */}
      {!backendAvailable && (
        <div className="bg-yellow-600/20 border-b border-yellow-600/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3 text-yellow-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Backend server is not available. Please run <code className="bg-gray-800 px-2 py-0.5 rounded">cd backend && npm run dev</code> in your terminal.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Today's Log</h1>
            <p className="text-gray-400">Record your daily reflection (up to 60 seconds)</p>
          </div>

          {/* Status Text */}
          <div className="mb-8 h-20">
            <AnimatePresence mode="wait">
              {state === 'idle' && (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-400 text-lg"
                >
                  Tap the microphone to start recording
                </motion.p>
              )}
              {state === 'recording' && (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-4xl font-bold text-purple-400">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-gray-400">Recording... Tap to stop</span>
                </motion.div>
              )}
              {state === 'uploading' && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 text-gray-400"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <span>Uploading your log...</span>
                </motion.div>
              )}
              {state === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 text-green-400"
                >
                  <CheckCircle className="w-8 h-8" />
                  <span>Log saved successfully!</span>
                </motion.div>
              )}
              {state === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 text-red-400"
                >
                  <XCircle className="w-8 h-8" />
                  <span>Upload failed. Try again.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mic Button */}
          <div className="relative inline-block">
            {/* Audio level ring */}
            {state === 'recording' && (
              <motion.div
                className="absolute rounded-full bg-purple-500/20"
                animate={{
                  scale: 1 + audioLevel * 0.5,
                  opacity: 0.3 + audioLevel * 0.4
                }}
                transition={{ duration: 0.1 }}
                style={{ inset: -20 }}
              />
            )}

            {/* Pulsing ring when recording */}
            {state === 'recording' && (
              <motion.div
                className="absolute rounded-full border-4 border-red-500"
                animate={{ scale: [1, 1.2], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ inset: -8 }}
              />
            )}

            <motion.button
              onClick={handleMicClick}
              disabled={state === 'uploading' || state === 'success' || (!backendAvailable && state === 'idle')}
              whileHover={{ scale: state === 'idle' && backendAvailable ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center
                transition-all duration-300 shadow-2xl
                ${state === 'recording'
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                  : state === 'uploading' || state === 'success' || !backendAvailable
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 shadow-purple-500/30'
                }
              `}
            >
              {state === 'uploading' ? (
                <Loader2 className="w-12 h-12 md:w-16 md:h-16 animate-spin" />
              ) : state === 'recording' ? (
                <MicOff className="w-12 h-12 md:w-16 md:h-16" />
              ) : state === 'success' ? (
                <CheckCircle className="w-12 h-12 md:w-16 md:h-16" />
              ) : (
                <Mic className="w-12 h-12 md:w-16 md:h-16" />
              )}
            </motion.button>
          </div>

          {/* Waveform visualization */}
          {state === 'recording' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex items-center justify-center gap-1 h-12"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-purple-500 rounded-full"
                  style={{
                    height: `${8 + Math.sin(Date.now() / 200 + i) * audioLevel * 32}px`
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Tips */}
          {state === 'idle' && backendAvailable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-gray-500 text-sm max-w-md"
            >
              <p>💡 Talk about what you accomplished, how you felt, and what you learned today.</p>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`
              fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg
              flex items-center gap-3 z-50 max-w-md
              ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-yellow-600' : 'bg-red-600'}
            `}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
