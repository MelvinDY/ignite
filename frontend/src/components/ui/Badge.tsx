import { twMerge } from "tailwind-merge";

interface BadgeProps {
  text: string;
  onRemove: () => void;
  className?: string;
}

const Badge = ({ text, onRemove, className }: BadgeProps) => {
  return (
    <span
      className={twMerge(
        `inline-block h-6 bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 
        rounded dark:bg-blue-200 dark:text-blue-800`,
        className
      )}
    >
      {text}
      <button className="ml-1" onClick={onRemove}>
        x
      </button>
    </span>
  );
};

export { Badge };
