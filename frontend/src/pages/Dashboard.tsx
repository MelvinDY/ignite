import ngompoel from "../assets/ngompoel-min.jpg";
import ICON_event from "../assets/ICON-min.jpg";
import INM_event from "../assets/INM-min.jpg";
import { AboutUsCard } from "@/components/AboutUsCard";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const aboutUsSection = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash === "#about") {
      aboutUsSection.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);


  return (
    <div className="w-full flex flex-col justify-start items-center scroll-smooth gap-y-12"
    >
      <section
        id="welcome-header"
        className="flex flex-col justify-center min-h-screen w-full items-center gap-5 z-10 bg-contain
                  bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(159, 0, 0, 0.5), rgba(0,0,0,0.5)), url(${ngompoel})`}}
      >
        <header className="flex flex-col items-center mx-2 h-full justify-around mt-20">
          <div className="flex flex-wrap justify-center items-center">
            <h1 className="text-6xl text-center font-bold drop-shadow-xl mr-[1rem]">Welcome to</h1>
            <h1 className="text-6xl text-center font-bold drop-shadow-xl">PPIA UNSW</h1>
          </div>
          <h2 className="text-center text-3xl font-bold drop-shadow-2xl rounded-xl h-64 w-[70%]">Connecting Indonesian students in Australia</h2>
        </header>
      </section>

      {/* <section id="meet-the-execs" className="z-10">
        <MeetTheExecs />
      </section> */}

      <div ref={aboutUsSection} className="h-5"/>
      <section id="about" className="flex flex-col z-10 h-[calc(100vh-5rem)] px-20 gap-6 w-full">
        <h1 className="text-4xl font-bold text-center">About Us</h1>
        <button className="flex-1" onClick={() => navigate("/about/PPIA")}>
          <AboutUsCard className="h-full w-full" img={ngompoel}>
            <h1 className="text-5xl font-bold">PPIA</h1>
            <p className="text-lg">
              Short desc of PPIA
            </p>
          </AboutUsCard>
        </button>
        <button className="flex-1" onClick={() => navigate("/about/INM")}>
          <AboutUsCard className="h-full w-full" img={INM_event}>
            <h1 className="text-5xl font-bold">International Night Market (INM)</h1>
            <p className="text-lg">
              Short desc of INM
            </p>
          </AboutUsCard>
        </button>
        <button className="flex-1" onClick={() => navigate("/about/ICON")}>
          <AboutUsCard className="h-full w-full" img={ICON_event}>
            <h1 className="text-5xl font-bold">ICON</h1>
            <p className="text-lg">
              Short desc of ICON
            </p>
          </AboutUsCard>
        </button>
      </section>
    </div>
  );
};

export { Dashboard };
