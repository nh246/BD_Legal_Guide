import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { 
  Send, Bot, User, Scale, Plus, MessageSquare, 
  Settings, LogOut, FileText, Loader2, Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null && !localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load sessions on mount
  useEffect(() => {
    if (user) loadSessions();
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
      if (res.data.length > 0 && !activeSessionId) {
        loadSessionMessages(res.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    setActiveSessionId(sessionId);
    setMessages([]); // Clear while loading
    try {
      const res = await api.get(`/sessions/${sessionId}/messages`);
      // Map backend messages to frontend format
      const formatted = res.data.map(m => ({
        role: m.role,
        content: m.content,
        sources: m.sources || []
      }));
      setMessages(formatted);
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await api.post('/sessions');
      const newSession = res.data;
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create session", error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput('');
    
    // Add optimistic user message
    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const payload = { query };
      if (activeSessionId) {
        payload.session_id = activeSessionId;
      }
      
      const res = await api.post('/query', payload);
      
      // If we didn't have a session id, the backend created one. We need to reload sessions to get it in the sidebar.
      if (!activeSessionId && res.data.session_id) {
        setActiveSessionId(res.data.session_id);
        loadSessions();
      }

      setMessages([...newMessages, { 
        role: 'assistant', 
        content: res.data.answer,
        sources: res.data.sources || []
      }]);
    } catch (error) {
      console.error("Query failed", error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "**Error:** Failed to get a response from the AI. Check if the database has indexed documents." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null; // Prevent flash before redirect

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-72 border-r border-white/5 bg-bg-secondary flex flex-col z-10">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-400 font-bold text-lg">
            <Scale className="w-5 h-5" />
            <span>Legal Guide AI</span>
          </div>
        </div>
        
        <div className="p-3">
          <button 
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 && (
            <p className="text-text-muted text-sm text-center mt-4">No recent chats</p>
          )}
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => loadSessionMessages(session.id)}
              className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                activeSessionId === session.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="truncate text-sm font-medium">{session.title}</div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          {user?.role === 'admin' && (
            <button className="flex items-center gap-3 text-text-secondary hover:text-brand-400 px-2 py-2 transition-colors text-sm font-medium">
              <Settings className="w-4 h-4" />
              Admin Dashboard
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-text-secondary hover:text-red-400 px-2 py-2 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <div className="mt-2 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-sm font-bold truncate">{user.name}</div>
              <div className="text-xs text-text-muted truncate">{user.plan} Plan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Glow */}
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8 pb-10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center mt-32">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6 border border-brand-500/30">
                  <Scale className="w-8 h-8 text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                <p className="text-text-secondary max-w-md">
                  Ask me anything about Bangladesh law. I will search the official acts and sections to provide a precise, cited answer.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                  {[
                    "What is the penalty for cyber bullying?",
                    "How to register a private company?",
                    "What are the employee leave policies?",
                    "Divorce laws under Muslim Family Act"
                  ].map((preset, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(preset)}
                      className="p-3 text-sm text-left glass-panel rounded-xl hover:bg-white/10 transition-colors text-text-secondary hover:text-white"
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(37,99,235,0.4)]">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                    <div className={`p-5 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-brand-600 text-white rounded-tr-sm' 
                        : 'glass-panel rounded-tl-sm border-white/10 text-gray-100 shadow-xl'
                    }`}>
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="prose prose-invert prose-brand max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Citations / Sources */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="w-full text-xs font-bold text-brand-400 mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Sources Cited:
                        </div>
                        {msg.sources.map((src, idx) => (
                          <div key={idx} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
                            <span className="font-semibold">{src.act_title}</span>
                            <span className="opacity-50">|</span>
                            <span>Sec: {src.section_number}</span>
                            <span className="opacity-50">|</span>
                            <span>{src.year}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0 mt-1 order-2 border border-white/10">
                      <User className="w-5 h-5 text-text-secondary" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(37,99,235,0.4)]">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="glass-panel p-4 rounded-2xl rounded-tl-sm flex items-center gap-3 text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                  Searching legal corpus...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-bg-primary/80 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="relative flex items-end gap-2">
              <div className="flex-1 glass-panel rounded-2xl border border-white/10 p-2 focus-within:border-brand-500/50 transition-colors shadow-lg">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Ask a legal question..."
                  className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2 px-3 text-white placeholder-text-muted"
                  rows={1}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-[60px] w-[60px] flex-shrink-0 flex items-center justify-center rounded-2xl gradient-bg text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
            <div className="text-center mt-3 text-xs text-text-muted flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              BD Legal Guide AI can make mistakes. Always verify critical information.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
