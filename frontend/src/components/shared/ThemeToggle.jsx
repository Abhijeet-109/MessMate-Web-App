import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-surface-container transition-colors duration-200"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <Sun className="w-6 h-6 text-warning" />
      ) : (
        <Moon className="w-6 h-6 text-on-surface" />
      )}
    </button>
  );
};

export default ThemeToggle;
