import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, BarChart3, LogOut, User, List, MessageSquare, Menu, X, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { usePageTransition } from '../App';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const { startTransition } = usePageTransition();
  const { toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    startTransition(() => navigate(path));
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/log', icon: Mic, label: 'Log' },
    { path: '/logs', icon: List, label: 'History' },
    { path: '/summary', icon: BarChart3, label: 'Summary' },
    { path: '/chat', icon: MessageSquare, label: 'Coach' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      >
        <div 
          className="max-w-6xl mx-auto rounded-2xl px-4 py-2 transition-colors duration-500"
          style={{
            background: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-center justify-between">
            {/* Logo - links to Dashboard */}
            <button onClick={() => handleNavigate('/dashboard')} className="flex items-center gap-3 group">
              <motion.div 
                className="relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, #003040 0%, #006080 50%, #00a0c0 100%)'
                    : 'linear-gradient(135deg, #C2986C 0%, #D4A574 50%, #E6BE8A 100%)',
                  boxShadow: isDark ? '0 0 20px rgba(0,212,255,0.3)' : '0 0 20px rgba(194,152,108,0.4)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                />
              </motion.div>
              <span 
                className="font-semibold text-lg tracking-tight hidden sm:block"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  ...(isDark ? {
                    background: 'linear-gradient(135deg, #ffffff 0%, #80e0ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  } : {
                    color: '#5C4033',
                  }),
                }}
              >
                Parallax
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className="relative px-4 py-2 rounded-xl transition-all duration-300"
                >
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(194, 152, 108, 0.2)',
                        border: isDark ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid rgba(194, 152, 108, 0.3)',
                        boxShadow: isDark ? '0 0 20px rgba(0, 212, 255, 0.1)' : '0 0 20px rgba(194, 152, 108, 0.2)',
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span 
                    className={`relative z-10 flex items-center gap-2 text-sm font-medium transition-colors duration-300`}
                    style={{ 
                      fontFamily: "'Inter', sans-serif",
                      color: isActive(item.path) 
                        ? (isDark ? '#00d4ff' : '#8B6914')
                        : (isDark ? '#9ca3af' : '#6B5B4F'),
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </button>
              ))}

              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative ml-2 p-2 rounded-xl transition-colors duration-300"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isDark ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#5C4033]" />
                  )}
                </motion.div>
              </motion.button>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-3">
              {/* User info - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors duration-300"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="w-6 h-6 rounded-full ring-1"
                      style={{ 
                        boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.1)' : '0 0 0 1px rgba(0,0,0,0.1)' 
                      }}
                    />
                  ) : (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ 
                        background: isDark 
                          ? 'linear-gradient(135deg, #003040, #006080)' 
                          : 'linear-gradient(135deg, #C2986C, #D4A574)' 
                      }}
                    >
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span 
                    className="text-sm max-w-[120px] truncate transition-colors duration-300"
                    style={{ 
                      fontFamily: "'Inter', sans-serif",
                      color: isDark ? '#d1d5db' : '#5C4033',
                    }}
                  >
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                </div>

                {/* Logout button */}
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors duration-300"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
                    color: isDark ? '#9ca3af' : '#6B5B4F',
                  }}
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Mobile menu button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                className="md:hidden p-2 rounded-xl transition-colors"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
                  color: isDark ? '#9ca3af' : '#6B5B4F',
                }}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-4 right-4 z-40 md:hidden rounded-2xl p-4"
            style={{
              background: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(0, 0, 0, 0.15)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: isActive(item.path) 
                      ? (isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(194, 152, 108, 0.2)')
                      : 'transparent',
                    border: isActive(item.path)
                      ? (isDark ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid rgba(194, 152, 108, 0.3)')
                      : '1px solid transparent',
                    color: isActive(item.path)
                      ? (isDark ? '#00d4ff' : '#8B6914')
                      : (isDark ? '#9ca3af' : '#6B5B4F'),
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}

              {/* Theme toggle in mobile */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)',
                  color: isDark ? '#9ca3af' : '#6B5B4F',
                }}
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              
              <div style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }} className="pt-3 mt-3">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    {user?.picture ? (
                      <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: isDark 
                            ? 'linear-gradient(135deg, #003040, #006080)'
                            : 'linear-gradient(135deg, #C2986C, #D4A574)',
                        }}
                      >
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span 
                      className="text-sm"
                      style={{ color: isDark ? '#d1d5db' : '#5C4033' }}
                    >
                      {user?.name || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: isDark ? '#9ca3af' : '#6B5B4F' }}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-20" />
    </>
  );
}
