import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export function Select({ 
  id, 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option",
  error, 
  required = false 
}: SelectProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 bg-white/10 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent ${
          error ? 'border-red-400' : 'border-white/30'
        }`}
      >
        <option value="" className="bg-gray-800">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-400" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
    </div>
  );
}