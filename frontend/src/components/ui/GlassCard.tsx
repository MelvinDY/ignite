import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`relative bg-white/[0.15] backdrop-blur-2xl border border-white/25 shadow-2xl rounded-2xl p-6 md:p-8 hover:bg-white/[0.18] transition-all duration-300 ${className}`}>
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}