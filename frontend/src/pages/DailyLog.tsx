import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Mic, MicOff, Loader2, CheckCircle, XCircle, X, AlertCircle, Sparkles } from 'lucide-react';
import { uploadAudioLog } from '../lib/api';
import { AxiosError } from 'axios';
import { useTheme } from '../context/ThemeContext';

type RecordingState = 'idle' | 'recording' | 'uploading' | 'success' | 'error' | 'title-input';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning';
}

// Generate floating particles
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
  }));
};

const particles = generateParticles(30);

// Generate stars for background
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.5 + 0.2,
  }));
};

const stars = generateStars(80);

export default function DailyLog() {
  const navigate = useNavigate();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const { isDark } = useTheme();

  const [state, setState] = useState<RecordingState>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [toast, setToast] = useState<Toast | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = (e.clientX - rect.left - centerX) / centerX;
    const y = (e.clientY - rect.top - centerY) / centerY;
    mouseX.set(x);
    mouseY.set(y);
  };

  useEffect(() => {
    const checkBackend = async () => {
      try {
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
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close().catch(() => {});
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    timerRef.current = null;
    animationRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
  }, []);

  const uploadAudio = async (blob: Blob, logTitle: string) => {
    setState('uploading');
    try {
      if (!isAuthenticated) throw new Error('Not authenticated');
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        }
      });
      
      const mimeType = blob.type || 'audio/webm';
      const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp3') ? 'mp3' : 'webm';
      const file = new File([blob], `log-${Date.now()}.${extension}`, { type: mimeType });
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', logTitle.trim());

      await uploadAudioLog(formData, token);
      setState('success');
      showToast('Log uploaded successfully!', 'success');
      setTimeout(() => navigate('/success'), 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setState('error');
      let message = 'Upload failed. Please try again.';
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 401) message = 'Session expired. Please log in again.';
        else if (status === 404 || !error.response) {
          message = 'Server not available.';
          setBackendAvailable(false);
        }
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
      showToast('Backend server is not available.', 'warning');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } 
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close().catch(() => {});
        // Store blob and show title input modal
        setPendingBlob(blob);
        setTitle('');
        setState('title-input');
      };

      mediaRecorder.start(1000);
      setState('recording');
      setTimeLeft(60);
      animationRef.current = requestAnimationFrame(updateAudioLevel);

      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { stopRecording(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Microphone error:', error);
      showToast('Could not access microphone.', 'error');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setAudioLevel(0);
  }, []);

  const handleMicClick = () => {
    if (state === 'idle') startRecording();
    else if (state === 'recording') stopRecording();
  };

  const handleTitleSubmit = () => {
    if (pendingBlob && title.trim()) {
      uploadAudio(pendingBlob, title);
      setPendingBlob(null);
    }
  };

  const handleTitleCancel = () => {
    setPendingBlob(null);
    setTitle('');
    setState('idle');
  };

  useEffect(() => () => cleanup(), [cleanup]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((60 - timeLeft) / 60) * 100;

  // Pre-compute transforms (hooks must be called unconditionally)
  const nebulaX1 = useTransform(smoothMouseX, [-1, 1], [15, -15]);
  const nebulaY1 = useTransform(smoothMouseY, [-1, 1], [15, -15]);
  const nebulaX2 = useTransform(smoothMouseX, [-1, 1], [-10, 10]);
  const nebulaY2 = useTransform(smoothMouseY, [-1, 1], [-10, 10]);
  const starX = useTransform(smoothMouseX, [-1, 1], [10, -10]);
  const starY = useTransform(smoothMouseY, [-1, 1], [10, -10]);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen text-white overflow-hidden transition-colors duration-500"
      style={{ background: isDark ? '#000000' : '#F5E6D3', color: isDark ? '#ffffff' : '#3D2914' }}
      onMouseMove={handleMouseMove}
    >
      {/* Ambient background effects - Dark mode */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none">
          {/* Nebula gradients */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 20% 80%, rgba(0, 60, 80, 0.2) 0%, transparent 50%)',
              x: nebulaX1,
              y: nebulaY1,
            }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 80% 20%, rgba(0, 100, 120, 0.15) 0%, transparent 50%)',
              x: nebulaX2,
              y: nebulaY2,
            }}
          />
          
          {/* Stars */}
          {stars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                x: starX,
                y: starY,
              }}
              animate={{ opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3] }}
              transition={{ duration: star.duration, delay: star.delay, repeat: Infinity }}
            />
          ))}

          {/* Floating particles */}
          {particles.map((particle) => (
            <motion.div
              key={`particle-${particle.id}`}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                background: 'rgba(0, 212, 255, 0.6)',
                boxShadow: '0 0 6px rgba(0, 212, 255, 0.4)',
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [particle.opacity, particle.opacity * 2, particle.opacity],
              }}
              transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Light mode background */}
      {!isDark && (
        <div className="fixed inset-0 pointer-events-none">
          <motion.div
            className="absolute w-full h-[40%] bottom-0"
            style={{
              background: 'linear-gradient(0deg, rgba(210, 180, 140, 0.2) 0%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* Backend warning */}
      <AnimatePresence>
        {!backendAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-40 rounded-xl p-4"
            style={{
              background: 'rgba(180, 100, 0, 0.15)',
              border: '1px solid rgba(255, 180, 0, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-3 text-amber-400 max-w-4xl mx-auto">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                Backend server unavailable. Run <code className="px-2 py-0.5 rounded bg-black/30">npm run dev</code> in backend folder.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 pt-8">
        {/* Decorative orbiting rings around content - dark mode only */}
        {isDark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{ border: '1px solid rgba(0, 212, 255, 0.05)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{ border: '1px solid rgba(0, 212, 255, 0.03)' }}
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-[700px] h-[700px] rounded-full"
              style={{ border: '1px solid rgba(0, 212, 255, 0.02)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* Main card with glassmorphism - enhanced during recording */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center w-full max-w-lg z-10"
        >
          {/* Glassmorphism card wrapper */}
          <motion.div
            className="relative px-8 py-12 rounded-3xl overflow-hidden transition-colors duration-500"
            style={{
              background: state === 'recording' 
                ? (isDark ? 'rgba(0, 20, 30, 0.6)' : 'rgba(255, 255, 255, 0.8)')
                : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.6)'),
              border: '1px solid',
              borderColor: state === 'recording' 
                ? 'rgba(0, 212, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: state === 'recording' ? 'blur(20px)' : 'blur(10px)',
              boxShadow: state === 'recording'
                ? '0 0 60px rgba(0, 212, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            animate={{
              borderColor: state === 'recording' 
                ? ['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.4)', 'rgba(0, 212, 255, 0.2)']
                : 'rgba(255, 255, 255, 0.05)',
            }}
            transition={{ duration: 2, repeat: state === 'recording' ? Infinity : 0 }}
          >
            {/* Recording glow effect */}
            {state === 'recording' && (
              <>
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
                  }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)' }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </>
            )}

            {/* Header */}
            <div className="mb-10 relative">
              <motion.div
                className="flex items-center justify-center gap-2 mb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-5 h-5" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
                <span 
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(0, 212, 255, 0.7)' : 'rgba(139, 105, 20, 0.8)' }}
                >
                  Daily Reflection
                </span>
                <Sparkles className="w-5 h-5" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
              </motion.div>
              <h1 
                className="text-3xl md:text-4xl font-semibold mb-3"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  ...(isDark ? {
                    background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  } : {
                    color: '#3D2914',
                  }),
                }}
              >
                {state === 'recording' ? 'Recording...' : "Today's Reflection"}
              </h1>
              <p 
                className="text-base"
                style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)' }}
              >
                {state === 'recording' 
                  ? 'Share your thoughts, we\'re listening'
                  : 'Record up to 60 seconds about your day'}
              </p>
            </div>

            {/* Status */}
            <div className="mb-8 h-24">
              <AnimatePresence mode="wait">
                {state === 'idle' && (
                  <motion.p
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg"
                    style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.6)' }}
                  >
                    Tap to start recording
                  </motion.p>
                )}
                {state === 'recording' && (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <span 
                      className="text-5xl font-semibold tabular-nums"
                      style={{ 
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: isDark ? '#00d4ff' : '#8B6914',
                        textShadow: isDark ? '0 0 30px rgba(0,212,255,0.5)' : '0 0 30px rgba(139,105,20,0.3)',
                      }}
                    >
                      {formatTime(timeLeft)}
                    </span>
                    <span style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)' }}>
                      Tap to stop
                    </span>
                  </motion.div>
                )}

                {state === 'uploading' && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.6)' }}>
                      Processing your reflection...
                    </span>
                  </motion.div>
                )}
                {state === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 text-emerald-400"
                  >
                    <CheckCircle className="w-10 h-10" />
                    <span style={{ fontFamily: "'Inter', sans-serif" }}>Saved successfully!</span>
                  </motion.div>
                )}
                {state === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 text-red-400"
                  >
                    <XCircle className="w-10 h-10" />
                    <span style={{ fontFamily: "'Inter', sans-serif" }}>Upload failed</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mic Button */}
            <div className="relative inline-flex items-center justify-center">
              {/* Outer decorative rings */}
              <motion.div
                className="absolute w-48 h-48 rounded-full"
                style={{ border: isDark ? '1px solid rgba(0, 212, 255, 0.1)' : '1px solid rgba(139, 105, 20, 0.15)' }}
                animate={{ rotate: 360, scale: state === 'recording' ? [1, 1.05, 1] : 1 }}
                transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}
              />
              <motion.div
                className="absolute w-52 h-52 rounded-full"
                style={{ border: isDark ? '1px dashed rgba(0, 212, 255, 0.05)' : '1px dashed rgba(139, 105, 20, 0.1)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              />

              {/* Progress ring */}
              {state === 'recording' && (
                <svg className="absolute w-44 h-44 -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="82"
                    fill="none"
                    stroke={isDark ? 'rgba(0,212,255,0.1)' : 'rgba(139,105,20,0.15)'}
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="88"
                    cy="88"
                    r="82"
                    fill="none"
                    stroke={isDark ? '#00d4ff' : '#8B6914'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={515}
                    strokeDashoffset={515 - (515 * progress) / 100}
                    style={{ filter: isDark ? 'drop-shadow(0 0 8px rgba(0,212,255,0.5))' : 'drop-shadow(0 0 8px rgba(139,105,20,0.4))' }}
                  />
                </svg>
              )}

              {/* Audio level ring */}
              {state === 'recording' && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 160 + audioLevel * 60,
                    height: 160 + audioLevel * 60,
                    background: isDark 
                      ? 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(139,105,20,0.2) 0%, transparent 70%)',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Pulsing ring when recording */}
              {state === 'recording' && (
                <>
                  <motion.div
                    className="absolute w-36 h-36 rounded-full"
                    style={{ border: '2px solid rgba(239, 68, 68, 0.5)' }}
                    animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <motion.div
                    className="absolute w-36 h-36 rounded-full"
                    style={{ border: '2px solid rgba(239, 68, 68, 0.3)' }}
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                  />
                </>
              )}

              <motion.button
                onClick={handleMicClick}
                disabled={state === 'uploading' || state === 'success' || (!backendAvailable && state === 'idle')}
                whileHover={{ scale: state === 'idle' && backendAvailable ? 1.05 : 1 }}
                whileTap={{ scale: 0.97 }}
                className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: state === 'recording' 
                    ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                    : state === 'uploading' || state === 'success' || !backendAvailable
                      ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                      : isDark 
                        ? 'linear-gradient(135deg, #003040 0%, #006080 100%)'
                        : 'linear-gradient(135deg, #C2986C 0%, #D4A574 100%)',
                  boxShadow: state === 'recording'
                    ? '0 0 50px rgba(239, 68, 68, 0.5), inset 0 0 30px rgba(0,0,0,0.3)'
                    : state === 'idle' && backendAvailable
                      ? isDark 
                        ? '0 0 50px rgba(0, 212, 255, 0.3), inset 0 0 30px rgba(0,0,0,0.3)'
                        : '0 0 50px rgba(139, 105, 20, 0.3), inset 0 0 30px rgba(0,0,0,0.2)'
                      : 'none',
                  border: '1px solid',
                  borderColor: state === 'recording' 
                    ? 'rgba(239, 68, 68, 0.5)'
                    : isDark ? 'rgba(0, 212, 255, 0.3)' : 'rgba(139, 105, 20, 0.4)',
                }}
              >
                {/* Inner glow */}
                <motion.div
                  className="absolute inset-2 rounded-full pointer-events-none"
                  style={{
                    background: state === 'recording'
                      ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)'
                      : isDark 
                        ? 'radial-gradient(circle at 30% 30%, rgba(0,212,255,0.2) 0%, transparent 60%)'
                        : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)',
                  }}
                />
                
                {state === 'uploading' ? (
                  <Loader2 className="w-12 h-12 animate-spin" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
                ) : state === 'recording' ? (
                  <MicOff className="w-12 h-12 text-white" />
                ) : state === 'success' ? (
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </motion.button>
            </div>

            {/* Enhanced Waveform */}
            {state === 'recording' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 relative"
              >
                {/* Waveform container with glow */}
                <div 
                  className="relative flex items-center justify-center gap-[2px] h-16 px-6 py-4 rounded-2xl"
                  style={{
                    background: isDark ? 'rgba(0, 212, 255, 0.05)' : 'rgba(139, 105, 20, 0.08)',
                    border: isDark ? '1px solid rgba(0, 212, 255, 0.1)' : '1px solid rgba(139, 105, 20, 0.15)',
                  }}
                >
                  {/* Animated bars */}
                  {[...Array(40)].map((_, i) => {
                    const centerDistance = Math.abs(i - 20) / 20;
                    const baseHeight = 8 + (1 - centerDistance) * 20;
                    return (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full"
                        style={{
                          background: isDark 
                            ? `linear-gradient(to top, rgba(0, 60, 80, 0.8), rgba(0, 212, 255, ${0.6 + audioLevel * 0.4}))`
                            : `linear-gradient(to top, rgba(194, 152, 108, 0.8), rgba(139, 105, 20, ${0.6 + audioLevel * 0.4}))`,
                          boxShadow: audioLevel > 0.3 
                            ? (isDark ? '0 0 4px rgba(0, 212, 255, 0.5)' : '0 0 4px rgba(139, 105, 20, 0.4)')
                            : 'none',
                        }}
                        animate={{
                          height: baseHeight + Math.sin(Date.now() / 100 + i * 0.3) * audioLevel * 30,
                        }}
                        transition={{ duration: 0.05 }}
                      />
                    );
                  })}
                </div>
                
                {/* Recording indicator */}
                <motion.div
                  className="absolute -top-2 -right-2 flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-xs text-red-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                    REC
                  </span>
                </motion.div>
              </motion.div>
            )}

            {/* Tips section - enhanced */}
            {state === 'idle' && backendAvailable && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12"
              >
                <div 
                  className="p-6 rounded-2xl relative overflow-hidden"
                  style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(0, 60, 80, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(139, 105, 20, 0.08) 0%, rgba(194, 152, 108, 0.12) 100%)',
                    border: isDark ? '1px solid rgba(0, 212, 255, 0.1)' : '1px solid rgba(139, 105, 20, 0.15)',
                  }}
                >
                  {/* Decorative corner accent */}
                  <div 
                    className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                    style={{
                      background: isDark 
                        ? 'radial-gradient(circle at top right, rgba(0, 212, 255, 0.15) 0%, transparent 70%)'
                        : 'radial-gradient(circle at top right, rgba(139, 105, 20, 0.15) 0%, transparent 70%)',
                    }}
                  />
                  
                  <div className="flex items-start gap-4">
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 60, 80, 0.3) 100%)'
                          : 'linear-gradient(135deg, rgba(139, 105, 20, 0.2) 0%, rgba(194, 152, 108, 0.3) 100%)',
                        border: isDark ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid rgba(139, 105, 20, 0.2)',
                      }}
                    >
                      <span className="text-lg">💡</span>
                    </div>
                    <div className="text-left">
                      <h3 
                        className="text-sm font-medium mb-2"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", color: isDark ? 'rgba(0, 212, 255, 0.9)' : '#8B6914' }}
                      >
                        Reflection Tips
                      </h3>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.6)' }}
                      >
                        Share what you accomplished, how you felt, and what you learned today. 
                        Your reflections help track your growth journey.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl flex items-center gap-3 z-50 max-w-md"
            style={{
              background: toast.type === 'success' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : toast.type === 'warning' 
                  ? 'rgba(245, 158, 11, 0.15)' 
                  : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                toast.type === 'success' 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : toast.type === 'warning' 
                    ? 'rgba(245, 158, 11, 0.3)' 
                    : 'rgba(239, 68, 68, 0.3)'
              }`,
              backdropFilter: 'blur(10px)',
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span 
              className="text-sm"
              style={{ 
                fontFamily: "'Inter', sans-serif",
                color: toast.type === 'success' ? '#10b981' : toast.type === 'warning' ? '#f59e0b' : '#ef4444',
              }}
            >
              {toast.message}
            </span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 flex-shrink-0">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Input Modal */}
      <AnimatePresence>
        {state === 'title-input' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(0, 30, 40, 0.95) 0%, rgba(0, 20, 30, 0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 235, 220, 0.98) 100%)',
                border: isDark ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid rgba(139, 105, 20, 0.2)',
                boxShadow: isDark 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 212, 255, 0.1)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 40px rgba(139, 105, 20, 0.1)',
              }}
            >
              {/* Decorative glow */}
              <div 
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: isDark 
                    ? 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(139, 105, 20, 0.4), transparent)',
                }}
              />

              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                  className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 100, 120, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(139, 105, 20, 0.2) 0%, rgba(194, 152, 108, 0.3) 100%)',
                    border: isDark ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(139, 105, 20, 0.3)',
                  }}
                >
                  <CheckCircle className="w-7 h-7" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
                </motion.div>
                <h2 
                  className="text-xl font-semibold mb-2"
                  style={{ 
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: isDark ? '#ffffff' : '#3D2914',
                  }}
                >
                  Recording Complete!
                </h2>
                <p 
                  className="text-sm"
                  style={{ 
                    fontFamily: "'Inter', sans-serif",
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(61, 41, 20, 0.6)',
                  }}
                >
                  Give your reflection a title
                </p>
              </div>

              {/* Title Input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                  placeholder="e.g., Morning thoughts, Work progress..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all duration-300"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#ffffff' : '#3D2914',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && title.trim()) handleTitleSubmit();
                    if (e.key === 'Escape') handleTitleCancel();
                  }}
                />
                <p 
                  className="text-xs mt-2 text-right"
                  style={{ 
                    fontFamily: "'Inter', sans-serif",
                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(61, 41, 20, 0.4)',
                  }}
                >
                  {title.length}/60
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleTitleCancel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(61, 41, 20, 0.7)',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleTitleSubmit}
                  disabled={!title.trim()}
                  whileHover={{ scale: title.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: title.trim() ? 0.98 : 1 }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: isDark 
                      ? 'linear-gradient(135deg, #003040 0%, #006080 100%)'
                      : 'linear-gradient(135deg, #C2986C 0%, #D4A574 100%)',
                    color: '#ffffff',
                    boxShadow: title.trim() 
                      ? (isDark ? '0 0 20px rgba(0, 212, 255, 0.3)' : '0 0 20px rgba(139, 105, 20, 0.3)')
                      : 'none',
                  }}
                >
                  Save Recording
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
