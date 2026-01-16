import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Generate random stars with depth layers
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.8 + 0.2,
    depth: Math.random(), // 0 = far (moves less), 1 = close (moves more)
  }));
};

// Generate shooting stars
const generateShootingStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: Math.random() * 100,
    startY: Math.random() * 40,
    duration: Math.random() * 1.2 + 0.8,
    delay: Math.random() * 6 + i * 3,
  }));
};

const stars = generateStars(250);
const shootingStars = generateShootingStars(4);

interface SplashScreenProps {
  onComplete?: () => void;
}

// Black Hole Loader Component
function BlackHoleLoader() {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer accretion disk rings */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: 200 - i * 25,
            height: 200 - i * 25,
            border: `${1 + i * 0.3}px solid transparent`,
            borderTopColor: `rgba(0, 212, 255, ${0.1 + i * 0.08})`,
            borderRightColor: `rgba(0, 180, 220, ${0.05 + i * 0.05})`,
            filter: `blur(${i * 0.5}px)`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3 - i * 0.3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Gravitational lensing effect - outer glow */}
      <motion.div
        className="absolute w-40 h-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(0,212,255,0.12) 50%, rgba(0,150,180,0.08) 70%, transparent 100%)',
          filter: 'blur(8px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Swirling matter particles */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 60 + Math.random() * 30;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: '#00d4ff',
              boxShadow: '0 0 4px 1px rgba(0,212,255,0.6)',
            }}
            animate={{
              x: [
                Math.cos(angle) * radius,
                Math.cos(angle + Math.PI) * (radius * 0.3),
                Math.cos(angle) * radius,
              ],
              y: [
                Math.sin(angle) * radius,
                Math.sin(angle + Math.PI) * (radius * 0.3),
                Math.sin(angle) * radius,
              ],
              scale: [1, 0.3, 1],
              opacity: [0.8, 0.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.1,
            }}
          />
        );
      })}

      {/* Event horizon - the black center */}
      <motion.div
        className="absolute w-16 h-16 rounded-full"
        style={{
          background: 'radial-gradient(circle, #000000 0%, #000000 60%, rgba(0,0,0,0.9) 100%)',
          boxShadow: `
            0 0 30px 10px rgba(0,0,0,0.8),
            0 0 60px 20px rgba(0,0,0,0.6),
            inset 0 0 20px 10px rgba(0,0,0,1)
          `,
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Photon sphere - bright ring around event horizon */}
      <motion.div
        className="absolute w-20 h-20 rounded-full"
        style={{
          border: '2px solid transparent',
          background: 'linear-gradient(#000, #000) padding-box, linear-gradient(135deg, rgba(0,212,255,0.8), rgba(0,150,180,0.4), rgba(0,212,255,0.8)) border-box',
          filter: 'blur(1px)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner glow ring */}
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        style={{
          background: 'radial-gradient(circle, transparent 50%, rgba(0,212,255,0.25) 60%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Light bending streaks */}
      {[...Array(8)].map((_, i) => {
        const rotation = (i / 8) * 360;
        return (
          <motion.div
            key={`streak-${i}`}
            className="absolute"
            style={{
              width: 2,
              height: 40,
              background: 'linear-gradient(to top, transparent, rgba(0,212,255,0.5), transparent)',
              transformOrigin: 'center 60px',
              rotate: rotation,
              filter: 'blur(1px)',
            }}
            animate={{ opacity: [0.2, 0.6, 0.2], scaleY: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        );
      })}

      {/* Hawking radiation particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`hawking-${i}`}
          className="absolute w-0.5 h-0.5 rounded-full bg-white"
          style={{ boxShadow: '0 0 3px 1px rgba(0,212,255,0.5)' }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, (Math.random() - 0.5) * 150],
            y: [0, (Math.random() - 0.5) * 150],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.25,
          }}
        />
      ))}
    </div>
  );
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'splash' | 'loading' | 'exit'>('splash');
  const [isHovered, setIsHovered] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Handle mouse move for parallax effect
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

  const handleGetStarted = () => {
    setPhase('loading');
  };

  useEffect(() => {
    if (phase === 'loading') {
      const timer = setTimeout(() => setPhase('exit'), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'exit') {
      const timer = setTimeout(() => onComplete?.(), 800);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsGlowing(false);
    setTimeout(() => setIsGlowing(true), 670);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsGlowing(false);
  };

  return (
    <AnimatePresence>
      {phase !== 'exit' || true ? (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'exit' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden cursor-default"
          style={{ background: '#000000' }}
          onMouseMove={handleMouseMove}
          onAnimationComplete={() => {
            if (phase === 'exit') onComplete?.();
          }}
        >
          {/* Nebula accents */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 15% 85%, rgba(0, 60, 80, 0.3) 0%, transparent 50%)',
                x: useTransform(smoothMouseX, [-1, 1], [20, -20]),
                y: useTransform(smoothMouseY, [-1, 1], [20, -20]),
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              transition={{ duration: 3 }}
            />
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 85% 15%, rgba(0, 100, 120, 0.2) 0%, transparent 50%)',
                x: useTransform(smoothMouseX, [-1, 1], [-15, 15]),
                y: useTransform(smoothMouseY, [-1, 1], [-15, 15]),
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 3, delay: 0.5 }}
            />
          </div>

          {/* Parallax star field */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map((star) => {
              const parallaxStrength = 15 + star.depth * 35; // 15-50px movement based on depth
              return (
                <motion.div
                  key={star.id}
                  className="absolute rounded-full"
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: star.size,
                    height: star.size,
                    backgroundColor: '#ffffff',
                    boxShadow: star.size > 1.5 
                      ? `0 0 ${star.size * 2}px ${star.size * 0.5}px rgba(255,255,255,0.3)` 
                      : 'none',
                    x: useTransform(smoothMouseX, [-1, 1], [parallaxStrength, -parallaxStrength]),
                    y: useTransform(smoothMouseY, [-1, 1], [parallaxStrength, -parallaxStrength]),
                  }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, star.opacity, star.opacity * 0.3, star.opacity],
                  }}
                  transition={{
                    duration: star.duration,
                    delay: star.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
          </div>

          {/* Shooting stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {shootingStars.map((star) => (
              <motion.div
                key={`shooting-${star.id}`}
                className="absolute h-[1px] w-[80px]"
                style={{
                  left: `${star.startX}%`,
                  top: `${star.startY}%`,
                  background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), rgba(255,255,255,0.9))',
                  borderRadius: '100px',
                  boxShadow: '0 0 6px 1px rgba(0,212,255,0.4)',
                }}
                initial={{ x: 0, y: 0, opacity: 0, rotate: 35 }}
                animate={{
                  x: [0, 350],
                  y: [0, 220],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: star.duration,
                  delay: star.delay,
                  repeat: Infinity,
                  repeatDelay: 10,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Central content */}
          <div className="relative z-10 flex flex-col items-center px-6">
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(0,80,100,0.12) 0%, transparent 70%)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            />

            <AnimatePresence mode="wait">
              {phase === 'splash' && (
                <motion.div
                  key="splash"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <div
                    className="relative px-12 sm:px-20 py-16 rounded-[2.5rem] border border-white/[0.06] overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                      backdropFilter: 'blur(40px)',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 25px 50px -12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.03)',
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-30 pointer-events-none"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)' }}
                    />

                    <motion.div className="relative flex flex-col items-center">
                      <motion.div
                        className="relative mb-10"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <motion.div
                          className="absolute inset-[-16px] rounded-full"
                          style={{ border: '1px solid rgba(0,212,255,0.2)' }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          className="absolute inset-[-32px] rounded-full"
                          style={{ border: '1px solid rgba(0,212,255,0.1)' }}
                          animate={{ rotate: -360 }}
                          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                        />

                        <div
                          className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, #003040 0%, #006080 50%, #00a0c0 100%)',
                            boxShadow: '0 0 40px 8px rgba(0,212,255,0.25), 0 0 80px 16px rgba(0,150,180,0.15)',
                          }}
                        >
                          <motion.div className="absolute inset-0 rounded-2xl overflow-hidden">
                            <motion.div
                              className="absolute inset-0"
                              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)' }}
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                            />
                          </motion.div>
                          
                          <svg viewBox="0 0 32 32" className="w-10 h-10 relative z-10">
                            <defs>
                              <linearGradient id="pGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
                              </linearGradient>
                            </defs>
                            <motion.path
                              d="M10 26V6h8a8 8 0 0 1 0 16h-8"
                              fill="none"
                              stroke="url(#pGradient)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, delay: 0.6, ease: 'easeInOut' }}
                            />
                          </svg>
                        </div>

                        <motion.div
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{ background: 'linear-gradient(135deg, #003040 0%, #00a0c0 100%)', filter: 'blur(25px)' }}
                          animate={{ opacity: [0.3, 0.5, 0.3] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </motion.div>

                      <div className="mb-4 overflow-hidden">
                        <motion.h1
                          className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight"
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 35%, #00d4ff 60%, #ffffff 100%)',
                            backgroundSize: '200% 200%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em',
                          }}
                          initial={{ y: 60, opacity: 0 }}
                          animate={{ y: 0, opacity: 1, backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                          transition={{
                            y: { duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 1, delay: 0.8 },
                            backgroundPosition: { duration: 8, repeat: Infinity, ease: 'linear' },
                          }}
                        >
                          Parallax
                        </motion.h1>
                      </div>

                      <motion.p
                        className="text-sm sm:text-base font-light tracking-[0.25em] uppercase"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          background: 'linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.35) 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        Shift Your Perspective
                      </motion.p>
                    </motion.div>

                    <motion.div
                      className="mt-12 flex justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.button
                        onClick={handleGetStarted}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        className="group relative px-10 py-4 rounded-full overflow-hidden cursor-pointer"
                        style={{ background: 'transparent' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Animated border */}
                        <motion.div
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{
                            border: '1px solid',
                            borderColor: 'rgba(255,255,255,0.1)',
                          }}
                          animate={
                            isHovered
                              ? isGlowing
                                ? { borderColor: '#00d4ff', boxShadow: '0 0 20px 2px rgba(0,212,255,0.4), inset 0 0 20px 2px rgba(0,212,255,0.1)' }
                                : { 
                                    borderColor: ['rgba(255,255,255,0.1)', '#00d4ff', 'rgba(255,255,255,0.1)', '#00d4ff', 'rgba(255,255,255,0.1)', '#00d4ff', 'rgba(255,255,255,0.1)', '#00d4ff'],
                                    boxShadow: [
                                      '0 0 0px 0px rgba(0,212,255,0)',
                                      '0 0 25px 3px rgba(0,212,255,0.6)',
                                      '0 0 5px 1px rgba(0,212,255,0.1)',
                                      '0 0 20px 2px rgba(0,212,255,0.5)',
                                      '0 0 0px 0px rgba(0,212,255,0)',
                                      '0 0 25px 3px rgba(0,212,255,0.6)',
                                      '0 0 5px 1px rgba(0,212,255,0.1)',
                                      '0 0 20px 2px rgba(0,212,255,0.4)',
                                    ]
                                  }
                              : { borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 0 0px 0px rgba(0,212,255,0)' }
                          }
                          transition={isHovered && !isGlowing ? { duration: 0.67, ease: 'linear' } : { duration: 0.3 }}
                        />
                        
                        {/* Outer glow on permanent state */}
                        <motion.div
                          className="absolute inset-[-4px] rounded-full pointer-events-none"
                          style={{ 
                            background: 'transparent',
                            boxShadow: '0 0 30px 5px rgba(0,212,255,0.3)',
                          }}
                          animate={{ opacity: isHovered && isGlowing ? 1 : 0 }}
                          transition={{ duration: 0.3 }}
                        />

                        {/* Button text with flicker */}
                        <motion.span 
                          className="relative z-10 flex items-center gap-3 text-base font-medium"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '0.02em',
                          }}
                          animate={
                            isHovered
                              ? isGlowing
                                ? { color: '#00d4ff', textShadow: '0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.4)' }
                                : { 
                                    color: ['rgba(255,255,255,0.75)', '#00d4ff', 'rgba(255,255,255,0.75)', '#00d4ff', 'rgba(255,255,255,0.75)', '#00d4ff', 'rgba(255,255,255,0.75)', '#00d4ff'],
                                    textShadow: [
                                      '0 0 0px rgba(0,212,255,0)',
                                      '0 0 20px rgba(0,212,255,0.9)',
                                      '0 0 5px rgba(0,212,255,0.2)',
                                      '0 0 15px rgba(0,212,255,0.7)',
                                      '0 0 0px rgba(0,212,255,0)',
                                      '0 0 20px rgba(0,212,255,0.9)',
                                      '0 0 5px rgba(0,212,255,0.2)',
                                      '0 0 20px rgba(0,212,255,0.8)',
                                    ]
                                  }
                              : { color: 'rgba(255,255,255,0.75)', textShadow: '0 0 0px rgba(0,212,255,0)' }
                          }
                          transition={isHovered && !isGlowing ? { duration: 0.67, ease: 'linear' } : { duration: 0.3 }}
                        >
                          Get Started
                          {/* Arrow with flicker */}
                          <motion.svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            style={{ filter: isHovered && isGlowing ? 'drop-shadow(0 0 8px rgba(0,212,255,0.8))' : 'none' }}
                            animate={
                              isHovered
                                ? isGlowing
                                  ? { stroke: '#00d4ff', x: [0, 4, 0] }
                                  : { 
                                      stroke: ['rgba(255,255,255,0.6)', '#00d4ff', 'rgba(255,255,255,0.6)', '#00d4ff', 'rgba(255,255,255,0.6)', '#00d4ff', 'rgba(255,255,255,0.6)', '#00d4ff'],
                                    }
                                : { stroke: 'rgba(255,255,255,0.6)', x: 0 }
                            }
                            transition={
                              isHovered && isGlowing 
                                ? { x: { duration: 1, repeat: Infinity, ease: 'easeInOut' }, stroke: { duration: 0.3 } }
                                : isHovered && !isGlowing
                                  ? { duration: 0.67, ease: 'linear' }
                                  : { duration: 0.3 }
                            }
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </motion.svg>
                        </motion.span>
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {phase === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center"
                >
                  <BlackHoleLoader />
                  
                  <motion.p
                    className="mt-8 text-sm font-light tracking-[0.3em] uppercase"
                    style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.4)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: [0.3, 0.6, 0.3], y: 0 }}
                    transition={{ opacity: { duration: 2, repeat: Infinity }, y: { duration: 0.5 } }}
                  >
                    Entering the void
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom ambient glow */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center bottom, rgba(0,150,180,0.1) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
