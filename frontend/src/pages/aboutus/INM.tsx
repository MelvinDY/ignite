import { useState, useEffect } from "react";
import PPIALogo from "@/assets/PPIA_logo_white.png";
import INM1 from "@/assets/INM-min.jpg";

const INM = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full text-white pb-32">
      {/* Hero Section with Logo */}
      <div className="mt-32 relative flex flex-col md:flex-row justify-between items-center px-8 gap-8">
        <div className="max-w-xs">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cumque omnis
          ratione tempora. Aliquam, impedit? Voluptate non tenetur velit hic,
          illo ratione est molestiae, tempore eos vero veritatis nobis
          asperiores. Odio saepe libero numquam velit eaque, fugiat ut corporis
          sit deleniti dignissimos voluptatem nulla et explicabo nobis corrupti
          vero enim praesentium!
        </div>
        <div className="flex items-center justify-center">
          <img src={PPIALogo} alt="PPIA Logo" className="w-[200px] h-auto" />
        </div>
      </div>

      {/* Vision Section with Image */}
      <div
        className="mt-32 relative grid grid-cols-1 md:grid-cols-2 gap-8"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Left - Vision */}
        <div className="relative min-h-[50vh] p-8 md:p-16 flex items-center">
          <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2">
            <div className="-rotate-90 origin-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-widest whitespace-nowrap">
                INM
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

        {/* Right - Image */}
        <div className="relative min-h-[50vh] p-8 md:p-16 flex items-center justify-center">
          <img 
            src={INM1} 
            alt="Indonesian Night Market" 
            className="w-full h-auto object-cover rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* Second Section - Reversed Layout */}
      <div
        className="mt-16 relative grid grid-cols-1 md:grid-cols-2 gap-8"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Left - Image */}
        <div className="relative min-h-[50vh] p-8 md:p-16 flex items-center justify-center order-2 md:order-1">
          <img 
            src={INM1} 
            alt="Indonesian Night Market" 
            className="w-full h-auto object-cover rounded-lg shadow-2xl"
          />
        </div>

        {/* Right - Content */}
        <div className="relative min-h-[50vh] p-8 md:p-16 flex items-center order-1 md:order-2">
          <div className="max-w-md">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">MISSION</h3>
            <p className="text-sm md:text-base leading-relaxed">
              We strive to further increase community interactions through
              innovative initiatives, including sports, collaborative efforts,
              fundraising, and networking. With the aim of sustainable growth,
              we will restructure our organization to maintain a consistently
              high level of quality in our initiatives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default INM;