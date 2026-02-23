/**
 * ThemeToggle: Kawaii Bubble Pop Design
 * Cute animated theme toggle button — positioned at bottom-left to avoid blocking content
 */

import { useTheme } from '@/contexts/ThemeContext';
import { useStudio } from '@/contexts/StudioContext';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { sidebarOpen } = useStudio();

  return (
    <motion.button
      className={cn(
        "fixed bottom-3 z-50 w-8 h-8 rounded-full glass-card flex items-center justify-center hover:scale-110 transition-all duration-300",
        sidebarOpen ? "left-[272px]" : "left-3"
      )}
      onClick={toggleTheme}
      whileTap={{ scale: 0.9, rotate: 180 }}
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
      layout
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {theme === 'dark' ? (
          <Sun size={14} className="text-banana" />
        ) : (
          <Moon size={14} className="text-lavender" />
        )}
      </motion.div>
    </motion.button>
  );
}
