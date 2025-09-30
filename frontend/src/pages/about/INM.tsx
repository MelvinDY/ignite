import { useState, useEffect } from "react";
import type { JSX, FC } from "react";
import logoPPIA from "@/assets/Copy of PPIA.png";

const HeroSection: FC<{ scrollOffset: number; blur?: number }> = ({ scrollOffset, blur = 0 }) => (
  <section
    className="h-screen relative pt-20"
    style={{
      transform: `translateY(${scrollOffset * 0.4}px)`,
      filter: `blur(${blur}px)`,
      willChange: "transform",
    }}
  >
    <div
      className="absolute inset-0 z-0"
      style={{
        background:
          "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)",
      }}
    />

    {/* Main Title - Top Right */}
    <div className="absolute top-20 right-0 z-10 text-right">
      <h1 className="m-0 leading-none text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider uppercase text-white">
        INDONESIAN
      </h1>
      <h1 className="m-0 -mt-1 md:-mt-3 lg:-mt-5 leading-none text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider uppercase text-white">
        NIGHT MARKET
      </h1>
      <h1 className="m-0 -mt-1 md:-mt-3 lg:-mt-5 leading-none text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider uppercase text-white">
        2025
      </h1>
    </div>

    {/* Subtitle - Below main title */}
    <div className="absolute top-60 right-0 z-10 text-right">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-widest uppercase text-white/90">
        NAWASENA
      </h2>
    </div>

    {/* Logo - Bottom Left */}
    <div className="absolute bottom-48 left-0 z-10">
      <img src={logoPPIA} alt="PPIA UNSW Logo" className="w-32 h-32 md:w-40 md:h-40" />
    </div>

    {/* Description - Bottom Left, under logo */}
    <div className="absolute bottom-8 left-0 z-10 max-w-md">
      <p className="text-sm md:text-base text-white/80 leading-relaxed">
        Experience the vibrant flavors, sounds, and colors of Indonesia at Sydney's premier cultural celebration.
        A night market bringing authentic Indonesian street food, traditional performances, and cultural experiences
        to the heart of UNSW, connecting communities through the rich heritage of the archipelago.
      </p>
    </div>
  </section>
);

const VisionMissionSection: FC = () => (
  <section className="py-24 max-w-3xl mx-auto space-y-20">
    <div className="text-left">
      <div className="relative inline-block">
        <div className="absolute -inset-24 z-0 bg-black/50 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-5xl font-medium mb-4 uppercase tracking-widest">
            Vision
          </h2>
          <p className="text-white/80 leading-relaxed max-w-md">
            To expand the INM community through value and inclusive programs
            while uplifting Indonesian culture and cultural expression through
            innovative night market experiences.
          </p>
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className="relative inline-block">
        <div className="absolute -inset-24 z-0 bg-black/50 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-5xl font-medium mb-4 uppercase tracking-widest">
            Mission
          </h2>
          <p className="text-white/80 leading-relaxed max-w-md ml-auto">
            We strive to create meaningful community interactions through
            innovative programs, cultural celebrations, collaborative efforts,
            and authentic Indonesian experiences that bring people together
            and preserve our heritage for future generations.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const LegacyEventCard: FC<{
  index: number;
  id: string;
  image: string;
  title: string;
  theme: string;
  activeEvent: number;
}> = ({ index, id, image, title, theme, activeEvent }) => {
  const offset = index - activeEvent;
  const isVisible = Math.abs(offset) <= 2;

  let transform, zIndex, opacity;

  if (!isVisible) {
    transform = `translateX(${offset * 100}%)`;
    opacity = 0;
    zIndex = 0;
  } else {
    const rotateY = offset * -25;
    const translateX = offset * 50;
    const translateZ = -Math.abs(offset) * 200;

    transform = `translateX(${translateX}%) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
    zIndex = 10 - Math.abs(offset);
    opacity = offset === 0 ? 1 : 0.7;
  }

  return (
    <div
      key={id}
      className="absolute top-0 left-0 right-0 mx-auto transition-all duration-500 ease-out"
      style={{
        width: "320px",
        height: "480px",
        transform,
        zIndex,
        opacity,
      }}
    >
      <div className="relative w-full h-full bg-[#3E000C] text-white shadow-2xl shadow-black/50 overflow-hidden rounded-2xl border border-white/20">
        <div
          className="absolute inset-0 transition-opacity duration-500 rounded-2xl"
          style={{
            background: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.6) 100%)",
            opacity: offset === 0 ? 0 : 1,
          }}
        />

        {/* Event Image */}
        <img src={image} alt={title} className="w-full h-[70%] object-cover" />

        {/* Event Details */}
        <div className="p-6 relative h-[30%] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-2xl text-white truncate tracking-wider uppercase">
              {title}
            </h3>
            <p className="text-white text-sm mt-2 uppercase tracking-widest font-medium">
              {theme}
            </p>
          </div>

          {/* Traditional Indonesian decorative element */}
          <div className="flex items-center justify-center space-x-2 mt-4 opacity-60">
            <div className="w-2 h-2 bg-white transform rotate-45" />
            <div className="w-2 h-2 bg-red-600 rounded-full" />
            <div className="w-2 h-2 bg-white transform rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
};

const EventsSection: FC<{ scrollOffset: number }> = ({ scrollOffset }) => {
  const [activeEvent, setActiveEvent] = useState<number>(2);

  const events = [
    {
      id: 1,
      title: "NAWASENA",
      year: "2025",
      theme: "Nine Realms of Heritage",
      image: "https://placehold.co/400x300/3E000C/FFFFFF?text=NAWASENA+2025"
    },
    {
      id: 2,
      title: "HERITAGE",
      year: "2023",
      theme: "Celebrating Tradition",
      image: "https://placehold.co/400x300/8B0000/FFFFFF?text=HERITAGE+2023"
    },
    {
      id: 3,
      title: "LEGACY",
      year: "2022",
      theme: "Timeless Flavors",
      image: "https://placehold.co/400x300/654321/FFFFFF?text=LEGACY+2022"
    },
    {
      id: 4,
      title: "CULTURE",
      year: "2021",
      theme: "Unity in Diversity",
      image: "https://placehold.co/400x300/2F4F4F/FFFFFF?text=CULTURE+2021"
    },
    {
      id: 5,
      title: "MALIOBORO",
      year: "2020",
      theme: "Streets of Indonesia",
      image: "https://placehold.co/400x300/800080/FFFFFF?text=MALIOBORO+2020"
    },
    {
      id: 6,
      title: "WARISAN",
      year: "2019",
      theme: "Cultural Legacy",
      image: "https://placehold.co/400x300/006400/FFFFFF?text=WARISAN+2019"
    },
    {
      id: 7,
      title: "PASAR MALAM",
      year: "2018",
      theme: "Night Market Spirit",
      image: "https://placehold.co/400x300/4B0082/FFFFFF?text=PASAR+MALAM+2018"
    },
    {
      id: 8,
      title: "MENUJU",
      year: "2016",
      theme: "Moving Forward",
      image: "https://placehold.co/400x300/8B4513/FFFFFF?text=MENUJU+2016"
    }
  ];

  const handlePrev = (): void => {
    setActiveEvent((prev) => (prev > 0 ? prev - 1 : events.length - 1));
  };

  const handleNext = (): void => {
    setActiveEvent((prev) => (prev < events.length - 1 ? prev + 1 : 0));
  };

  // Auto-advance based on scroll
  useEffect(() => {
    const scrollBasedIndex = Math.floor(scrollOffset / 100) % events.length;
    setActiveEvent(scrollBasedIndex);
  }, [scrollOffset, events.length]);

  return (
    <section className="py-24 h-[600px] relative flex flex-col items-center justify-center bg-gradient-to-b from-[#3E000C] to-[#2A0008]">
      {/* Section Title */}
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-16 uppercase tracking-wider text-white">
        Legacy Events
      </h2>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 md:left-24 text-white/50 hover:text-white transition-colors z-20 top-1/2 -translate-y-1/2 group"
        aria-label="Previous event"
      >
        <div className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center group-hover:border-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </div>
      </button>

      {/* 3D Card Display */}
      <div className="relative w-full h-full" style={{ perspective: "1200px" }}>
        <div
          className="absolute w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {events.map((event, index) => (
            <LegacyEventCard
              key={event.id}
              index={index}
              id={event.id.toString()}
              image={event.image}
              title={event.title}
              theme={event.theme}
              activeEvent={activeEvent}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        className="absolute right-4 md:right-24 text-white/50 hover:text-white transition-colors z-20 top-1/2 -translate-y-1/2 group"
        aria-label="Next event"
      >
        <div className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center group-hover:border-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </button>

      {/* Event Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {events.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveEvent(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === activeEvent
                ? 'bg-white'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to event ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

const InstagramIcon: FC = () => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2"></line>
  </svg>
);

const InstagramSection: FC = () => (
  <section className="py-24 max-w-xl mx-auto flex flex-col items-center">
    <a
      href="https://www.instagram.com/inm_unsw"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative z-10 mb-8 block"
    >
      <div className="transition-transform duration-300 ease-in-out group-hover:scale-110">
        <div className="absolute -inset-8 z-0 bg-black/50 rounded-full blur-3xl scale-125" />
        <InstagramIcon />
      </div>
    </a>
  </section>
);

const Footer: FC = () => (
  <section className="text-center py-16">
    <div className="flex justify-between items-center max-w-md mx-auto">
      <a
        href="/about"
        className="inline-block text-sm border-[0.5px] border-white/50 rounded-lg px-8 py-3 hover:bg-white/10 transition-colors uppercase tracking-[0.2em]"
      >
        go to PPIA
      </a>
      <a
        href="#"
        className="inline-block text-sm border-[0.5px] border-white/50 rounded-lg px-8 py-3 hover:bg-white/10 transition-colors uppercase tracking-[0.2em]"
      >
        go to ICON
      </a>
    </div>
  </section>
);

export default function AboutINM(): JSX.Element {
  const [scrollOffset, setScrollOffset] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => setScrollOffset(window.pageYOffset);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Calculate blur based on scroll position - starts blurring when vision/mission section comes into view
  const visionMissionStart = window.innerHeight * 0.5; // Start blurring earlier
  const blurAmount = Math.max(0, Math.min(20, (scrollOffset - visionMissionStart) / 50));

  return (
    <div
      className="bg-[#3E000C] min-h-screen text-white overflow-x-hidden"
      style={{ fontFamily: "'Figtree', sans-serif" }}
    >
      <main>
        <HeroSection scrollOffset={scrollOffset} blur={blurAmount} />
        <VisionMissionSection />
        <EventsSection scrollOffset={scrollOffset} />
        <InstagramSection />
        <Footer />
      </main>
    </div>
  );
}