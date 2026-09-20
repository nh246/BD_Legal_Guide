import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Loader2, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentSessionId, onSelectSession, onNewSession }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const fetchSessions = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await api.get('/chat/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  // Expose fetchSessions to parent via custom event if needed
  useEffect(() => {
    const handleRefresh = () => fetchSessions();
    window.addEventListener('chat:refresh-sessions', handleRefresh);
    return () => window.removeEventListener('chat:refresh-sessions', handleRefresh);
  }, [token]);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        onNewSession();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <div className="w-64 bg-gray-900/50 border-r border-white/10 flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-white/5">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center p-4 text-gray-500 text-sm">
            No previous chats
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                currentSessionId === session.id
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm font-medium">
                  {session.title || 'New Chat'}
                </span>
              </div>
              <button
                onClick={(e) => handleDelete(e, session.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                title="Delete chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
