import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, MessageSquare, Zap } from 'lucide-react';

export default function Sidebar({ sessions = [], currentSessionId }) {
  // Hardcoded for now until we integrate auth state properly
  const isPro = false; 

  return (
    <aside className="w-64 flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      
      {/* New Chat Button */}
      <div className="p-4 border-b border-zinc-800">
        <Link 
          to="/chat"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Link>
      </div>

      {/* Session History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 mt-2 px-2">
          History
        </h3>
        
        {sessions.length === 0 ? (
          <div className="text-sm text-zinc-500 px-2 italic">No previous chats</div>
        ) : (
          sessions.map((session) => (
            <Link
              key={session.id}
              to={`/chat/${session.id}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentSessionId === session.id 
                  ? 'bg-zinc-800 text-zinc-50' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">{session.title}</span>
            </Link>
          ))
        )}
      </div>

      {/* Upgrade Banner (Free Users Only) */}
      {!isPro && (
        <div className="p-4 mt-auto border-t border-zinc-800">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-semibold text-zinc-50">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Unlock RAG-verified citations, document upload, and unlimited queries.
            </p>
            <Link 
              to="/pricing"
              className="block w-full text-center py-1.5 px-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}
      
    </aside>
  );
}
