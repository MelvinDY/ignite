import batik2 from "../assets/batik2.png";
import batik3 from "../assets/batik3.png";
import batik4 from "../assets/batik 4.png";

const BatikBackground = () => {
  return (
    <>
      {/* Shape Blur Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[var(--dark-red)] via-[var(--darker-red)] to-[var(--dark-red)]" />

      {/* Enhanced gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-tr from-transparent via-[var(--darker-red)]/20 to-[var(--dark-red)]/40" />
      <div className="fixed inset-0 bg-gradient-to-bl from-[var(--dark-red)]/50 via-transparent to-[var(--darker-red)]/60" />

      {/* Mobile-specific gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[var(--darker-red)]/15 to-transparent sm:hidden" />

      {/* Desktop enhancement gradient */}
      <div className="hidden lg:block fixed inset-0 bg-gradient-to-r from-[var(--dark-red)]/25 via-[var(--darker-red)]/20 to-[var(--dark-red)]/25" />

      {/* Batik Pattern Overlays for Enhanced Visual Depth - All using batik2 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Batik 2 - Top Left */}
        <div
          className="absolute -top-20 -left-20 w-80 h-96 sm:w-96 sm:h-[120px] md:w-[120px] md:h-[144px] opacity-50"
          style={{
            backgroundImage: `url(${batik2})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* Batik 3 - Bottom Right
        <div
          className="absolute -bottom-20 -right-20 w-96 h-[120px] sm:w-[120px] sm:h-[144px] md:w-[480px] md:h-[160px] lg:w-[600px] lg:h-[200px] opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        /> */}

        {/* Batik 4 - Center Right */}
        <div
          className="absolute top-1/2 -right-16 w-64 h-80 sm:w-80 h-96 md:w-96 md:h-[120px] opacity-50"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* Batik 3 - Top Center */}
        <div
          className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-56 h-72 sm:w-72 sm:h-88 md:w-88 md:h-[110px] opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* Batik 4 - Bottom Left */}
        <div
          className="absolute -bottom-16 -left-16 w-48 h-64 sm:w-64 sm:h-80 md:w-80 md:h-96 opacity-50"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* Batik 2 - Center Left */}
        <div
          className="absolute top-1/3 -left-12 w-44 h-56 sm:w-56 sm:h-72 md:w-72 md:h-88 opacity-50"
          style={{
            backgroundImage: `url(${batik2})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* Batik 3 - Top Right */}
        <div
          className="absolute top-1/4 -right-12 w-40 h-52 sm:w-52 sm:h-64 md:w-64 md:h-80 opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* Additional Center Batik Patterns - Mixed Designs */}
        <div
          className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-32 sm:w-[480px] sm:h-40 md:w-[600px] md:h-48 opacity-50"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        <div
          className="absolute top-3/4 left-1/2 transform -translate-x-1/2 w-80 h-28 sm:w-96 sm:h-32 md:w-[480px] md:h-36 opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        <div
          className="absolute top-1/2 left-1/4 w-64 h-24 sm:w-80 sm:h-28 md:w-96 md:h-32 opacity-50"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        <div
          className="absolute top-1/2 right-1/4 w-64 h-24 sm:w-80 sm:h-28 md:w-96 md:h-32 opacity-50"
          style={{
            backgroundImage: `url(${batik2})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        <div
          className="absolute top-2/3 left-1/3 w-72 h-26 sm:w-88 sm:h-30 md:w-[420px] md:h-34 opacity-50"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        {/* Mobile-only mixed batik patterns */}
        <div
          className="absolute top-16 right-16 w-28 h-36 opacity-50 sm:hidden"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        <div
          className="absolute bottom-24 left-8 w-32 h-40 opacity-50 sm:hidden"
          style={{
            backgroundImage: `url(${batik4})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />

        <div
          className="absolute top-1/3 right-8 w-24 h-32 opacity-50 sm:hidden"
          style={{
            backgroundImage: `url(${batik3})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />
      </div>

      {/* Enhanced glassmorphism overlay */}
      <div className="fixed inset-0 bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.03]" />
    </>
  );
};

export { BatikBackground };
