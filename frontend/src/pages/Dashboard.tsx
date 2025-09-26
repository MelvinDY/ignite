import { BatikBackground } from "../components/BatikBackground";
import ngompoel from "../assets/ngompoel.jpg";
import ICON_event from "../assets/ICON.jpg";
import INM_event from "../assets/INM.jpg";
import { MeetTheExecs } from "../components/MeetTheExecs";
import { GlassCard } from "@/components/ui/GlassCard";
import { AboutUsCard } from "@/components/AboutUsCard";

const Dashboard = () => {
  return (
    <div className="w-full flex flex-col justify-start items-center scroll-smooth gap-y-24"
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

      <section id="about" className="flex flex-col z-10 min-h-screen px-20 gap-10 w-full">
        <h1 className="text-4xl font-bold text-center">About Us</h1>
        <button>
          <AboutUsCard className="w-full" img={ngompoel}>
            <h1 className="text-5xl font-bold">PPIA</h1>
            <p className="text-lg">
              Short desc of PPIA
            </p>
          </AboutUsCard>
        </button>
        <button>
          <AboutUsCard className="w-full" img={INM_event}>
            <h1 className="text-5xl font-bold">International Night Market (INM)</h1>
            <p className="text-lg">
              Short desc of INM
            </p>
          </AboutUsCard>
        </button>
        <button>
          <AboutUsCard className="w-full" img={ICON_event}>
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
