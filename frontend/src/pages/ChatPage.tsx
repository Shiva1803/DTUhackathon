import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare, User, Bot, RefreshCw, Plus } from 'lucide-react';
import { sendChatMessage, getChatSessions, getChatHistory } from '../lib/api';
import { AxiosError } from 'axios';
import { useTheme } from '../context/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Session {
  sessionId: string;
  lastMessage: string;
  messageCount: number;
  preview: string;
}

export default function ChatPage() {
  const { getAccessTokenSilently } = useAuth0();
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { loadSessions(); }, []);

  const getToken = async () => getAccessTokenSilently({
    authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
  });

  const loadSessions = async () => {
    try {
      const token = await getToken();
      const response = await getChatSessions(token);
      setSessions(response.data?.data || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  const loadSessionHistory = async (sessionId: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await getChatHistory(token, sessionId);
      setMessages((response.data?.data || []).map((msg: { id: string; role: string; content: string; timestamp: string }) => ({
        id: msg.id, role: msg.role as 'user' | 'assistant', content: msg.content, timestamp: msg.timestamp,
      })));
      setCurrentSessionId(sessionId);
    } catch {
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    inputRef.current?.focus();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || sendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError(null);

    const tempUserMessage: Message = {
      id: `temp_${Date.now()}`, role: 'user', content: userMessage, timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);
    setSendingMessage(true);

    try {
      const token = await getToken();
      const response = await sendChatMessage(token, userMessage, currentSessionId || undefined);
      const data = response.data?.data;

      if (data) {
        if (!currentSessionId && data.sessionId) setCurrentSessionId(data.sessionId);
        setMessages(prev => [...prev, {
          id: data.messageId || `msg_${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        }]);
        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex transition-colors duration-500" style={{ background: isDark ? '#000000' : '#F5E6D3', color: isDark ? '#ffffff' : '#3D2914' }}>
      {/* Sidebar */}
      <div 
        className={`${showSidebar ? 'block' : 'hidden'} md:block w-72 flex flex-col`}
        style={{
          background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="p-4" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}>
          <motion.button
            onClick={startNewChat}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: isDark 
                ? 'linear-gradient(135deg, #003040 0%, #006080 100%)'
                : 'linear-gradient(135deg, #C2986C 0%, #D4A574 100%)',
              border: isDark ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(139, 105, 20, 0.3)',
              boxShadow: isDark ? '0 0 20px rgba(0, 212, 255, 0.15)' : '0 0 20px rgba(139, 105, 20, 0.15)',
              color: '#ffffff',
            }}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {sessions.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61, 41, 20, 0.5)' }}>
              No chat sessions yet
            </p>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => loadSessionHistory(session.sessionId)}
                  className="w-full text-left px-3 py-3 rounded-xl transition-all text-sm"
                  style={{
                    background: currentSessionId === session.sessionId 
                      ? (isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(139, 105, 20, 0.1)')
                      : 'transparent',
                    border: currentSessionId === session.sessionId 
                      ? (isDark ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid rgba(139, 105, 20, 0.2)')
                      : '1px solid transparent',
                    color: currentSessionId === session.sessionId 
                      ? (isDark ? '#00d4ff' : '#8B6914')
                      : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(61, 41, 20, 0.7)'),
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <p className="truncate font-medium">{session.preview || 'New conversation'}</p>
                  <p className="text-xs mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61, 41, 20, 0.5)' }}>
                    {session.messageCount} messages
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header 
          className="px-4 py-4 flex items-center justify-between"
          style={{
            background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 rounded-xl"
              style={{ 
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' 
              }}
            >
              <MessageSquare className="w-5 h-5" style={{ color: isDark ? '#ffffff' : '#3D2914' }} />
            </button>
            <div>
              <h1 
                className="text-lg font-semibold"
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
                AI Coach
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)', fontSize: '0.75rem' }}>
                Your personal growth assistant
              </p>
            </div>
          </div>
          <button
            onClick={loadSessions}
            className="p-2 rounded-xl transition-colors"
            style={{ 
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' 
            }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.5)' }} />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div 
                  className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,150,180,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(139,105,20,0.1) 0%, rgba(194,152,108,0.08) 100%)',
                    border: isDark ? '1px solid rgba(0,212,255,0.15)' : '1px solid rgba(139,105,20,0.15)',
                  }}
                >
                  <Bot className="w-10 h-10" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
                </div>
                <h2 
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(61, 41, 20, 0.8)' }}
                >
                  Welcome to AI Coach
                </h2>
                <p style={{ fontFamily: "'Inter', sans-serif", color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(61, 41, 20, 0.6)' }}>
                  Ask me anything about your personal growth journey.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: message.role === 'user' 
                          ? (isDark ? 'linear-gradient(135deg, #003040, #006080)' : 'linear-gradient(135deg, #C2986C, #D4A574)')
                          : (isDark ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,150,180,0.1))' : 'linear-gradient(135deg, rgba(139,105,20,0.15), rgba(194,152,108,0.1))'),
                        border: isDark ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(139,105,20,0.2)',
                      }}
                    >
                      {message.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div 
                        className="inline-block px-4 py-3 rounded-2xl"
                        style={{
                          background: message.role === 'user' 
                            ? (isDark ? 'linear-gradient(135deg, #003040, #006080)' : 'linear-gradient(135deg, #C2986C, #D4A574)')
                            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)'),
                          border: `1px solid ${message.role === 'user' 
                            ? (isDark ? 'rgba(0,212,255,0.3)' : 'rgba(139,105,20,0.3)')
                            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')}`,
                          fontFamily: "'Inter', sans-serif",
                          color: message.role === 'user' ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(61, 41, 20, 0.9)'),
                        }}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className="text-xs mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61, 41, 20, 0.5)' }}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {sendingMessage && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,150,180,0.1))'
                        : 'linear-gradient(135deg, rgba(139,105,20,0.15), rgba(194,152,108,0.1))',
                      border: isDark ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(139,105,20,0.2)',
                    }}
                  >
                    <Bot className="w-4 h-4" style={{ color: isDark ? '#00d4ff' : '#8B6914' }} />
                  </div>
                  <div 
                    className="px-4 py-3 rounded-2xl"
                    style={{ 
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', 
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' 
                    }}
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ background: isDark ? '#00d4ff' : '#8B6914' }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 pb-2">
            <div 
              className="max-w-3xl mx-auto rounded-xl p-3 text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {error}
            </div>
          </div>
        )}

        {/* Input */}
        <div 
          className="p-4"
          style={{ 
            background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', 
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' 
          }}
        >
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 rounded-xl resize-none min-h-[48px] max-h-[120px] focus:outline-none"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                  color: isDark ? '#ffffff' : '#3D2914',
                  fontFamily: "'Inter', sans-serif",
                }}
                rows={1}
                disabled={sendingMessage}
              />
              <motion.button
                type="submit"
                disabled={!inputMessage.trim() || sendingMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-3 rounded-xl disabled:opacity-50"
                style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, #003040 0%, #006080 100%)'
                    : 'linear-gradient(135deg, #C2986C 0%, #D4A574 100%)',
                  border: isDark ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(139, 105, 20, 0.3)',
                  color: '#ffffff',
                }}
              >
                {sendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </motion.button>
            </div>
            <p className="text-xs text-center mt-2" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(61, 41, 20, 0.5)', fontFamily: "'Inter', sans-serif" }}>
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
