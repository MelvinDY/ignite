import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="sticky top-0 p-5 backdrop-blur-sm w-full shadow-2xl">
      <ul className="flex gap-10">
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/events">Events</Link>
        </li>
        <li>
          <Link to="/login">Login</Link>
        </li>
        <li>
          <Link to="/register">Register</Link>
        </li>
        <li>
          <Link to="/membership">Membership</Link>
        </li>
      </ul>
    </nav>
  );
};

export { Navbar };
