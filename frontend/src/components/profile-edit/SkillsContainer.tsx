import { twMerge } from "tailwind-merge";
import { Badge } from "../ui/Badge";
import { useEffect, useState } from "react";

interface SkillsContainerProps {
  id: string;
  label?: string;
  value: string[];
  className?: string;
  onChange: (value: string[]) => void;
}

const SkillsContainer = ({
  id,
  label,
  value = [],
  className,
  onChange,
}: SkillsContainerProps) => {
  const [inputValue, setInputValue] = useState("");

  const removeSkill = (index?: number) => {
    if (index) {
      const newSkills = value.filter((_, i) => i !== index);
      onChange(newSkills);
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !value.includes(skill)) {
      onChange([...value, skill]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addSkill(inputValue.trim());
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove the last skill on backspace if input is empty
      removeSkill();
    }
  };

  return (
    <>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <div
        id={id}
        className={twMerge(
          `w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder-white/60 
          focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent border-white/30`,
          className
        )}
      >
        <div className="flex flex-wrap gap-y-1">
          {value.map((skill, index) => (
            <Badge
              key={index}
              text={skill}
              onRemove={() => removeSkill(index)}
            />
          ))}
          <input
            id={id}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              value.length > 0 ? "" : "Enter a skill and press Enter"
            }
            className="flex-1 bg-transparent text-white placeholder-white/60 focus:outline-none min-w-0"
          />
        </div>
      </div>
    </>
  );
};

export { SkillsContainer };
