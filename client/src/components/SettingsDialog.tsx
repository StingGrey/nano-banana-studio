/**
 * SettingsDialog — Nano Banana Studio
 * Full API configuration management dialog
 */

import { useStudio } from '@/contexts/StudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, TestTube, Check,
  Globe, Key, Server, Cpu, Copy, Eye, EyeOff, Info, ExternalLink, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type ApiFormat, GEMINI_MODELS, OPENAI_MODELS, resolveRequestFormat } from '@/lib/store';
import { testConnection } from '@/lib/api-service';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Link } from 'lucide-react';

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
  vertex: {
    label: 'Vertex',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    desc: 'Google Vertex AI Gemini（generateContent）',
    placeholder: 'https://aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models',
    endpoint: '/{model}:generateContent',
    authDesc: 'Authorization: Bearer {ACCESS_TOKEN}',
    docUrl: 'https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference',
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
  { value: 'vertex', label: 'Vertex - Google Cloud Vertex AI' },
  { value: 'openai', label: 'OpenAI - Images API' },
  { value: 'claude', label: 'Claude - Anthropic 兼容' },
];

export default function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, apiConfigs, addApiConfig, updateApiConfig, deleteApiConfig, setActiveConfig, activeConfig, availableModels, fetchingModels, refreshModels } = useStudio();
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
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        />

        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-lg shadow-lg flex flex-col pointer-events-auto"
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3 border-b border-border shrink-0">
              <div>
                <h2 className="text-lg font-semibold">
                  API 配置管理
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  配置你的 AI 图片生成 API，支持 Gemini、Vertex、OpenAI、Claude 格式
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md shrink-0"
                onClick={() => setSettingsOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto p-5"
              style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
            >
              <div className="space-y-4">
                {apiConfigs.map((config) => {
                  const info = FORMAT_INFO[config.format];
                  const isActive = activeConfig?.id === config.id;

                  return (
                    <div
                      key={config.id}
                      className={cn(
                        "border border-border rounded-lg p-4 space-y-3 transition-colors",
                        isActive && "ring-2 ring-foreground/20"
                      )}
                    >
                      {/* Config header */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded font-mono font-medium shrink-0", info.color)}>
                            {info.label}
                          </span>
                          <input
                            type="text"
                            value={config.name}
                            onChange={(e) => updateApiConfig(config.id, { name: e.target.value })}
                            className="text-sm font-semibold bg-transparent border-none focus:outline-none focus:ring-0 p-0 min-w-0 flex-1"
                          />
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium shrink-0">
                              当前使用
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              className="h-7 px-2 text-xs rounded-md hover:bg-muted transition-colors flex items-center gap-1"
                              onClick={() => setActiveConfig(config.id)}
                            >
                              <Check size={12} />
                              激活
                            </button>
                          )}
                          <button
                            type="button"
                            className="h-7 px-2 text-xs rounded-md hover:bg-muted transition-colors flex items-center gap-1 disabled:opacity-40"
                            onClick={() => handleTest(config)}
                            disabled={testingId === config.id || !config.baseUrl || !config.apiKey}
                          >
                            {testingId === config.id ? (
                              <TestTube size={12} className="animate-spin" />
                            ) : (
                              <TestTube size={12} />
                            )}
                            测试
                          </button>
                          {apiConfigs.length > 1 && (
                            <button
                              type="button"
                              className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center justify-center"
                              onClick={() => deleteApiConfig(config.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Format selection */}
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
                              : v === 'vertex' ? 'gemini-2.5-flash-image'
                              : v === 'openai' ? 'gpt-image-1'
                              : 'claude-3-opus-20240229';
                            updateApiConfig(config.id, {
                              format: v,
                              baseUrl: newInfo.placeholder,
                              model: defaultModel,
                            });
                          }}
                          className="w-full h-9 px-3 text-xs rounded-md bg-muted/30 border border-border focus:border-foreground/30 focus:outline-none appearance-auto"
                        >
                          {FORMAT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        <div className="mt-2 p-2.5 rounded-md bg-muted/30 border border-border space-y-1">
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
                            className="flex items-center gap-1 text-[10px] text-foreground/60 hover:text-foreground hover:underline"
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
                          className="w-full px-3 py-2 text-xs rounded-md bg-muted/30 border border-border focus:border-foreground/30 focus:outline-none font-mono placeholder:text-muted-foreground/40"
                        />
                      </div>

                      {/* Custom Endpoint */}
                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                          <Link size={10} />
                          端点路径（可选，留空自动推断）
                        </Label>
                        <input
                          type="text"
                          value={config.endpoint || ''}
                          onChange={(e) => updateApiConfig(config.id, { endpoint: e.target.value || undefined })}
                          placeholder={(() => {
                            const rf = resolveRequestFormat(config);
                            return rf === 'gemini' ? '/models/{model}:generateContent?key={apiKey}'
                              : rf === 'vertex' ? '/{model}:generateContent'
                              : rf === 'openai' ? '/images/generations'
                              : '/messages';
                          })()}
                          className="w-full px-3 py-2 text-xs rounded-md bg-muted/30 border border-border focus:border-foreground/30 focus:outline-none font-mono placeholder:text-muted-foreground/40"
                        />
                        <p className="text-[9px] text-muted-foreground/50 mt-1">
                          支持 <code className="text-[8px] bg-muted px-1 rounded">{'{model}'}</code> 和 <code className="text-[8px] bg-muted px-1 rounded">{'{apiKey}'}</code> 变量。留空时按模型名自动选择端点格式
                        </p>
                        {(() => {
                          const rf = resolveRequestFormat(config);
                          if (rf !== config.format) {
                            return (
                              <p className="text-[9px] mt-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                检测到模型 <span className="font-mono font-medium">{config.model}</span> 为 <span className="font-medium">{rf === 'gemini' ? 'Gemini' : rf === 'vertex' ? 'Vertex' : rf === 'openai' ? 'OpenAI' : 'Claude'}</span> 格式，请求体将自动使用 {rf === 'gemini' ? 'Gemini' : rf === 'vertex' ? 'Vertex' : rf === 'openai' ? 'OpenAI' : 'Claude'} 格式构建
                              </p>
                            );
                          }
                          return null;
                        })()}
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
                              config.format === 'vertex' ? 'ya29.... (OAuth Access Token)' :
                              config.format === 'openai' ? 'sk-...' :
                              'sk-ant-...'
                            }
                            className="w-full px-3 py-2 pr-16 text-xs rounded-md bg-muted/30 border border-border focus:border-foreground/30 focus:outline-none font-mono placeholder:text-muted-foreground/40"
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => toggleKeyVisibility(config.id)}
                              className="p-1.5 rounded hover:bg-muted"
                            >
                              {showKeys[config.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(config.apiKey); toast.success('已复制'); }}
                              className="p-1.5 rounded hover:bg-muted"
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
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={config.model}
                            onChange={(e) => updateApiConfig(config.id, { model: e.target.value })}
                            placeholder={
                              config.format === 'gemini' ? 'gemini-3-pro-image-preview' :
                              config.format === 'vertex' ? 'gemini-2.5-flash-image' :
                              config.format === 'openai' ? 'gpt-image-1' :
                              'claude-3-opus-20240229'
                            }
                            className="flex-1 px-3 py-2 text-xs rounded-md bg-muted/30 border border-border focus:border-foreground/30 focus:outline-none font-mono placeholder:text-muted-foreground/40"
                          />
                          <button
                            type="button"
                            className="h-9 px-2.5 rounded-md border border-border hover:bg-muted transition-colors flex items-center gap-1 text-xs disabled:opacity-40 shrink-0"
                            onClick={() => refreshModels(config.id)}
                            disabled={fetchingModels[config.id] || !config.baseUrl || !config.apiKey}
                            title="从 API 获取可用模型"
                          >
                            <RefreshCw size={12} className={fetchingModels[config.id] ? "animate-spin" : ""} />
                          </button>
                        </div>

                        {availableModels[config.id] && availableModels[config.id].length > 0 ? (
                          <div className="mt-2">
                            <span className="text-[9px] text-muted-foreground/50 leading-6 flex items-center gap-1 mb-1">
                              <RefreshCw size={8} />
                              从 API 获取（{availableModels[config.id].length} 个模型）
                            </span>
                            <div className="max-h-[120px] overflow-y-auto rounded-md border border-border" style={{ WebkitOverflowScrolling: 'touch' }}>
                              {availableModels[config.id].map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  className={cn(
                                    "w-full text-left px-2.5 py-1.5 text-[10px] transition-colors border-b border-border last:border-b-0",
                                    config.model === m.id
                                      ? "bg-muted text-foreground font-medium"
                                      : "hover:bg-muted/40 text-muted-foreground"
                                  )}
                                  onClick={() => updateApiConfig(config.id, { model: m.id })}
                                >
                                  <span className="font-mono">{m.id}</span>
                                  {m.desc && <span className="ml-1.5 text-[9px] text-muted-foreground/60">— {m.desc}</span>}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          (config.format === 'gemini' || config.format === 'vertex' || config.format === 'openai') && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="text-[9px] text-muted-foreground/50 mr-1 leading-6">推荐：</span>
                              {((config.format === 'gemini' || config.format === 'vertex') ? GEMINI_MODELS : OPENAI_MODELS).map((m) => (
                                <button
                                  key={m.value}
                                  type="button"
                                  className={cn(
                                    "text-[10px] px-2.5 py-1 rounded-md border transition-colors",
                                    config.model === m.value
                                      ? "bg-muted border-border text-foreground font-medium"
                                      : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                                  )}
                                  onClick={() => updateApiConfig(config.id, { model: m.value })}
                                  title={m.desc}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          )
                        )}

                        {fetchingModels[config.id] && (
                          <p className="text-[9px] text-muted-foreground mt-1 animate-pulse">
                            正在从 API 获取模型列表...
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add button */}
                <button
                  type="button"
                  className="w-full p-4 rounded-lg border-2 border-dashed border-border hover:border-foreground/20 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground"
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
