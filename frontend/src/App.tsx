import { useState, useEffect } from "react";
import "./App.css";
import AddUser from "./components/AddUser";
import { Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { Verify } from "./pages/auth/Verify";
import { RequestReset } from "./pages/auth/password/RequestReset";
import { VerifyReset } from "./pages/auth/password/VerifyReset";
import { ResetPassword } from "./pages/auth/password/ResetPassword";
import { ProfileEdit } from "./pages/ProfileEdit";
import { FeedPage } from "./pages/feed/FeedPage";
import { HandleSetupPage } from "./pages/profile/handle-setup";
import { MyProfilePage } from "./pages/profile/me";
import { PublicProfilePage } from "./pages/profile/PublicProfile";
import { useAuth } from "./hooks/useAuth";
import { MobileNavbar } from "./components/MobileNavbar";
import AboutPPIA from "./pages/about/PPIA";

function App() {
  const [, setRefreshKey] = useState(0);
  const { attemptSessionRestore } = useAuth();

  const handleUserAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Initialize auth on app startup - attempt to restore session with refresh token cookie
  useEffect(() => {
    const initializeAuth = async () => {
      await attemptSessionRestore();
    };

    initializeAuth();
  }, [attemptSessionRestore]);

  return (
    <Routes>
      {/* Auth routes - full screen, no navbar/footer */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/verify" element={<Verify />} />
      <Route path="/auth/password/request" element={<RequestReset />} />
      <Route path="/auth/password/verify" element={<VerifyReset />} />
      <Route path="/auth/password/reset" element={<ResetPassword />} />
      <Route path="/profile/edit" element={<ProfileEdit />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/profile/handle-setup" element={<HandleSetupPage />} />
      <Route path="/profile/me" element={<MyProfilePage />} />
      <Route path="/profile/:slug" element={<PublicProfilePage />} />
      <Route path="/feed" element={<FeedPage />} />

      {/* App routes - with navbar/footer */}
      <Route
        path="/*"
        element={
          <div className="flex flex-col h-full w-full">
            <div className="hidden md:block">
              <Navbar />
            </div>
            <div className="block md:hidden">
              <MobileNavbar />
            </div>
            <div className="flex flex-col">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* About subpages */}
                <Route path="/about">
                  <Route path="ppia" element={<AboutPPIA />} />
                  <Route path="icon" element={<AboutPPIA />} />
                  <Route path="inm" element={<AboutPPIA />} />
                </Route>
                <Route
                  path="/add"
                  element={<AddUser onUserAdded={handleUserAdded} />}
                />
              </Routes>
            </div>
            {<Footer />}
          </div>
        }
      />
    </Routes>
  );
}

export default App;
