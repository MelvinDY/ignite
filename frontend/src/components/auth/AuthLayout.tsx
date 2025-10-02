import React from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "../ui/GlassCard";
import connectImage from "../../assets/Connect.png";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4 lg:p-6">
      {/* Base background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--dark-red)] via-[var(--darker-red)] to-[var(--dark-red)]" />

      {/* Radial blur gradient overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)"
        }}
      />

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

        {/* Right side - Custom Image */}
        <div className="order-1 lg:order-2 flex items-center justify-center px-2 sm:px-4">
          <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
            {/* Background glow layers */}
            <div className="absolute -inset-4 bg-gradient-to-br from-white/8 via-white/4 to-transparent blur-lg pointer-events-none rounded-2xl" />
            <div className="absolute -inset-2 bg-gradient-to-t from-white/6 via-transparent to-white/4 blur-md pointer-events-none rounded-xl" />

            <img
              src={connectImage}
              alt="Connect and find your family"
              className="w-full h-auto object-contain drop-shadow-2xl relative z-10"
            />

            {/* Overlay gradient effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/12 via-white/6 to-transparent pointer-events-none rounded-lg z-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/6 pointer-events-none rounded-lg z-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
