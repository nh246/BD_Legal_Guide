import React from 'react';

export default function Skeleton({ className = '', ...props }) {
  return (
    <div 
      className={`animate-pulse bg-zinc-800/50 rounded ${className}`} 
      {...props} 
    />
  );
}
