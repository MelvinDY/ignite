import React from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "../ui/GlassCard";
import { BatikBackground } from "../BatikBackground";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <BatikBackground />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm sm:text-base font-medium">
              Back to Dashboard
            </span>
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
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center lg:text-left">
              {title}
            </h1>
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
