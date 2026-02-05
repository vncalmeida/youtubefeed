import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      aria-pressed={isDark}
      title={isDark ? "Tema escuro ativo — clique para claro" : "Tema claro ativo — clique para escuro"}
      onClick={toggleTheme}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium
                  transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow
                  dark:bg-white/5 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/10 ${className || ""}`}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        {/* Ícone com micro transição */}
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="absolute"
        >
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </motion.span>
      </span>
      <span className="hidden sm:inline">{isDark ? "Escuro" : "Claro"}</span>
    </motion.button>
  );
};

export default ThemeToggle;
