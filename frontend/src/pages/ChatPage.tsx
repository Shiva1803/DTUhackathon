import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Loader2,
    MessageSquare,
    User,
    Bot,
    RefreshCw,
    Plus
} from 'lucide-react';
import { sendChatMessage, getChatSessions, getChatHistory } from '../lib/api';
import { AxiosError } from 'axios';

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

    // Scroll to bottom of messages
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Load sessions on mount
    useEffect(() => {
        loadSessions();
    }, []);

    const getToken = async () => {
        return getAccessTokenSilently({
            authorizationParams: {
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }
        });
    };

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
            const data = response.data?.data || [];
            setMessages(data.map((msg: { id: string; role: string; content: string; timestamp: string }) => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: msg.timestamp,
            })));
            setCurrentSessionId(sessionId);
        } catch (err) {
            console.error('Error loading session history:', err);
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

        // Add user message optimistically
        const tempUserMessage: Message = {
            id: `temp_${Date.now()}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMessage]);

        setSendingMessage(true);

        try {
            const token = await getToken();
            const response = await sendChatMessage(token, userMessage, currentSessionId || undefined);
            const data = response.data?.data;

            if (data) {
                // Update session ID if it's a new chat
                if (!currentSessionId && data.sessionId) {
                    setCurrentSessionId(data.sessionId);
                }

                // Add assistant response
                const assistantMessage: Message = {
                    id: data.messageId || `msg_${Date.now()}`,
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, assistantMessage]);

                // Refresh sessions list
                loadSessions();
            }
        } catch (err) {
            console.error('Error sending message:', err);

            let errorMessage = 'Failed to send message. Please try again.';
            if (err instanceof AxiosError) {
                if (err.response?.status === 401) {
                    errorMessage = 'Session expired. Please log in again.';
                } else if (err.response?.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
            }

            setError(errorMessage);
            // Remove the optimistic user message
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex">
            {/* Sidebar - Sessions */}
            <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-64 bg-gray-800 border-r border-gray-700 flex flex-col`}>
                <div className="p-4 border-b border-gray-700">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:to-cyan-600 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {sessions.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No chat sessions yet</p>
                    ) : (
                        <div className="space-y-1">
                            {sessions.map((session) => (
                                <button
                                    key={session.sessionId}
                                    onClick={() => loadSessionHistory(session.sessionId)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${currentSessionId === session.sessionId
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : 'text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    <p className="truncate font-medium">{session.preview || 'New conversation'}</p>
                                    <p className="text-xs text-gray-500">{session.messageCount} messages</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-gray-800/50 border-b border-gray-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="md:hidden p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                            >
                                <MessageSquare className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold">AI Coach</h1>
                                <p className="text-gray-400 text-sm">Your personal growth assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={loadSessions}
                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-md">
                                <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-400 mb-2">Welcome to AI Coach</h2>
                                <p className="text-gray-500">
                                    Ask me anything about your personal growth journey. I can help you reflect on patterns, set goals, and provide encouragement.
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
                                        exit={{ opacity: 0, y: -20 }}
                                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                            ? 'bg-purple-500'
                                            : 'bg-gradient-to-r from-purple-500 to-cyan-500'
                                            }`}>
                                            {message.role === 'user' ? (
                                                <User className="w-4 h-4" />
                                            ) : (
                                                <Bot className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                                            <div className={`inline-block px-4 py-3 rounded-2xl ${message.role === 'user'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-800 text-gray-200 border border-gray-700'
                                                }`}>
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTime(message.timestamp)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {sendingMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
                        <div className="max-w-3xl mx-auto bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                            {error}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                        <div className="flex gap-3">
                            <textarea
                                ref={inputRef}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none min-h-[48px] max-h-[120px]"
                                rows={1}
                                disabled={sendingMessage}
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || sendingMessage}
                                className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sendingMessage ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
