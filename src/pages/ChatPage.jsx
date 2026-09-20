import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, Scale, AlertTriangle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';

const ChatPage = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadSession = async (id) => {
    try {
      setSessionId(id);
      setIsLoading(true);
      const response = await api.get(`/chat/sessions/${id}/history`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // If session not found, start new one
      startNewSession();
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSession = () => {
    setSessionId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    
    // Add user message to UI immediately
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.post('/chat/query', {
        query,
        session_id: sessionId
      });
      
      const { answer, sources, session_id: newSessionId } = response.data;
      
      // If this was a new session, update the ID and refresh sidebar
      if (!sessionId && newSessionId) {
        setSessionId(newSessionId);
        window.dispatchEvent(new Event('chat:refresh-sessions'));
      }
      
      // Add assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: answer,
        sources: sources
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0a0f1e] flex flex-col font-sans overflow-hidden">
      <Navbar />

      <div className="flex-1 flex pt-16 h-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          currentSessionId={sessionId} 
          onSelectSession={loadSession}
          onNewSession={startNewSession}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative h-full">
          {/* Background effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
          
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
                <Scale className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">How can I help you with Bangladesh Law today?</h2>
              <p className="text-gray-400 max-w-lg mx-auto mb-8 text-lg">
                Ask me about specific acts, punishments, or general legal procedures. I have access to the complete 1,484 acts in the Bangladesh Legal Code.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                {[
                  "What is the punishment for murder under the Penal Code?",
                  "Explain the requirements for a valid contract.",
                  "What are the rights of a consumer under the Consumer Rights Act?",
                  "What is the procedure for registering a company?"
                ].map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => setInputValue(prompt)}
                    className="p-4 glass-panel border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl text-left transition-all group"
                  >
                    <p className="text-sm text-gray-300 group-hover:text-blue-300 transition-colors">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar relative z-10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-3xl space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                        : 'bg-gray-800 border border-white/10'
                    }`}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className="flex flex-col space-y-2 max-w-full">
                      <div className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : msg.isError
                            ? 'bg-red-500/10 border border-red-500/20 text-red-200 rounded-tl-sm'
                            : 'glass-panel text-gray-200 rounded-tl-sm prose prose-invert max-w-none'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      
                      {/* Sources Snippets */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                            <FileText className="w-3 h-3 mr-1" /> Legal Citations
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map((source, sIdx) => (
                              <div key={sIdx} className="px-3 py-1.5 bg-gray-800/50 border border-white/5 rounded-lg text-xs text-gray-300 max-w-full truncate flex items-center">
                                <span className="font-medium text-blue-400 mr-2">{source.act_title}</span>
                                {source.section_number && <span className="text-gray-400">Sec {source.section_number}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-3xl space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-5 h-5 text-blue-400 animate-pulse" />
                    </div>
                    <div className="glass-panel p-4 rounded-2xl rounded-tl-sm flex items-center space-x-2 w-24">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-[#0a0f1e] to-transparent relative z-20">
            <div className="max-w-4xl mx-auto relative">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a legal question..."
                  className="w-full bg-gray-900/80 border border-white/10 text-white rounded-2xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-lg backdrop-blur-md"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <div className="mt-2 text-center flex items-center justify-center text-xs text-gray-500">
                <AlertTriangle className="w-3 h-3 mr-1 text-yellow-500/70" />
                <span>AI can make mistakes. For official legal advice, consult a qualified practitioner.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
