import { programDataService } from "../../data/programDataService";
import { SearchableSelect } from "../ui/SearchableSelect";
import { Select } from "../ui/Select";
import { TextArea } from "../ui/TextArea";
import { TextInput } from "../ui/TextInput";
import type { EditProfileFormProps } from "./formTypes";

// Get program and major options from the data service
const PROGRAM_OPTIONS = programDataService
  .searchPrograms("")
  .map((program) => ({
    value: program.value,
    label: program.label,
  }));

const MAJOR_OPTIONS = programDataService.searchMajors("").map((major) => ({
  value: major.value,
  label: major.label,
}));

const DashboardForm = ({ formData, changeFormData }: EditProfileFormProps) => {
  return (
    <div className="space-y-4 pr-2 w-full">
      <Select
        id="level"
        label="Level"
        value={formData.level}
        onChange={(value) => changeFormData("level", value)}
        options={[
          { value: "foundation", label: "Foundation" },
          { value: "diploma", label: "Diploma" },
          { value: "undergrad", label: "Undergraduate" },
          { value: "postgrad", label: "Postgraduate" },
          { value: "phd", label: "PhD" },
        ]}
        placeholder="Select your level of study"
        // error={errors.level}
        required
      />

      <SearchableSelect
        id="program"
        label="Program"
        value={formData.program}
        onChange={(value) => changeFormData("program", value)}
        options={PROGRAM_OPTIONS}
        placeholder="Type to search UNSW programs..."
        // error={errors.program}
        required
        searchFunction={(query) => {
          const results = programDataService.searchPrograms(query);
          return results.map((p) => ({ value: p.value, label: p.label }));
        }}
        popularOptions={programDataService
          .getPopularPrograms()
          .map((p) => ({ value: p.value, label: p.label }))}
      />

      <SearchableSelect
        id="major"
        label="Major"
        value={formData.major}
        onChange={(value) => changeFormData("major", value)}
        options={MAJOR_OPTIONS}
        placeholder="Type to search majors/specializations..."
        // error={errors.major}
        required
        searchFunction={(query) =>
          programDataService
            .searchMajors(query)
            .map((m) => ({ value: m.value, label: m.label }))
        }
        popularOptions={programDataService
          .getPopularMajors()
          .map((m) => ({ value: m.value, label: m.label }))}
      />

      <TextInput
        id="headline"
        label="Headline"
        placeholder="Enter your headline"
        value={formData.headline}
        onChange={(value) => changeFormData("headline", value)}
        required
      />
      <TextArea
        id="bio"
        label="Bio"
        placeholder="Tell us about yourself"
        value={formData.bio}
        onChange={(value) => changeFormData("bio", value)}
        className="w-full h-52"
      />

      {/* Skills */}
    </div>
  );
};

export { DashboardForm };
