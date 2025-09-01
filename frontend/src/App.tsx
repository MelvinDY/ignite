import { useState } from "react";
import "./App.css";
import UserList from "./components/UserList";
import AddUser from "./components/AddUser";
import { Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <Navbar />
      <div className="flex-grow flex flex-col m-20 pt-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/add"
            element={<AddUser onUserAdded={handleUserAdded} />}
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
