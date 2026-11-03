import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function ThemeToggle({ className = "", style }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text)",
        cursor: "pointer",
        transition: "all var(--transition-base)",
        boxShadow: "var(--shadow-xs)",
        ...style,
      }}
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} theme`}
      aria-label={`Switch to ${theme === "light" ? "Dark" : "Light"} theme`}
    >
      {theme === "light" ? (
        <Moon size={18} style={{ color: "#d97706" }} />
      ) : (
        <Sun size={18} style={{ color: "#fbbf24" }} />
      )}
    </button>
  );
}
