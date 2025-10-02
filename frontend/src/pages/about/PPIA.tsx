import { useState, useEffect } from "react";
import type { JSX, FC } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import logoPPIA from "@/assets/PPIA_logo_white.png";
import { BsInstagram } from "react-icons/bs";

// Import event images
import Welcome1 from "@/assets/WelcomingEvent/20250404_191622.jpg";
import Welcome2 from "@/assets/WelcomingEvent/20250404_192058.jpg";
import Welcome3 from "@/assets/WelcomingEvent/Welcome1.jpg";

import Hero1 from "@/assets/ProjectHero/_TRY1764.JPG";
import Hero2 from "@/assets/ProjectHero/_TRY1779.JPG";
import Hero3 from "@/assets/ProjectHero/_TRY1794.JPG";

import Matcha1 from "@/assets/Matchilates/Matcha1.jpeg";

import Ngoempoel1 from "@/assets/NgoempoelAja/Ngoempoel1.JPG";
import Ngoempoel2 from "@/assets/NgoempoelAja/Ngoempoel2.JPG";
import Ngoempoel3 from "@/assets/NgoempoelAja/Ngoempoel3.JPG";

// --- Type Definitions ---
interface Event {
  id: number;
  title: string;
  date: string;
  desc: string;
  image: string;
  images?: string[];
  fullDesc?: string;
}

// --- Data & Constants ---
const eventsData: Event[] = [
  {
    id: 0,
    title: "Welcoming Event",
    date: "April 2025",
    desc: "Welcome new students to PPIA UNSW",
    image: Welcome1,
    images: [Welcome1, Welcome2, Welcome3],
    fullDesc: "A warm welcome event for new Indonesian students at UNSW, featuring introductions, networking opportunities, and cultural activities to help students feel at home in their new academic journey."
  },
  {
    id: 1,
    title: "Project Hero",
    date: "2025",
    desc: "Community service initiative",
    image: Hero1,
    images: [Hero1, Hero2, Hero3],
    fullDesc: "Project Hero is a community service initiative by PPIA UNSW aimed at giving back to the local community through various charitable activities and volunteer work."
  },
  {
    id: 2,
    title: "Sport Day",
    date: "2025",
    desc: "Annual sports competition",
    image: "https://placehold.co/400x300/e8e8e8/3E000C?text=Sport+Day",
    images: [],
    fullDesc: "An exciting day of sports and friendly competition where Indonesian students come together to showcase their athletic abilities and team spirit."
  },
  {
    id: 3,
    title: "Matchilates",
    date: "2025",
    desc: "Wellness and fitness event",
    image: Matcha1,
    images: [Matcha1],
    fullDesc: "A unique wellness event combining matcha tea culture with pilates exercises, promoting health and mindfulness among PPIA members."
  },
  {
    id: 4,
    title: "Ngoempoel Aja",
    date: "2025",
    desc: "Casual gathering and networking",
    image: Ngoempoel1,
    images: [Ngoempoel1, Ngoempoel2, Ngoempoel3],
    fullDesc: "Ngoempoel Aja is a casual gathering event where Indonesian students can relax, socialize, and strengthen bonds within the PPIA community in a laid-back atmosphere."
  },
];

const HeroSection: FC<{ scrollOffset: number }> = ({ scrollOffset }) => (
  <section
    className="h-[calc(100vh-80px)] flex flex-col items-center text-center relative pt-48 mt-20"
    style={{
      transform: `translateY(${scrollOffset * 0.4}px)`,
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
    <div className="absolute top-28 z-10">
      <p className="tracking-[0.2em]">
        PPIA <span className="font-bold">UNSW</span>
      </p>
    </div>
    <div className="flex justify-center mb-6 z-10">
      <img src={logoPPIA} alt="PPIA UNSW Logo" className="w-32 h-32" />
    </div>
    <div className="w-full max-w-3xl text-4xl md:text-5xl font-medium tracking-widest uppercase space-y-4 z-10">
      <h1 className="text-left pl-4">Bridging</h1>
      <div className="flex justify-between items-center w-full px-8">
        <h1>Cultures</h1>
        <h1>Empowering</h1>
      </div>
      <h1 className="text-right pr-4">Students</h1>
    </div>
    <div className="mt-8 text-xs uppercase tracking-widest text-white/70 z-10 max-w-3xl mx-auto">
      <p>
        PERHIMPUNAN PELAJAR INDONESIA AUSTRALIA (PPIA) OR INDONESIAN STUDENT
        ASSOCIATION IS A UNIVERSITY STUDENT ASSOCIATION OPERATING UNDER THE
        CONSULATE GENERAL OF THE REPUBLIC OF INDONESIA IN SYDNEY WITH MEMBERS
        CONSISTING OF INDONESIAN STUDENTS TAKING THEIR STUDIES IN AUSTRALIA.
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
            To expand the PPIA UNSW community through wider and collaborative
            initiatives with other PPIA branches and cultural UNSW societies.
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
            We strive to further increase community interactions through
            innovative initiatives, including sports, collaborative efforts,
            fundraising, and networking. With the aim of sustainable growth, we
            will restructure our organization to maintain a consistently high
            level of quality in our initiatives.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const EventModal: FC<{
  event: Event | null;
  onClose: () => void;
}> = ({ event, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!event) return null;

  const images = event.images && event.images.length > 0 ? event.images : [event.image];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Image slider */}
        <div className="relative w-full h-[60vh] bg-gray-900">
          <img
            src={images[currentImageIndex]}
            alt={`${event.title} - ${currentImageIndex + 1}`}
            className="w-full h-full object-contain"
          />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Event details */}
        <div className="p-6 text-black">
          <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
          <p className="text-sm text-gray-500 mb-4">{event.date}</p>
          <p className="text-gray-700 leading-relaxed">
            {event.fullDesc || event.desc}
          </p>
        </div>
      </div>
    </div>
  );
};

const EventsSection: FC<{
  activeEvent: number;
  onPrev: () => void;
  onNext: () => void;
  onEventClick: (event: Event) => void;
}> = ({ activeEvent, onPrev, onNext, onEventClick }) => (
  <section className="py-24 h-[40rem] relative flex flex-col items-center justify-center">
    <h2 className="text-5xl font-medium text-center mb-12 uppercase tracking-widest">
      Event
    </h2>
    <button
      onClick={onPrev}
      className="absolute left-4 md:left-24 text-white/50 hover:text-white transition-colors z-20 top-1/2 -translate-y-1/2"
    >
      <ChevronLeft size={48} strokeWidth={1} />
    </button>
    <div className="relative w-full h-full" style={{ perspective: "1000px" }}>
      <div
        className="absolute w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {eventsData.map((event, index) => (
          <EventCard
            key={event.id}
            id={event.id.toString()}
            index={index}
            title={event.title}
            date={event.date}
            desc={event.desc}
            image={event.image}
            activeEvent={activeEvent}
            onSeeMore={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
    <button
      onClick={onNext}
      className="absolute right-4 md:right-24 text-white/50 hover:text-white transition-colors z-20 top-1/2 -translate-y-1/2"
    >
      <ChevronRight size={48} strokeWidth={1} />
    </button>
  </section>
);

const JoinUsIcon: FC = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 m-auto text-white/30 overflow-visible"
  >
    {/* Angled Ellipse 1 - Animation 1 */}
    <g className="animate-circle-1 origin-center">
      <ellipse
        cx="100"
        cy="100"
        rx="85"
        ry="40"
        transform="rotate(60 100 100)"
        stroke="currentColor"
        strokeWidth="1"
      />
    </g>
    {/* Angled Ellipse 2 - Animation 2 */}
    <g className="animate-circle-2 origin-center">
      <ellipse
        cx="100"
        cy="100"
        rx="85"
        ry="40"
        transform="rotate(-60 100 100)"
        stroke="currentColor"
        strokeWidth="1"
      />
    </g>
    {/* Stationary center ellipse */}
    <ellipse
      cx="100"
      cy="100"
      rx="95"
      ry="45"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);

const JoinUsSection: FC = () => (
  <section className="py-24 text-center">
    <a
      href="#"
      className="group relative inline-flex items-center justify-center h-52 w-52"
    >
      <div className="absolute -inset-16 z-0 bg-black/50 rounded-full blur-3xl"></div>
      <JoinUsIcon />
      <span className="relative z-10 text-2xl uppercase tracking-widest font-medium transition-transform duration-300 group-hover:scale-110">
        Join Us
      </span>
    </a>
  </section>
);

const InstagramSection: FC = () => (
  <section className="py-24 max-w-xl mx-auto flex flex-col items-center">
    <a
      href="https://www.instagram.com/ppiaunsw"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative z-10 mb-8 block"
    >
      <div className="transition-transform duration-300 ease-in-out group-hover:scale-110">
        <div className="absolute -inset-8 z-0 bg-black/50 rounded-full blur-3xl scale-125" />
        <BsInstagram size={64} className="text-white/70" />
      </div>
    </a>
  </section>
);

const Footer: FC = () => (
  <section className="text-center py-16">
    <div className="flex justify-between items-center max-w-md mx-auto">
      <a
        href="#"
        className="inline-block text-sm border-[0.5px] border-white/50 rounded-lg px-8 py-3 hover:bg-white/10 transition-colors uppercase tracking-[0.2em]"
      >
        go to INM
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

// --- Main Page Component ---
export default function AboutPPIA(): JSX.Element {
  const [activeEvent, setActiveEvent] = useState<number>(2);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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

    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
        }
        .group:hover .animate-circle-1 {
            animation: spin-slow 10s linear infinite;
        }
        .group:hover .animate-circle-2 {
            animation: spin-slow-reverse 10s linear infinite;
        }
    `;
    document.head.appendChild(style);
  }, []);

  const handlePrev = (): void => {
    setActiveEvent((prev) => (prev > 0 ? prev - 1 : eventsData.length - 1));
  };

  const handleNext = (): void => {
    setActiveEvent((prev) => (prev < eventsData.length - 1 ? prev + 1 : 0));
  };

  const handleEventClick = (event: Event): void => {
    setSelectedEvent(event);
  };

  const handleCloseModal = (): void => {
    setSelectedEvent(null);
  };

  return (
    <div
      className="bg-[#3E000C] min-h-screen text-white overflow-x-hidden"
      style={{ fontFamily: "'Figtree', sans-serif" }}
    >
      <main className="container mx-auto px-4">
        <HeroSection scrollOffset={scrollOffset} />
        <VisionMissionSection />
        <EventsSection
          activeEvent={activeEvent}
          onPrev={handlePrev}
          onNext={handleNext}
          onEventClick={handleEventClick}
        />
        <JoinUsSection />
        <InstagramSection />
        <Footer />
      </main>

      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={handleCloseModal} />
      )}
    </div>
  );
}
