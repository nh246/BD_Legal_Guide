import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg shadow-black/20 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pb-4 border-b border-zinc-800/50 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-xl font-semibold text-zinc-50 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pt-4 border-t border-zinc-800/50 flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
}
