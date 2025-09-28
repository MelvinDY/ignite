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
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // go to the path
    navigate(path);
  };


  return (
    <nav className="fixed top-0 p-5 backdrop-blur-sm w-full shadow-2xl z-40 h-20">
      <div className="flex justify-between items-center w-full">
        <ul className="flex justify-between w-full">
          <div className="flex gap-10">
            <button
              onClick={() => handleNavigation("/")}
            >
              <img src={ppiaLogo} className="w-10"></img>
            </button>
            <button
              className="hover:underline"
              onClick={() => handleNavigation("/#about")}
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
            <button
              className="hover:underline"
              onClick={() => handleNavigation("/membership")}
            >
              Membership
            </button>
          </div>

          {!isAuthenticated && (
            // Login/Register buttons if not logged in
            <div className="flex gap-3 items-center">
              <button
                className="hover:underline"
                onClick={() => handleNavigation("/auth/login")}
              >
                Login
              </button>
              <span>|</span>
              <button
                className="hover:underline"
                onClick={() => handleNavigation("/auth/register")}
              >
                Register
              </button>
            </div>
          )}
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
