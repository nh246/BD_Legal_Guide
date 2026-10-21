import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Send,
  Bot,
  User as UserIcon,
  FileText,
  Scale,
  MessageSquare,
  AlertCircle,
  Cpu,
  Paperclip,
  Lock,
  Upload,
  Trash2,
  X,
  Loader2,
  Image as ImageIcon,
  Menu,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Modal from '../../components/ui/Modal';
import ProPaywallModal from '../../components/ui/ProPaywallModal';
import api, { asList, getErrorMessage } from '../../lib/api';
import useApi from '../../lib/useApi';
import useAuthStore from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';

const SUGGESTIONS = [
  'What is the punishment for theft under the Penal Code?',
  'How do I register a Private Limited Company in Bangladesh?',
  'What are the grounds for divorce under Bangladeshi law?',
  'How to resolve a boundary dispute with my neighbor under land law?',
];

export default function ChatPage() {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams();
  const { user, token } = useAuthStore();
  const { data: subData } = useApi(token ? '/subscriptions/mine' : null);

  const [activeSessionId, setActiveSessionId] = useState(routeSessionId || null);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [llmConfig, setLlmConfig] = useState(null);
  const [usage, setUsage] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Document attachment states
  const [isDocPopoverOpen, setIsDocPopoverOpen] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [attachedDocs, setAttachedDocs] = useState([]);
  const fileInputRef = useRef(null);
  const popoverRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPro = Boolean(
    (subData?.status === 'active' && subData?.plan_code === 'user_pro') ||
    user?.plan === 'user_pro' ||
    user?.plan === 'pro' ||
    user?.is_pro === true
  );

  const isFree = usage ? usage.plan === 'user_free' : !isPro;
  const messagesLeft = usage?.daily_limit != null
    ? Math.max(0, usage.daily_limit - (usage.messages_today || 0))
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch usage stats
  const fetchUsage = async () => {
    try {
      const res = await api.get('/chat/usage');
      setUsage(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  // Fetch active LLM config on mount
  useEffect(() => {
    api.get('/admin/llm-config')
      .then((res) => setLlmConfig(res.data))
      .catch(() => {
        setLlmConfig({
          model_name: 'gemini-1.5-flash',
          disclaimer: 'This information is for educational purposes and not a substitute for professional legal advice under Bangladesh law.'
        });
      });
  }, []);

  // Load chat sessions
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/chat/sessions');
      setSessions(asList(res.data, 'sessions'));
    } catch {
      // Backend not yet ready or empty
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
          // If session not found, keep existing messages
        });
    }
  }, [activeSessionId]);

  // Click outside listener for the popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsDocPopoverOpen(false);
      }
    };
    if (isDocPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDocPopoverOpen]);

  const loadUserDocuments = async () => {
    setIsDocsLoading(true);
    try {
      const res = await api.get('/chat/documents');
      setUserDocuments(asList(res.data, 'documents'));
    } catch {
      // ignore
    } finally {
      setIsDocsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowed = ['txt', 'md', 'pdf', 'png', 'jpg', 'jpeg', 'webp'];
    setIsUploadingDoc(true);

    const newlyUploaded = [];
    try {
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!allowed.includes(ext)) {
          toast(`Invalid file type for "${file.name}". Supported: .txt, .md, .pdf, images.`, 'error');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast(`"${file.name}" exceeds maximum limit of 5 MB.`, 'error');
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await api.post('/chat/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const newDoc = res.data;
          toast(`"${newDoc.filename}" uploaded successfully!`, 'success');
          newlyUploaded.push(newDoc);
        } catch (err) {
          if (err.response?.status === 402) {
            setShowPaywall(true);
            const msg = err.response?.data?.message || 'Document upload is a Pro feature.';
            setPaywallMessage(msg);
            toast(msg, 'error');
            break;
          } else if (err.response?.status === 400) {
            const msg = err.response?.data?.message || err.response?.data?.detail || `Failed to upload "${file.name}".`;
            toast(msg, 'error');
          } else {
            toast(getErrorMessage(err, `Failed to upload "${file.name}".`), 'error');
          }
        }
      }

      if (newlyUploaded.length > 0) {
        setUserDocuments((prev) => [...newlyUploaded, ...prev]);
        setAttachedDocs((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          const toAdd = newlyUploaded.filter((d) => !existingIds.has(d.id));
          const available = 4 - prev.length;
          if (available <= 0) return prev;
          return [...prev, ...toAdd.slice(0, available)];
        });
      }
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (e, docId) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/documents/${docId}`);
      setUserDocuments((prev) => prev.filter((d) => d.id !== docId));
      setAttachedDocs((prev) => prev.filter((d) => d.id !== docId));
      toast('Document deleted', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to delete document'), 'error');
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

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeletingSession(true);
    const targetId = sessionToDelete.id;

    try {
      await api.delete(`/chat/sessions/${targetId}`);
      setSessions((prev) => prev.filter((s) => s.id !== targetId));
      toast('Conversation deleted', 'success');

      if (activeSessionId === targetId) {
        setActiveSessionId(null);
        setMessages([]);
        setChatError(null);
        navigate('/client/chat');
      }

      await fetchUsage();
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to delete conversation'), 'error');
    } finally {
      setIsDeletingSession(false);
      setSessionToDelete(null);
    }
  };

  const handleSend = async (text = input) => {
    if (!text.trim() || isTyping) return;
    const userText = text.trim();
    const docsToSend = [...attachedDocs];
    setInput('');
    setChatError(null);
    setAttachedDocs([]);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      attachedDocs: docsToSend.map((d) => d.filename),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const payload = {
        session_id: activeSessionId || null,
        content: userText,
        attachment_ids: docsToSend.map((d) => d.id),
      };

      const res = await api.post('/chat', payload);

      const reply = res.data;
      if (reply.session_id && reply.session_id !== activeSessionId) {
        setActiveSessionId(reply.session_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: reply.id || Date.now().toString(),
          role: 'assistant',
          content: reply.content || reply.reply || reply.response || reply.message || 'No response generated.',
          citations: reply.citations || [],
          disclaimer: reply.disclaimer || llmConfig?.disclaimer,
          triage: reply.triage || null,
          usedDocuments: docsToSend.length > 0 ? docsToSend.map((d) => d.filename).join(', ') : null,
        },
      ]);
      loadSessions();
      fetchUsage();
    } catch (err) {
      if (err.response?.status === 402) {
        setShowPaywall(true);
        const msg = err.response?.data?.message || 'Daily free limit reached (10 messages). Upgrade to Pro for unlimited queries.';
        setPaywallMessage(msg);
        toast(msg, 'error');
        setChatError(msg);
        return;
      }
      if (err.response?.status === 400) {
        const msg = err.response?.data?.message || err.response?.data?.detail || 'Invalid chat request.';
        toast(msg, 'error');
        setChatError(msg);
        return;
      }
      const is502 = err.response?.status === 502;
      const errorMsg = is502
        ? 'AI service temporarily unavailable. Please try again.'
        : getErrorMessage(err, 'AI service temporarily unavailable. Please try again.');
      toast('AI service temporarily unavailable. Please try again.', 'error');
      setChatError(errorMsg);
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

  const currentModelDisplay = llmConfig?.model_name || llmConfig?.model || 'Gemini 1.5 Flash';
  const disclaimerText = llmConfig?.disclaimer || 'This information is for educational purposes and not a substitute for professional legal advice.';

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
              <div
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={`group w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                  activeSessionId === session.id
                    ? 'bg-zinc-800 text-zinc-50'
                    : 'text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{session.title || 'Legal Query'}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToDelete(session);
                  }}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar with Model Name & Mode */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 bg-zinc-950/80 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors"
              title="Recent conversations"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <Cpu className="h-3.5 w-3.5 text-blue-400" />
              <span>Model: <strong className="text-zinc-100">{currentModelDisplay}</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {isFree ? (
              <>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Free Plan
                </span>
                {messagesLeft !== null && (
                  <span className="text-xs text-zinc-400">
                    {messagesLeft} messages left today
                  </span>
                )}
              </>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/40">
                Pro Plan
              </span>
            )}
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
              <h2 className="text-2xl font-bold text-zinc-50 mb-3">How can I help you with Bangladesh Law today?</h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-md">
                Ask questions regarding Penal Code, Family Law, Corporate registration, or Property disputes.
              </p>

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
                    {msg.role === 'user' && msg.attachedDoc && (
                      <div className="mb-1.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-300 font-medium">
                        <Paperclip className="h-3 w-3 text-violet-400" />
                        <span className="truncate max-w-[200px]">{msg.attachedDoc}</span>
                      </div>
                    )}

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

                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                      <div className="w-full mt-3 flex flex-wrap gap-2">
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

                    {msg.role === 'assistant' && (msg.usedDocuments || msg.usedDocument) && (
                      <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-xs text-violet-300 w-fit">
                        <FileText className="h-3 w-3 text-violet-400" />
                        <span>Answered using: <span className="font-semibold text-zinc-100">{msg.usedDocuments || msg.usedDocument}</span></span>
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

        {/* Composer Area with Prominent Disclaimer */}
        <div className="p-4 sm:p-6 pt-0 bg-zinc-950">
          {/* Prominent Legal Disclaimer Banner */}
          <div className="max-w-4xl mx-auto mb-3 px-3.5 py-2 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{disclaimerText}</span>
          </div>

          <div className="max-w-4xl mx-auto relative flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-2 pl-4">
            {/* Attached file chips row */}
            {attachedDocs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-1">
                {attachedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-1.5 p-1.5 px-3 bg-violet-500/10 border border-violet-500/30 rounded-lg text-xs text-violet-300"
                  >
                    {doc.kind === 'image' ? (
                      <ImageIcon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    )}
                    <span className="font-medium truncate max-w-[180px]">{doc.filename} (attached)</span>
                    <button
                      type="button"
                      onClick={() => setAttachedDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                      className="ml-1 text-violet-400 hover:text-violet-200 transition-colors p-0.5 rounded-full hover:bg-violet-500/20"
                      title="Detach file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 w-full">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a Bangladesh legal question..."
                className="w-full bg-transparent text-zinc-50 placeholder-zinc-500 py-3 min-h-[44px] max-h-[160px] resize-none outline-none text-sm scrollbar-thin scrollbar-thumb-zinc-700"
                rows={input.split('\n').length > 1 ? Math.min(5, input.split('\n').length) : 1}
              />

              {/* Attach document button left of send button */}
              <div className="relative mb-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp"
                  multiple
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (isFree) {
                      setPaywallMessage('Legal document and image upload with AI analysis is a Pro feature.');
                      setShowPaywall(true);
                    } else {
                      if (!isDocPopoverOpen) {
                        loadUserDocuments();
                      }
                      setIsDocPopoverOpen((prev) => !prev);
                    }
                  }}
                  className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors border relative ${
                    attachedDocs.length > 0
                      ? 'bg-violet-600/20 text-violet-300 border-violet-500/40 hover:bg-violet-600/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-zinc-200 hover:bg-zinc-700/60'
                  }`}
                  title={isFree ? 'Document & Image Analysis (Pro Plan Required)' : 'Attach files (up to 4)'}
                >
                  {isFree ? (
                    <Lock className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <>
                      <Paperclip className={`h-4 w-4 ${attachedDocs.length > 0 ? 'text-violet-400' : ''}`} />
                      {attachedDocs.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {attachedDocs.length}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* Popover Document Manager */}
                {isDocPopoverOpen && !isFree && (
                  <div
                    ref={popoverRef}
                    className="absolute bottom-12 right-0 w-80 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-semibold text-zinc-100">Attach Documents & Images</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDocPopoverOpen(false)}
                        className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Upload Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingDoc}
                      className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isUploadingDoc ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Uploading files...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload File (.txt, .md, .pdf, images)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                      <span>My Documents</span>
                      <span className="text-[10px] text-zinc-500 normal-case">{attachedDocs.length}/4 selected</span>
                    </div>

                    {/* Documents List */}
                    <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-700 pr-1">
                      {isDocsLoading ? (
                        <div className="py-4 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                          <span>Loading documents...</span>
                        </div>
                      ) : userDocuments.length === 0 ? (
                        <div className="py-4 text-center text-xs text-zinc-500 italic">
                          No documents uploaded yet.
                        </div>
                      ) : (
                        userDocuments.map((doc) => {
                          const isSelected = attachedDocs.some((d) => d.id === doc.id);
                          return (
                            <div
                              key={doc.id}
                              onClick={() => {
                                if (isSelected) {
                                  setAttachedDocs((prev) => prev.filter((d) => d.id !== doc.id));
                                } else {
                                  if (attachedDocs.length >= 4) {
                                    toast('Maximum 4 attachments per message', 'error');
                                    return;
                                  }
                                  setAttachedDocs((prev) => [...prev, doc]);
                                }
                              }}
                              className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors border ${
                                isSelected
                                  ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                                  : 'bg-zinc-800/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {doc.kind === 'image' ? (
                                  <ImageIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-violet-400' : 'text-zinc-400'}`} />
                                ) : (
                                  <FileText className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-violet-400' : 'text-zinc-400'}`} />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-medium">{doc.filename}</div>
                                  <div className="text-[10px] text-zinc-500">
                                    {doc.kind === 'image' ? formatFileSize(doc.char_count) : `${(doc.char_count || 0).toLocaleString()} chars`}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {isSelected && (
                                  <span className="text-[10px] text-violet-400 font-semibold px-1.5 py-0.5 rounded bg-violet-500/20">
                                    Selected
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteDocument(e, doc.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-400 transition-all rounded"
                                  title="Delete file"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="mb-1 shrink-0 h-10 w-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        message={paywallMessage}
        onSuccess={fetchUsage}
      />

      {/* Delete Conversation Confirmation Modal */}
      <Modal
        isOpen={Boolean(sessionToDelete)}
        onClose={() => {
          if (!isDeletingSession) setSessionToDelete(null);
        }}
        title="Delete conversation?"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            This will permanently remove this chat history.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isDeletingSession}
              onClick={() => setSessionToDelete(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeletingSession}
              onClick={handleConfirmDeleteSession}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-900/20"
            >
              {isDeletingSession ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col z-50 h-full animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => {
                  handleNewChat();
                  setIsMobileSidebarOpen(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare className="h-4 w-4" /> New Chat
              </button>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="ml-2 p-2 text-zinc-400 hover:text-zinc-200 rounded-lg"
              >
                <X className="h-4 w-4" />
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
                  <div
                    key={`m-${session.id}`}
                    onClick={() => {
                      selectSession(session.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`group w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      activeSessionId === session.id
                        ? 'bg-zinc-800 text-zinc-50'
                        : 'text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{session.title || 'Legal Query'}</div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
