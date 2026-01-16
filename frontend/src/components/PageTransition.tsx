import { motion, AnimatePresence } from 'framer-motion';

// Black Hole Loader Component (reused from splash)
function BlackHoleLoader({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const scale = size === 'sm' ? 0.5 : 0.7;
  
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ 
        width: 200 * scale, 
        height: 200 * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'center',
      }}
    >
      {/* Outer accretion disk rings */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: 180 - i * 30,
            height: 180 - i * 30,
            border: `${1 + i * 0.3}px solid transparent`,
            borderTopColor: `rgba(0, 212, 255, ${0.15 + i * 0.1})`,
            borderRightColor: `rgba(0, 180, 220, ${0.08 + i * 0.06})`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5 - i * 0.3, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Gravitational lensing glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 100,
          height: 100,
          background: 'radial-gradient(circle, transparent 30%, rgba(0,212,255,0.15) 50%, transparent 70%)',
          filter: 'blur(6px)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Swirling particles */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 45 + Math.random() * 20;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{ backgroundColor: '#00d4ff', boxShadow: '0 0 4px rgba(0,212,255,0.6)' }}
            animate={{
              x: [Math.cos(angle) * radius, Math.cos(angle + Math.PI) * (radius * 0.2), Math.cos(angle) * radius],
              y: [Math.sin(angle) * radius, Math.sin(angle + Math.PI) * (radius * 0.2), Math.sin(angle) * radius],
              scale: [1, 0.3, 1],
              opacity: [0.8, 0.2, 0.8],
            }}
            transition={{ duration: 1.5 + Math.random() * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
          />
        );
      })}

      {/* Event horizon */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 40,
          height: 40,
          background: 'radial-gradient(circle, #000 0%, #000 60%, rgba(0,0,0,0.9) 100%)',
          boxShadow: '0 0 20px 8px rgba(0,0,0,0.8), inset 0 0 15px 8px rgba(0,0,0,1)',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Photon sphere */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 52,
          height: 52,
          border: '1.5px solid transparent',
          background: 'linear-gradient(#000, #000) padding-box, linear-gradient(135deg, rgba(0,212,255,0.8), rgba(0,150,180,0.4), rgba(0,212,255,0.8)) border-box',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 60,
          height: 60,
          background: 'radial-gradient(circle, transparent 50%, rgba(0,212,255,0.2) 60%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

interface PageTransitionProps {
  isLoading: boolean;
}

export default function PageTransition({ isLoading }: PageTransitionProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.95)' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <BlackHoleLoader size="md" />
            <motion.p
              className="mt-6 text-sm tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.4)' }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
