/**
 * ParamsPanel: Kawaii Bubble Pop Design — Nano Banana Studio
 * Right panel with rich customization options for image generation
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, RotateCcw, Sparkles, Dice5,
  SlidersHorizontal, Palette, Maximize2, Layers, Wand2, Plus, X,
  Zap, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { SAMPLERS, STYLES, QUALITY_OPTIONS, ASPECT_RATIOS } from '@/lib/store';
import { useState } from 'react';

function SectionHeader({ icon: Icon, title, children }: { icon: any; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={12} className="text-primary" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-foreground/70 font-display">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function ParamSlider({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono font-medium text-foreground/80 bg-muted/60 px-2 py-0.5 rounded-md min-w-[3rem] text-center">
          {typeof value === 'number' && step < 1 ? value.toFixed(2) : value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-peach [&_[role=slider]]:to-lavender [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-md [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:transition-transform [&_[role=slider]]:hover:scale-125"
      />
    </div>
  );
}

export default function ParamsPanel() {
  const { rightPanelOpen, setRightPanelOpen, params, updateParams, resetParams } = useStudio();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');

  const addCustomParam = () => {
    if (customKey.trim()) {
      updateParams({
        customParams: { ...params.customParams, [customKey.trim()]: customValue },
      });
      setCustomKey('');
      setCustomValue('');
    }
  };

  const removeCustomParam = (key: string) => {
    const next = { ...params.customParams };
    delete next[key];
    updateParams({ customParams: next });
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        className={cn(
          "fixed top-4 z-50 glass-card p-2 hover:scale-110 transition-transform",
          rightPanelOpen ? "right-[332px]" : "right-4"
        )}
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
        whileTap={{ scale: 0.9 }}
        layout
      >
        {rightPanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </motion.button>

      <AnimatePresence>
        {rightPanelOpen && (
          <motion.aside
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-[328px] glass-sidebar z-40 flex flex-col"
            style={{ borderLeft: '1px solid oklch(0.9 0.03 300 / 30%)' }}
          >
            {/* Header */}
            <div className="p-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <SlidersHorizontal size={16} className="text-primary" />
                </motion.div>
                <h2 className="font-bold text-sm font-display">参数设置</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={resetParams}
              >
                <RotateCcw size={12} className="mr-1" />
                重置
              </Button>
            </div>

            <ScrollArea className="flex-1 px-4">
              <div className="space-y-5 pb-6">

                {/* Style Preset */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <SectionHeader icon={Palette} title="风格预设" />
                  <div className="grid grid-cols-4 gap-1.5">
                    {STYLES.map((style) => (
                      <motion.button
                        key={style.value}
                        className={cn(
                          "px-2 py-1.5 rounded-xl text-[10px] font-medium transition-all border",
                          params.style === style.value
                            ? "bg-primary/15 border-primary/30 text-primary shadow-sm"
                            : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                        )}
                        onClick={() => updateParams({ style: style.value })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {style.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Quality */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <SectionHeader icon={Sparkles} title="质量" />
                  <div className="grid grid-cols-2 gap-2">
                    {QUALITY_OPTIONS.map((q) => (
                      <motion.button
                        key={q.value}
                        className={cn(
                          "p-2.5 rounded-xl text-left transition-all border",
                          params.quality === q.value
                            ? "bg-primary/15 border-primary/30 shadow-sm"
                            : "bg-muted/30 border-transparent hover:bg-muted/60"
                        )}
                        onClick={() => updateParams({ quality: q.value })}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-xs font-bold font-display">{q.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{q.desc}</div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Aspect Ratio */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <SectionHeader icon={Maximize2} title="画面比例" />
                  <div className="grid grid-cols-4 gap-1.5">
                    {ASPECT_RATIOS.map((ar) => (
                      <motion.button
                        key={ar.value}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all border",
                          params.aspectRatio === ar.value
                            ? "bg-primary/15 border-primary/30 shadow-sm"
                            : "bg-muted/30 border-transparent hover:bg-muted/60"
                        )}
                        onClick={() => updateParams({ aspectRatio: ar.value, width: ar.w, height: ar.h })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div
                          className={cn(
                            "border-2 rounded-sm transition-colors",
                            params.aspectRatio === ar.value ? "border-primary" : "border-muted-foreground/30"
                          )}
                          style={{
                            width: `${Math.min(24, 24 * (ar.w / Math.max(ar.w, ar.h)))}px`,
                            height: `${Math.min(24, 24 * (ar.h / Math.max(ar.w, ar.h)))}px`,
                          }}
                        />
                        <span className="text-[10px] font-mono font-medium">{ar.label}</span>
                      </motion.button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">宽度</Label>
                      <input
                        type="number"
                        value={params.width}
                        onChange={(e) => updateParams({ width: parseInt(e.target.value) || 512 })}
                        className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg bg-muted/40 border border-border/50 focus:border-primary/50 focus:outline-none font-mono transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">高度</Label>
                      <input
                        type="number"
                        value={params.height}
                        onChange={(e) => updateParams({ height: parseInt(e.target.value) || 512 })}
                        className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg bg-muted/40 border border-border/50 focus:border-primary/50 focus:outline-none font-mono transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Generation Params */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <SectionHeader icon={Wand2} title="生成参数" />
                  <div className="space-y-4">
                    <ParamSlider
                      label="采样步数"
                      value={params.steps}
                      onChange={(v) => updateParams({ steps: v })}
                      min={1} max={150}
                    />
                    <ParamSlider
                      label="CFG Scale"
                      value={params.cfgScale}
                      onChange={(v) => updateParams({ cfgScale: v })}
                      min={1} max={30} step={0.5}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">采样器</Label>
                      <Select value={params.sampler} onValueChange={(v) => updateParams({ sampler: v })}>
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-muted/30 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SAMPLERS.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">种子</Label>
                        <div className="flex gap-1 mt-1">
                          <input
                            type="number"
                            value={params.seed}
                            onChange={(e) => updateParams({ seed: parseInt(e.target.value) })}
                            className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-muted/40 border border-border/50 focus:border-primary/50 focus:outline-none font-mono transition-colors"
                            placeholder="-1 为随机"
                          />
                          <motion.button
                            className="h-8 w-8 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-colors shrink-0"
                            onClick={() => updateParams({ seed: Math.floor(Math.random() * 2147483647) })}
                            whileTap={{ scale: 0.9, rotate: 180 }}
                            title="随机种子"
                          >
                            <Dice5 size={12} />
                          </motion.button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">批量数</Label>
                        <input
                          type="number"
                          value={params.batchSize}
                          onChange={(e) => updateParams({ batchSize: Math.max(1, Math.min(8, parseInt(e.target.value) || 1)) })}
                          min={1} max={8}
                          className="w-full mt-1 px-2 py-1.5 text-xs rounded-lg bg-muted/40 border border-border/50 focus:border-primary/50 focus:outline-none font-mono transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Advanced Options */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <motion.button
                      className="w-full flex items-center justify-between h-9 px-3 text-xs rounded-xl hover:bg-muted/60 transition-colors"
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Layers size={12} className="text-lavender" />
                        高级选项
                      </span>
                      <motion.div
                        animate={{ rotate: showAdvanced ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <ChevronRight size={12} className="rotate-90" />
                      </motion.div>
                    </motion.button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 mt-3 pl-1"
                    >
                      <ParamSlider
                        label="Clip Skip"
                        value={params.clipSkip}
                        onChange={(v) => updateParams({ clipSkip: v })}
                        min={1} max={12}
                      />
                      <ParamSlider
                        label="去噪强度"
                        value={params.denoisingStrength}
                        onChange={(v) => updateParams({ denoisingStrength: v })}
                        min={0} max={1} step={0.05}
                      />
                      <ParamSlider
                        label="高清放大倍数"
                        value={params.hiresUpscale}
                        onChange={(v) => updateParams({ hiresUpscale: v })}
                        min={1} max={4} step={0.1} unit="x"
                      />
                      <ParamSlider
                        label="高清放大步数"
                        value={params.hiresSteps}
                        onChange={(v) => updateParams({ hiresSteps: v })}
                        min={0} max={100}
                      />
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Custom Parameters */}
                <Collapsible open={showCustom} onOpenChange={setShowCustom}>
                  <CollapsibleTrigger asChild>
                    <motion.button
                      className="w-full flex items-center justify-between h-9 px-3 text-xs rounded-xl hover:bg-muted/60 transition-colors"
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Zap size={12} className="text-banana" />
                        自定义参数
                        {Object.keys(params.customParams).length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-banana/20 text-banana font-bold">
                            {Object.keys(params.customParams).length}
                          </span>
                        )}
                      </span>
                      <motion.div
                        animate={{ rotate: showCustom ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <ChevronRight size={12} className="rotate-90" />
                      </motion.div>
                    </motion.button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2 mt-3 pl-1"
                    >
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                        添加自定义参数，将直接传递给 API 请求体。适用于模型特有的参数。
                      </p>
                      {Object.entries(params.customParams).map(([key, val]) => (
                        <motion.div
                          key={key}
                          className="flex items-center gap-1.5 bg-muted/30 rounded-lg p-2"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          layout
                        >
                          <span className="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">{key}</span>
                          <span className="text-[10px] text-muted-foreground">=</span>
                          <span className="text-[10px] font-mono flex-1 truncate">{val}</span>
                          <motion.button
                            onClick={() => removeCustomParam(key)}
                            className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                            whileTap={{ scale: 0.8 }}
                          >
                            <X size={10} className="text-muted-foreground hover:text-destructive" />
                          </motion.button>
                        </motion.div>
                      ))}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customKey}
                          onChange={(e) => setCustomKey(e.target.value)}
                          placeholder="参数名"
                          className="flex-1 px-2 py-1.5 text-[10px] rounded-lg bg-muted/40 border border-border/50 focus:border-primary/50 focus:outline-none font-mono transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && addCustomParam()}
                        />
                        <input
                          type="text"
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value)}
                          placeholder="值"
                          className="flex-1 px-2 py-1.5 text-[10px] rounded-lg bg-muted/40 border border-border/50 focus:border-primary/50 focus:outline-none font-mono transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && addCustomParam()}
                        />
                        <motion.button
                          className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0 disabled:opacity-40"
                          onClick={addCustomParam}
                          disabled={!customKey.trim()}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus size={10} className="text-primary" />
                        </motion.button>
                      </div>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Quick info */}
                <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ImageIcon size={10} className="text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-display">当前配置摘要</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div className="text-[10px]"><span className="text-muted-foreground">尺寸：</span><span className="font-mono">{params.width}x{params.height}</span></div>
                    <div className="text-[10px]"><span className="text-muted-foreground">步数：</span><span className="font-mono">{params.steps}</span></div>
                    <div className="text-[10px]"><span className="text-muted-foreground">CFG：</span><span className="font-mono">{params.cfgScale}</span></div>
                    <div className="text-[10px]"><span className="text-muted-foreground">种子：</span><span className="font-mono">{params.seed === -1 ? '随机' : params.seed}</span></div>
                    <div className="text-[10px]"><span className="text-muted-foreground">采样器：</span><span className="font-mono text-[9px]">{params.sampler}</span></div>
                    <div className="text-[10px]"><span className="text-muted-foreground">批量：</span><span className="font-mono">{params.batchSize}</span></div>
                  </div>
                </div>

              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
