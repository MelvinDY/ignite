import { useState } from "react";
import { BatikBackground } from "../components/BatikBackground";
import { GlassCard } from "../components/ui/GlassCard";
import { RadioGroup } from "../components/ui/RadioGroup";
import { TextInput } from "../components/ui/TextInput";
import { Button } from "../components/ui/Button";

const ProfileEdit = () => {
  const [formData, setFormData] = useState({
    fullName: "Andrew Garfield",
    zid: "z1234567",
    isIndonesian: false,
  });

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
                  <svg
                    className="w-10 h-10 z-10"
                    viewBox="0 -960 960 960"
                    fill="#ffffff"
                  >
                    <path d="M202.63-202.87h57.24l374.74-374.74-56.76-57-375.22 375.22v56.52Zm-45.26 91q-19.15 0-32.33-13.17-13.17-13.18-13.17-32.33v-102.26q0-18.15 6.84-34.69 6.83-16.53 19.51-29.2l501.17-500.41q12.48-11.72 27.7-17.96 15.21-6.24 31.93-6.24 16.48 0 32.2 6.24 15.71 6.24 27.67 18.72l65.28 65.56q12.48 11.72 18.34 27.56 5.86 15.83 5.86 31.79 0 16.72-5.86 32.05-5.86 15.34-18.34 27.82L324-138.22q-12.67 12.68-29.21 19.51-16.53 6.84-34.68 6.84H157.37Zm597.37-586.39-56.24-56.48 56.24 56.48Zm-148.89 92.41-28-28.76 56.76 57-28.76-28.24Z" />
                  </svg>
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
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, fullName: value }))
                    }
                    // error={errors.fullName}
                    placeholder="Your full name"
                    required
                  />

                  <TextInput
                    id="zid"
                    label="zID"
                    value={formData.zid}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, zid: value }))
                    }
                    placeholder="z1234567"
                    required
                  />

                  <RadioGroup
                    name="isIndonesian"
                    label="Are you Indonesian?"
                    value={formData.isIndonesian.toString()}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        isIndonesian: value === "true",
                      }))
                    }
                    options={[
                      { value: "true", label: "Yes" },
                      { value: "false", label: "No" },
                    ]}
                    required
                  />
                  <div className="flex justify-end gap-4 mt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      children="Cancel"
                      className="w-24"
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
