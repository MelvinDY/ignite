import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleNavigation = (path: string) => {
    if (location.pathname === path) {
      // smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // go to the path
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <nav className="fixed top-0 p-5 backdrop-blur-sm w-full shadow-2xl z-40">
      <ul className="flex gap-10">
        <button
          className="hover:underline"
          onClick={() => handleNavigation("/")}
        >
          Dashboard
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
        {isAuthenticated ? (
          <button
            className="hover:underline"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            Logout
          </button>
        ) : (
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
    </nav>
  );
};

export { Navbar };
