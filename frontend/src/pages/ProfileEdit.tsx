import { useState } from "react";
import { BatikBackground } from "../components/BatikBackground";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Pencil } from "lucide-react";
import { AccountDetailsForm } from "../components/profile-edit/AccountDetailsForm";

const initialFormData = {
  fullName: "Andrew Garfield",
  zid: "z1234567",
  isIndonesian: false,
};

const menuItems = [
  { label: "Account Details", value: "accountDetails" },
  { label: "Change Password", value: "changePassword" },
  { label: "Log Out", value: "logOut" },
];

const ProfileEdit = () => {
  const [menu, setMenu] = useState("accountDetails");

  return (
    <div className="w-full flex flex-col justify-center items-center min-h-screen">
      <BatikBackground />
      <GlassCard
        className="w-[90%]"
        children={
          <div className="flex flex-col gap-4">
            <h1 className="font-bold text-3xl place-self-start">My Account</h1>
            <div className="flex sm:flex-row flex-col justify-between items-center gap-4 p-8">
              <div className="flex flex-col justify-center items-center gap-4">
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
                  <Button
                    type="button"
                    variant="link"
                    children="Account Details"
                    className="mt-2 font-bold text-xl"
                  />
                  <Button
                    type="button"
                    variant="link"
                    children="Change Password"
                    className="mt-2 font-bold text-xl"
                  />
                  <Button
                    type="button"
                    variant="link"
                    children="Log Out"
                    className="mt-2 font-bold text-xl"
                  />
                </div>
              </div>

              {/* Form */}
              <AccountDetailsForm initialFormData={initialFormData} />
            </div>
          </div>
        }
      />
    </div>
  );
};

export { ProfileEdit };
