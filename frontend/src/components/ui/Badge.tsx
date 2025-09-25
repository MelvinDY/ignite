import { twMerge } from "tailwind-merge";

interface BadgeProps {
  text: string;
  onRemove?: () => void;
  className?: string;
  canRemove?: boolean;
}

const Badge = ({ text, onRemove, className, canRemove = true }: BadgeProps) => {
  return (
    <span
      className={twMerge(
        `inline-block h-6 bg-white text-black text-xs font-semibold mr-2 px-2.5 py-0.5 
        rounded-full border border-black`,
        className
      )}
    >
      {text}
      {canRemove && (
        <button type="button" className="ml-1" onClick={onRemove}>
          x
        </button>
      )}
    </span>
  );
};

export { Badge };
