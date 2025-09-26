import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { DashboardHeaderAvatar } from "./DashboardHeaderAvatar";
import ppiaLogo from "../assets/PPIA_logo_white.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleNavigation = (path: string) => {
    if (location.pathname === path) {
      // smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // go to the path
    navigate(path);
  };


  return (
    <nav className="fixed top-0 p-5 backdrop-blur-sm w-full shadow-2xl z-40">
      <div className="flex justify-between items-center">
        <ul className="flex gap-10">
          <button
            className="hover:underline"
            onClick={() => handleNavigation("/")}
          >
            <img src={ppiaLogo} className="w-12"></img>
          </button>
          <button
            className="hover:underline"
            onClick={() => handleNavigation("/about")}
          >
            About
          </button>
          <button
            className="hover:underline"
            onClick={() => handleNavigation("/events")}
          >
            Events
          </button>
          <button
            className="hover:underline"
            onClick={() => handleNavigation("/feed")}
          >
            Feed
          </button>
          {!isAuthenticated && (
            <>
              <button
                className="hover:underline"
                onClick={() => handleNavigation("/auth/login")}
              >
                Login
              </button>
              <button
                className="hover:underline"
                onClick={() => handleNavigation("/auth/register")}
              >
                Register
              </button>
            </>
          )}
          <button
            className="hover:underline"
            onClick={() => handleNavigation("/membership")}
          >
            Membership
          </button>
        </ul>
        
        {/* Avatar */}
        {isAuthenticated && (
          <div className="ml-4">
            <DashboardHeaderAvatar />
          </div>
        )}
      </div>
    </nav>
  );
};

export { Navbar };
