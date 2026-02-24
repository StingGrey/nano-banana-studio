/**
 * ParamsPanel — Nano Banana Studio
 * Right panel with rich customization options for image generation
 *
 * 根据当前 API 格式动态显示对应的官方参数：
 * - Gemini: aspectRatio, imageSize, responseModalities
 * - OpenAI: size, quality, n, background, output_format, compression, moderation
 * - Claude: 通用参数 + 自定义参数
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, RotateCcw, Dice5,
  SlidersHorizontal, Palette, Maximize2, Layers, Wand2, Plus, X,
  Zap, Image as ImageIcon, Eye, FileType, Shield, MonitorSmartphone,
  Ratio, Gem, MessageSquare, Code2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  SAMPLERS, STYLES,
  type ParamDef,
  getModelParamProfile,
  resolveRequestFormat,
} from '@/lib/store';
import { previewRequest } from '@/lib/api-service';
import { useState, useMemo, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useMobile';

function SectionHeader({ icon: Icon, title, badge, children }: { icon: any; title: string; badge?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-wider text-foreground/70">
          {title}
        </span>
        {badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
            {badge}
          </span>
        )}
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
        <span className="text-xs font-mono font-medium text-foreground/80 bg-muted px-2 py-0.5 rounded min-w-[3rem] text-center">
          {typeof value === 'number' && step < 1 ? value.toFixed(2) : value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function OptionGrid<T extends string>({ options, value, onChange, cols = 2 }: {
  options: { value: T; label: string; desc?: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className={cn("grid gap-1.5", cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4")}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={cn(
            "p-2 rounded-md text-left transition-colors border",
            value === opt.value
              ? "bg-muted border-border"
              : "bg-transparent border-transparent hover:bg-muted/60"
          )}
          onClick={() => onChange(opt.value)}
        >
          <div className="text-xs font-medium">{opt.label}</div>
          {opt.desc && <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{opt.desc}</div>}
        </button>
      ))}
    </div>
  );
}

// 图标映射
const ICON_MAP: Record<string, any> = {
  Ratio, Gem, MessageSquare, Maximize2, Sparkles, Layers,
  MonitorSmartphone, FileType, Shield, Wand2, SlidersHorizontal,
};

function getIcon(name?: string) {
  return name ? ICON_MAP[name] || SlidersHorizontal : SlidersHorizontal;
}

/**
 * 动态参数渲染 — 由模型决定显示哪些参数
 */
function DynamicModelParams({ params, updateParams, modelId, format }: {
  params: any; updateParams: (u: any) => void; modelId: string; format: string;
}) {
  const profile = useMemo(
    () => getModelParamProfile(modelId, format as any),
    [modelId, format],
  );

  // 按 sectionTitle 分组
  const sections = useMemo(() => {
    const map = new Map<string, { title: string; icon?: string; badge?: string; params: ParamDef[] }>();
    for (const p of profile.params) {
      const key = p.sectionTitle || p.label;
      if (!map.has(key)) {
        map.set(key, { title: key, icon: p.icon, badge: p.sectionBadge, params: [] });
      }
      map.get(key)!.params.push(p);
    }
    return Array.from(map.values());
  }, [profile]);

  const mainSections = sections.filter(s => s.title !== '高级选项');
  const advancedSection = sections.find(s => s.title === '高级选项');
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <>
      {mainSections.map((section, sIdx) => (
        <div key={section.title}>
          <SectionHeader icon={getIcon(section.icon)} title={section.title} badge={section.badge} />
          {section.params.length === 2 && section.params.every(p => p.type === 'number') ? (
            <div className="grid grid-cols-2 gap-2">
              {section.params.map(p => (
                <div key={p.key}>
                  <Label className="text-[10px] text-muted-foreground">{p.label}</Label>
                  <input
                    type="number"
                    value={(params as any)[p.key]}
                    onChange={(e) => updateParams({ [p.key]: parseInt(e.target.value) || 0 })}
                    min={p.min} max={p.max}
                    className="w-full mt-1 px-2 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:border-foreground/30 focus:outline-none font-mono transition-colors"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {section.params.map(p => (
                <DynamicParamControl key={p.key} def={p} value={(params as any)[p.key]} onChange={(v) => updateParams({ [p.key]: v })} params={params} updateParams={updateParams} />
              ))}
            </div>
          )}
          {section.params[0]?.description && (
            <p className="text-[9px] text-muted-foreground/50 mt-1.5 leading-relaxed">
              {section.params[0].description}
            </p>
          )}
        </div>
      ))}

      {advancedSection && (
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between h-9 px-3 text-xs rounded-md hover:bg-muted transition-colors">
              <span className="flex items-center gap-2 font-medium">
                <Layers size={12} className="text-muted-foreground" />
                高级选项
              </span>
              <ChevronRight size={12} className={cn("transition-transform", showAdvanced && "rotate-90")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 mt-3 pl-1">
              {advancedSection.params.map(p => (
                <DynamicParamControl key={p.key} def={p} value={(params as any)[p.key]} onChange={(v) => updateParams({ [p.key]: v })} params={params} updateParams={updateParams} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </>
  );
}

/**
 * 单个参数的动态控件
 */
function DynamicParamControl({ def, value, onChange, params, updateParams }: {
  def: ParamDef; value: any; onChange: (v: any) => void; params: any; updateParams: (u: any) => void;
}) {
  switch (def.type) {
    case 'grid': {
      if (def.key === 'aspectRatio') {
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {(def.options || []).map((ar) => {
                const [w, h] = ar.value.split(':').map(Number);
                const hasNumericRatio = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
                const ratio = hasNumericRatio ? w / h : 1;
                const isAuto = ar.value === 'auto';
                const isCustom = ar.value === 'custom';

                return (
                  <button
                    key={ar.value}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md transition-colors border text-left",
                      value === ar.value
                        ? "bg-muted border-border"
                        : "bg-transparent border-transparent hover:bg-muted/60"
                    )}
                    onClick={() => onChange(ar.value)}
                  >
                    <div className="w-6 h-6 rounded bg-muted border border-border flex items-center justify-center shrink-0">
                      {isAuto ? (
                        <Sparkles size={12} className="text-muted-foreground" />
                      ) : isCustom ? (
                        <SlidersHorizontal size={12} className="text-muted-foreground" />
                      ) : (
                        <div
                          className={cn(
                            "border-2 rounded-sm transition-colors",
                            value === ar.value ? "border-foreground" : "border-muted-foreground/30"
                          )}
                          style={{
                            width: `${Math.min(16, 16 * (ratio >= 1 ? 1 : ratio))}px`,
                            height: `${Math.min(16, 16 * (ratio <= 1 ? 1 : 1 / ratio))}px`,
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-medium leading-none">{ar.label}</div>
                      {ar.desc && <div className="text-[9px] text-muted-foreground mt-1 leading-tight">{ar.desc}</div>}
                    </div>
                  </button>
                );
              })}
            </div>

            {value === 'custom' && (
              <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-center bg-muted/20 rounded-md p-2.5 border border-border">
                <input
                  type="number"
                  min={1}
                  value={params.customAspectRatioWidth || 1}
                  onChange={(e) => updateParams({ customAspectRatioWidth: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-2 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:border-foreground/30 focus:outline-none font-mono transition-colors"
                />
                <span className="text-xs text-muted-foreground font-mono">:</span>
                <input
                  type="number"
                  min={1}
                  value={params.customAspectRatioHeight || 1}
                  onChange={(e) => updateParams({ customAspectRatioHeight: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-2 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:border-foreground/30 focus:outline-none font-mono transition-colors"
                />
              </div>
            )}
          </div>
        );
      }

      if (def.key === 'openaiOutputFormat') {
        return (
          <>
            <OptionGrid options={def.options || []} value={value} onChange={onChange} cols={def.cols || 2} />
            {(params.openaiOutputFormat === 'jpeg' || params.openaiOutputFormat === 'webp') && (
              <div className="mt-3">
                <ParamSlider
                  label="压缩质量"
                  value={params.openaiOutputCompression}
                  onChange={(v) => updateParams({ openaiOutputCompression: v })}
                  min={0} max={100} unit="%"
                />
              </div>
            )}
          </>
        );
      }

      return <OptionGrid options={def.options || []} value={value} onChange={onChange} cols={def.cols || 2} />;
    }

    case 'slider':
      return (
        <ParamSlider
          label={def.label}
          value={value}
          onChange={onChange}
          min={def.min ?? 0} max={def.max ?? 100}
          step={def.step} unit={def.unit}
        />
      );

    case 'number': {
      if (def.key === 'seed') {
        return (
          <div>
            <Label className="text-xs text-muted-foreground">{def.label}</Label>
            <div className="flex gap-1 mt-1">
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="flex-1 px-2 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:border-foreground/30 focus:outline-none font-mono transition-colors"
                placeholder={def.description || '-1 为随机'}
              />
              <button
                className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                onClick={() => onChange(Math.floor(Math.random() * 2147483647))}
                title="随机种子"
              >
                <Dice5 size={12} />
              </button>
            </div>
          </div>
        );
      }

      if (def.key === 'sampler') {
        return (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{def.label || '采样器'}</Label>
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="h-8 text-xs rounded-md border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {SAMPLERS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      return (
        <div>
          <Label className="text-[10px] text-muted-foreground">{def.label}</Label>
          <input
            type="number"
            value={value}
            onChange={(e) => {
              let v = parseInt(e.target.value) || 0;
              if (def.min !== undefined) v = Math.max(def.min, v);
              if (def.max !== undefined) v = Math.min(def.max, v);
              onChange(v);
            }}
            min={def.min} max={def.max}
            className="w-full mt-1 px-2 py-1.5 text-xs rounded-md bg-muted/40 border border-border focus:border-foreground/30 focus:outline-none font-mono transition-colors"
          />
        </div>
      );
    }

    default:
      return null;
  }
}

/**
 * 模型驱动的配置摘要
 */
function ModelParamSummary({ params, modelId, format }: {
  params: any; modelId: string; format: string;
}) {
  const profile = useMemo(
    () => getModelParamProfile(modelId, format as any),
    [modelId, format],
  );

  return (
    <div className="p-3 rounded-md bg-muted/30 border border-border">
      <div className="flex items-center gap-1.5 mb-2">
        <ImageIcon size={10} className="text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">当前配置摘要</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {modelId && (
          <div className="text-[10px] col-span-2"><span className="text-muted-foreground">模型：</span><span className="font-mono text-[9px]">{modelId}</span></div>
        )}
        {profile.params.filter(p => p.sectionTitle !== '高级选项').map(p => (
          <div key={p.key} className="text-[10px]">
            <span className="text-muted-foreground">{p.label}：</span>
            <span className="font-mono">{String((params as any)[p.key])}</span>
          </div>
        ))}
        {Object.keys(params.customParams).length > 0 && (
          <div className="text-[10px] col-span-2"><span className="text-muted-foreground">自定义：</span><span className="font-mono">{Object.keys(params.customParams).length} 个参数</span></div>
        )}
      </div>
    </div>
  );
}

export default function ParamsPanel() {
  const { rightPanelOpen, setRightPanelOpen, params, updateParams, resetParams, activeConfig } = useStudio();
  const [showCustom, setShowCustom] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setShowCustom(false);
      setShowPreview(false);
    }
  }, [isMobile]);

  const authFormat = activeConfig?.format || 'gemini';
  const format = activeConfig ? resolveRequestFormat(activeConfig) : authFormat;

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

  const requestPreview = activeConfig ? previewRequest(params, activeConfig) : null;

  return (
    <>
      {/* Toggle button */}
      <motion.button
        className={cn(
          "fixed top-4 z-50 p-2 rounded-md border border-border bg-card hover:bg-muted transition-colors",
          rightPanelOpen ? "right-[332px]" : "right-4"
        )}
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 w-[328px] z-40 flex flex-col bg-card border-l border-border"
          >
            {/* Header */}
            <div className="p-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-muted-foreground" />
                <h2 className="font-semibold text-sm">参数设置</h2>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded font-mono font-medium",
                  format === 'gemini' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  format === 'openai' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {format === 'gemini' ? 'Gemini' : format === 'openai' ? 'OpenAI' : 'Claude'}
                </span>
                {format !== authFormat && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-mono">
                    模型推断
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs rounded-md hover:bg-destructive/10 hover:text-destructive"
                onClick={resetParams}
              >
                <RotateCcw size={12} className="mr-1" />
                重置
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <div className="space-y-5 pb-6">

                {/* Style Preset */}
                <div>
                  <SectionHeader icon={Palette} title="风格预设" badge="通用" />
                  <div className="grid grid-cols-4 gap-1.5">
                    {STYLES.map((style) => (
                      <button
                        key={style.value}
                        className={cn(
                          "px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors border",
                          params.style === style.value
                            ? "bg-muted border-border text-foreground"
                            : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/60"
                        )}
                        onClick={() => updateParams({ style: style.value })}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground/50 mt-1.5 leading-relaxed">
                    风格会作为提示词前缀自动拼接到你的描述中
                  </p>
                </div>

                {/* 模型驱动的参数渲染 */}
                <DynamicModelParams params={params} updateParams={updateParams} modelId={activeConfig?.model || ''} format={format} />

                {/* 自定义参数 */}
                <Collapsible open={showCustom} onOpenChange={setShowCustom}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between h-9 px-3 text-xs rounded-md hover:bg-muted transition-colors">
                      <span className="flex items-center gap-2 font-medium">
                        <Zap size={12} className="text-muted-foreground" />
                        自定义参数
                        {Object.keys(params.customParams).length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {Object.keys(params.customParams).length}
                          </span>
                        )}
                      </span>
                      <ChevronRight size={12} className={cn("transition-transform", showCustom && "rotate-90")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 mt-3 pl-1">
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                        {format === 'gemini'
                          ? '自定义参数将合并到请求体。支持嵌套路径如 "generationConfig.temperature"'
                          : format === 'openai'
                          ? '自定义参数将直接添加到请求体顶层。值会自动尝试 JSON 解析。'
                          : '自定义参数将直接添加到请求体。适用于第三方服务的特有参数。'
                        }
                      </p>
                      {Object.entries(params.customParams).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center gap-1.5 bg-muted/30 rounded-md p-2"
                        >
                          <span className="text-[10px] font-mono font-medium text-foreground px-1.5 py-0.5 bg-muted rounded">{key}</span>
                          <span className="text-[10px] text-muted-foreground">=</span>
                          <span className="text-[10px] font-mono flex-1 truncate">{val}</span>
                          <button
                            onClick={() => removeCustomParam(key)}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <X size={10} className="text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customKey}
                          onChange={(e) => setCustomKey(e.target.value)}
                          placeholder="参数名"
                          className="flex-1 px-2 py-1.5 text-[10px] rounded-md bg-muted/40 border border-border focus:border-foreground/30 focus:outline-none font-mono transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && addCustomParam()}
                        />
                        <input
                          type="text"
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value)}
                          placeholder="值"
                          className="flex-1 px-2 py-1.5 text-[10px] rounded-md bg-muted/40 border border-border focus:border-foreground/30 focus:outline-none font-mono transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && addCustomParam()}
                        />
                        <button
                          className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0 disabled:opacity-40"
                          onClick={addCustomParam}
                          disabled={!customKey.trim()}
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* 请求预览 */}
                <Collapsible open={showPreview} onOpenChange={setShowPreview}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between h-9 px-3 text-xs rounded-md hover:bg-muted transition-colors">
                      <span className="flex items-center gap-2 font-medium">
                        <Code2 size={12} className="text-muted-foreground" />
                        请求预览
                      </span>
                      <ChevronRight size={12} className={cn("transition-transform", showPreview && "rotate-90")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 pl-1">
                      {requestPreview ? (
                        <div className="space-y-2">
                          {requestPreview.requestFormat !== authFormat && (
                            <div className="text-[9px] px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                              认证：{authFormat} / 请求体：{requestPreview.requestFormat}
                            </div>
                          )}
                          <div>
                            <Label className="text-[10px] text-muted-foreground mb-1 block">端点</Label>
                            <div className="text-[9px] font-mono bg-muted p-2 rounded-md break-all leading-relaxed">
                              POST {requestPreview.endpoint}
                            </div>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground mb-1 block">请求体</Label>
                            <pre className="text-[9px] font-mono bg-muted p-2 rounded-md overflow-auto max-h-[200px] leading-relaxed whitespace-pre-wrap break-all">
                              {JSON.stringify(requestPreview.body, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/50">请先配置 API</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Quick info */}
                <ModelParamSummary params={params} modelId={activeConfig?.model || ''} format={format} />

              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
