/**
 * Sidebar — Nano Banana Studio
 * Left sidebar with API config, history, and navigation
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, History, ChevronLeft, ChevronRight,
  Star, Trash2, Image as ImageIcon, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
          "fixed top-4 z-50 p-2 rounded-md border border-border bg-card hover:bg-muted transition-colors",
          sidebarOpen ? "left-[268px]" : "left-4"
        )}
        onClick={() => setSidebarOpen(!sidebarOpen)}
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-0 top-0 bottom-0 w-[264px] glass-sidebar z-40 flex flex-col"
          >
            {/* Logo area */}
            <div className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-base font-semibold leading-tight">
                    Nano Banana
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Studio</p>
                </div>
              </div>
            </div>

            {/* API Config Section */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  API 配置
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <Plus size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>管理 API 配置</TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-1">
                {apiConfigs.map((config) => (
                  <button
                    key={config.id}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeConfig?.id === config.id
                        ? "bg-muted border border-border text-foreground"
                        : "hover:bg-muted/60 text-muted-foreground border border-transparent"
                    )}
                    onClick={() => setActiveConfig(config.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          activeConfig?.id === config.id ? "bg-green-500" : "bg-muted-foreground/30"
                        )}
                      />
                      <span className="truncate font-medium text-xs">{config.name}</span>
                    </div>
                    <div className="ml-3.5 mt-0.5">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-mono",
                        config.format === 'openai' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        config.format === 'gemini' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        config.format === 'vertex' && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                        config.format === 'claude' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                      )}>
                        {config.format.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs rounded-md"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={12} className="mr-1.5" />
                管理配置
              </Button>
            </div>

            {/* Divider */}
            <div className="mx-4 my-2 h-px bg-border" />

            {/* Gallery / History */}
            <div className="px-3 py-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <History size={12} />
                  历史记录
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{gallery.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                <div className="space-y-1 pr-2">
                  <AnimatePresence>
                    {gallery.slice(0, 30).map((img) => (
                      <motion.div
                        key={img.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="group relative rounded-md overflow-hidden hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => updateParams({ prompt: img.prompt })}
                      >
                        <div className="flex items-center gap-2 p-2">
                          <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-muted">
                            <img
                              src={img.url}
                              alt=""
                              className="w-full h-full object-cover"
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
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(img.id); }}
                              className="p-1 rounded hover:bg-accent"
                            >
                              <Star size={10} className={img.isFavorite ? "fill-foreground text-foreground" : "text-muted-foreground"} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFromGallery(img.id); }}
                              className="p-1 rounded hover:bg-destructive/10"
                            >
                              <Trash2 size={10} className="text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {gallery.length === 0 && (
                    <div className="text-center py-8">
                      <ImageIcon size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground/50">还没有生成记录</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-1">输入提示词开始创作吧</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40">
                <span>Nano Banana Studio</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
