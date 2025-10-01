import { useState, useEffect } from "react";
import type { JSX, FC } from "react";
import logoINM from "@/assets/INM/PURE_WHITE_INM_NO_YEAR.png";
import inmPhoto1 from "@/assets/INM/GF500004.JPG";
import inmPhoto2 from "@/assets/INM/PIX06792.JPG";
import inmPhoto3 from "@/assets/INM/PIX06973.JPG";
import inmPhoto4 from "@/assets/INM/XT5J2830.JPG";
import inmPhoto5 from "@/assets/INM/XT5J2874.JPG";
import inmPhoto6 from "@/assets/INM/XT5J2931.JPG";
import inmPhoto7 from "@/assets/INM/XT5J3007.JPG";
import inmPhoto8 from "@/assets/INM/XT5J3057.JPG";

const HeroSection: FC<{ scrollOffset: number; blur?: number }> = ({ scrollOffset, blur = 0 }) => (
  <section
    className="h-[calc(100vh-80px)] relative"
  >
    <div
      className="absolute inset-0 z-0"
      style={{
        background:
          "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)",
      }}
    />

    {/* Main Title - Top Right */}
    <div className="absolute top-[15px] right-0 z-10 text-right">
      <h1 className="m-0 leading-none text-6xl md:text-8xl lg:text-9xl font-bold tracking-wider uppercase text-white">
        INDONESIAN
      </h1>
      <h1 className="m-0 -mt-3 md:-mt-6 lg:-mt-9 leading-none text-6xl md:text-8xl lg:text-9xl font-bold tracking-wider uppercase text-white">
        NIGHT MARKET
      </h1>
      <h1 className="m-0 -mt-3 md:-mt-6 lg:-mt-9 leading-none text-6xl md:text-8xl lg:text-9xl font-bold tracking-wider uppercase text-white">
        2025
      </h1>
    </div>

    {/* Subtitle - Below main title */}
    <div className="absolute top-[350px] right-0 z-10 text-right">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-widest uppercase text-white/90">
        NAWASENA
      </h2>
    </div>

    {/* Logo - Bottom Left */}
    <div className="absolute bottom-48 left-0 z-10">
      <img src={logoINM} alt="INM Logo" className="w-32 h-32 md:w-40 md:h-40" />
    </div>

    {/* Description - Bottom Left, under logo */}
    <div className="absolute bottom-8 left-0 z-10 max-w-md">
      <p className="text-base md:text-lg text-white/80 leading-relaxed">
        Experience the vibrant flavors, sounds, and colors of Indonesia at Sydney's premier cultural celebration.
        A night market bringing authentic Indonesian street food, traditional performances, and cultural experiences
        to the heart of UNSW, connecting communities through the rich heritage of the archipelago.
      </p>
    </div>
  </section>
);

const VisionMissionSection: FC = () => (
  <section className="h-screen flex flex-col justify-center max-w-3xl mx-auto space-y-20">
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


const EventsSection: FC<{ scrollOffset: number }> = ({ scrollOffset }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [startX, setStartX] = useState<number>(0);
  const [endX, setEndX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const events = [
    {
      id: 1,
      image: inmPhoto1
    },
    {
      id: 2,
      image: inmPhoto2
    },
    {
      id: 3,
      image: inmPhoto3
    },
    {
      id: 4,
      image: inmPhoto4
    },
    {
      id: 5,
      image: inmPhoto5
    },
    {
      id: 6,
      image: inmPhoto6
    },
    {
      id: 7,
      image: inmPhoto7
    },
    {
      id: 8,
      image: inmPhoto8
    }
  ];

  const totalSlides = events.length;

  const updateSlide = () => {
    const photoTrack = document.getElementById('photoTrack');
    if (photoTrack) {
      photoTrack.style.transform = `translateX(-${currentSlide * 100}vw)`;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    updateSlide();
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = startX - endX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setEndX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const diff = startX - endX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <div
        className="flex w-full h-full transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
        id="photoTrack"
        style={{
          width: `${totalSlides * 100}vw`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {events.map((event) => (
          <div key={event.id} className="w-screen h-screen flex-shrink-0 relative">
            <img
              src={event.image}
              alt={`INM Legacy Event ${event.id}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-8 transform -translate-y-1/2 w-12 h-12 bg-white/10 border-none rounded-full text-white text-xl cursor-pointer z-20 transition-all duration-300 backdrop-blur-md hover:bg-white/20 hover:scale-110 hidden md:flex items-center justify-center"
      >
        &#8249;
      </button>

      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-8 transform -translate-y-1/2 w-12 h-12 bg-white/10 border-none rounded-full text-white text-xl cursor-pointer z-20 transition-all duration-300 backdrop-blur-md hover:bg-white/20 hover:scale-110 hidden md:flex items-center justify-center"
      >
        &#8250;
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {events.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white/90 scale-125'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
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
      <main className="border-l-[15px] border-r-[15px] border-[#3E000C]">
        <HeroSection scrollOffset={scrollOffset} blur={blurAmount} />
        <VisionMissionSection />
        <EventsSection scrollOffset={scrollOffset} />
        <InstagramSection />
        <Footer />
      </main>
    </div>
  );
}