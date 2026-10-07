import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/authContext";

// Signed-out visitors are sent to /login
export function ProtectedRoute() {
    const { isAuthenticated } = useAuth();

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Signed-in users skip the login / register screens
export function PublicOnlyRoute() {
    const { isAuthenticated } = useAuth();

    return isAuthenticated ? <Navigate to="/chat" replace /> : <Outlet />;
}
