import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { X } from "lucide-react";
import { SkillsContainer } from "../profile-edit/SkillsContainer";
import type { Skill } from "../profile-edit/formTypes";
import { profileApi, ProfileApiError } from "../../lib/api/profile";

type SkillsModalProps = {
  open: boolean;
  onClose: () => void;
  formError: string | null;
  skills: Skill[];
  setSkills: Dispatch<SetStateAction<Skill[]>>;
};

const SkillsModal = ({
  open,
  onClose,
  formError,
  skills,
  setSkills,
}: SkillsModalProps) => {
  if (!open) return null;
  const [newSkills, setNewSkills] = useState<Skill[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNewSkills(skills);
  }, [open]);

  const updateSkills = async () => {
    setSubmitting(true);
    const skillsToAdd = newSkills.filter((newSkill) => newSkill.id === -1);

    for (const skillToAdd of skillsToAdd) {
      if (!skills.includes(skillToAdd)) {
        try {
          console.log("Adding skill:", skillToAdd.name);
          const resp = await profileApi.addSkills(skillToAdd.name);
          const newId = resp.id;
          setSkills((currentData: Skill[]) => {
            const updatedSkills = currentData.map((s) => {
              // If this is the skill we just added, return a new object with the ID
              if (s.name === skillToAdd.name) {
                return { ...s, id: newId };
              }
              return s;
            });

            // Return a whole new state object
            return updatedSkills;
          });
        } catch (error) {
          if (error instanceof ProfileApiError) {
            console.error("Profile API Error:", error.message);
          } else {
            console.error("Unexpected Error:", error);
          }
        } finally {
          setSubmitting(false);
        }
      }
    }

    const skillsToRemove = skills.filter(
      (oldSkill) =>
        !newSkills.some((newSkill) => newSkill.name === oldSkill.name)
    );

    for (const skill of skillsToRemove) {
      try {
        console.log("Removing skill:", skill.name);
        await profileApi.deleteSkill(skill.id);
      } catch (error) {
        console.error(`Failed to remove skill: ${skill.name}`, error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
      >
        <div className="flex-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-black">Add skills</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={() => updateSkills()} className="px-5 py-4 space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <SkillsContainer
            id="skills"
            skills={newSkills}
            onChange={(value) => setNewSkills(value)}
            displayOnly={false}
            className="border border-black/30"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-black hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[var(--dark-red)] px-4 py-2 font-medium text-white hover:bg-[var(--dark-red)]/90 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { SkillsModal };
