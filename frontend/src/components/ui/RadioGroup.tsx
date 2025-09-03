import React from 'react';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  error?: string;
  required?: boolean;
}

export function RadioGroup({ 
  name, 
  label, 
  value, 
  onChange, 
  options, 
  error, 
  required = false 
}: RadioGroupProps) {
  return (
    <div className="mb-4">
      <fieldset>
        <legend className="block text-sm font-medium text-white mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </legend>
        <div className="flex space-x-6">
          {options.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="mr-2 focus:ring-2 focus:ring-white/50"
              />
              <span className="text-white">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="mt-1 text-sm text-red-400" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
    </div>
  );
}