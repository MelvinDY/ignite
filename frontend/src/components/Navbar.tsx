import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { DashboardHeaderAvatar } from "./DashboardHeaderAvatar";
import ppiaLogo from "../assets/PPIA_logo_white.png";
import { Link } from "react-router-dom";

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
    <nav className="fixed top-0 backdrop-blur-sm w-full shadow-2xl z-40 h-16 flex items-center px-6">
      <div className="flex justify-between items-center w-full h-full">
        <ul className="flex justify-between w-full h-full">
          <div className="flex gap-10 h-full">
            <button
              onClick={() => handleNavigation("/")}
            >
              <img src={ppiaLogo} className="w-10"></img>
            </button>
            <div className="flex flex-col items-center justify-center group">
              {/* About button */}
              <button
                className="relative hover:underline"
                onClick={() => handleNavigation("/#about")}
              >
                About
              </button>
              <div className="absolute top-14 bg-white text-black rounded-md mt-2 p-2
                              shadow-lg opacity-0 group-hover:opacity-90 invisible
                              group-hover:visible transition-opacity duration-500 ease-in-out">
                <ul className="flex flex-col gap-2">
                  {/* Submenu for About */}
                  <Link to="/about/ppia"
                    className="px-3 rounded-lg hover:underline transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    PPIA
                  </Link>
                  <div className="h-px bg-gray-300 my-1" />
                  <Link to="/about/inm"
                    className="px-3 rounded-lg hover:underline transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    INM
                  </Link>
                  <div className="h-px bg-gray-300 my-1" />
                  <Link to="/about/icon"
                    className="px-3 rounded-lg hover:underline transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ICON
                  </Link>
                </ul>
              </div>
            </div>
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
