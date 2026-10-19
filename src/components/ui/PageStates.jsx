import React from 'react';
import { Loader2, ServerCrash, RefreshCw, Inbox } from 'lucide-react';
import { getErrorMessage } from '../../lib/api';

export function LoadingState({ label, message, className = '' }) {
  const text = message || label || 'Loading...';
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
      <p className="text-sm text-zinc-500">{text}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-300">
        <div className="h-14 w-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ServerCrash className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-50 mb-2">Could not reach server</h2>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{getErrorMessage(error)}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description,
  message,
  actionLabel,
  onAction,
  className = ''
}) {
  const desc = description || message || 'There is nothing to display right now.';
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="h-14 w-14 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-400 border border-zinc-700/40">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-1.5">{title}</h3>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{desc}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
