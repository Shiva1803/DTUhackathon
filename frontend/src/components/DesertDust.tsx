import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Generate dust particles
const generateDustParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: -10 - Math.random() * 20,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.4 + 0.1,
    drift: Math.random() * 30 - 15,
  }));
};

// Generate sand wisps
const generateSandWisps = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 20 + Math.random() * 60,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 5,
    height: 1 + Math.random() * 2,
    width: 100 + Math.random() * 200,
  }));
};

// Generate swirling dust motes
const generateDustMotes = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.3 + 0.1,
  }));
};

const dustParticles = generateDustParticles(50);
const sandWisps = generateSandWisps(12);
const dustMotes = generateDustMotes(30);

export default function DesertDust() {
  const { isDark } = useTheme();

  if (isDark) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {/* Desert gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,235,205,0.1) 0%, rgba(210,180,140,0.05) 50%, rgba(194,154,108,0.1) 100%)',
        }}
      />

      {/* Floating dust motes that swirl */}
      {dustMotes.map((mote) => (
        <motion.div
          key={`mote-${mote.id}`}
          className="absolute rounded-full"
          style={{
            left: `${mote.x}%`,
            top: `${mote.y}%`,
            width: mote.size,
            height: mote.size,
            background: `rgba(160, 130, 90, ${mote.opacity})`,
            boxShadow: `0 0 ${mote.size * 3}px rgba(160, 130, 90, ${mote.opacity * 0.5})`,
          }}
          animate={{
            x: [0, 30, -20, 40, 0],
            y: [0, -40, 20, -30, 0],
            opacity: [mote.opacity, mote.opacity * 1.5, mote.opacity * 0.5, mote.opacity * 1.2, mote.opacity],
          }}
          transition={{
            duration: mote.duration,
            delay: mote.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Dust particles blowing across */}
      {dustParticles.map((particle) => (
        <motion.div
          key={`dust-${particle.id}`}
          className="absolute rounded-full"
          style={{
            left: `${particle.startX}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `rgba(180, 150, 100, ${particle.opacity})`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(180, 150, 100, ${particle.opacity * 0.5})`,
          }}
          animate={{
            x: ['0vw', '120vw'],
            y: [0, particle.drift, -particle.drift, particle.drift * 0.5, 0],
            opacity: [0, particle.opacity, particle.opacity, particle.opacity * 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Sand wisps / streaks */}
      {sandWisps.map((wisp) => (
        <motion.div
          key={`wisp-${wisp.id}`}
          className="absolute"
          style={{
            top: `${wisp.y}%`,
            left: '-20%',
            width: wisp.width,
            height: wisp.height,
            background: 'linear-gradient(90deg, transparent, rgba(210, 180, 140, 0.3), rgba(180, 150, 100, 0.2), transparent)',
            filter: 'blur(2px)',
            borderRadius: '50%',
          }}
          animate={{
            x: ['0vw', '140vw'],
            opacity: [0, 0.6, 0.4, 0],
          }}
          transition={{
            duration: wisp.duration,
            delay: wisp.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Larger dust clouds */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute"
          style={{
            top: `${15 + i * 10}%`,
            left: '-30%',
            width: 300 + Math.random() * 200,
            height: 80 + Math.random() * 60,
            background: 'radial-gradient(ellipse, rgba(210, 180, 140, 0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
            borderRadius: '50%',
          }}
          animate={{
            x: ['0vw', '160vw'],
          }}
          transition={{
            duration: 18 + i * 4,
            delay: i * 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Dust devils / small swirls */}
      {Array.from({ length: 4 }, (_, i) => (
        <motion.div
          key={`devil-${i}`}
          className="absolute"
          style={{
            bottom: `${10 + i * 15}%`,
            left: `${20 + i * 20}%`,
            width: 40 + i * 10,
            height: 80 + i * 20,
            background: 'linear-gradient(0deg, rgba(194, 152, 108, 0.2) 0%, transparent 100%)',
            filter: 'blur(8px)',
            borderRadius: '50% 50% 0 0',
          }}
          animate={{
            opacity: [0, 0.4, 0.6, 0.3, 0],
            scale: [0.8, 1.2, 1, 1.1, 0.8],
            x: [0, 50, -30, 80, 0],
          }}
          transition={{
            duration: 12 + i * 3,
            delay: i * 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Heat shimmer effect at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(0deg, rgba(255, 235, 205, 0.2) 0%, transparent 100%)',
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Additional heat distortion waves */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background: 'linear-gradient(0deg, rgba(210, 180, 140, 0.1) 0%, transparent 100%)',
        }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scaleY: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
    </div>
  );
}
