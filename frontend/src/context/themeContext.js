import { createContext, useContext } from "react";

export const ThemeContext = createContext(null);

// { theme: "light" | "dark", toggleTheme, setTheme }
export const useTheme = () => useContext(ThemeContext);
