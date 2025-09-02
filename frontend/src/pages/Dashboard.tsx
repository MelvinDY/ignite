import { MeetTheExecs } from "../components/MeetTheExecs";

const Dashboard = () => {
  return (
    <div className="flex flex-col justify-start items-center gap-y-60 scroll-smooth snap-y">
      <section
        id="welcome-header"
        className="flex flex-col justify-center w-full items-center gap-5"
      >
        <header className="">
          <h1 className="text-4xl font-bold">Welcome to</h1>
          <p className="text-6xl font-bold">(insert logo PPIA UNSW)</p>
        </header>
        <div className="relative border rounded-xl h-64 bg-gray-400 w-[70%]">
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/src/assets/batik.png"
              className="absolute object-contain xs:w-3/4 xs:-top-20 w-full top-0 lg:-top-48 lg:-left-64 -left-32 -z-10"
            ></img>
            <img
              src="/src/assets/batik.png"
              className="absolute object-contain xs:w-3/4 xs:right-30 w-full lg:-bottom-32 lg:-right-48 -right-28 bottom-0 sm:-bottom-32 -z-10"
            ></img>
          </div>
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
      <section id="meet-the-execs">
        <MeetTheExecs />
      </section>
    </div>
  );
};

export { Dashboard };
