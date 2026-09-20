import React from 'react';

export default function Badge({ 
  children, 
  variant = 'default', 
  className = '',
  ...props 
}) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  
  const variants = {
    default: 'bg-zinc-800 text-zinc-300',
    success: 'bg-emerald-400/10 text-emerald-400',
    warning: 'bg-amber-400/10 text-amber-400',
    danger: 'bg-red-400/10 text-red-400',
    pro: 'bg-violet-400/10 text-violet-400 border border-violet-400/20'
  };

  return (
    <span 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
