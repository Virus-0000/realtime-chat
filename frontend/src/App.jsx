import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ThemeProvider from "./context/ThemeProvider";
import ToastProvider from "./context/ToastProvider";
import AuthProvider from "./context/AuthProvider";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ProtectedRoute, PublicOnlyRoute } from "./components/common/RouteGuards";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Chat from "./pages/Chat";

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <BrowserRouter>
                            <Routes>
                                <Route element={<PublicOnlyRoute />}>
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/login" element={<Login />} />
                                </Route>

                                <Route element={<ProtectedRoute />}>
                                    <Route path="/chat" element={<Chat />} />
                                </Route>

                                <Route path="*" element={<Navigate to="/chat" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
