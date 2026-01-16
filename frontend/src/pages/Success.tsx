import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageTransition } from '../App';
import { useTheme } from '../context/ThemeContext';

export default function Success() {
  const navigate = useNavigate();
  const { startTransition } = usePageTransition();
  const { isDark } = useTheme();

  const handleNavigate = (path: string) => {
    startTransition(() => navigate(path));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 transition-colors duration-500" style={{ background: isDark ? '#000000' : '#F5E6D3', color: isDark ? '#ffffff' : '#3D2914' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative text-center max-w-md"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          className="mb-10 inline-flex"
        >
          <div className="relative">
            <motion.div
              className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 0 60px rgba(16, 185, 129, 0.2)',
              }}
            >
              <CheckCircle className="w-14 h-14 text-emerald-400" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-amber-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-3xl md:text-4xl font-semibold mb-4"
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
          Reflection Saved
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-10"
          style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(61, 41, 20, 0.6)' }}
        >
          Your audio has been transcribed and analyzed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            onClick={() => handleNavigate('/dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.7)',
            }}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </motion.button>
          
          <motion.button
            onClick={() => handleNavigate('/summary')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: isDark 
                ? 'linear-gradient(135deg, #003040 0%, #006080 100%)'
                : 'linear-gradient(135deg, #C2986C 0%, #D4A574 100%)',
              border: isDark ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(139, 105, 20, 0.3)',
              boxShadow: isDark ? '0 0 30px rgba(0, 212, 255, 0.2)' : '0 0 30px rgba(139, 105, 20, 0.2)',
            }}
          >
            Go to Summary
            <ArrowRight className="w-4 h-4" style={{ color: isDark ? '#00d4ff' : '#ffffff' }} />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-4 rounded-xl"
          style={{
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <p 
            className="text-sm"
            style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.5)' }}
          >
            Record daily to build a complete picture of your week
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
