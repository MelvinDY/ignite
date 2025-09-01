import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const handleNavigation = (path: string) => {
    if (location.pathname === path) {
      // smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  };

  return (
    <nav className="fixed top-0 p-5 backdrop-blur-sm w-full shadow-2xl">
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
        <li className="hover:underline">
          <Link to="/events">Events</Link>
        </li>
        <li className="hover:underline">
          <Link to="/login">Login</Link>
        </li>
        <li className="hover:underline">
          <Link to="/register">Register</Link>
        </li>
        <li className="hover:underline">
          <Link to="/membership">Membership</Link>
        </li>
      </ul>
    </nav>
  );
};

export { Navbar };
