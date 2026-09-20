import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User as UserIcon, Zap, FileText, Sparkles, Scale, MessageSquare, Crown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ProPaywallModal from '../../components/ProPaywallModal';

// Mock State & Data
const plan = 'free'; // Change to 'pro' to test RAG mode

const SUGGESTIONS = [
  "What is the punishment for theft under the Penal Code?",
  "How do I register a Private Limited Company?",
  "What are the grounds for divorce in Bangladesh?",
  "How to resolve a boundary dispute with my neighbor?"
];

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [input, setInput] = useState('');
  const [isRagMode, setIsRagMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      setSessions(prev => [{
        id: Date.now().toString(),
        title: messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : ''),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: messages.length
      }, ...prev]);
      setMessages([]);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleToggleRag = () => {
    if (plan === 'free') {
      setShowPaywall(true);
    } else {
      setIsRagMode(!isRagMode);
    }
  };

  const handleSend = (text = input) => {
    if (!text.trim()) return;
    
    const newMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isRagMode 
          ? "According to the Transfer of Property Act 1882, property disputes often require establishing clear legal title and boundaries through civil courts. **Boundary disputes specifically** require a court-appointed surveyor commissioner to demarcate the land."
          : "Property disputes in Bangladesh are generally handled through civil courts. You may need to file a civil suit to establish your rights or resolve boundary issues.",
        citations: isRagMode ? ['Transfer of Property Act 1882 · §54', 'Specific Relief Act 1877 · §8'] : [],
        triage: { specialty: 'Property' }
      }]);
    }, 1200);
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
          
          {/* Active Session */}
          {messages.length > 0 && (
            <button className="w-full text-left px-3 py-2 text-sm text-zinc-50 bg-zinc-800 rounded-lg transition-colors flex flex-col gap-1">
              <span className="truncate w-full">{messages[0].content.substring(0, 30)}{messages[0].content.length > 30 ? '...' : ''}</span>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Today</span>
                <span>•</span>
                <span>{messages.length} msg{messages.length !== 1 ? 's' : ''}</span>
              </div>
            </button>
          )}

          {/* Past Sessions */}
          {sessions.map(session => (
            <button key={session.id} className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900 rounded-lg transition-colors flex flex-col gap-1">
              <span className="truncate w-full">{session.title}</span>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{session.date}</span>
                <span>•</span>
                <span>{session.count} msg{session.count !== 1 ? 's' : ''}</span>
              </div>
            </button>
          ))}

          {messages.length === 0 && sessions.length === 0 && (
            <div className="text-xs text-zinc-600 px-2 italic">No previous chats</div>
          )}
        </div>

        {/* Upgrade Banner */}
        {plan === 'free' && (
          <div className="p-4">
            <div className="bg-zinc-900/50 border border-violet-500/30 rounded-xl p-4 shadow-lg shadow-violet-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-violet-500" />
                <span className="font-semibold text-zinc-50 text-sm">Pro Plan</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">Unlock verified citations with Pro — ৳299/mo</p>
              <button 
                onClick={() => setShowPaywall(true)}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
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
          
          {isRagMode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" /> Citations active
            </span>
          )}
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
                  
                  {/* Avatar */}
                  <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-zinc-800' : 'bg-blue-600/10 border border-blue-500/20'
                  }`}>
                    {msg.role === 'user' ? (
                      <UserIcon className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <Bot className="h-5 w-5 text-blue-500" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                    <div className={`px-5 py-3.5 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-p:leading-relaxed prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                      )}
                    </div>
                    
                    {/* Citations & Triage */}
                    {msg.role === 'assistant' && (
                      <div className="w-full mt-3 space-y-3">
                        {/* Citations */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((cit, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium">
                                <FileText className="h-3 w-3" />
                                {cit}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Triage Card */}
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
                              onClick={() => navigate(`/lawyers?specialty=${msg.triage.specialty}`)}
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
              
              {/* Typing Indicator */}
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
