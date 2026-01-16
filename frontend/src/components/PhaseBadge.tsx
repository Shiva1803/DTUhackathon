import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface PhaseBadgeProps {
  phase: string;
  confidence: number;
}

const phaseColors: Record<string, { from: string; to: string; text: string; lightText: string }> = {
  'Explorer': { from: 'from-blue-500', to: 'to-cyan-400', text: 'text-cyan-400', lightText: '#9B7B8E' },
  'Builder': { from: 'from-purple-500', to: 'to-pink-400', text: 'text-purple-400', lightText: '#9B7B8E' },
  'Optimizer': { from: 'from-green-500', to: 'to-emerald-400', text: 'text-emerald-400', lightText: '#9B7B8E' },
  'Leader': { from: 'from-yellow-500', to: 'to-orange-400', text: 'text-orange-400', lightText: '#9B7B8E' },
  'default': { from: 'from-purple-500', to: 'to-cyan-400', text: 'text-purple-400', lightText: '#9B7B8E' }
};

// Dusty mauve color for light mode
const dustyMauve = '#9B7B8E';
const dustyMauveLight = '#B8A0AD';

export default function PhaseBadge({ phase, confidence }: PhaseBadgeProps) {
  const { isDark } = useTheme();
  const colors = phaseColors[phase] || phaseColors.default;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isDark ? 'currentColor' : dustyMauveLight}
            strokeWidth="6"
            className={isDark ? 'text-gray-700' : ''}
            style={{ opacity: isDark ? 1 : 0.3 }}
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke={isDark ? undefined : dustyMauve}
            className={isDark ? `stroke-current ${colors.text}` : ''}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, delay: 0.3 }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={`text-2xl font-bold ${isDark ? colors.text : ''}`}
            style={{ color: isDark ? undefined : dustyMauve }}
          >
            {confidence}%
          </span>
        </div>
      </div>

      {/* Phase name badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`mt-4 px-6 py-2 rounded-full text-white font-semibold ${isDark ? `bg-gradient-to-r ${colors.from} ${colors.to}` : ''}`}
        style={!isDark ? { background: `linear-gradient(135deg, ${dustyMauve} 0%, ${dustyMauveLight} 100%)` } : {}}
      >
        {phase}
      </motion.div>
    </motion.div>
  );
}
