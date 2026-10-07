import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContext";

const THEME_COLORS = { light: "#ffffff", dark: "#0d0f14" };

export default function ThemeProvider({ children }) {
    // index.html already applied the saved / preferred theme before first paint
    const [theme, setThemeState] = useState(
        () => document.documentElement.getAttribute("data-theme") || "light"
    );

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);

        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute("content", THEME_COLORS[theme]);

        try {
            localStorage.setItem("theme", theme);
        } catch {
            // storage unavailable (private mode) - theme still applies
        }
    }, [theme]);

    const setTheme = useCallback((value) => setThemeState(value), []);

    const toggleTheme = useCallback(
        () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
        []
    );

    const value = useMemo(
        () => ({ theme, setTheme, toggleTheme }),
        [theme, setTheme, toggleTheme]
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}
