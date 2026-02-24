/**
 * ImageViewer — Nano Banana Studio
 * Full-screen image viewer with details and actions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Copy, ZoomIn, ZoomOut, RotateCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import type { GeneratedImage } from '@/lib/store';

interface Props {
  image: GeneratedImage | null;
  onClose: () => void;
  onToggleFavorite?: (id: string) => void;
}

export default function ImageViewer({ image, onClose, onToggleFavorite }: Props) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  if (!image) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = image.url;
    a.download = `nano-banana-${image.id}.png`;
    a.click();
    toast.success('图片已开始下载');
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
    toast.success('提示词已复制到剪贴板');
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-lg"
          onClick={onClose}
        />

        {/* Image */}
        <motion.div
          className="relative z-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <motion.img
            src={image.url}
            alt={image.prompt}
            className="max-w-[85vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            transition={{ type: 'spring', stiffness: 200 }}
            drag
            dragConstraints={{ top: -200, bottom: 200, left: -200, right: 200 }}
          />
        </motion.div>

        {/* Top controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <button
            className="p-2.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-colors"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Bottom toolbar */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
          >
            <ZoomOut size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            onClick={() => setRotation(r => r + 90)}
          >
            <RotateCw size={16} />
          </Button>

          <div className="w-px h-6 bg-white/20" />

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            onClick={() => onToggleFavorite?.(image.id)}
          >
            <Heart size={16} className={image.isFavorite ? "fill-red-400 text-red-400" : ""} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            onClick={handleCopyPrompt}
          >
            <Copy size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            onClick={() => setShowInfo(!showInfo)}
          >
            <Info size={16} />
          </Button>
        </motion.div>

        {/* Info panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              className="absolute right-4 top-16 bottom-20 w-72 z-20 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-4 overflow-auto"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
            >
              <h3 className="text-white font-semibold text-sm mb-3">图片详情</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-white/50 text-[10px] uppercase tracking-wider">提示词</span>
                  <p className="text-white/90 text-xs mt-1">{image.prompt}</p>
                </div>
                {image.params.negativePrompt && (
                  <div>
                    <span className="text-white/50 text-[10px] uppercase tracking-wider">反向提示词</span>
                    <p className="text-white/90 text-xs mt-1">{image.params.negativePrompt}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-white/50 text-[10px]">尺寸</span>
                    <p className="text-white/90 text-xs font-mono">{image.params.width}×{image.params.height}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-[10px]">步数</span>
                    <p className="text-white/90 text-xs font-mono">{image.params.steps}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-[10px]">CFG</span>
                    <p className="text-white/90 text-xs font-mono">{image.params.cfgScale}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-[10px]">种子</span>
                    <p className="text-white/90 text-xs font-mono">{image.params.seed}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-[10px]">采样器</span>
                    <p className="text-white/90 text-xs font-mono">{image.params.sampler}</p>
                  </div>
                  <div>
                    <span className="text-white/50 text-[10px]">风格</span>
                    <p className="text-white/90 text-xs font-mono">{image.params.style || '无'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-white/50 text-[10px]">生成时间</span>
                  <p className="text-white/90 text-xs font-mono">
                    {new Date(image.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
