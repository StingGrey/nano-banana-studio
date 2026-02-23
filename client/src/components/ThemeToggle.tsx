/**
 * ThemeToggle: Kawaii Bubble Pop Design
 * Cute animated theme toggle button
 */

import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-transform"
      onClick={toggleTheme}
      whileTap={{ scale: 0.9, rotate: 180 }}
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {theme === 'dark' ? (
          <Sun size={16} className="text-banana" />
        ) : (
          <Moon size={16} className="text-lavender" />
        )}
      </motion.div>
    </motion.button>
  );
}
