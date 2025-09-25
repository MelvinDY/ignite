import { Pencil } from "lucide-react";
import { SkillsContainer } from "./profile-edit/SkillsContainer";
import { useEffect, useState } from "react";
import { profileApi } from "../lib/api/profile";
import { type Skill } from "./profile-edit/formTypes";
import { SkillsModal } from "./ui/SkillsModal";

export function ProfileSkills() {
  const [openModal, setOpenModal] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);

  const fetchSkills = async () => {
    try {
      const skills = await profileApi.getSkills();
      setSkills(skills);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="flex-between w-full text-xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="flex items-center">
          <svg
            className="w-6 h-6 mr-2 text-[var(--dark-red)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Skills
        </div>
        <button
          type="button"
          className="text-gray-700 hover:text-gray-500"
          onClick={() => setOpenModal(true)}
        >
          <Pencil className="size-5 mr-1" />
        </button>
      </h2>

      <div className="flex flex-wrap gap-2">
        {/* Skills container here */}
        <SkillsContainer
          id="skills"
          skills={skills}
          onChange={(value) => setSkills(value)}
          displayOnly={true}
        />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {skills.length} skills total
        </p>
      </div>

      {openModal && (
        <SkillsModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          formError={""}
          skills={skills}
          setSkills={setSkills}
        />
      )}
    </div>
  );
}
