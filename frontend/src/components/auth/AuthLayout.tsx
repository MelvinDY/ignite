import React from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import batik2 from '../../assets/batik2.png';
import batik3 from '../../assets/batik3.png';
import batik4 from '../../assets/batik 4.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4 lg:p-6">
      {/* Shape Blur Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#3E000C] via-[#2A0007] to-[#3E000C]" />
      
      {/* Enhanced gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-tr from-transparent via-[#2A0007]/20 to-[#3E000C]/40" />
      <div className="fixed inset-0 bg-gradient-to-bl from-[#3E000C]/50 via-transparent to-[#2A0007]/60" />
      
      {/* Mobile-specific gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#2A0007]/15 to-transparent sm:hidden" />
      
      {/* Desktop enhancement gradient */}
      <div className="hidden lg:block fixed inset-0 bg-gradient-to-r from-[#3E000C]/25 via-[#2A0007]/20 to-[#3E000C]/25" />
      
      {/* Batik Pattern Overlays for Enhanced Visual Depth - All using batik2 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Batik 2 - Top Left */}
        <div 
          className="absolute -top-20 -left-20 w-80 h-96 sm:w-96 sm:h-[120px] md:w-[120px] md:h-[144px] opacity-50"
          style={{
            backgroundImage: `url(${batik2})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Batik 3 - Bottom Right */}
        <div 
          className="absolute -bottom-20 -right-20 w-96 h-[120px] sm:w-[120px] sm:h-[144px] md:w-[480px] md:h-[160px] lg:w-[600px] lg:h-[200px] opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Batik 4 - Center Right */}
        <div 
          className="absolute top-1/2 -right-16 w-64 h-80 sm:w-80 h-96 md:w-96 md:h-[120px] opacity-50"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Batik 3 - Top Center */}
        <div 
          className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-56 h-72 sm:w-72 sm:h-88 md:w-88 md:h-[110px] opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Batik 4 - Bottom Left */}
        <div 
          className="absolute -bottom-16 -left-16 w-48 h-64 sm:w-64 sm:h-80 md:w-80 md:h-96 opacity-50"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Batik 2 - Center Left */}
        <div 
          className="absolute top-1/3 -left-12 w-44 h-56 sm:w-56 sm:h-72 md:w-72 md:h-88 opacity-50"
          style={{
            backgroundImage: `url(${batik2})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Batik 3 - Top Right */}
        <div 
          className="absolute top-1/4 -right-12 w-40 h-52 sm:w-52 sm:h-64 md:w-64 md:h-80 opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Additional Center Batik Patterns - Mixed Designs */}
        <div 
          className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-32 sm:w-[480px] sm:h-40 md:w-[600px] md:h-48 opacity-50"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        <div 
          className="absolute top-3/4 left-1/2 transform -translate-x-1/2 w-80 h-28 sm:w-96 sm:h-32 md:w-[480px] md:h-36 opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        <div 
          className="absolute top-1/2 left-1/4 w-64 h-24 sm:w-80 sm:h-28 md:w-96 md:h-32 opacity-50"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        <div 
          className="absolute top-1/2 right-1/4 w-64 h-24 sm:w-80 sm:h-28 md:w-96 md:h-32 opacity-50"
          style={{
            backgroundImage: `url(${batik2})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        <div 
          className="absolute top-2/3 left-1/3 w-72 h-26 sm:w-88 sm:h-30 md:w-[420px] md:h-34 opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Mobile-only mixed batik patterns */}
        <div 
          className="absolute top-16 right-16 w-28 h-36 opacity-50 sm:hidden"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        <div 
          className="absolute bottom-24 left-8 w-32 h-40 opacity-50 sm:hidden"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
        
        <div 
          className="absolute top-1/3 right-8 w-24 h-32 opacity-50 sm:hidden"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
      </div>
      
      {/* Enhanced glassmorphism overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.03]" />
      
      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6">
        <div className="flex justify-between items-center">
          <Link 
            to="/"
            className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors group"
          >
            <svg 
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm sm:text-base font-medium">Back to Dashboard</span>
          </Link>
          
          <div className="text-white/60 text-sm hidden sm:block">
            IGNITE UNSW
          </div>
        </div>
      </div>
      
      {/* Responsive subtle background elements for depth */}
      <div className="absolute inset-0 opacity-15 sm:opacity-20">
        <div className="absolute top-1/4 left-1/4 w-20 h-20 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-white/6 sm:bg-white/8 rounded-full blur-2xl sm:blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16 sm:w-24 sm:h-24 lg:w-36 lg:h-36 bg-white/4 sm:bg-white/6 rounded-full blur-xl sm:blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-14 h-14 sm:w-20 sm:h-20 lg:w-28 lg:h-28 bg-white/5 sm:bg-white/7 rounded-full blur-xl sm:blur-2xl" />
        
        {/* Additional mobile-only element */}
        <div className="absolute top-3/4 left-1/3 w-12 h-12 bg-white/3 rounded-full blur-xl sm:hidden" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
        {/* Left side - Auth card */}
        <div className="order-2 lg:order-1 flex justify-center">
          <GlassCard className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-md">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center lg:text-left">{title}</h1>
            {children}
          </GlassCard>
        </div>

        {/* Right side - Headline */}
        <div className="order-1 lg:order-2 text-center lg:text-left px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-wide leading-tight drop-shadow-lg">
            CONNECT AND FIND YOUR FAMILY
          </h2>
          <div className="mt-3 sm:mt-4 w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-white/60 to-transparent mx-auto lg:mx-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}