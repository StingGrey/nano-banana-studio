/**
 * ThemeToggle — Nano Banana Studio
 * Minimalist theme toggle button
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
    <button
      className={cn(
        "fixed bottom-3 z-50 w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors",
        sidebarOpen ? "left-[272px]" : "left-3"
      )}
      onClick={toggleTheme}
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {theme === 'dark' ? (
          <Sun size={14} className="text-amber-500" />
        ) : (
          <Moon size={14} className="text-foreground" />
        )}
      </motion.div>
    </button>
  );
}
