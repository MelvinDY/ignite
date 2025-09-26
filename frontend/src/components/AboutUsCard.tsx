import { twMerge } from "tailwind-merge";

interface AboutUsCardProps {
  children: React.ReactNode;
  className?: string;
  img?: string;
}

const AboutUsCard = ({ children, className = "", img = "" }: AboutUsCardProps) => {
  return <div className={twMerge(`relative border border-white/25 shadow-3xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8
      hover:scale-105 ease-in-out transition-all duration-300 bg-cover bg-center bg-no-repeat`, className)}
      style={{ backgroundImage: `url(${img})`}}
  >
    {/* Inner overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-red-900/50 to-black/50 rounded-xl sm:rounded-2xl"/>
    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>
  </div>
}

export { AboutUsCard };