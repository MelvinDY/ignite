import { BatikBackground } from "../components/BatikBackground";
import ngompoel from "../assets/ngompoel.jpg";
import { MeetTheExecs } from "../components/MeetTheExecs";

const Dashboard = () => {
  return (
    <div className="w-full flex flex-col justify-start items-center gap-y-60 scroll-smooth"
    >
      <section
        id="welcome-header"
        className="flex flex-col justify-center h-screen w-full items-center gap-5 z-10 bg-contain
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
      <section id="events" className="z-10 h-screen">
        <h1 className="text-4xl font-bold text-center">Upcoming Events</h1>
      </section>
    </div>
  );
};

export { Dashboard };
