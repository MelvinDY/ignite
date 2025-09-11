import { twMerge } from "tailwind-merge";
import { Button } from "../ui/Button";
import { RadioGroup } from "../ui/RadioGroup";
import { TextInput } from "../ui/TextInput";
import { useState } from "react";

interface AccountDetailsFormProps {
  initialFormData: {
    fullName: string;
    zid: string;
    isIndonesian: boolean;
  };
}

const AccountDetailsForm = ({ initialFormData }: AccountDetailsFormProps) => {
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const changeFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setShowSaveButton(true);
  };

  return (
    <div>
      <div className="space-y-4">
        <TextInput
          id="fullName"
          label="Full Name"
          value={formData.fullName}
          onChange={(value) => changeFormData("fullName", value)}
          // error={errors.fullName}
          placeholder="Your full name"
          required
        />

        <TextInput
          id="zid"
          label="zID"
          value={formData.zid}
          onChange={(value) => changeFormData("zid", value)}
          placeholder="z1234567"
          required
        />

        <RadioGroup
          name="isIndonesian"
          label="Are you Indonesian?"
          value={formData.isIndonesian.toString()}
          onChange={(value) => changeFormData("isIndonesian", value === "true")}
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
          required
        />

        {/* Save and Cancel Button group, hidden when no changes */}
        <div
          className={twMerge(
            "flex justify-end gap-4 mt-2",
            !showSaveButton && "hidden"
          )}
        >
          <Button
            type="button"
            variant="secondary"
            children="Cancel"
            className="w-24"
            onClick={() => {
              setFormData(initialFormData);
              setShowSaveButton(false);
            }}
          />
          <Button type="submit" children="Save" className="w-24" />
        </div>
      </div>
    </div>
  );
};

export { AccountDetailsForm };
