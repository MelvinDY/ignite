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
import { FeedPage } from "./pages/FeedPage";
import { HandleSetupPage } from "./pages/profile/handle-setup";
import { MyProfilePage } from "./pages/profile/me";
import { useAuth } from "./hooks/useAuth";

function App() {
  const [, setRefreshKey] = useState(0);
  const { refreshAuth } = useAuth();

  const handleUserAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Initialize auth on app startup - check for existing tokens
  useEffect(() => {
    const initializeAuth = async () => {
      // Import authStateManager directly to check stored state
      const { authStateManager } = await import('./hooks/useAuth');
      const currentState = authStateManager.getState();
      
      // Only try to refresh if we have ALL required auth data and it's not expired
      if (currentState.isAuthenticated && 
          currentState.accessToken && 
          currentState.userId && 
          currentState.expiresAt && 
          currentState.expiresAt > Date.now() + 60000) { // Must have > 1 min remaining
        try {
          console.log('Attempting to restore session...');
          await refreshAuth();
          console.log('Session restored successfully');
        } catch (error) {
          console.log('Session refresh failed, user will need to log in again');
          // Auth hook will automatically clear invalid tokens
        }
      } else {
        console.log('No valid stored session found');
      }
    };
    
    initializeAuth();
  }, [refreshAuth]);

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
      <Route path="/profile/handle-setup" element={<HandleSetupPage />} />
      <Route path="/profile/me" element={<MyProfilePage />} />
      <Route path="/feed" element={<FeedPage/>}/>

      {/* App routes - with navbar/footer */}
      <Route
        path="/*"
        element={
          <div className="flex flex-col h-full w-full">
            <Navbar />
            <div className="flex flex-col m-20 pt-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/add"
                  element={<AddUser onUserAdded={handleUserAdded} />}
                />
              </Routes>
            </div>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}

export default App;
