import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { DashboardHeaderAvatar } from "./DashboardHeaderAvatar";
import {
  useEffect,
  useState,
  type FC,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type JSX,
} from "react";

interface AnimatedHamburgerIconProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen: boolean;
}

interface NavLink {
  path: string;
  label: string;
}

const AnimatedHamburgerIcon: FC<AnimatedHamburgerIconProps> = ({
  isOpen,
  ...props
}) => (
  <button
    aria-label="Toggle menu"
    {...props}
    className="relative z-50 h-8 w-8 text-white focus:outline-none hover:text-black "
  >
    <span className="sr-only">Open main menu</span>
    <div className="absolute left-1/2 top-1/2 block w-7 -translate-x-1/2 -translate-y-1/2 transform">
      <span
        aria-hidden="true"
        className={`absolute block h-0.5 w-7 transform rounded-full bg-current transition duration-300 ease-in-out ${
          isOpen ? "rotate-45" : "-translate-y-2"
        }`}
      ></span>
      <span
        aria-hidden="true"
        className={`absolute block h-0.5 w-7 transform rounded-full bg-current transition duration-300 ease-in-out ${
          isOpen ? "opacity-0" : ""
        }`}
      ></span>
      <span
        aria-hidden="true"
        className={`absolute block h-0.5 w-7 transform rounded-full bg-current transition duration-300 ease-in-out ${
          isOpen ? "-rotate-45" : "translate-y-2"
        }`}
      ></span>
    </div>
  </button>
);

const MobileNavbar: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

  const handleNavigation = (path: string): void => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(path);
    }
    setIsMenuOpen(false);
  };

  const navLinks: NavLink[] = [
    { path: "/", label: "Dashboard" },
    { path: "/about", label: "About" },
    { path: "/events", label: "event" },
    { path: "/feed", label: "feed" },
  ];

  const authLinks: NavLink[] = [
    { path: "/auth/login", label: "login" },
    { path: "/auth/register", label: "register" },
  ];

  const memberLink: NavLink = { path: "/membership", label: "membership" };

  const renderNavButton = (path: string, label: string): JSX.Element => {
    const isActive = location.pathname === path;
    const baseStyle =
      "text-2xl text-center w-full py-4 rounded-lg transition-colors duration-300 capitalize";
    const activeStyle = "bg-[#3b0f0f] text-white font-medium underline";
    const inactiveStyle =
      "text-gray-300 hover:bg-[#3b0f0f] hover:text-white hover:font-medium hover:underline";

    return (
      <button
        className={`${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
        onClick={() => handleNavigation(path)}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 backdrop-blur-sm w-full shadow-2xl z-40 p-4">
        <div className="flex justify-between items-center">
          <AnimatedHamburgerIcon
            isOpen={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
          {/* Avatar */}
          {isAuthenticated && (
            <div className="ml-4">
              <DashboardHeaderAvatar />
            </div>
          )}
        </div>
      </header>
      <div
        className={`h-screen fixed bg-[#1a0000] overflow-y-scroll inset-0 z-30 transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className="relative pt-24 p-4 h-full flex flex-col"
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <ul className="flex flex-col items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.path} className="w-full">
                {renderNavButton(link.path, link.label)}
              </li>
            ))}
            {!isAuthenticated &&
              authLinks.map((link) => (
                <li key={link.path} className="w-full">
                  {renderNavButton(link.path, link.label)}
                </li>
              ))}
            <li className="w-full">
              {renderNavButton(memberLink.path, memberLink.label)}
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export { MobileNavbar };
