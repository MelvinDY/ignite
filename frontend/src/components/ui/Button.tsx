import React from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "link";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: ButtonProps) {
  const baseClasses =
    "rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-colors";
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };
  const variantClasses = {
    primary:
      "bg-white text-[#3E000C] hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed",
    secondary:
      "bg-white/10 text-white border border-white/30 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed",
    link: "bg-transparent text-white underline hover:text-white/80 disabled:text-white/50 disabled:cursor-not-allowed",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={twMerge(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
