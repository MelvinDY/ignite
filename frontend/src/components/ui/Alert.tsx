import React from 'react';

interface AlertProps {
  message: React.ReactNode;
  type?: 'error' | 'success' | 'info';
  className?: string;
}

export function Alert({ message, type = 'error', className = '' }: AlertProps) {
  const baseClasses = 'p-3 rounded-md border text-sm';
  const typeClasses = {
    error: 'bg-red-900/20 border-red-400 text-red-200',
    success: 'bg-green-900/20 border-green-400 text-green-200',
    info: 'bg-blue-900/20 border-blue-400 text-blue-200',
  };

  return (
    <div 
      className={`${baseClasses} ${typeClasses[type]} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}