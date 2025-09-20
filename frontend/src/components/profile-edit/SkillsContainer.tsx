import { twMerge } from "tailwind-merge";
import { Badge } from "../ui/Badge";
import { useState } from "react";
import { type Skill } from "./formTypes";

interface SkillsContainerProps {
  id: string;
  value: Skill[];
  className?: string;
  onChange: (value: Skill[]) => void;
  displayOnly: boolean;
}

const SkillsContainer = ({
  id,
  value = [],
  className,
  onChange,
  displayOnly,
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
    if (skill && !value.find((s) => s.name === skill)) {
      onChange([...value, { name: skill, id: -1 }]);
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
      <div
        id={id}
        className={twMerge(
          `w-full px-3 py-2 bg-white/10 rounded-md placeholder-white/60 text-black`,
          className
        )}
      >
        <div className="flex flex-wrap gap-y-1">
          {value.map((skill, index) => (
            <Badge
              key={index}
              text={skill.name}
              onRemove={() => removeSkill(index)}
              canRemove={!displayOnly}
            />
          ))}
          {!displayOnly && (
            <input
              id={id}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                value.length > 0 ? "" : "Enter a skill and press Enter"
              }
              className="text-black flex-1 bg-transparent placeholder-black/60 focus:outline-none min-w-0"
            />
          )}
        </div>
      </div>
    </>
  );
};

export { SkillsContainer };
