import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

// { user, token, isAuthenticated, login(token, user), logout(reason?), updateUser(patch) }
export const useAuth = () => useContext(AuthContext);
