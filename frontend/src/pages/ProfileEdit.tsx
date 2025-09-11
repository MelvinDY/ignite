import { useState } from "react";
import { BatikBackground } from "../components/BatikBackground";
import { GlassCard } from "../components/ui/GlassCard";
import { RadioGroup } from "../components/ui/RadioGroup";
import { TextInput } from "../components/ui/TextInput";
import { Button } from "../components/ui/Button";
import { twMerge } from "tailwind-merge";
import { Pencil } from "lucide-react";

const initialFormData = {
  fullName: "Andrew Garfield",
  zid: "z1234567",
  isIndonesian: false,
};

const ProfileEdit = () => {
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const changeFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setShowSaveButton(true);
  };

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen">
      <BatikBackground />
      <GlassCard
        className="w-[90%]"
        children={
          <div className="flex flex-col gap-4">
            <h1 className="font-bold text-3xl place-self-start">My Account</h1>
            <div className="flex sm:flex-row flex-col justify-between items-center gap-4 p-8">
              {/* Profile picture */}
              <div className="w-32 h-32 relative flex justify-center items-center sm:place-self-start">
                <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 hover:opacity-100 flex justify-center items-center cursor-pointer transition-all">
                  <Pencil />
                </div>
                <img
                  className="rounded-full w-32 h-32 object-cover cursor-pointer"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Andrew_Garfield_Comic-Con_2011_%28Straighten_Crop%29.jpg/250px-Andrew_Garfield_Comic-Con_2011_%28Straighten_Crop%29.jpg"
                  alt="Profile edit"
                />
              </div>
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
                    onChange={(value) =>
                      changeFormData("isIndonesian", value === "true")
                    }
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
            </div>
          </div>
        }
      />
    </div>
  );
};

export { ProfileEdit };
