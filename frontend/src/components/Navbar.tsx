import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Mic, BarChart3, Sparkles, LogOut, User, List, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth0();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white hidden sm:inline">GrowthAmp</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          <Link
            to="/log"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/log')
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Log</span>
          </Link>
          <Link
            to="/logs"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/logs')
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Logs</span>
          </Link>
          <Link
            to="/summary"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/summary')
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Summary</span>
          </Link>
          <Link
            to="/chat"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive('/chat')
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </Link>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-3">
          {/* User info */}
          <div className="hidden md:flex items-center gap-2">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-gray-300 text-sm">{user?.name || user?.email}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
