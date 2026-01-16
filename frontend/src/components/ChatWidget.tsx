import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Send,
    X,
    Loader2,
    Bot,
    User,
    Minimize2
} from 'lucide-react';
import { sendChatMessage } from '../lib/api';
import { AxiosError } from 'axios';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatWidgetProps {
    className?: string;
}

export default function ChatWidget({ className = '' }: ChatWidgetProps) {
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

    // Generate session ID on mount
    useEffect(() => {
        if (!sessionId) {
            setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        }
    }, [sessionId]);

    // Scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async (messageText?: string) => {
        const text = messageText || inputMessage.trim();
        if (!text || isLoading) return;

        setInputMessage('');
        setError(null);
        setSuggestions([]);

        // Add user message
        const userMessage: Message = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                }
            });

            const response = await sendChatMessage(token, text, sessionId || undefined);
            const data = response.data?.data;

            if (data) {
                if (data.sessionId && !sessionId) {
                    setSessionId(data.sessionId);
                }

                // Add assistant message
                const assistantMessage: Message = {
                    id: data.messageId || `assistant_${Date.now()}`,
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);

                // Set suggestions if provided
                if (data.suggestions && data.suggestions.length > 0) {
                    setSuggestions(data.suggestions);
                }
            }
        } catch (err) {
            console.error('Chat error:', err);
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

    const handleSuggestionClick = (suggestion: string) => {
        handleSendMessage(suggestion);
    };

    if (!isAuthenticated) return null;

    return (
        <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5" />
                                <span className="font-semibold">AI Coach</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-400 mt-8">
                                    <Bot className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                                    <p className="font-medium">Hi! I'm your AI Coach</p>
                                    <p className="text-sm mt-1">Ask me anything about your growth journey</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                                ? 'bg-purple-500'
                                                : 'bg-gradient-to-r from-purple-500 to-cyan-500'
                                            }`}>
                                            {message.role === 'user' ? (
                                                <User className="w-3.5 h-3.5 text-white" />
                                            ) : (
                                                <Bot className="w-3.5 h-3.5 text-white" />
                                            )}
                                        </div>
                                        <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${message.role === 'user'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-700 text-gray-200'
                                            }`}>
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="bg-gray-700 px-4 py-2 rounded-xl">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-red-300 text-xs">
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
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t border-gray-700">
                            <div className="flex gap-2">
                                <textarea
                                    ref={inputRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                                    rows={1}
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputMessage.trim() || isLoading}
                                    className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-cyan-600 transition-all"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
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
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${isOpen
                        ? 'bg-gray-700 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageSquare className="w-6 h-6" />
                )}
            </motion.button>
        </div>
    );
}
