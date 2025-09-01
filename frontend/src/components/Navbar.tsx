const Navbar = () => {
  return (
    <nav className="sticky top-0 p-5 backdrop-blur-sm w-full shadow-2xl">
      <ul className="flex gap-10">
        <li>
          <a href="/">Dashboard</a>
        </li>
        <li>
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/events">Events</a>
        </li>
        <li>
          <a href="/login">Login</a>
        </li>
        <li>
          <a href="/register">Register</a>
        </li>
        <li>
          <a href="/membership">Membership</a>
        </li>
      </ul>
    </nav>
  );
};

export { Navbar };
