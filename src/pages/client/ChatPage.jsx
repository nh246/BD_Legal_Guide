import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User as UserIcon, Zap } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import ProPaywallModal from '../../components/ui/ProPaywallModal';
import { CitationChips, TriageCard } from '../../components/ui/ChatHelpers';
import Textarea from '../../components/ui/Textarea';

// Mock state
const isProUser = false;
const mockMessages = [
  { id: '1', role: 'assistant', content: 'Hello! I am BD Legal Guide AI. How can I help you today?', mode: 'gemini', timestamp: new Date().toISOString() },
  { id: '2', role: 'user', content: 'What is the punishment for theft?', mode: 'gemini', timestamp: new Date().toISOString() },
  { 
    id: '3', 
    role: 'assistant', 
    content: 'Under the Penal Code of Bangladesh, theft is punishable by imprisonment of either description for a term which may extend to three years, or with fine, or with both.', 
    mode: 'rag', 
    citations: [{ act: 'Penal Code', section: '379' }],
    timestamp: new Date().toISOString() 
  },
  { id: '4', role: 'user', content: 'I have a property dispute with my neighbor over a boundary wall.', mode: 'gemini', timestamp: new Date().toISOString() },
  { 
    id: '5', 
    role: 'assistant', 
    content: 'Property and boundary disputes are civil matters. While I can provide general information about the Transfer of Property Act, boundary disputes often require surveying and legal intervention to resolve effectively.', 
    mode: 'gemini', 
    triageSuggestion: { specialty: 'Property', lawyerIds: [] },
    timestamp: new Date().toISOString() 
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const [isRagMode, setIsRagMode] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggleRag = () => {
    if (!isProUser && !isRagMode) {
      setShowPaywall(true);
    } else {
      setIsRagMode(!isRagMode);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      mode: isRagMode ? 'rag' : 'gemini',
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, newMsg]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isRagMode ? 'This is a RAG verified response.' : 'This is a standard AI response.',
        mode: isRagMode ? 'rag' : 'gemini',
        timestamp: new Date().toISOString()
      }]);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      
      {/* Sidebar - hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <Sidebar currentSessionId="current" />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
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
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className={`px-5 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                </div>
                
                {/* Citations & Triage */}
                {msg.role === 'assistant' && (
                  <div className="w-full mt-1">
                    <CitationChips citations={msg.citations} />
                    <TriageCard suggestion={msg.triageSuggestion} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer Area */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="max-w-4xl mx-auto relative flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a legal question..."
              className="w-full bg-transparent text-zinc-50 placeholder-zinc-500 p-4 min-h-[80px] max-h-[200px] resize-y outline-none text-sm scrollbar-thin scrollbar-thumb-zinc-700"
            />
            
            <div className="flex items-center justify-between p-3 border-t border-zinc-800/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => !isProUser && setShowPaywall(true)}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Upload Document (Pro)"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                
                {/* RAG Toggle */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${!isRagMode ? 'text-zinc-300' : 'text-zinc-500'}`}>Standard AI</span>
                  
                  <button 
                    onClick={handleToggleRag}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      isRagMode ? 'bg-violet-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isRagMode ? 'translate-x-2' : '-translate-x-2'
                    }`} />
                  </button>
                  
                  <span className={`text-xs font-medium flex items-center gap-1 ${isRagMode ? 'text-violet-400' : 'text-zinc-500'}`}>
                    <Zap className="h-3 w-3" /> RAG Verified
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
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
