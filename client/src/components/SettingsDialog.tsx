/**
 * SettingsDialog: Kawaii Bubble Pop Design — Nano Banana Studio
 * Full API configuration management dialog
 * 
 * 修复移动端触摸交互：
 * - 使用 onPointerDown + stopPropagation 防止事件冒泡到 backdrop
 * - 所有交互元素使用 native button/select 确保移动端可点击
 * - 弹窗内容使用原生 overflow-y-auto 滚动
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, TestTube, Check, 
  Globe, Key, Server, Cpu, Copy, Eye, EyeOff, Info, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type ApiFormat, GEMINI_MODELS, OPENAI_MODELS } from '@/lib/store';
import { testConnection } from '@/lib/api-service';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const FORMAT_INFO: Record<ApiFormat, {
  label: string;
  color: string;
  desc: string;
  placeholder: string;
  endpoint: string;
  authDesc: string;
  docUrl: string;
}> = {
  gemini: {
    label: 'Gemini',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    desc: 'Google Gemini API（generateContent）',
    placeholder: 'https://generativelanguage.googleapis.com/v1beta',
    endpoint: '/models/{model}:generateContent',
    authDesc: 'x-goog-api-key header 或 ?key= 查询参数',
    docUrl: 'https://ai.google.dev/gemini-api/docs/image-generation',
  },
  openai: {
    label: 'OpenAI',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    desc: 'OpenAI API（/v1/images/generations）',
    placeholder: 'https://api.openai.com/v1',
    endpoint: '/images/generations',
    authDesc: 'Authorization: Bearer {API_KEY}',
    docUrl: 'https://developers.openai.com/api/docs/guides/image-generation',
  },
  claude: {
    label: 'Claude',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    desc: 'Anthropic Claude 兼容格式（/messages）',
    placeholder: 'https://api.anthropic.com/v1',
    endpoint: '/messages',
    authDesc: 'x-api-key header + anthropic-version',
    docUrl: 'https://docs.anthropic.com/en/docs/build-with-claude/vision',
  },
};

const FORMAT_OPTIONS: { value: ApiFormat; label: string }[] = [
  { value: 'gemini', label: 'Gemini - Google Gemini API' },
  { value: 'openai', label: 'OpenAI - Images API' },
  { value: 'claude', label: 'Claude - Anthropic 兼容' },
];

export default function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, apiConfigs, addApiConfig, updateApiConfig, deleteApiConfig, setActiveConfig, activeConfig } = useStudio();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleTest = useCallback(async (config: typeof apiConfigs[0]) => {
    setTestingId(config.id);
    const result = await testConnection(config);
    setTestingId(null);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }, []);

  const handleAdd = useCallback(() => {
    addApiConfig({
      name: `新配置 ${apiConfigs.length + 1}`,
      format: 'gemini',
      baseUrl: FORMAT_INFO.gemini.placeholder,
      apiKey: '',
      model: 'gemini-3-pro-image-preview',
      isActive: true,
    });
  }, [addApiConfig, apiConfigs.length]);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!settingsOpen) return null;

  return (
    <AnimatePresence>
      {/* Full-screen overlay */}
      <motion.div
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop - clicking closes dialog */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        />

        {/* Dialog container - centered */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            className="relative w-full max-w-2xl max-h-[85vh] glass-card flex flex-col pointer-events-auto"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3 border-b border-border/30 shrink-0">
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                  API 配置管理
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  配置你的 AI 图片生成 API，支持 Gemini、OpenAI、Claude 格式
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full shrink-0"
                onClick={() => setSettingsOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>

            {/* Scrollable content - native scroll for mobile touch */}
            <div
              className="flex-1 overflow-y-auto p-5"
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              <div className="space-y-4">
                {apiConfigs.map((config, idx) => {
                  const info = FORMAT_INFO[config.format];
                  const isActive = activeConfig?.id === config.id;

                  return (
                    <motion.div
                      key={config.id}
                      className={cn(
                        "glass-card p-4 space-y-3 transition-all",
                        isActive && "ring-2 ring-primary/30"
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      layout
                    >
                      {/* Config header */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0", info.color)}>
                            {info.label}
                          </span>
                          <input
                            type="text"
                            value={config.name}
                            onChange={(e) => updateApiConfig(config.id, { name: e.target.value })}
                            className="text-sm font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 min-w-0 flex-1"
                            style={{ fontFamily: "'Fredoka', sans-serif" }}
                          />
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold shrink-0">
                              当前使用
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              className="h-7 px-2 text-xs rounded-full bg-transparent hover:bg-muted/60 transition-colors flex items-center gap-1"
                              onClick={() => setActiveConfig(config.id)}
                            >
                              <Check size={12} />
                              激活
                            </button>
                          )}
                          <button
                            type="button"
                            className="h-7 px-2 text-xs rounded-full bg-transparent hover:bg-muted/60 transition-colors flex items-center gap-1 disabled:opacity-40"
                            onClick={() => handleTest(config)}
                            disabled={testingId === config.id || !config.baseUrl || !config.apiKey}
                          >
                            {testingId === config.id ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <TestTube size={12} />
                              </motion.div>
                            ) : (
                              <TestTube size={12} />
                            )}
                            测试
                          </button>
                          {apiConfigs.length > 1 && (
                            <button
                              type="button"
                              className="h-7 w-7 rounded-full bg-transparent hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center justify-center"
                              onClick={() => deleteApiConfig(config.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Format selection - native select for mobile */}
                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Globe size={10} />
                          API 格式
                        </Label>
                        <select
                          value={config.format}
                          onChange={(e) => {
                            const v = e.target.value as ApiFormat;
                            const newInfo = FORMAT_INFO[v];
                            const defaultModel = v === 'gemini' ? 'gemini-3-pro-image-preview'
                              : v === 'openai' ? 'gpt-image-1'
                              : 'claude-3-opus-20240229';
                            updateApiConfig(config.id, {
                              format: v,
                              baseUrl: newInfo.placeholder,
                              model: defaultModel,
                            });
                          }}
                          className="w-full h-9 px-3 text-xs rounded-xl bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none appearance-auto"
                        >
                          {FORMAT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        {/* Format info box */}
                        <div className="mt-2 p-2.5 rounded-xl bg-muted/20 border border-border/20 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Info size={10} className="text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground">
                              端点：<span className="font-mono">{info.endpoint}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Key size={10} className="text-muted-foreground shrink-0" />
                            <span className="text-[10px] text-muted-foreground">
                              认证：{info.authDesc}
                            </span>
                          </div>
                          <a
                            href={info.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                          >
                            <ExternalLink size={9} />
                            查看官方文档
                          </a>
                        </div>
                      </div>

                      {/* Base URL */}
                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Server size={10} />
                          API 地址（Base URL）
                        </Label>
                        <input
                          type="text"
                          value={config.baseUrl}
                          onChange={(e) => updateApiConfig(config.id, { baseUrl: e.target.value })}
                          placeholder={info.placeholder}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none font-mono placeholder:text-muted-foreground/40"
                        />
                        <p className="text-[9px] text-muted-foreground/50 mt-1">
                          {config.format === 'gemini'
                            ? '完整请求 URL = Base URL + /models/{模型名}:generateContent?key={API Key}'
                            : config.format === 'openai'
                            ? '完整请求 URL = Base URL + /images/generations'
                            : '完整请求 URL = Base URL + /messages'
                          }
                        </p>
                      </div>

                      {/* API Key */}
                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Key size={10} />
                          API Key
                        </Label>
                        <div className="relative">
                          <input
                            type={showKeys[config.id] ? 'text' : 'password'}
                            value={config.apiKey}
                            onChange={(e) => updateApiConfig(config.id, { apiKey: e.target.value })}
                            placeholder={
                              config.format === 'gemini' ? 'AIza...' :
                              config.format === 'openai' ? 'sk-...' :
                              'sk-ant-...'
                            }
                            className="w-full px-3 py-2 pr-16 text-xs rounded-xl bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none font-mono placeholder:text-muted-foreground/40"
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => toggleKeyVisibility(config.id)}
                              className="p-1.5 rounded-lg hover:bg-muted/60 active:bg-muted/80"
                            >
                              {showKeys[config.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(config.apiKey); toast.success('已复制'); }}
                              className="p-1.5 rounded-lg hover:bg-muted/60 active:bg-muted/80"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Model */}
                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Cpu size={10} />
                          模型名称
                        </Label>
                        <input
                          type="text"
                          value={config.model}
                          onChange={(e) => updateApiConfig(config.id, { model: e.target.value })}
                          placeholder={
                            config.format === 'gemini' ? 'gemini-3-pro-image-preview' :
                            config.format === 'openai' ? 'gpt-image-1' :
                            'claude-3-opus-20240229'
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none font-mono placeholder:text-muted-foreground/40"
                        />

                        {/* Model suggestions - native buttons for mobile */}
                        {(config.format === 'gemini' || config.format === 'openai') && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="text-[9px] text-muted-foreground/50 mr-1 leading-6">推荐：</span>
                            {(config.format === 'gemini' ? GEMINI_MODELS : OPENAI_MODELS).map((m) => (
                              <button
                                key={m.value}
                                type="button"
                                className={cn(
                                  "text-[10px] px-2.5 py-1 rounded-full border transition-all active:scale-95",
                                  config.model === m.value
                                    ? "bg-primary/15 border-primary/30 text-primary font-bold"
                                    : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/60 active:bg-muted/80"
                                )}
                                onClick={() => updateApiConfig(config.id, { model: m.value })}
                                title={m.desc}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Add button */}
                <button
                  type="button"
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground"
                  onClick={handleAdd}
                >
                  <Plus size={16} />
                  添加新的 API 配置
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
