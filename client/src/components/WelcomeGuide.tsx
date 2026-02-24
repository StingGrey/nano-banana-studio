/**
 * WelcomeGuide — Nano Banana Studio
 * First-time user onboarding guide
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowRight, Settings, Palette, Wand2 } from 'lucide-react';
import { useStudio } from '@/contexts/StudioContext';

const steps = [
  {
    icon: Settings,
    title: '配置 API',
    desc: '在左侧边栏设置你的 API 密钥，支持 OpenAI、Gemini、Claude 格式',
  },
  {
    icon: Palette,
    title: '自定义参数',
    desc: '在右侧面板调整风格、质量、尺寸等丰富的生成参数',
  },
  {
    icon: Wand2,
    title: '开始创作',
    desc: '输入提示词，点击生成按钮，让 AI 为你绘制精美图片',
  },
];

export default function WelcomeGuide() {
  const { setSettingsOpen } = useStudio();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('nb-welcome-dismissed');
    if (!dismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('nb-welcome-dismissed', 'true');
    setShow(false);
  };

  const handleSetup = () => {
    handleDismiss();
    setSettingsOpen(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border shadow-lg"
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="bg-card px-6 pt-8 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wand2 size={24} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-1">
                欢迎来到 Nano Banana Studio
              </h2>
              <p className="text-xs text-muted-foreground">
                你的 AI 绘图助手，三步开始创作
              </p>
            </div>

            {/* Content */}
            <div className="bg-card px-6 pb-6">
              {/* Steps */}
              <div className="space-y-3 mb-5">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.2 }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <step.icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">
                        {i + 1}. {step.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted/80 transition-colors text-muted-foreground"
                  onClick={handleDismiss}
                >
                  稍后再说
                </button>
                <button
                  className="flex-1 kawaii-btn flex items-center justify-center gap-2 text-sm rounded-lg"
                  onClick={handleSetup}
                >
                  开始配置
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
