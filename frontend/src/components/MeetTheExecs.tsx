import { ExecProfile } from "./ExecProfile";

const MeetTheExecs = () => {
  return (
    <div className="flex w-full gap-10">
      <header>
        <h1 className="text-5xl font-bold">Meet the</h1>
        <h1 className="text-8xl font-bold text-[var(--secondary-text)] font-kaushan -rotate-10">
          Execs
        </h1>
      </header>
      <div className="flex flex-wrap gap-5 justify-center">
        <ExecProfile name="Andrew Garfield" title="President" />
        <ExecProfile name="Andrew Garfield" title="VP Internal" />
        <ExecProfile name="Andrew Garfield" title="VP External" />
        <ExecProfile name="Andrew Garfield" title="Secretary" />
        <ExecProfile name="Andrew Garfield" title="Treasurer" />
        <ExecProfile name="Andrew Garfield" title="Arc Delegate" />
        <ExecProfile name="Andrew Garfield" title="Wellness Officer" />
      </div>
    </div>
  );
};

export { MeetTheExecs };
