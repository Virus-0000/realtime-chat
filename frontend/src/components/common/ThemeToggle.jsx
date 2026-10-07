import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/themeContext";
import { IconButton } from "./Button";

export default function ThemeToggle({ size = "md", className = "" }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <IconButton
            icon={isDark ? Sun : Moon}
            label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            size={size}
            className={`theme-toggle ${className}`}
            onClick={toggleTheme}
        />
    );
}
