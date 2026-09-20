import React, { forwardRef } from 'react';

const Textarea = forwardRef(({ 
  label, 
  error, 
  className = '', 
  id,
  ...props 
}, ref) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        className={`
          w-full rounded-lg bg-zinc-900 border text-zinc-50 placeholder-zinc-500
          transition-all duration-200 outline-none resize-y min-h-[80px]
          focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-zinc-800'}
          p-3 text-sm scrollbar-thin scrollbar-thumb-zinc-700
        `}
        {...props}
      />
      
      {error && (
        <p className="text-xs text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
