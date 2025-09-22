import { useEffect, useState } from "react";
import { BatikBackground } from "../components/BatikBackground";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Pencil, CheckCircle, XCircle } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
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
    setSaving(true);
    setNotification(null);

    try {
      // Build the update payload (exclude non-API fields)
      const updates = {
        fullName: formData.fullName !== initialFormData.fullName ? formData.fullName : undefined,
        headline: formData.headline !== initialFormData.headline ? (formData.headline || null) : undefined,
        isIndonesian: formData.isIndonesian !== initialFormData.isIndonesian ? formData.isIndonesian : undefined,
        bio: formData.bio !== initialFormData.bio ? (formData.bio || null) : undefined,
        major: formData.major !== initialFormData.major ? formData.major : undefined,
        level: formData.level !== initialFormData.level ? formData.level as any : undefined,
        program: formData.program !== initialFormData.program ? formData.program : undefined,
        yearStart: formData.yearStart !== initialFormData.yearStart ? formData.yearStart : undefined,
        yearGrad: formData.yearGrad !== initialFormData.yearGrad ? formData.yearGrad : undefined,
        domicileCity: formData.domicileCity !== initialFormData.domicileCity ? (formData.domicileCity || null) : undefined,
        domicileCountry: formData.domicileCountry !== initialFormData.domicileCountry ? (formData.domicileCountry || null) : undefined,
      };

      // Remove undefined fields
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(filteredUpdates).length === 0) {
        setNotification({ type: 'error', message: 'No changes to save' });
        setSaving(false);
        return;
      }

      await profileApi.updateProfile(filteredUpdates);

      // Update initial form data to reflect saved changes
      setInitialFormData(formData);
      setShowSaveButton(false);
      setNotification({ type: 'success', message: 'Profile updated successfully!' });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        setNotification({ type: 'error', message: err.message || 'Failed to update profile' });
      } else {
        setNotification({ type: 'error', message: 'An unexpected error occurred' });
      }
    } finally {
      setSaving(false);
    }
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
          yearStart: profileData.yearStart,
          yearGrad: profileData.yearGrad,
          domicileCity: profileData.domicileCity ?? "",
          domicileCountry: profileData.domicileCountry ?? "",
        };
        setInitialFormData(data);
        setFormData(data);
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
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-3xl place-self-start">My Account</h1>
            {/* Notification */}
            {notification && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                notification.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            )}
          </div>
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
                  children={saving ? "Saving..." : "Save"}
                  className="w-24"
                  disabled={saving}
                  onClick={() => {
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
