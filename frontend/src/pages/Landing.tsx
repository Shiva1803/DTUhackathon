import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { Mic, Brain, LineChart, Sparkles, Loader2 } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const steps = [
  {
    icon: Mic,
    step: '1',
    title: 'Log Daily',
    description: 'Record 60s voice about your day.'
  },
  {
    icon: Brain,
    step: '2',
    title: 'AI Analyzes',
    description: 'Categorizes activities & trends.'
  },
  {
    icon: LineChart,
    step: '3',
    title: 'See Insights',
    description: 'Get weekly summary & tips.'
  }
];

export default function Landing() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  // Redirect to /log if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/log');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    loginWithRedirect({
      appState: { returnTo: '/log' }
    });
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          <span className="text-gray-400">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-cyan-900/20" />
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
              <Sparkles className="w-4 h-4" />
              AI-Powered Personal Growth
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent"
          >
            Amplify Your Growth in 60 Seconds a Day
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Transform your daily reflections into actionable insights. Just speak for a minute, and let AI uncover patterns that drive your personal growth.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold text-lg hover:from-purple-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-105"
            >
              Get Started
              <Sparkles className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-400 max-w-xl mx-auto"
            >
              Three simple steps to unlock your potential
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((item) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                className="relative p-8 rounded-2xl bg-gray-800 border border-gray-700 hover:border-purple-500/50 transition-colors group"
              >
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div className="mb-6 w-16 h-16 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 flex items-center justify-center group-hover:from-purple-500/20 group-hover:to-cyan-500/20 transition-colors">
                  <item.icon className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">GrowthAmp</span>
            </div>

            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <span>Built for Hackathon 2026</span>
              <span className="hidden md:inline">•</span>
              <span>Made with ❤️ by Team</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded bg-gray-700" />
              <div className="w-8 h-8 rounded bg-gray-700" />
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
