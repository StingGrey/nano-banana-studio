/**
 * WelcomeGuide: Kawaii Bubble Pop Design — Nano Banana Studio
 * First-time user onboarding guide
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Settings, Palette, Wand2 } from 'lucide-react';
import { useStudio } from '@/contexts/StudioContext';

const HERO_BG = 'https://private-us-east-1.manuscdn.com/sessionFile/yePiFU8GjRdBGPYX8liEt4/sandbox/tLQ6zULlYtQGokogVvqybz-img-1_1771829343000_na1fn_aGVyby1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUveWVQaUZVOEdqUmRCR1BZWDhsaUV0NC9zYW5kYm94L3RMUTZ6VUxsWXRRR29rb2dWdnF5YnotaW1nLTFfMTc3MTgyOTM0MzAwMF9uYTFmbl9hR1Z5YnkxaVp3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=d2Eg7Z76bjqf6p4K-Ilzu7n35vjgOhDsTNRhe09NO~g0M6xMuC-1QtGFXVlUJxlhZOvBn2SAvmxRVyZ0Ecc-baNsLAhiSEddah5Ma4ToJVX0uWRQwjYJp6zLq17CcSNMSBOn1UHi7kinJTxXIinuRJMwy4CwCdhDOmtwJ~XUBYemQMQXK-OJedS9jGIlNumFjlLygXzSMtjm32yjbHcJSixeX5UvBe2PgNR4t6XT-LSuB7TnhpRVoIuiBu3YK~b-Rv0UTUff5N2cesJcmwPSKusYqt48CQmPt7jrRqy9vhkLajZneHfmeoFplrkosHxHmbof5kh9Ctzq5LY1sdb8yw__';

const MASCOT_URL = 'https://private-us-east-1.manuscdn.com/sessionFile/yePiFU8GjRdBGPYX8liEt4/sandbox/tLQ6zULlYtQGokogVvqybz_1771829362990_na1fn_YmFuYW5hLW1hc2NvdA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUveWVQaUZVOEdqUmRCR1BZWDhsaUV0NC9zYW5kYm94L3RMUTZ6VUxsWXRRR29rb2dWdnF5YnpfMTc3MTgyOTM2Mjk5MF9uYTFmbl9ZbUZ1WVc1aExXMWhjMk52ZEEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=oo4oKa1qcbYvQaBZCrz2Izj~Q4zkI7EH2XOrGSQ3a-Copk6hSf7L2cwJy3mK18m~-5lhPbeZWe5y0LN6l6~3yEQvCMqm2k8ubO1c33MMXlRoSbxv5apGjDe8YDuioMj1CANqA9gbjq7niUjXbTCstnQ0yu2lMVBHfttkK07tp1j~WwXpiZJpncribYM5bSxYIz2y4k6x5lah9mLRDDzCm3e-2LzZsK65XpV5tmAaDLqVnCm4ffqKlpSwBBhSmyC4kDa0KgsoZdBh47OhB9Xe4wOl~pFCmNxoTSBmDKJ1fHttdsuTWcbKVbHzy9OimvZVDoaSX5tZdnOfU1rLMYIiSw__';

const steps = [
  {
    icon: Settings,
    title: '配置 API',
    desc: '在左侧边栏设置你的 API 密钥，支持 OpenAI、Gemini、Claude 格式',
    color: 'from-green-400 to-emerald-500',
  },
  {
    icon: Palette,
    title: '自定义参数',
    desc: '在右侧面板调整风格、质量、尺寸等丰富的生成参数',
    color: 'from-purple-400 to-violet-500',
  },
  {
    icon: Wand2,
    title: '开始创作',
    desc: '输入提示词，点击生成按钮，让 AI 为你绘制精美图片',
    color: 'from-amber-400 to-orange-500',
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
            className="relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl"
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Hero section */}
            <div className="relative h-44 overflow-hidden">
              <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-[oklch(0.15_0.02_290)]" />
              <motion.img
                src={MASCOT_URL}
                alt="Nano Banana"
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-24 object-contain drop-shadow-xl"
                animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-[oklch(0.15_0.02_290)] px-6 pb-6 pt-2">
              <h2 className="text-center text-xl font-bold mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                欢迎来到 Nano Banana Studio
              </h2>
              <p className="text-center text-xs text-muted-foreground mb-5">
                你的可爱 AI 绘图助手，三步开始创作
              </p>

              {/* Steps */}
              <div className="space-y-3 mb-5">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 shadow-md`}>
                      <step.icon size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                        {i + 1}. {step.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <motion.button
                  className="flex-1 py-2.5 rounded-full text-sm font-medium bg-muted/50 hover:bg-muted/80 transition-colors text-muted-foreground"
                  onClick={handleDismiss}
                  whileTap={{ scale: 0.98 }}
                >
                  稍后再说
                </motion.button>
                <motion.button
                  className="flex-1 kawaii-btn flex items-center justify-center gap-2 text-sm"
                  onClick={handleSetup}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles size={14} />
                  开始配置
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
