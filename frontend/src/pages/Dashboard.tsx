import { BatikBackground } from "../components/BatikBackground";
import { MeetTheExecs } from "../components/MeetTheExecs";

const Dashboard = () => {
  return (
    <div className="w-full flex flex-col justify-start items-center gap-y-60 scroll-smooth snap-y">
      <BatikBackground />
      <section
        id="welcome-header"
        className="flex flex-col justify-center w-full items-center gap-5 z-10"
      >
        <header className="">
          <h1 className="text-4xl font-bold">Welcome to</h1>
          <p className="text-6xl font-bold">(insert logo PPIA UNSW)</p>
        </header>
        <div className="relative border rounded-xl h-64 bg-gray-400 w-[70%]">
          <div className="p-4 gap-4 flex flex-col justify-center items-center h-full z-1">
            <div className="w-full border rounded-xl bg-white">1</div>
            <div className="w-full border rounded-xl bg-white">2</div>
            <div className="w-full flex justify-center gap-2">
              <div className="w-1/3 border rounded-xl bg-white">Log in</div>
              <div className="w-1/3 border rounded-xl bg-white">Sign up</div>
            </div>
          </div>
        </div>
      </section>
      <section id="meet-the-execs" className="z-10">
        <MeetTheExecs />
      </section>
    </div>
  );
};

export { Dashboard };
