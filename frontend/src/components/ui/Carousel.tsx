import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";


export type CarouselCard = {
    id: string | number;
    title: string;
    content: string;
};

type CarouselProps = {
    items: CarouselCard[];
    /** index to start on (default 2) */
    initialIndex?: number;
    /** number of cards visible to either side of the active one (default 3) */
    maxVisibility?: number;
    /** fixed square size in rem (default 23) – can be overridden with className w/ w-[..] h-[..] */
    sizeRem?: number;
    className?: string;
    /** render function if you want custom card body */
    renderCard?: (item: CarouselCard) => React.ReactNode;
};


const Carousel = ({
    items,
    initialIndex = 2,
    maxVisibility = 3,
    sizeRem = 3,
    renderCard,
}: CarouselProps) => {
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    
    const count = items.length;
    const [active, setActive] = useState(clamp(initialIndex, 0, Math.max(0, count - 1)));

    const canPrev = active > 0;
    const canNext = active < count - 1;

    const go = (delta: number) => setActive((i) => clamp(i + delta, 0, count - 1));

    const transformFor = (i: number) => {
        const distance = Math.abs(active - i) / 3;
        const direction = Math.sign(active - i);
        const offset = (active - i) / 3;
        const rotation = offset * 50;
        const scaleY = 1 + distance * -0.4;
        const translateZ = -30 * distance;
        const translateX = -5 * direction;

        return `rotateY(${rotation}deg) scaleY(${scaleY}) translateZ(${translateZ}rem) translateX(${translateX}rem)`;
    }
    
    const blurFor = (i: number) => {
        const distance = Math.abs(active - i) / 3;
        return `${distance}rem`;
    }

    return (
        <div
            className="relative [perspective:500px] [transform-style:preserve-3d]"
            style={{ width: `${sizeRem}rem`, height: `${sizeRem}rem` }}
            role="region"
            aria-roledescription="carousel"
            aria-label="cards carousel"
        >
            {/* Prev */}
            <button
                type="button"
                onClick={() => go(-1)}
                disabled={!canPrev}
                aria-label="Previous"
                className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-10 flex-inline-center text-white text-5xl disabled:opacity-40"
            >
                <ChevronLeft className="size-10" aria-hidden />
            </button>

            {/* Cards */}
            {items.map((item, i) => {
                const distance = Math.abs(active - i);
                const isHidden = distance > maxVisibility;
                const isActive = i === active;

                return (
                    <div 
                        key={item.id} 
                        className={`absolute inset-0 transition-[transform, filter, opacity] duration-300 ease-out ${isHidden ? "hidden" : ""} ${isActive ? "pointer-events-auto" : "pointer-events-none"}`}
                        style={{
                            transform: transformFor(i),
                            filter: `blur(${blurFor(i)})`,
                            opacity: distance >= maxVisibility ? 0 : 1,
                        }}
                    >
                        <article className="h-full w-full rounded-2xl p-6 text-justify transition-all shadow-[0_10px_25px_rgba(0,0,0,0.15)] bg-white">
                        <h2 className="mb-3 text-center text-2xl font-bold text-slate-800 transition-opacity" style={{opacity: isActive ? 1 : 0}}>
                            {item.title}
                        </h2>
                        <p className="text-slate-400 transition-opacity" style={{opacity: isActive ? 1 : 0}}>
                            {renderCard ? renderCard(item) : item.content}
                        </p>
                        </article>
                    </div>
                );
            })}
        
            {/* Next */}
            <button
                type="button"
                onClick={() => go(1)}
                disabled={!canNext}
                aria-label="Next"
                className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 z-10 flex-inline-center text-black text-5xl disabled:opacity-40 group-hover:translate-x-1 transition-transform"
            >
                <ChevronRight className="size-10" aria-hidden />
            </button>
        </div>
    );
}

export default Carousel