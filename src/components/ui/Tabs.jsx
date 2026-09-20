import React from 'react';

export function Tabs({ children, className = '', ...props }) {
  return (
    <div className={`w-full ${className}`} {...props}>
      {children}
    </div>
  );
}

export function TabsList({ children, className = '', ...props }) {
  return (
    <div className={`flex items-center gap-6 border-b border-zinc-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function TabsTrigger({ 
  children, 
  isActive = false, 
  onClick,
  className = '',
  ...props 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        pb-3 pt-2 px-1 text-sm font-medium transition-colors relative
        ${isActive ? 'text-blue-500' : 'text-zinc-400 hover:text-zinc-200'}
        ${className}
      `}
      {...props}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full"></span>
      )}
    </button>
  );
}

export function TabsContent({ children, isActive = false, className = '', ...props }) {
  if (!isActive) return null;
  
  return (
    <div className={`py-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
