import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type React from "react";
import { LoaderCircle } from "lucide-react";

// Wrapper component for pages/components that needs authentication
export function ProtectedRoute({ children }: {children: React.ReactNode}) {
    const {isAuthenticated, isLoading} = useAuth();

    // Display laoding if token is being refreshed
    if (isLoading) {
        return (
            <div className="flex-center flex-col h-screen">
                <LoaderCircle className="animate-spin w-24 h-24 text-gray-400"/>
                <p className="text-gray-300">Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace/>;
    } else {
        return children;
    }
}