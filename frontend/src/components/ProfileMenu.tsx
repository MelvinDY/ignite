import * as React from "react";
import { useNavigate } from "react-router-dom";
import { User, Edit, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface ProfileMenuProps {
  user: {
    name: string;
    avatarUrl?: string | null;
    email?: string;
  };
  variant?: "default" | "navbar";
}

export function ProfileMenu({ user, variant = "default" }: ProfileMenuProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewProfile = () => {
    navigate("/profile/me");
  };

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect to login even if logout API call fails
      navigate("/auth/login");
    }
  };

  const triggerClasses = variant === "navbar"
    ? "flex items-center space-x-2 rounded-full p-2 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
    : "flex items-center space-x-2 rounded-full p-2 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

  const textClasses = variant === "navbar"
    ? "hidden sm:inline-block text-sm font-medium text-white"
    : "hidden sm:inline-block text-sm font-medium text-foreground";

  const avatarFallbackClasses = variant === "navbar"
    ? "bg-white/10 text-white text-sm font-medium"
    : "bg-primary text-primary-foreground text-sm font-medium";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={triggerClasses}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
            <AvatarFallback className={avatarFallbackClasses}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className={textClasses}>
            {user.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-sm">{user.name}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEditProfile} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}