/**
 * Sidebar: Kawaii Bubble Pop Design — Nano Banana Studio
 * Left sidebar with API config, history, and navigation
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, History, Sparkles, ChevronLeft, ChevronRight,
  Zap, Star, Trash2, Image as ImageIcon, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// 使用原生滚动替代 ScrollArea 以确保移动端触摸滚动兼容性
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const MASCOT_URL = 'https://private-us-east-1.manuscdn.com/sessionFile/yePiFU8GjRdBGPYX8liEt4/sandbox/tLQ6zULlYtQGokogVvqybz_1771829362990_na1fn_YmFuYW5hLW1hc2NvdA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUveWVQaUZVOEdqUmRCR1BZWDhsaUV0NC9zYW5kYm94L3RMUTZ6VUxsWXRRR29rb2dWdnF5YnpfMTc3MTgyOTM2Mjk5MF9uYTFmbl9ZbUZ1WVc1aExXMWhjMk52ZEEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=oo4oKa1qcbYvQaBZCrz2Izj~Q4zkI7EH2XOrGSQ3a-Copk6hSf7L2cwJy3mK18m~-5lhPbeZWe5y0LN6l6~3yEQvCMqm2k8ubO1c33MMXlRoSbxv5apGjDe8YDuioMj1CANqA9gbjq7niUjXbTCstnQ0yu2lMVBHfttkK07tp1j~WwXpiZJpncribYM5bSxYIz2y4k6x5lah9mLRDDzCm3e-2LzZsK65XpV5tmAaDLqVnCm4ffqKlpSwBBhSmyC4kDa0KgsoZdBh47OhB9Xe4wOl~pFCmNxoTSBmDKJ1fHttdsuTWcbKVbHzy9OimvZVDoaSX5tZdnOfU1rLMYIiSw__';

const fredoka = { fontFamily: "'Fredoka', sans-serif" };

export default function Sidebar() {
  const {
    sidebarOpen, setSidebarOpen, setSettingsOpen,
    apiConfigs, activeConfig, setActiveConfig,
    gallery, removeFromGallery, toggleFavorite,
    updateParams,
  } = useStudio();

  return (
    <>
      {/* Toggle button */}
      <motion.button
        className={cn(
          "fixed top-4 z-50 glass-card p-2 hover:scale-110 transition-transform",
          sidebarOpen ? "left-[268px]" : "left-4"
        )}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        whileTap={{ scale: 0.9 }}
        layout
      >
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </motion.button>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-[264px] glass-sidebar z-40 flex flex-col"
          >
            {/* Logo area */}
            <div className="p-4 pb-2">
              <motion.div
                className="flex items-center gap-3"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.img
                  src={MASCOT_URL}
                  alt="Nano Banana"
                  className="w-10 h-10 object-contain"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div>
                  <h1
                    className="text-lg font-bold bg-gradient-to-r from-[oklch(0.85_0.08_30)] via-[oklch(0.82_0.1_290)] to-[oklch(0.9_0.12_90)] bg-clip-text text-transparent leading-tight"
                    style={fredoka}
                  >
                    Nano Banana
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Studio Pro</p>
                </div>
              </motion.div>
            </div>

            {/* API Config Section */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={12} className="text-[oklch(0.9_0.12_90)]" />
                  API 配置
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <Plus size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>管理 API 配置</TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-1">
                {apiConfigs.map((config, i) => (
                  <motion.button
                    key={config.id}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                      activeConfig?.id === config.id
                        ? "bg-primary/10 border border-primary/20 text-foreground shadow-sm"
                        : "hover:bg-muted/60 text-muted-foreground border border-transparent"
                    )}
                    onClick={() => setActiveConfig(config.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          activeConfig?.id === config.id ? "bg-green-400" : "bg-muted-foreground/30"
                        )}
                        animate={activeConfig?.id === config.id ? {
                          boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 8px rgba(74,222,128,0.6)', '0 0 0px rgba(74,222,128,0)'],
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="truncate font-medium text-xs">{config.name}</span>
                    </div>
                    <div className="ml-4 mt-0.5">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                        config.format === 'openai' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        config.format === 'gemini' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        config.format === 'claude' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                      )}>
                        {config.format.toUpperCase()}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs rounded-xl hover:bg-primary/5"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={12} className="mr-1.5" />
                管理配置
              </Button>
            </div>

            {/* Divider */}
            <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Gallery / History */}
            <div className="px-3 py-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <History size={12} className="text-[oklch(0.82_0.1_290)]" />
                  历史记录
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-full font-mono">{gallery.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                <div className="space-y-1.5 pr-2">
                  <AnimatePresence>
                    {gallery.slice(0, 30).map((img, i) => (
                      <motion.div
                        key={img.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="group relative rounded-xl overflow-hidden bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => updateParams({ prompt: img.prompt })}
                      >
                        <div className="flex items-center gap-2 p-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted/30">
                            <img
                              src={img.url}
                              alt=""
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] truncate text-foreground/80">{img.prompt}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {new Date(img.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(img.id); }}
                              className="p-1 rounded-lg hover:bg-primary/10"
                              whileTap={{ scale: 0.8 }}
                            >
                              <Star size={10} className={img.isFavorite ? "fill-[oklch(0.9_0.12_90)] text-[oklch(0.9_0.12_90)]" : "text-muted-foreground"} />
                            </motion.button>
                            <motion.button
                              onClick={(e) => { e.stopPropagation(); removeFromGallery(img.id); }}
                              className="p-1 rounded-lg hover:bg-destructive/10"
                              whileTap={{ scale: 0.8 }}
                            >
                              <Trash2 size={10} className="text-muted-foreground" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {gallery.length === 0 && (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <ImageIcon size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                      </motion.div>
                      <p className="text-xs text-muted-foreground/50">还没有生成记录</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-1">输入提示词开始创作吧</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border/20">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={10} />
                </motion.div>
                <span>Powered by Nano Banana Pro</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
