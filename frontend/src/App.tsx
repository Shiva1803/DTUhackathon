import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Auth0Provider, AppState } from '@auth0/auth0-react';
import { Landing, Dashboard, DailyLog, Success, SummaryPage, LogsPage, ChatPage } from './pages';
import { ProtectedRoute } from './components/auth';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import PageTransition from './components/PageTransition';
import DesertDust from './components/DesertDust';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || '';
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || '';

if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
  console.error('Auth0 configuration missing. Check VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env');
}

// Page transition context
interface PageTransitionContextType {
  isTransitioning: boolean;
  startTransition: (callback: () => void) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  isTransitioning: false,
  startTransition: () => {},
});

export const usePageTransition = () => useContext(PageTransitionContext);

// Page transition provider
function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);

  // Protected routes that should show transition
  const protectedPaths = ['/dashboard', '/log', '/logs', '/summary', '/chat', '/success'];

  useEffect(() => {
    const currentPath = location.pathname;
    const wasProtected = protectedPaths.some(p => prevPath.startsWith(p));
    const isProtected = protectedPaths.some(p => currentPath.startsWith(p));

    // Show transition when navigating between protected routes
    if (wasProtected && isProtected && prevPath !== currentPath) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 800);
      setPrevPath(currentPath);
      return () => clearTimeout(timer);
    }
    
    setPrevPath(currentPath);
  }, [location.pathname]);

  const startTransition = (callback: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      callback();
      setTimeout(() => setIsTransitioning(false), 400);
    }, 400);
  };

  return (
    <PageTransitionContext.Provider value={{ isTransitioning, startTransition }}>
      <PageTransition isLoading={isTransitioning} />
      {children}
    </PageTransitionContext.Provider>
  );
}

function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo || '/dashboard');
  };

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: AUTH0_AUDIENCE,
        scope: 'openid profile email',
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  
  return (
    <PageTransitionProvider>
      <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-[#F5E6D3]'}`}>
        <DesertDust />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute>
                <Navbar />
                <DailyLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/success"
            element={
              <ProtectedRoute>
                <Navbar />
                <Success />
              </ProtectedRoute>
            }
          />
          <Route
            path="/summary"
            element={
              <ProtectedRoute>
                <Navbar />
                <SummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <Navbar />
                <LogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Navbar />
                <ChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        <ChatWidget />
      </div>
    </PageTransitionProvider>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <BrowserRouter>
          <Auth0ProviderWithNavigate>
            <AppContent />
          </Auth0ProviderWithNavigate>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
