import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Auth0Provider, AppState } from '@auth0/auth0-react';
import { Landing, DailyLog, Success, SummaryPage, LogsPage, ChatPage } from './pages';
import { ProtectedRoute } from './components/auth';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import ErrorBoundary from './components/ErrorBoundary';

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || '';
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || '';
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || '';

// Validate Auth0 config
if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
  console.error('Auth0 configuration missing. Check VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env');
}

// Auth0 provider wrapper that handles redirect callback
function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: AppState) => {
    // Navigate to the returnTo path or default to /log after login
    navigate(appState?.returnTo || '/log');
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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Auth0ProviderWithNavigate>
          <div className="min-h-screen bg-gray-900">
            <Routes>
              {/* Public route */}
              <Route path="/" element={<Landing />} />

              {/* Protected routes */}
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
            {/* Floating Chat Widget - appears on all pages for authenticated users */}
            <ChatWidget />
          </div>
        </Auth0ProviderWithNavigate>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

