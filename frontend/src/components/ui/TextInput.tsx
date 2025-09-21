import { twMerge } from "tailwind-merge";

interface TextInputProps {
  id: string;
  label: string;
  type?: "text" | "email" | "number";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  className?: string;
  disabled?: boolean;
}

export function TextInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  maxLength,
  min,
  max,
  pattern,
  className = "",
  disabled = false,
}: TextInputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        max={max}
        pattern={pattern}
        disabled={disabled}
        className={twMerge(
          "w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent",
          error ? "border-red-400" : "border-white/30",
          className,
          disabled ? "opacity-50 cursor-not-allowed" : ""
        )}
      />
      {error && (
        <p
          className="mt-1 text-sm text-red-400"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
