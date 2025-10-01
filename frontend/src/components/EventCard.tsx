export function EventCard({
  index,
  id,
  image,
  title,
  date,
  desc,
  activeEvent,
  onSeeMore,
}: {
  id: string;
  image: string;
  title: string;
  date: string;
  desc: string;
  index: number;
  activeEvent: number;
  onSeeMore?: () => void;
}) {
  const offset = index - activeEvent;
  const isVisible = Math.abs(offset) <= 1;

  let transform, zIndex, opacity;

  if (!isVisible) {
    transform = `translateX(${offset * 100}%)`;
    opacity = 0;
    zIndex = 0;
  } else {
    const rotateY = offset * -35;
    const translateX = offset * 60;
    const translateZ = -Math.abs(offset) * 250;

    transform = `translateX(${translateX}%) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
    zIndex = 10 - Math.abs(offset);
    opacity = 1;
  }

  return (
    <div
      key={id}
      className="absolute top-0 left-0 right-0 mx-auto transition-all duration-500 ease-out"
      style={{
        width: "280px",
        height: "420px",
        transform,
        zIndex,
        opacity,
      }}
    >
      <div className="relative w-full h-full bg-white text-black shadow-2xl shadow-black/50 overflow-hidden">
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.6) 100%)",
            opacity: offset === 0 ? 0 : 1,
          }}
        />
        <img src={image} alt={title} className="w-full h-[60%] object-cover" />
        <div className="p-4 relative">
          <h3 className="font-bold text-xl text-gray-900 truncate">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{date}</p>
          <p className="text-sm text-gray-700 mt-3 h-10 overflow-hidden">
            {desc}
          </p>
          <button
            onClick={onSeeMore}
            className="absolute bottom-[-8px] right-4 text-xs font-bold tracking-widest uppercase text-gray-800 hover:underline cursor-pointer"
          >
            see more
          </button>
        </div>
      </div>
    </div>
  );
}
