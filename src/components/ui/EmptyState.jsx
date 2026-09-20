import React from 'react';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl border-dashed">
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-zinc-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-zinc-50 mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 mb-6 max-w-sm">{description}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
