import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Loader2, Bot, User } from 'lucide-react';
import { sendChatMessage } from '../lib/api';
import { AxiosError } from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatWidget({ className = '' }: { className?: string }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sessionId) setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, [sessionId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text || isLoading) return;

    setInputMessage('');
    setError(null);
    setSuggestions([]);

    const userMessage: Message = { id: `user_${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE }
      });
      const response = await sendChatMessage(token, text, sessionId || undefined);
      const data = response.data?.data;

      if (data) {
        if (data.sessionId && !sessionId) setSessionId(data.sessionId);
        setMessages(prev => [...prev, {
          id: data.messageId || `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }]);
        if (data.suggestions?.length > 0) setSuggestions(data.suggestions);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error?.message || 'Failed to send message');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Early return must be after all hooks are called to avoid React #310 error
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4"
              style={{
                background: 'linear-gradient(135deg, #003040 0%, #006080 100%)',
                borderBottom: '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#00d4ff]" />
                <span className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  AI Coach
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center mt-8">
                  <div 
                    className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid rgba(0,212,255,0.15)',
                    }}
                  >
                    <Bot className="w-7 h-7 text-[#00d4ff]" />
                  </div>
                  <p className="font-medium" style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.7)' }}>
                    Hi! I'm your AI Coach
                  </p>
                  <p className="text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(255,255,255,0.4)' }}>
                    Ask me anything about your growth journey
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: message.role === 'user' 
                          ? 'linear-gradient(135deg, #003040, #006080)'
                          : 'rgba(0,212,255,0.1)',
                        border: '1px solid rgba(0,212,255,0.2)',
                      }}
                    >
                      {message.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-[#00d4ff]" />}
                    </div>
                    <div 
                      className="max-w-[75%] px-3 py-2 rounded-xl text-sm"
                      style={{
                        background: message.role === 'user' ? 'linear-gradient(135deg, #003040, #006080)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${message.role === 'user' ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex gap-2">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.15)' }}
                  >
                    <Bot className="w-3.5 h-3.5 text-[#00d4ff]" />
                  </div>
                  <div 
                    className="px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex gap-1">
                      {Array.from({ length: 3 }, (_, i) => (
                        <motion.div
                          key={`dot-${i}`}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#00d4ff' }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div 
                  className="rounded-lg p-2 text-xs"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                  }}
                >
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid rgba(0,212,255,0.2)',
                      color: '#00d4ff',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm resize-none focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#ffffff',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  rows={1}
                  disabled={isLoading}
                />
                <motion.button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2 rounded-lg disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #003040 0%, #006080 100%)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                  }}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: isOpen ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #003040 0%, #006080 100%)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          boxShadow: isOpen ? 'none' : '0 0 30px rgba(0, 212, 255, 0.3)',
        }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
