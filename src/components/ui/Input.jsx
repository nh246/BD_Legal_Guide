import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  iconLeft: IconLeft, 
  iconRight: IconRight, 
  className = '', 
  id,
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {IconLeft && (
          <div className="absolute left-3 text-zinc-500 pointer-events-none">
            <IconLeft className="h-4 w-4" />
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg bg-zinc-900 border text-zinc-50 placeholder-zinc-500
            transition-all duration-200 outline-none
            focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-zinc-800'}
            ${IconLeft ? 'pl-9' : 'pl-3'}
            ${IconRight ? 'pr-9' : 'pr-3'}
            py-2 text-sm
          `}
          {...props}
        />
        
        {IconRight && (
          <div className="absolute right-3 text-zinc-500 pointer-events-none">
            <IconRight className="h-4 w-4" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
