import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { Mic, Brain, LineChart, Loader2, ArrowRight, Zap } from 'lucide-react';

// Generate stars for background
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.7 + 0.3,
    depth: Math.random(),
  }));
};

const stars = generateStars(150);

// Component for parallax stars - hooks called at component level
function ParallaxStar({ 
  star, 
  smoothMouseX, 
  smoothMouseY 
}: { 
  star: typeof stars[0]; 
  smoothMouseX: MotionValue<number>; 
  smoothMouseY: MotionValue<number>;
}) {
  const parallaxStrength = 10 + star.depth * 25;
  const x = useTransform(smoothMouseX, [-1, 1], [parallaxStrength, -parallaxStrength]);
  const y = useTransform(smoothMouseY, [-1, 1], [parallaxStrength, -parallaxStrength]);
  
  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: star.size,
        height: star.size,
        x,
        y,
        boxShadow: star.size > 1.5 ? `0 0 ${star.size * 2}px rgba(255,255,255,0.3)` : 'none',
      }}
      animate={{ opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3] }}
      transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
    />
  );
}

const steps = [
  {
    icon: Mic,
    step: '01',
    title: 'Record Daily',
    description: 'Speak for 60 seconds about your day, thoughts, and feelings.',
  },
  {
    icon: Brain,
    step: '02',
    title: 'AI Analysis',
    description: 'Our AI categorizes, analyzes sentiment, and identifies patterns.',
  },
  {
    icon: LineChart,
    step: '03',
    title: 'Get Insights',
    description: 'Receive weekly summaries with actionable growth recommendations.',
  }
];

export default function Landing() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Pre-compute useTransform calls at component level
  const ambientX1 = useTransform(smoothMouseX, [-1, 1], [30, -30]);
  const ambientY1 = useTransform(smoothMouseY, [-1, 1], [30, -30]);
  const ambientX2 = useTransform(smoothMouseX, [-1, 1], [-20, 20]);
  const ambientY2 = useTransform(smoothMouseY, [-1, 1], [-20, 20]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    loginWithRedirect({ appState: { returnTo: '/dashboard' } });
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 animate-spin text-[#00d4ff]" />
          <span className="text-gray-500 text-sm tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
            {isLoading ? 'Loading...' : 'Redirecting...'}
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-black text-white overflow-hidden"
    >
      {/* Animated star field */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <ParallaxStar 
            key={star.id} 
            star={star} 
            smoothMouseX={smoothMouseX} 
            smoothMouseY={smoothMouseY} 
          />
        ))}
      </div>

      {/* Ambient gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 20% 80%, rgba(0, 60, 80, 0.2) 0%, transparent 50%)',
            x: ambientX1,
            y: ambientY1,
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 80% 20%, rgba(0, 100, 120, 0.15) 0%, transparent 50%)',
            x: ambientX2,
            y: ambientY2,
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-8"
          >
            <span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{
                background: 'rgba(0, 212, 255, 0.08)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                color: '#00d4ff',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <Zap className="w-4 h-4" />
              AI-Powered Personal Growth
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold mb-6 leading-[1.1] tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 40%, #00d4ff 70%, #ffffff 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Transform Your Daily
            <br />
            Reflections Into Growth
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Speak for 60 seconds a day. Let AI uncover patterns, track your progress, 
            and guide your personal development journey.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <motion.button
              onClick={handleLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium text-lg overflow-hidden"
              style={{
                fontFamily: "'Inter', sans-serif",
                background: 'linear-gradient(135deg, #003040 0%, #006080 100%)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)',
              }}
            >
              <span className="relative z-10 text-white">Get Started Free</span>
              <ArrowRight className="w-5 h-5 text-[#00d4ff] group-hover:translate-x-1 transition-transform" />
              
              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, #004050 0%, #007090 100%)',
                }}
              />
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full flex items-start justify-center p-2"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <motion.div 
              className="w-1 h-2 rounded-full"
              style={{ background: '#00d4ff' }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              How It Works
            </h2>
            <p 
              className="text-lg max-w-xl mx-auto"
              style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.4)' }}
            >
              Three simple steps to unlock your potential
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                className="group relative"
              >
                <div
                  className="relative p-8 rounded-3xl h-full transition-all duration-500"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {/* Step number */}
                  <div 
                    className="absolute -top-4 -left-2 text-6xl font-bold opacity-10"
                    style={{ 
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: '#00d4ff',
                    }}
                  >
                    {item.step}
                  </div>

                  {/* Icon */}
                  <motion.div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,150,180,0.05) 100%)',
                      border: '1px solid rgba(0,212,255,0.15)',
                    }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,212,255,0.2)' }}
                  >
                    <item.icon className="w-6 h-6 text-[#00d4ff]" />
                  </motion.div>

                  <h3 
                    className="text-xl font-semibold mb-3 text-white"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="leading-relaxed"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.5)' }}
                  >
                    {item.description}
                  </p>

                  {/* Hover border glow */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      border: '1px solid rgba(0,212,255,0.2)',
                      boxShadow: '0 0 30px rgba(0,212,255,0.1)',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #003040 0%, #006080 100%)',
                }}
              >
                <svg viewBox="0 0 32 32" className="w-5 h-5">
                  <path
                    d="M10 26V6h8a8 8 0 0 1 0 16h-8"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span 
                className="font-semibold text-lg"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Parallax
              </span>
            </div>

            <p 
              className="text-sm"
              style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.3)' }}
            >
              © 2026 Parallax. Shift your perspective.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
