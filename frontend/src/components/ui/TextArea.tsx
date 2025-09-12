import { twMerge } from "tailwind-merge";

interface TextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

const TextArea = ({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  maxLength,
  className = "",
  disabled = false,
}: TextAreaProps) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className={twMerge(
          `w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder-white/60
          focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent
          resize-none max-h-96`,
          error ? "border-red-400" : "border-white/30",
          className,
          disabled ? "opacity-50 cursor-not-allowed" : ""
        )}
        disabled={disabled}
      />
    </div>
  );
};

export { TextArea };
