/**
 * LoadingAnimation — Nano Banana Studio
 * Minimalist loading animation overlay
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LOADING_MESSAGES = [
  '正在生成中...',
  '处理图片中...',
  '灵感正在涌现...',
  '即将完成...',
  '渲染中...',
  '优化画面...',
];

interface Props {
  isVisible: boolean;
  progress: number;
}

export default function LoadingAnimation({ isVisible, progress }: Props) {
  const messageIndex = Math.floor((progress / 100) * (LOADING_MESSAGES.length - 1));
  const message = LOADING_MESSAGES[Math.min(messageIndex, LOADING_MESSAGES.length - 1)];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
          >
            <Loader2 size={32} className="text-foreground/60 animate-spin" />

            {/* Message */}
            <motion.p
              key={message}
              className="mt-3 text-xs font-medium text-foreground/60"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message}
            </motion.p>

            {/* Progress bar */}
            <div className="w-40 h-1.5 rounded-full bg-muted/40 mt-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-foreground/60"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
