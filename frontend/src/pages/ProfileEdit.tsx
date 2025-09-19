import { useEffect, useState } from "react";
import { BatikBackground } from "../components/BatikBackground";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Pencil } from "lucide-react";
import { AccountDetailsForm } from "../components/profile-edit/AccountDetailsForm";
import { twMerge } from "tailwind-merge";
import { DashboardForm } from "../components/profile-edit/DashboardForm";
import { profileApi, ProfileApiError } from "../lib/api/profile";
import { type FormData } from "../components/profile-edit/formTypes";

interface MenuItem {
  label: string;
  component: React.ReactNode;
}

const ProfileEdit = () => {
  const [menu, setMenu] = useState(0);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [initialFormData, setInitialFormData] = useState<FormData>(
    {} as FormData
  );
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const changeFormData = (
    field: string,
    value: any // TODO: improve type
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setShowSaveButton(true);
  };

  const updateData = async () => {
    // TODO: update other fields
  };

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      component: (
        <DashboardForm formData={formData} changeFormData={changeFormData} />
      ),
    },
    {
      label: "Account Details",
      component: (
        <AccountDetailsForm
          formData={formData}
          changeFormData={changeFormData}
        />
      ),
    },
    {
      label: "Change Password",
      component: <></>,
    },
    {
      label: "Log Out",
      component: <></>,
    },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await profileApi.getMyProfile();
        const skills = await profileApi.getSkills();
        const data = {
          emailAddress: "TODO",
          fullName: profileData.fullName,
          zid: profileData.zid,
          isIndonesian: profileData.isIndonesian,
          bio: profileData.bio ?? "",
          headline: profileData.headline ?? "",
          major: profileData.major ?? "",
          level: profileData.level,
          program: profileData.program ?? "",
          skills: skills,
        };
        setInitialFormData(data);
        setFormData(data);
        console.log(data);
      } catch (error) {
        if (error instanceof ProfileApiError) {
          console.error("Profile API Error:", error.message);
        } else {
          console.error("Unexpected Error:", error);
        }
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen p-8">
      <BatikBackground />
      <GlassCard className="w-[90%] h-[calc(100vh-8rem)]">
        <div className="flex flex-col gap-4 h-full">
          <h1 className="font-bold text-3xl place-self-start">My Account</h1>
          <div className="flex sm:flex-row flex-col items-center gap-10 p-8">
            <div className="flex flex-col justify-center items-center gap-4 h-full">
              {/* Profile picture */}
              <div className="w-32 h-32 relative flex justify-center items-center">
                <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 hover:opacity-100 flex justify-center items-center cursor-pointer transition-all">
                  <Pencil />
                </div>
                <img
                  className="rounded-full w-32 h-32 object-cover cursor-pointer"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Andrew_Garfield_Comic-Con_2011_%28Straighten_Crop%29.jpg/250px-Andrew_Garfield_Comic-Con_2011_%28Straighten_Crop%29.jpg"
                  alt="Profile edit"
                />
              </div>
              <div className="flex flex-col">
                {/* Menu */}
                {Object.entries(menuItems).map(([_, item], index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="link"
                    children={item.label}
                    className={twMerge(
                      "mt-2 font-bold text-xl",
                      menu === index && "after:w-full"
                    )}
                    onClick={() => setMenu(index)}
                  />
                ))}
              </div>
            </div>
            {/* Form */}
            <div className="flex flex-1 flex-col justify-start items-start h-[calc(100vh-16rem)] overflow-y-auto p-1">
              {menuItems[menu].component}
              {/* Save and Cancel Button group, hidden when no changes */}
              <div
                className={twMerge(
                  "flex justify-end gap-4 mt-6 w-full",
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
                <Button
                  type="submit"
                  children="Save"
                  className="w-24"
                  onClick={() => {
                    setInitialFormData(formData);
                    setShowSaveButton(false);
                    updateData();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export { ProfileEdit };
