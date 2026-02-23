/**
 * LoadingAnimation: Kawaii Bubble Pop Design — Nano Banana Studio
 * Cute banana loading animation overlay
 */

import { motion, AnimatePresence } from 'framer-motion';

const MASCOT_URL = 'https://private-us-east-1.manuscdn.com/sessionFile/yePiFU8GjRdBGPYX8liEt4/sandbox/tLQ6zULlYtQGokogVvqybz_1771829362990_na1fn_YmFuYW5hLW1hc2NvdA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUveWVQaUZVOEdqUmRCR1BZWDhsaUV0NC9zYW5kYm94L3RMUTZ6VUxsWXRRR29rb2dWdnF5YnpfMTc3MTgyOTM2Mjk5MF9uYTFmbl9ZbUZ1WVc1aExXMWhjMk52ZEEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=oo4oKa1qcbYvQaBZCrz2Izj~Q4zkI7EH2XOrGSQ3a-Copk6hSf7L2cwJy3mK18m~-5lhPbeZWe5y0LN6l6~3yEQvCMqm2k8ubO1c33MMXlRoSbxv5apGjDe8YDuioMj1CANqA9gbjq7niUjXbTCstnQ0yu2lMVBHfttkK07tp1j~WwXpiZJpncribYM5bSxYIz2y4k6x5lah9mLRDDzCm3e-2LzZsK65XpV5tmAaDLqVnCm4ffqKlpSwBBhSmyC4kDa0KgsoZdBh47OhB9Xe4wOl~pFCmNxoTSBmDKJ1fHttdsuTWcbKVbHzy9OimvZVDoaSX5tZdnOfU1rLMYIiSw__';

const LOADING_MESSAGES = [
  '正在调配魔法颜料...',
  '小香蕉正在画画...',
  '灵感正在涌现...',
  '像素精灵正在工作...',
  '梦境正在成形...',
  '色彩正在融合...',
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
            {/* Bouncing mascot */}
            <motion.img
              src={MASCOT_URL}
              alt="Loading"
              className="w-20 h-20 object-contain drop-shadow-lg"
              animate={{
                y: [0, -15, 0],
                rotate: [0, -5, 5, 0],
                scale: [1, 1.05, 0.95, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Sparkle dots */}
            <div className="flex gap-2 mt-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: ['oklch(0.85 0.08 30)', 'oklch(0.82 0.1 290)', 'oklch(0.9 0.12 90)'][i],
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Message */}
            <motion.p
              key={message}
              className="mt-3 text-xs font-medium text-foreground/60"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              {message}
            </motion.p>

            {/* Progress bar */}
            <div className="w-40 h-1.5 rounded-full bg-muted/40 mt-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, oklch(0.85 0.08 30), oklch(0.82 0.1 290), oklch(0.9 0.12 90))',
                }}
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
