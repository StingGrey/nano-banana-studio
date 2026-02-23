/**
 * SettingsDialog: Kawaii Bubble Pop Design — Nano Banana Studio
 * Full API configuration management dialog
 * 
 * 支持 OpenAI / Gemini / Claude 三种 API 格式
 * 每种格式显示对应的官方端点提示和推荐模型
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, TestTube, Check, AlertCircle,
  Globe, Key, Server, Cpu, Copy, Eye, EyeOff, Info, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Dialog */}
        <motion.div
          className="relative w-full max-w-2xl max-h-[85vh] glass-card overflow-hidden flex flex-col"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-3 border-b border-border/30">
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
              className="rounded-full"
              onClick={() => setSettingsOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-5">
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-mono font-bold", info.color)}>
                          {info.label}
                        </span>
                        <input
                          type="text"
                          value={config.name}
                          onChange={(e) => updateApiConfig(config.id, { name: e.target.value })}
                          className="text-sm font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                          style={{ fontFamily: "'Fredoka', sans-serif" }}
                        />
                        {isActive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold">
                            当前使用
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs rounded-full"
                            onClick={() => setActiveConfig(config.id)}
                          >
                            <Check size={12} className="mr-1" />
                            激活
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs rounded-full"
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
                          <span className="ml-1">测试</span>
                        </Button>
                        {apiConfigs.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteApiConfig(config.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Format selection */}
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                        <Globe size={10} />
                        API 格式
                      </Label>
                      <Select
                        value={config.format}
                        onValueChange={(v: ApiFormat) => {
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
                      >
                        <SelectTrigger className="h-9 text-xs rounded-xl bg-muted/30 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {Object.entries(FORMAT_INFO).map(([key, fInfo]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-mono", fInfo.color)}>{fInfo.label}</span>
                                <span>{fInfo.desc}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

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
                            onClick={() => toggleKeyVisibility(config.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/60"
                          >
                            {showKeys[config.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            onClick={() => { navigator.clipboard.writeText(config.apiKey); toast.success('已复制'); }}
                            className="p-1.5 rounded-lg hover:bg-muted/60"
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
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={config.model}
                          onChange={(e) => updateApiConfig(config.id, { model: e.target.value })}
                          placeholder={
                            config.format === 'gemini' ? 'gemini-3-pro-image-preview' :
                            config.format === 'openai' ? 'gpt-image-1' :
                            'claude-3-opus-20240229'
                          }
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none font-mono placeholder:text-muted-foreground/40"
                        />
                      </div>

                      {/* Model suggestions */}
                      {(config.format === 'gemini' || config.format === 'openai') && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-[9px] text-muted-foreground/50 mr-1 leading-6">推荐：</span>
                          {(config.format === 'gemini' ? GEMINI_MODELS : OPENAI_MODELS).map((m) => (
                            <motion.button
                              key={m.value}
                              className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full border transition-all",
                                config.model === m.value
                                  ? "bg-primary/15 border-primary/30 text-primary"
                                  : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                              )}
                              onClick={() => updateApiConfig(config.id, { model: m.value })}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title={m.desc}
                            >
                              {m.label}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Add button */}
              <motion.button
                className="w-full p-4 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground"
                onClick={handleAdd}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Plus size={16} />
                添加新的 API 配置
              </motion.button>
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
