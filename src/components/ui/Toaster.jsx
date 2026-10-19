import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '../../store/useToastStore';

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
  error: <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-400 shrink-0" />,
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto bg-zinc-900 text-zinc-50 px-4 py-3 rounded-xl shadow-2xl border border-zinc-700 animate-in slide-in-from-bottom-5 fade-in font-medium text-sm flex items-start gap-3 max-w-md"
        >
          <div className="mt-0.5">{ICONS[t.variant] || ICONS.info}</div>
          <div className="flex-1 text-left">
            {t.title && <div className="font-semibold text-zinc-100">{t.title}</div>}
            {t.description && <div className="text-xs text-zinc-400 mt-0.5">{t.description}</div>}
            {!t.title && !t.description && <span>{t.message}</span>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 -mr-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
