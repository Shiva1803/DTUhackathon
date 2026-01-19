import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Mic, BarChart3, List, MessageSquare, Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';
import { usePageTransition } from '../App';
import { useTheme } from '../context/ThemeContext';

// Generate stars
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.5 + 0.2,
    depth: Math.random(),
  }));
};

const stars = generateStars(100);

// Pre-generated desert theme particles
const desertDustParticles = Array.from({ length: 80 }, (_, i) => {
  // Pre-computed pseudo-random values
  const seed1 = ((i * 7919) % 100) / 100;
  const seed2 = ((i * 104729) % 100) / 100;
  const seed3 = ((i * 13) % 100) / 100;
  const seed4 = ((i * 31) % 100) / 100;
  const seed5 = ((i * 47) % 100) / 100;
  const seed6 = ((i * 59) % 100) / 100;
  const seed7 = ((i * 71) % 100) / 100;
  const seed8 = ((i * 83) % 100) / 100;
  return {
    id: i,
    left: -10 - seed1 * 20,
    top: seed2 * 100,
    width: seed3 * 5 + 2,
    height: seed4 * 5 + 2,
    bgOpacity: seed5 * 0.5 + 0.2,
    boxShadowSize: seed6 * 6 + 3,
    yMid1: seed7 * 40 - 20,
    yMid2: seed8 * -40 + 20,
    duration: 6 + seed1 * 10,
    delay: seed2 * 8,
  };
});

const desertWisps = Array.from({ length: 15 }, (_, i) => {
  const seed1 = ((i * 7919) % 100) / 100;
  const seed2 = ((i * 104729) % 100) / 100;
  const seed3 = ((i * 13) % 100) / 100;
  const seed4 = ((i * 31) % 100) / 100;
  return {
    id: i,
    top: 10 + seed1 * 80,
    width: 80 + seed2 * 250,
    height: 2 + seed3 * 3,
    duration: 5 + seed4 * 7,
    delay: seed1 * 6,
  };
});

const desertClouds = Array.from({ length: 10 }, (_, i) => {
  const seed1 = ((i * 7919) % 100) / 100;
  const seed2 = ((i * 104729) % 100) / 100;
  return {
    id: i,
    width: 200 + seed1 * 200,
    height: 50 + seed2 * 50,
  };
});

const desertMotes = Array.from({ length: 50 }, (_, i) => {
  const seed1 = ((i * 7919) % 100) / 100;
  const seed2 = ((i * 104729) % 100) / 100;
  const seed3 = ((i * 13) % 100) / 100;
  const seed4 = ((i * 31) % 100) / 100;
  const seed5 = ((i * 47) % 100) / 100;
  const seed6 = ((i * 59) % 100) / 100;
  return {
    id: i,
    left: seed1 * 100,
    top: seed2 * 100,
    width: seed3 * 3 + 1,
    height: seed4 * 3 + 1,
    bgOpacity: seed5 * 0.4 + 0.15,
    duration: 12 + seed6 * 15,
    delay: seed1 * 10,
  };
});

// Navigation card with flicker effect
interface NavCardProps {
  path: string;
  icon: React.ElementType;
  title: string;
  description: string;
  gradientDark: string;
  gradientLight: string;
  delay: number;
  onNavigate: (path: string) => void;
  isDark: boolean;
}

function NavCard({ path, icon: Icon, title, description, gradientDark, gradientLight, delay, onNavigate, isDark }: NavCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const gradient = isDark ? gradientDark : gradientLight;
  const accentColor = isDark ? '#00d4ff' : '#8B6914';
  const accentRgb = isDark ? '0, 212, 255' : '139, 105, 20';

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
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onNavigate(path)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative p-6 rounded-2xl text-left overflow-hidden cursor-pointer transition-colors duration-500"
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated border with flicker */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)'}` }}
        animate={
          isHovered
            ? isGlowing
              ? { 
                  borderColor: `rgba(${accentRgb}, 0.4)`,
                  boxShadow: `0 0 30px rgba(${accentRgb}, 0.2), inset 0 0 30px rgba(${accentRgb}, 0.05)`,
                }
              : {
                  borderColor: [
                    isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
                    `rgba(${accentRgb}, 0.5)`,
                    isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
                    `rgba(${accentRgb}, 0.4)`,
                  ],
                  boxShadow: [
                    `0 0 0px rgba(${accentRgb}, 0)`,
                    `0 0 25px rgba(${accentRgb}, 0.3)`,
                    `0 0 5px rgba(${accentRgb}, 0.1)`,
                    `0 0 20px rgba(${accentRgb}, 0.25)`,
                  ],
                }
            : { 
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)', 
                boxShadow: `0 0 0px rgba(${accentRgb}, 0)` 
              }
        }
        transition={isHovered && !isGlowing ? { duration: 0.67, ease: 'linear' } : { duration: 0.3 }}
      />

      {/* Hover gradient overlay */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl`}
        animate={{ opacity: isHovered && isGlowing ? 0.15 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 50%, rgba(${accentRgb}, 0.1) 0%, transparent 70%)` }}
        animate={{ opacity: isHovered && isGlowing ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon with flicker */}
        <motion.div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient}`}
          animate={
            isHovered
              ? isGlowing
                ? { boxShadow: `0 0 25px rgba(${accentRgb}, 0.4)` }
                : {
                    boxShadow: [
                      `0 0 10px rgba(${accentRgb}, 0.2)`,
                      `0 0 30px rgba(${accentRgb}, 0.5)`,
                      `0 0 10px rgba(${accentRgb}, 0.2)`,
                      `0 0 25px rgba(${accentRgb}, 0.4)`,
                    ],
                  }
              : { boxShadow: `0 0 20px rgba(${accentRgb}, 0.2)` }
          }
          transition={isHovered && !isGlowing ? { duration: 0.67, ease: 'linear' } : { duration: 0.3 }}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>

        {/* Title with flicker */}
        <motion.h3
          className="text-xl font-semibold mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          animate={
            isHovered
              ? isGlowing
                ? { color: accentColor, textShadow: `0 0 20px rgba(${accentRgb}, 0.5)` }
                : {
                    color: [isDark ? '#ffffff' : '#3D2914', accentColor, isDark ? '#ffffff' : '#3D2914', accentColor],
                    textShadow: [
                      `0 0 0px rgba(${accentRgb}, 0)`,
                      `0 0 15px rgba(${accentRgb}, 0.6)`,
                      `0 0 5px rgba(${accentRgb}, 0.2)`,
                      `0 0 12px rgba(${accentRgb}, 0.5)`,
                    ],
                  }
              : { color: isDark ? '#ffffff' : '#3D2914', textShadow: `0 0 0px rgba(${accentRgb}, 0)` }
          }
          transition={isHovered && !isGlowing ? { duration: 0.67, ease: 'linear' } : { duration: 0.3 }}
        >
          {title}
        </motion.h3>

        <p
          className="text-sm mb-4 transition-colors duration-500"
          style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(61, 41, 20, 0.6)' }}
        >
          {description}
        </p>

        {/* Arrow */}
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: accentColor }}>Open</span>
          <motion.div
            animate={isHovered && isGlowing ? { x: [0, 4, 0] } : { x: 0 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowRight className="w-4 h-4" style={{ color: accentColor }} />
          </motion.div>
        </motion.div>
      </div>

      {/* Corner decoration */}
      <motion.div
        className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, rgba(${accentRgb}, 0.15) 0%, transparent 70%)` }}
        animate={{ opacity: isHovered && isGlowing ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}


// Theme Toggle Slider Component
function ThemeToggleSlider({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="flex items-center justify-center gap-4 mt-10"
    >
      <Sun className={`w-5 h-5 transition-colors duration-300 ${!isDark ? 'text-amber-500' : 'text-gray-500'}`} />
      
      <button
        onClick={onToggle}
        className="relative w-16 h-8 rounded-full transition-colors duration-500 p-1"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #003040 0%, #006080 100%)'
            : 'linear-gradient(135deg, #C2986C 0%, #D4A574 100%)',
          boxShadow: isDark 
            ? '0 0 20px rgba(0, 212, 255, 0.3), inset 0 2px 4px rgba(0,0,0,0.3)'
            : '0 0 20px rgba(194, 152, 108, 0.4), inset 0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <motion.div
          className="w-6 h-6 rounded-full bg-white shadow-lg"
          animate={{ x: isDark ? 32 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            boxShadow: isDark 
              ? '0 0 10px rgba(0, 212, 255, 0.5)'
              : '0 0 10px rgba(194, 152, 108, 0.5)',
          }}
        />
      </button>
      
      <Moon className={`w-5 h-5 transition-colors duration-300 ${isDark ? 'text-[#00d4ff]' : 'text-gray-400'}`} />
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { startTransition } = usePageTransition();
  const { isDark, toggleTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  useSpring(mouseY, springConfig); // Used for parallax effect

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

  const handleNavigate = (path: string) => {
    startTransition(() => navigate(path));
  };

  const navCards = [
    { path: '/log', icon: Mic, title: 'Daily Log', description: 'Record your daily reflection',
      gradientDark: 'from-[#003040] to-[#006080]', gradientLight: 'from-[#C2986C] to-[#D4A574]', delay: 0.1 },
    { path: '/logs', icon: List, title: 'History', description: 'View past recordings',
      gradientDark: 'from-[#004050] to-[#007090]', gradientLight: 'from-[#B8956A] to-[#CCA870]', delay: 0.2 },
    { path: '/summary', icon: BarChart3, title: 'Summary', description: 'Weekly insights & analytics',
      gradientDark: 'from-[#005060] to-[#0080a0]', gradientLight: 'from-[#A88A5B] to-[#C49B6C]', delay: 0.3 },
    { path: '/chat', icon: MessageSquare, title: 'AI Coach', description: 'Get personalized guidance',
      gradientDark: 'from-[#006070] to-[#0090b0]', gradientLight: 'from-[#9A7B4F] to-[#B8956A]', delay: 0.4 },
  ];

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const accentColor = isDark ? '#00d4ff' : '#8B6914';

  // Pre-compute transforms (hooks must be called unconditionally)
  const auroraX1 = useTransform(smoothMouseX, [-1, 1], [-50, 50]);
  const auroraX2 = useTransform(smoothMouseX, [-1, 1], [30, -30]);
  const desertX1 = useTransform(smoothMouseX, [-1, 1], [-20, 20]);
  const desertX2 = useTransform(smoothMouseX, [-1, 1], [30, -30]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-hidden transition-colors duration-500"
      style={{ background: isDark ? '#000000' : '#F5E6D3' }}
      onMouseMove={handleMouseMove}
    >
      {/* Dark theme: Aurora Background */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[200%] h-[60%] -top-[20%] -left-[50%]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(0, 100, 120, 0.15) 30%, rgba(0, 212, 255, 0.1) 50%, rgba(0, 150, 180, 0.08) 70%, transparent 100%)',
              filter: 'blur(60px)', borderRadius: '50%',
              x: auroraX1,
            }}
            animate={{ rotate: [0, 5, -5, 0], scaleX: [1, 1.1, 0.95, 1], y: [0, 30, -20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[180%] h-[50%] top-[10%] -left-[40%]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(0, 60, 80, 0.2) 40%, rgba(0, 180, 200, 0.12) 60%, transparent 100%)',
              filter: 'blur(80px)', borderRadius: '50%',
              x: auroraX2,
            }}
            animate={{ rotate: [0, -8, 8, 0], scaleX: [1, 0.9, 1.15, 1], y: [0, -40, 20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          {stars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size,
              }}
              animate={{ 
                opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
                x: [10 + star.depth * 25, -10 - star.depth * 25],
              }}
              transition={{ duration: star.duration, delay: star.delay, repeat: Infinity }}
            />
          ))}
        </div>
      )}

      {/* Light theme: Desert heat waves + Dust particles */}
      {!isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-full h-[40%] bottom-0"
            style={{
              background: 'linear-gradient(0deg, rgba(210, 180, 140, 0.3) 0%, rgba(245, 230, 211, 0.1) 50%, transparent 100%)',
              x: desertX1,
            }}
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[150%] h-[30%] top-[20%] -left-[25%]"
            style={{
              background: 'radial-gradient(ellipse, rgba(194, 152, 108, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
              x: desertX2,
            }}
            animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Dust particles - darker brown */}
          {desertDustParticles.map((particle) => (
            <motion.div
              key={`dust-${particle.id}`}
              className="absolute rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: particle.width,
                height: particle.height,
                background: `rgba(101, 67, 33, ${particle.bgOpacity})`,
                boxShadow: `0 0 ${particle.boxShadowSize}px rgba(101, 67, 33, 0.4)`,
              }}
              animate={{
                x: ['0vw', '120vw'],
                y: [0, particle.yMid1, particle.yMid2, 0],
                opacity: [0, 0.6, 0.5, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
          
          {/* Sand wisps - darker */}
          {desertWisps.map((wisp) => (
            <motion.div
              key={`wisp-${wisp.id}`}
              className="absolute"
              style={{
                top: `${wisp.top}%`,
                left: '-20%',
                width: wisp.width,
                height: wisp.height,
                background: 'linear-gradient(90deg, transparent, rgba(139, 90, 43, 0.4), rgba(101, 67, 33, 0.3), transparent)',
                filter: 'blur(2px)',
                borderRadius: '50%',
              }}
              animate={{
                x: ['0vw', '140vw'],
                opacity: [0, 0.7, 0.5, 0],
              }}
              transition={{
                duration: wisp.duration,
                delay: wisp.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
          
          {/* Larger dust clouds - darker brown */}
          {desertClouds.map((cloud) => (
            <motion.div
              key={`cloud-${cloud.id}`}
              className="absolute"
              style={{
                top: `${10 + cloud.id * 9}%`,
                left: '-30%',
                width: cloud.width,
                height: cloud.height,
                background: 'radial-gradient(ellipse, rgba(139, 90, 43, 0.15) 0%, transparent 70%)',
                filter: 'blur(12px)',
                borderRadius: '50%',
              }}
              animate={{
                x: ['0vw', '160vw'],
              }}
              transition={{
                duration: 15 + cloud.id * 3,
                delay: cloud.id * 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
          
          {/* Extra fine dust motes */}
          {desertMotes.map((mote) => (
            <motion.div
              key={`mote-${mote.id}`}
              className="absolute rounded-full"
              style={{
                left: `${mote.left}%`,
                top: `${mote.top}%`,
                width: mote.width,
                height: mote.height,
                background: `rgba(120, 80, 40, ${mote.bgOpacity})`,
              }}
              animate={{
                x: [0, 40, -30, 50, 0],
                y: [0, -50, 30, -40, 0],
                opacity: [0.2, 0.5, 0.3, 0.4, 0.2],
              }}
              transition={{
                duration: mote.duration,
                delay: mote.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Header section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          {/* Greeting badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 transition-colors duration-500"
            style={{
              background: isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(194, 152, 108, 0.2)',
              border: isDark ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid rgba(194, 152, 108, 0.3)',
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
            <span className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: accentColor }}>
              Welcome back
            </span>
          </motion.div>

          {/* Main heading */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-4"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              ...(isDark ? {
                background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 50%, #00d4ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              } : {
                color: '#3D2914',
              }),
            }}
          >
            Hello, {firstName}
          </h1>

          <p
            className="text-lg md:text-xl max-w-md mx-auto transition-colors duration-500"
            style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(61, 41, 20, 0.6)' }}
          >
            What would you like to do today?
          </p>
        </motion.div>

        {/* Navigation cards grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl"
        >
          {navCards.map((card) => (
            <NavCard key={card.path} {...card} onNavigate={handleNavigate} isDark={isDark} />
          ))}
        </motion.div>

        {/* Theme Toggle Slider */}
        <ThemeToggleSlider isDark={isDark} onToggle={toggleTheme} />

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full transition-colors duration-500"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.5)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span
              className="text-sm transition-colors duration-500"
              style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(61, 41, 20, 0.6)' }}
            >
              Your growth journey continues
            </span>
          </div>
        </motion.div>
      </main>

      {/* Decorative orbiting rings - dark mode only */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            className="absolute w-[800px] h-[800px] rounded-full"
            style={{ border: '1px solid rgba(0, 212, 255, 0.03)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-[1000px] h-[1000px] rounded-full"
            style={{ border: '1px solid rgba(0, 212, 255, 0.02)' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  );
}
