import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import ICONLogo from "@/assets/Icon Logo White.png";

const ICON = () => {
  const [selectedDay, setSelectedDay] = useState(1);
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

  const days = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
      theme: "THEME OF DAY 1",
      description:
        "lorem ipsum bla bla bla. The detail of day 1 ...? THEME OF DAY 1 (DESKRIPSI DRI DAY NYA ITU)",
      imageDetail:
        "detail of the image i guess ...? (nnti ini ganti tergantung image yg besar apa, jdi kayak misalnya di fotonya jerome lagi workshop brrh nanti ini isnya short desc event dri imagnya apa",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800",
      theme: "THEME OF DAY 6",
      description: "Description for day 6 activities and events",
      imageDetail: "Details about what's happening in day 6 image",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800",
      theme: "THEME OF DAY 3",
      description: "Description for day 3 activities and events",
      imageDetail: "Details about what's happening in day 3 image",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800",
      theme: "THEME OF DAY 4",
      description: "Description for day 4 activities and events",
      imageDetail: "Details about what's happening in day 4 image",
    },
  ];

  const selectedDayData = days.find((d) => d.id === selectedDay);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-red-950 via-red-900 to-black text-white">
      {/* Hero Section with ICON Logo */}
      <div className="mt-32 relative flex flex-row justify-between items-center px-8">
        <div className=" max-w-xs text-sm">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cumque omnis ratione tempora. Aliquam, impedit? Voluptate non tenetur velit hic, illo ratione est molestiae, tempore eos vero veritatis nobis asperiores. Odio saepe libero numquam velit eaque, fugiat ut corporis sit deleniti dignissimos voluptatem nulla et explicabo nobis corrupti vero enim praesentium!
        </div>
        <div className="text-[12rem] md:text-[16rem] font-bold leading-none tracking-tighter">
          <img src={ICONLogo} alt="Icon" className="w-40 h-45" />
        </div>
      </div>

      {/* Vision and Mission Section */}
      <div
        className="mt-32 relative grid grid-cols-1 md:grid-cols-2 border-t border-white/20"
        style={{
          transform: `translateY(${scrollY * 0.2}px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Vision - Left */}
        <div className="relative min-h-[50vh] p-8 md:p-16 border-r border-white/20 flex items-center">
          {/* Rotated ICON text */}
          <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2">
            <div className="-rotate-90 origin-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-widest whitespace-nowrap">
                ICON
              </h2>
            </div>
          </div>

          <div className="ml-12 md:ml-20 max-w-md">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">VISION</h3>
            <p className="text-sm md:text-base leading-relaxed">
              We strive to further increase community interactions through
              innovative initiatives, including sports, collaborative efforts,
              fundraising, and networking. With the aim of sustainable growth,
              we will restructure our organization to maintain a consistently
              high level of quality in our initiatives.
            </p>
          </div>
        </div>

        {/* Mission - Right */}
        <div className="relative min-h-[50vh] p-8 md:p-16 flex items-center justify-end">
          <div className="max-w-md">
            <h3 className="text-4xl md:text-5xl font-bold mb-6 text-right">
              MISSION
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-right">
              We strive to further increase community interactions through
              innovative initiatives, including sports, collaborative efforts,
              fundraising, and networking. With the aim of sustainable growth,
              we will restructure our organization to maintain a consistently
              high level of quality in our initiatives.
            </p>
          </div>
        </div>
      </div>

      {/* Image Gallery Section */}
      <div
        className="relative mt-16 md:mt-24"
        ref={galleryRef}
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Up Arrow */}
        <div className="flex justify-center mb-4">
          <button
            className="hover:scale-110 transition-transform"
            aria-label="Scroll up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-center">
          {/* Vertical Carousel - Left Side */}
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
                    src={day.image}
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
          <div className="flex-1 w-full max-w-4xl px-4 md:px-8">
            <div className="relative w-full aspect-video overflow-hidden border-4 border-white/20 shadow-2xl">
              <img
                src={selectedDayData?.image}
                alt={`Day ${selectedDay} main`}
                className="w-full h-full object-cover transition-all duration-500"
                key={selectedDay}
              />
            </div>
          </div>
        </div>

        {/* Day Information Section */}
        <div className="mt-8 mx-4 md:mx-auto md:max-w-5xl border-4 border-white/30 bg-red-950/80 backdrop-blur">
          <div className="bg-red-950/90 p-6 md:p-8">
            <h2 className="text-5xl md:text-7xl font-bold text-right mb-6">
              DAY {selectedDay}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Box - Day Description */}
              <div className="border-2 border-white/30 p-6 bg-black/20">
                <p className="text-sm leading-relaxed">
                  {selectedDayData?.description}
                </p>
              </div>

              {/* Right Box - Image Detail */}
              <div className="border-2 border-white/30 p-6 bg-black/20">
                <p className="text-sm leading-relaxed">
                  {selectedDayData?.imageDetail}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Down Arrow */}
        <div className="flex justify-center mt-8">
          <button
            className="hover:scale-110 transition-transform"
            aria-label="Scroll down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ICON;
