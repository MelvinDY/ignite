import React from 'react';
import { GlassCard } from '../ui/GlassCard';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Gradient Background with Responsive Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3E000C] via-[#2A0008] to-[#1A0005]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#4D1117]/20 to-[#3E000C]/40" />
      <div className="absolute inset-0 bg-gradient-to-bl from-[#3E000C]/60 via-transparent to-[#2A0008]/80" />
      
      {/* Subtle animated background elements for depth */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 md:w-36 md:h-36 bg-white/3 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 md:w-28 md:h-28 bg-white/4 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        {/* Left side - Auth card */}
        <div className="order-2 md:order-1">
          <GlassCard className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
            {children}
          </GlassCard>
        </div>

        {/* Right side - Headline */}
        <div className="order-1 md:order-2 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide leading-tight drop-shadow-lg">
            CONNECT AND FIND YOUR FAMILY
          </h2>
          <div className="mt-4 w-16 h-1 bg-gradient-to-r from-white/60 to-transparent mx-auto md:mx-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}