/**
 * MainCanvas — Nano Banana Studio
 * Central area with prompt input, generation controls, and image display
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Download, Heart, Maximize2,
  Copy, X, Loader2, ImageIcon, BookOpen, Trash2, Upload, Camera, Paperclip, FileImage
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useRef, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import PromptLibrary from './PromptLibrary';
import ImageViewer from './ImageViewer';
import { resolveRequestFormat, type GeneratedImage } from '@/lib/store';

const PROMPT_SUGGESTIONS = [
  '一只可爱的猫咪坐在月亮上，梦幻水彩风格',
  '赛博朋克城市夜景，霓虹灯倒映在雨水中',
  '精致的玻璃瓶中有一个微型花园',
  '日式和风庭院，樱花飘落，锦鲤池塘',
  '太空中漂浮的水晶城堡，星云背景',
  '冒着热气的拿铁咖啡，小熊拉花',
];

export default function MainCanvas() {
  const {
    params, updateParams, isGenerating, progress, generate,
    gallery, toggleFavorite, removeFromGallery, activeConfig, sidebarOpen, rightPanelOpen,
  } = useStudio();
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showNegPrompt, setShowNegPrompt] = useState(false);
  const [showPromptLib, setShowPromptLib] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const leftSlots = Math.max(0, 4 - params.referenceImages.length);
    if (leftSlots === 0) {
      toast.warning('最多上传 4 张参考图');
      event.target.value = '';
      return;
    }

    const acceptedFiles = files.slice(0, leftSlots);
    const readers = acceptedFiles.map((file) => new Promise<{ name: string; type: string; dataUrl: string }>((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('仅支持图片文件'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: file.type || 'image/png',
        dataUrl: String(reader.result || ''),
      });
      reader.onerror = () => reject(new Error(`${file.name} 读取失败`));
      reader.readAsDataURL(file);
    }));

    Promise.allSettled(readers).then((results) => {
      const fulfilled = results
        .filter((res): res is PromiseFulfilledResult<{ name: string; type: string; dataUrl: string }> => res.status === 'fulfilled')
        .map((res) => res.value)
        .filter((img) => img.dataUrl);

      if (fulfilled.length > 0) {
        updateParams({ referenceImages: [...params.referenceImages, ...fulfilled] });
        toast.success(`已添加 ${fulfilled.length} 张参考图`);
      }

      const failedCount = results.length - fulfilled.length;
      if (failedCount > 0) {
        toast.error(`${failedCount} 张图片添加失败，请重试`);
      }
    });

    event.target.value = '';
  };

  const removeReferenceImage = (index: number) => {
    updateParams({
      referenceImages: params.referenceImages.filter((_, i) => i !== index),
    });
  };

  const handleGenerate = async () => {
    if (!params.prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }
    if (!activeConfig) {
      toast.error('请先配置 API');
      return;
    }
    if (!activeConfig.apiKey) {
      toast.error('请先设置 API Key');
      return;
    }
    const result = await generate();
    if (result) {
      if (result.success) {
        toast.success(`成功生成 ${result.images.length} 张图片`);
      } else {
        toast.error(result.error || '生成失败');
      }
    }
  };

  const handleDownload = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `nano-banana-${id}.png`;
    a.click();
  };

  const recentImages = gallery.slice(0, 20);
  const requestFormat = activeConfig ? resolveRequestFormat(activeConfig) : null;

  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 ease-out",
        sidebarOpen ? "ml-[264px]" : "ml-0",
        rightPanelOpen ? "mr-[328px]" : "mr-0"
      )}
    >
      {/* Main content area */}
      <div className="flex-1 flex flex-col p-4 pt-14 overflow-hidden">

        {/* Image Display Area */}
        <div className="flex-1 flex items-center justify-center min-h-0 mb-4">
          {recentImages.length > 0 ? (
            <div className="w-full h-full overflow-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-max p-1">
                <AnimatePresence mode="popLayout">
                  {recentImages.map((img) => (
                    <motion.div
                      key={img.id}
                      className="group relative rounded-lg overflow-hidden border border-border bg-card cursor-pointer hover:shadow-sm transition-shadow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedImage(img)}
                      layout
                    >
                      <div className="aspect-square bg-muted/20">
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-[10px] line-clamp-2 mb-2 leading-relaxed">{img.prompt}</p>
                          <div className="flex gap-1.5">
                            <button
                              className="p-1.5 rounded bg-white/20 hover:bg-white/40 transition-colors"
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(img.id); }}
                            >
                              <Heart size={12} className={img.isFavorite ? "fill-red-400 text-red-400" : "text-white"} />
                            </button>
                            <button
                              className="p-1.5 rounded bg-white/20 hover:bg-white/40 transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.id); }}
                            >
                              <Download size={12} className="text-white" />
                            </button>
                            <button
                              className="p-1.5 rounded bg-white/20 hover:bg-white/40 transition-colors"
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(img.prompt); toast.success('提示词已复制'); }}
                            >
                              <Copy size={12} className="text-white" />
                            </button>
                            <button
                              className="p-1.5 rounded bg-white/20 hover:bg-red-500/40 transition-colors ml-auto"
                              onClick={(e) => { e.stopPropagation(); removeFromGallery(img.id); }}
                            >
                              <Trash2 size={12} className="text-white" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Favorite badge */}
                      {img.isFavorite && (
                        <div className="absolute top-2 right-2">
                          <Heart size={14} className="fill-red-400 text-red-400 drop-shadow" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-md">
              <ImageIcon size={48} className="mx-auto mb-4 text-muted-foreground/20" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-foreground/70 mb-2">
                开始你的创作之旅
              </h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                输入提示词，生成你想要的图片
              </p>
              {/* Prompt suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    className="px-3 py-1.5 rounded-md text-xs border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    onClick={() => updateParams({ prompt: suggestion })}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prompt Input Area */}
        <div className="border border-border rounded-lg bg-card p-3 relative">
          {/* Progress bar */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="h-full bg-foreground"
                  style={{ width: `${progress}%` }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Negative prompt */}
          <AnimatePresence>
            {showNegPrompt && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium text-destructive/70 uppercase tracking-wider">反向提示词</span>
                  <button onClick={() => setShowNegPrompt(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={10} />
                  </button>
                </div>
                <textarea
                  value={params.negativePrompt}
                  onChange={(e) => updateParams({ negativePrompt: e.target.value })}
                  placeholder="输入不想出现的元素，如：低质量, 模糊, 变形..."
                  className="w-full px-3 py-2 text-xs rounded-md bg-destructive/5 border border-destructive/10 focus:border-destructive/30 focus:outline-none resize-none placeholder:text-muted-foreground/40 transition-colors"
                  rows={2}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={params.prompt}
                onChange={(e) => updateParams({ prompt: e.target.value })}
                placeholder="描述你想要生成的图片..."
                className="w-full px-4 py-3 pr-10 text-sm rounded-md bg-muted/30 border border-border focus:border-foreground/30 focus:outline-none resize-none placeholder:text-muted-foreground/50 min-h-[52px] max-h-[120px] transition-colors"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              {/* Prompt library button */}
              <button
                className="absolute right-2 top-2 p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPromptLib(true)}
                title="提示词灵感库"
              >
                <BookOpen size={14} />
              </button>

              <div className="mt-2 flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Upload size={12} />
                  上传文件
                </button>
                <button
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                  onClick={() => cameraInputRef.current?.click()}
                  type="button"
                >
                  <Camera size={12} />
                  拍照
                </button>
                {params.referenceImages.length > 0 && (
                  <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                    <Paperclip size={11} />
                    已添加 {params.referenceImages.length}/4
                  </span>
                )}
              </div>

              {params.referenceImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {params.referenceImages.map((img, idx) => (
                    <span
                      key={`${img.name}-${idx}`}
                      className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded bg-muted text-foreground"
                    >
                      <FileImage size={11} />
                      <span className="max-w-[110px] truncate">{img.name}</span>
                      <button
                        type="button"
                        className="hover:text-destructive transition-colors"
                        onClick={() => removeReferenceImage(idx)}
                        title="移除参考图"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-[10px] rounded-md transition-colors",
                  showNegPrompt ? "bg-destructive/10 text-destructive" : ""
                )}
                onClick={() => setShowNegPrompt(!showNegPrompt)}
              >
                反向
              </Button>
              <button
                className={cn(
                  "kawaii-btn flex items-center gap-2 text-sm whitespace-nowrap",
                  isGenerating && "opacity-60 pointer-events-none"
                )}
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>生成中</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>生成</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom hints */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground/60">
                {activeConfig ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {activeConfig.name}
                  </span>
                ) : (
                  <span className="text-destructive/60">未配置 API</span>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground/40 font-mono">
                {requestFormat === 'gemini'
                  ? `${params.aspectRatio === 'auto' ? 'auto' : params.aspectRatio === 'custom' ? `${Math.max(1, params.customAspectRatioWidth)}:${Math.max(1, params.customAspectRatioHeight)}` : params.aspectRatio} | ${params.imageSize} | ${params.responseModalities === 'IMAGE_ONLY' ? '仅图片' : '文本+图片'}`
                  : requestFormat === 'openai'
                  ? `${params.openaiSize} | ${params.openaiQuality} | n=${params.openaiN}`
                  : `${params.width}x${params.height} | ${params.steps}步 | ${params.sampler}`
                }
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/40">
              Ctrl+Enter 发送
            </span>
          </div>
        </div>
      </div>

      {/* Prompt Library Dialog */}
      <PromptLibrary open={showPromptLib} onClose={() => setShowPromptLib(false)} />

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}
