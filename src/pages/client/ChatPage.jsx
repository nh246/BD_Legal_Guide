import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Bot, User as UserIcon, Zap, FileText, Sparkles, Scale, MessageSquare, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ProPaywallModal from '../../components/ui/ProPaywallModal';
import api, { asList, getErrorMessage } from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';

const SUGGESTIONS = [
  'What is the punishment for theft under the Penal Code?',
  'How do I register a Private Limited Company in Bangladesh?',
  'What are the grounds for divorce under Bangladeshi law?',
  'How to resolve a boundary dispute with my neighbor under land law?',
];

export default function ChatPage() {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams();
  const { user } = useAuthStore();

  const [activeSessionId, setActiveSessionId] = useState(routeSessionId || null);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRagMode, setIsRagMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const messagesEndRef = useRef(null);

  const isPro = user?.plan === 'pro' || user?.is_pro;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load chat sessions
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/chat/sessions');
      setSessions(asList(res.data, 'sessions'));
    } catch {
      // Backend not yet ready - sessions list will remain empty
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Load active session messages if session id present
  useEffect(() => {
    if (activeSessionId) {
      api.get(`/chat/sessions/${activeSessionId}`)
        .then((res) => {
          setMessages(asList(res.data, 'messages'));
        })
        .catch(() => {
          // If session not found on server, fallback to current in-memory messages
        });
    }
  }, [activeSessionId]);

  const handleToggleRag = () => {
    if (!isPro) {
      setShowPaywall(true);
    } else {
      setIsRagMode(!isRagMode);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setChatError(null);
    navigate('/client/chat');
  };

  const selectSession = (id) => {
    setActiveSessionId(id);
    navigate(`/client/chat/${id}`);
  };

  const handleSend = async (text = input) => {
    if (!text.trim() || isTyping) return;
    const userText = text.trim();
    setInput('');
    setChatError(null);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await api.post('/chat', {
        message: userText,
        session_id: activeSessionId,
        mode: isRagMode ? 'rag' : 'standard',
      });

      const reply = res.data;
      if (reply.session_id && reply.session_id !== activeSessionId) {
        setActiveSessionId(reply.session_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: reply.id || Date.now().toString(),
          role: 'assistant',
          content: reply.content || reply.response || reply.message || 'No response generated.',
          citations: reply.citations || [],
          triage: reply.triage || null,
        },
      ]);
    } catch (err) {
      setChatError(getErrorMessage(err, 'Could not reach server'));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950 overflow-hidden">
      {/* Left Sidebar */}
      <div className="hidden md:flex w-72 border-r border-zinc-800 flex-col bg-zinc-950/50">
        <div className="p-4 border-b border-zinc-800">
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="h-4 w-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-2">Recent Sessions</div>

          {sessionsLoading ? (
            <div className="text-xs text-zinc-600 px-2 py-4">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-xs text-zinc-600 px-2 italic">No previous chats recorded</div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex flex-col gap-1 ${
                  activeSessionId === session.id
                    ? 'bg-zinc-800 text-zinc-50'
                    : 'text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900'
                }`}
              >
                <span className="truncate w-full">{session.title || 'Legal Query'}</span>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>{session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Recent'}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full p-1">
            <button
              onClick={() => isRagMode && handleToggleRag()}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !isRagMode ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Standard AI
            </button>
            <button
              onClick={() => !isRagMode && handleToggleRag()}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isRagMode ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="h-3 w-3" /> Verified RAG
            </button>
          </div>
        </div>

        {/* Messages / Empty State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
              <div className="h-20 w-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                <Scale className="h-10 w-10 text-blue-500 relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-50 mb-8">How can I help you with Bangladesh Law today?</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sug)}
                    className="text-left p-4 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 rounded-xl transition-all text-sm text-zinc-300"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-zinc-800' : 'bg-blue-600/10 border border-blue-500/20'
                    }`}
                  >
                    {msg.role === 'user' ? <UserIcon className="h-5 w-5 text-zinc-400" /> : <Bot className="h-5 w-5 text-blue-500" />}
                  </div>

                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                    <div
                      className={`px-5 py-3.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-p:leading-relaxed prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                      )}
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="w-full mt-3 space-y-3">
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((cit, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium"
                              >
                                <FileText className="h-3 w-3" />
                                {cit}
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.triage && (
                          <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                                <Sparkles className="h-4 w-4 text-blue-500" />
                              </div>
                              <span className="text-sm font-medium text-zinc-200">
                                This matter requires professional representation.
                              </span>
                            </div>
                            <button
                              onClick={() => navigate(`/client/lawyers?specialty=${msg.triage.specialty}`)}
                              className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                            >
                              Book a verified {msg.triage.specialty} Lawyer
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4 max-w-4xl mx-auto">
                  <div className="shrink-0 h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5 h-12 w-16">
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="max-w-4xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Composer Area */}
        <div className="p-4 sm:p-6 pt-0 bg-zinc-950">
          <div className="max-w-4xl mx-auto relative flex items-end gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-2 pl-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a legal question..."
              className="w-full bg-transparent text-zinc-50 placeholder-zinc-500 py-3 min-h-[44px] max-h-[160px] resize-none outline-none text-sm scrollbar-thin scrollbar-thumb-zinc-700"
              rows={input.split('\n').length > 1 ? Math.min(5, input.split('\n').length) : 1}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="mb-1 shrink-0 h-10 w-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </div>
          <p className="text-center text-xs text-zinc-600 mt-3">
            AI can make mistakes. For critical legal matters, always consult a verified lawyer.
          </p>
        </div>
      </div>

      <ProPaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
