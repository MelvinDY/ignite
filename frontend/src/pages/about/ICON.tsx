import { useState, useRef, useEffect } from "react";
import type { JSX, FC } from "react";
import ICONLogo from "@/assets/Icon Logo White.png";

// ICON Day 1 images
import icon1_1 from "@/assets/ICON1/_TRY8268.JPG";
import icon1_2 from "@/assets/ICON1/_TRY8335.JPG";
import icon1_3 from "@/assets/ICON1/_TRY8406.JPG";

// ICON Day 2 images
import icon2_1 from "@/assets/ICON2/PIX08084.JPG";
import icon2_2 from "@/assets/ICON2/PIX08100.JPG";
import icon2_3 from "@/assets/ICON2/_TRY8532.JPG";

// ICON Day 3 images
import icon3_1 from "@/assets/ICON3/MNH07713.JPG";
import icon3_2 from "@/assets/ICON3/MNH07735.JPG";
import icon3_3 from "@/assets/ICON3/PIX00015.JPG";

// ICON Day 4 images
import icon4_1 from "@/assets/ICON4/AR509743.JPG";
import icon4_2 from "@/assets/ICON4/AR509763.JPG";
import icon4_3 from "@/assets/ICON4/AR509790.JPG";

const ICON: FC = (): JSX.Element => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const galleryRef = useRef(null);
  const carouselRef = useRef(null);

  // Handle scroll for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

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

  const days = [
    {
      id: 1,
      images: [icon1_1, icon1_2, icon1_3],
      theme: "DAY 1 ACTIVITIES",
      descriptions: [
        "Opening ceremony and welcome activities for ICON 2025. Participants gathered for the first day of innovative networking and collaboration.",
        "Workshop sessions and interactive activities continued throughout the day, fostering connections between Indonesian students.",
        "Day 1 concluded with networking dinner and cultural performances, setting the tone for the upcoming days."
      ],
      imageDetails: [
        "Opening ceremony capturing the excitement and energy of ICON 2025's first day with participants ready to engage.",
        "Mid-day workshop activities showcasing collaborative learning and skill development among Indonesian students.",
        "Evening networking session highlighting cultural exchange and community building through shared experiences."
      ],
    },
    {
      id: 2,
      images: [icon2_1, icon2_2, icon2_3],
      theme: "DAY 2 WORKSHOPS",
      descriptions: [
        "Professional development workshops and skill-building sessions dominated the second day of ICON 2025.",
        "Interactive seminars and guest speaker presentations provided valuable insights for career development.",
        "Collaborative projects and team-building exercises strengthened the Indonesian student community bonds."
      ],
      imageDetails: [
        "Professional workshop session with participants actively engaging in skill development and learning new competencies.",
        "Guest speaker presentation offering industry insights and career guidance to Indonesian students in Australia.",
        "Team collaboration exercise demonstrating the spirit of unity and cooperation among ICON participants."
      ],
    },
    {
      id: 3,
      images: [icon3_1, icon3_2, icon3_3],
      theme: "DAY 3 INNOVATION",
      descriptions: [
        "Innovation showcase and entrepreneurship sessions highlighted creative solutions from Indonesian students.",
        "Technology demonstrations and startup pitches inspired participants to pursue their entrepreneurial dreams.",
        "Mentorship sessions connected students with industry leaders and successful Indonesian entrepreneurs."
      ],
      imageDetails: [
        "Innovation showcase displaying creative projects and entrepreneurial initiatives by Indonesian students.",
        "Technology demonstration session featuring cutting-edge solutions and digital innovations from participants.",
        "Mentorship networking event connecting students with successful Indonesian professionals and entrepreneurs."
      ],
    },
    {
      id: 4,
      images: [icon4_1, icon4_2, icon4_3],
      theme: "DAY 4 CELEBRATION",
      descriptions: [
        "Cultural celebration and Indonesian heritage showcase marked the final day of ICON 2025.",
        "Traditional performances, food festival, and cultural exhibitions celebrated Indonesian diversity.",
        "Closing ceremony and farewell celebration concluded the successful ICON 2025 event with lasting memories."
      ],
      imageDetails: [
        "Cultural celebration featuring traditional Indonesian performances and heritage showcase for the community.",
        "Food festival and cultural exhibitions highlighting the rich diversity of Indonesian culture and traditions.",
        "Closing ceremony capturing the emotional farewell and lasting connections made during ICON 2025."
      ],
    },
  ];

  const selectedDayData = days.find((d) => d.id === selectedDay);

  // Reset image index when day changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedDay]);

  // Navigation functions for images
  const nextImage = () => {
    if (selectedDayData) {
      setCurrentImageIndex((prev) =>
        prev < selectedDayData.images.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevImage = () => {
    if (selectedDayData) {
      setCurrentImageIndex((prev) =>
        prev > 0 ? prev - 1 : selectedDayData.images.length - 1
      );
    }
  };

  return (
    <div className="bg-[#3E000C] min-h-screen text-white overflow-x-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <main>
        {/* Hero Section with ICON Logo */}
        <div className="relative flex flex-row justify-between items-center px-8 h-[calc(100vh-80px)]">
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-md relative z-10">
            <p className="text-sm md:text-base leading-relaxed text-white/80">
              ICON 2025 is an immersive, week-long educational and career event proudly organized by PPIA UNSW.
              This year's ICON marks a pivotal shift—from bringing innovative speakers from Indonesia to Australia,
              to spotlighting the achievements and potential of innovative Indonesians already residing in Australia.
              The event features distinguished panels, interactive workshops, exciting competitions, and valuable
              networking opportunities across diverse academic disciplines.
            </p>
          </div>
          <div className="text-[12rem] md:text-[16rem] font-bold leading-none tracking-tighter relative z-10">
            <div className="px-16">
              <img src={ICONLogo} alt="Icon" className="w-[200px] h-45" />
            </div>
          </div>
        </div>

        {/* Vision and Mission Section */}
        <div
          className="relative grid grid-cols-1 md:grid-cols-2 border-t border-white/20 h-screen"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          {/* Vision - Left */}
          <div className="relative min-h-[50vh] p-8 md:p-16 border-r border-white/20 flex items-center">
            <div
              className="absolute inset-0 z-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)",
              }}
            />
            {/* Rotated ICON text */}
            <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10">
              <div className="-rotate-90 origin-center">
                <h2 className="text-3xl md:text-5xl font-bold tracking-widest whitespace-nowrap">
                  ICON
                </h2>
              </div>
            </div>

            <div className="ml-12 md:ml-20 max-w-md relative z-10">
              <h3 className="text-4xl md:text-5xl font-bold mb-6 uppercase tracking-widest">VISION</h3>
              <p className="text-sm md:text-base leading-relaxed text-white/80">
                To empower students at UNSW by fostering meaningful industry connections,
                cultural pride, and leadership growth through impactful events like ICON,
                while representing the voice and ambition of our community with professionalism and heart.
              </p>
            </div>
          </div>

          {/* Mission - Right */}
          <div className="relative min-h-[50vh] p-8 md:p-16 flex items-center justify-end">
            <div
              className="absolute inset-0 z-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)",
              }}
            />
            <div className="max-w-md relative z-10">
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-right uppercase tracking-widest">
                MISSION
              </h3>
              <p className="text-sm md:text-base leading-relaxed text-right text-white/80">
                We aim to elevate ICON as a premier educational and industry networking platform for
                local and international students at UNSW. Through curated speaker sessions, professional
                development opportunities, and meaningful collaborations, ICON empowers students to gain
                real-world insights, build connections, and develop the confidence to lead beyond university.
              </p>
            </div>
          </div>
        </div>

        {/* Image Gallery Section */}
        <div
          className="relative mt-16 md:mt-24 min-h-screen"
          ref={galleryRef}
          style={{
            transform: `translateY(${scrollY * -0.05}px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <h1 className="text-6xl font-bold px-20 mb-16 uppercase tracking-wider">ICON Recap 2025</h1>
          <div className="flex flex-col md:flex-row items-start justify-center">
            <div className="relative w-full md:w-auto flex justify-center md:justify-start mb-4 md:mb-0">
              <div
                ref={carouselRef}
                className="flex md:flex-col gap-4 p-4 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto scroll-smooth max-h-[500px] md:max-h-[600px] scrollbar-hide"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`relative flex-shrink-0 w-32 h-24 md:w-40 md:h-32 overflow-hidden transition-all duration-300 ${
                      selectedDay === day.id
                        ? "ring-4 ring-white scale-110 z-10"
                        : "ring-2 ring-white/30 opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <img
                      src={day.images[0]}
                      alt={`Day ${day.id}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedDay === day.id && (
                      <div className="absolute inset-0 border-4 border-yellow-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Image */}
            <div className="flex flex-col flex-1 w-full max-w-4xl px-4 md:px-8">
              <div className="relative w-full aspect-video overflow-hidden border-4 border-white/20 shadow-2xl">
                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 border-none rounded-full text-white text-lg cursor-pointer z-10 transition-all duration-300 backdrop-blur-md hover:bg-black/70 flex items-center justify-center"
                >
                  &#8249;
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 border-none rounded-full text-white text-lg cursor-pointer z-10 transition-all duration-300 backdrop-blur-md hover:bg-black/70 flex items-center justify-center"
                >
                  &#8250;
                </button>

                <img
                  src={selectedDayData?.images[currentImageIndex]}
                  alt={`Day ${selectedDay} image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-all duration-500"
                  key={`${selectedDay}-${currentImageIndex}`}
                />

                {/* Image indicator dots */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {selectedDayData?.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'bg-white'
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Day Information Section */}
              <div
                className="mt-8 mx-4 md:mx-auto md:max-w-5xl border-4 border-white/30 bg-[#3E000C]/80 backdrop-blur -translate-y-20 w-[90%] ml-auto"
              >
                <div className="bg-[#3E000C]/90 p-6 md:p-8">
                  <h2 className="text-5xl md:text-7xl font-bold text-right mb-6 uppercase tracking-wider">
                    DAY {selectedDay}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Box - Day Description */}
                    <div className="border-2 border-white/30 p-6 bg-black/20">
                      <p className="text-sm leading-relaxed text-white/80">
                        {selectedDayData?.descriptions[currentImageIndex]}
                      </p>
                    </div>

                    {/* Right Box - Image Detail */}
                    <div className="border-2 border-white/30 p-6 bg-black/20">
                      <p className="text-sm leading-relaxed text-white/80">
                        {selectedDayData?.imageDetails[currentImageIndex]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Section */}
        <section className="py-24 max-w-xl mx-auto flex flex-col items-center">
          <a
            href="https://www.instagram.com/iconunsw"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative z-10 mb-8 block"
          >
            <div className="transition-transform duration-300 ease-in-out group-hover:scale-110">
              <div className="absolute -inset-8 z-0 bg-black/50 rounded-full blur-3xl scale-125" />
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
            </div>
          </a>
        </section>

        {/* Footer */}
        <section className="text-center py-16">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <a
              href="/about/ppia"
              className="inline-block text-sm border-[0.5px] border-white/50 rounded-lg px-8 py-3 hover:bg-white/10 transition-colors uppercase tracking-[0.2em]"
            >
              go to PPIA
            </a>
            <a
              href="/about/inm"
              className="inline-block text-sm border-[0.5px] border-white/50 rounded-lg px-8 py-3 hover:bg-white/10 transition-colors uppercase tracking-[0.2em]"
            >
              go to INM
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ICON;