import { useState } from "react";
import "./App.css";
import UserList from "./components/UserList";
import AddUser from "./components/AddUser";
import { Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/add"
          element={<AddUser onUserAdded={handleUserAdded} />}
        />
      </Routes>
    </>
  );
}

export default App;
