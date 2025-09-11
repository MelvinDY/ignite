import { RadioGroup } from "../ui/RadioGroup";
import { TextInput } from "../ui/TextInput";
import type { EditProfileFormProps } from "./formTypes";

const AccountDetailsForm = ({
  formData,
  changeFormData,
}: EditProfileFormProps) => {
  return (
    <div className="space-y-4 w-full">
      <TextInput
        id="emailAddress"
        label="Email Address"
        value={formData.emailAddress}
        onChange={(value) => changeFormData("emailAddress", value)}
        // error={errors.emailAddress}
        placeholder="Your email address"
        // className="items-left"
        required
      />

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
    </div>
  );
};

export { AccountDetailsForm };
