/**
 * Store — Nano Banana Studio
 * Central state management using React context + localStorage persistence
 * 
 * API 参数严格遵循各平台官方文档：
 * - Gemini: https://ai.google.dev/gemini-api/docs/image-generation
 * - OpenAI: https://developers.openai.com/api/docs/guides/image-generation
 * - Claude: https://docs.anthropic.com/en/docs/build-with-claude/vision
 * - Vertex AI: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference
 */

export type ApiFormat = 'openai' | 'gemini' | 'claude' | 'vertex';

export interface ApiConfig {
  id: string;
  name: string;
  format: ApiFormat;       // 认证格式（决定请求头）
  baseUrl: string;
  apiKey: string;
  model: string;
  endpoint?: string;       // 自定义端点路径（为空时自动推断）
  isActive: boolean;
}

// === 从 API 获取的模型信息 ===
export interface ModelInfo {
  id: string;          // 模型标识符（如 "gemini-3-pro-image-preview"）
  name: string;        // 显示名称
  desc?: string;       // 描述
  source: 'api' | 'builtin';  // 来源
}

/**
 * 根据模型名称推断实际的请求格式
 * 解决：代理服务用 OpenAI 认证但实际模型是 Gemini 的场景
 * 返回 null 表示未识别，应使用 config.format
 */
export function getEffectiveFormat(modelId: string): ApiFormat | null {
  if (/gemini/i.test(modelId)) return 'gemini';
  if (/gpt-image|dall-e|openai/i.test(modelId)) return 'openai';
  if (/claude/i.test(modelId)) return 'claude';
  return null;
}

/**
 * 获取最终生效的请求体格式：优先按模型名推断，推断不到则用 config.format
 */
export function resolveRequestFormat(config: ApiConfig): ApiFormat {
  return getEffectiveFormat(config.model) ?? config.format;
}

// === 模型参数定义 ===
export type ParamType = 'grid' | 'slider' | 'number';

export interface ParamDef {
  key: string;           // 对应 GenerationParams 中的字段
  label: string;         // 显示名称
  type: ParamType;
  icon?: string;         // lucide 图标名
  sectionTitle?: string; // 所在分组标题（同标题的参数会归入同一组）
  sectionBadge?: string; // 分组角标
  description?: string;  // 参数说明
  // grid / select 类型
  options?: { value: string; label: string; desc?: string }[];
  cols?: number;
  // slider / number 类型
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  // 默认值
  defaultValue?: any;
}

export interface ModelParamProfile {
  params: ParamDef[];
}

export interface GenerationParams {
  prompt: string;
  negativePrompt: string;
  referenceImages: { name: string; type: string; dataUrl: string }[];

  // === Gemini 官方参数 ===
  // aspectRatio: "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
  aspectRatio: string;
  // 自定义比例（aspectRatio = 'custom' 时使用）
  customAspectRatioWidth: number;
  customAspectRatioHeight: number;
  // imageSize: "1K", "2K", "4K" (仅 gemini-3-pro-image-preview)
  imageSize: string;
  // responseModalities: ['TEXT', 'IMAGE'] 或 ['IMAGE']
  responseModalities: string;

  // === OpenAI 官方参数 ===
  // size: "1024x1024", "1536x1024", "1024x1536", "auto"
  openaiSize: string;
  // quality: "low", "medium", "high", "auto"
  openaiQuality: string;
  // n: 生成数量 1-10
  openaiN: number;
  // background: "transparent", "opaque", "auto"
  openaiBackground: string;
  // output_format: "png", "jpeg", "webp"
  openaiOutputFormat: string;
  // output_compression: 0-100
  openaiOutputCompression: number;
  // moderation: "auto", "low"
  openaiModeration: string;

  // === 通用并发参数 ===
  // 通过并发请求实现一次生成多张（适用于不支持 n 的 API）
  concurrentGenerations: number;

  // === 通用 / Stable Diffusion 兼容参数 ===
  // 这些参数用于兼容 SD 类 API 或自定义端点
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  seed: number;
  sampler: string;
  batchSize: number;
  clipSkip: number;
  denoisingStrength: number;
  hiresUpscale: number;
  hiresSteps: number;

  // 风格预设（作为提示词前缀）
  style: string;

  // Extra custom params - 直接传递给 API 请求体
  customParams: Record<string, string>;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  params: Partial<GenerationParams>;
  timestamp: number;
  apiConfigId: string;
  isFavorite: boolean;
  revisedPrompt?: string;
}

export const DEFAULT_API_CONFIGS: ApiConfig[] = [
  {
    id: 'default-gemini',
    name: 'Nano Banana Pro (Gemini)',
    format: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: '',
    model: 'gemini-3-pro-image-preview',
    isActive: true,
  },
];

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  prompt: '',
  negativePrompt: '',
  referenceImages: [],

  // Gemini defaults
  aspectRatio: '1:1',
  customAspectRatioWidth: 1,
  customAspectRatioHeight: 1,
  imageSize: '1K',
  responseModalities: 'TEXT_AND_IMAGE',

  // OpenAI defaults
  openaiSize: '1024x1024',
  openaiQuality: 'auto',
  openaiN: 1,
  openaiBackground: 'auto',
  openaiOutputFormat: 'png',
  openaiOutputCompression: 100,
  openaiModeration: 'auto',
  concurrentGenerations: 1,

  // SD-compatible defaults
  width: 1024,
  height: 1024,
  steps: 30,
  cfgScale: 7,
  seed: -1,
  sampler: 'Euler a',
  batchSize: 1,
  clipSkip: 1,
  denoisingStrength: 0.7,
  hiresUpscale: 1.5,
  hiresSteps: 15,

  style: 'none',
  customParams: {},
};

// === Gemini 官方支持的采样器（无此参数，Gemini 不支持） ===
// Gemini 不使用 sampler、steps、cfg_scale 等 SD 参数

// === SD 兼容采样器 ===
export const SAMPLERS = [
  'Euler a', 'Euler', 'LMS', 'Heun', 'DPM2', 'DPM2 a',
  'DPM++ 2S a', 'DPM++ 2M', 'DPM++ SDE', 'DPM++ 2M SDE',
  'DDIM', 'PLMS', 'UniPC',
];

export const STYLES = [
  { value: 'none', label: '无风格' },
  { value: 'anime', label: '动漫' },
  { value: 'photorealistic', label: '写实' },
  { value: 'digital-art', label: '数字艺术' },
  { value: 'oil-painting', label: '油画' },
  { value: 'watercolor', label: '水彩' },
  { value: 'pixel-art', label: '像素风' },
  { value: 'comic', label: '漫画' },
  { value: '3d-render', label: '3D 渲染' },
  { value: 'sketch', label: '素描' },
  { value: 'fantasy', label: '奇幻' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'minimalist', label: '极简' },
  { value: 'surreal', label: '超现实' },
  { value: 'vintage', label: '复古' },
  { value: 'pop-art', label: '波普艺术' },
];

// === Gemini 官方宽高比（来自文档） ===
export const GEMINI_ASPECT_RATIOS = [
  { value: 'auto', label: '自动', desc: '由模型自动判断构图比例' },
  { value: '1:1', label: '1:1' },
  { value: '2:3', label: '2:3' },
  { value: '3:2', label: '3:2' },
  { value: '3:4', label: '3:4' },
  { value: '4:3', label: '4:3' },
  { value: '4:5', label: '4:5' },
  { value: '5:4', label: '5:4' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
  { value: '21:9', label: '21:9' },
  { value: 'custom', label: '自定义', desc: '手动输入宽高比例' },
];

// === Gemini 官方图片尺寸（仅 gemini-3-pro-image-preview） ===
export const GEMINI_IMAGE_SIZES = [
  { value: '1K', label: '1K', desc: '标准分辨率' },
  { value: '2K', label: '2K', desc: '高分辨率' },
  { value: '4K', label: '4K', desc: '超高分辨率' },
];

// === Gemini 响应模态 ===
export const GEMINI_RESPONSE_MODALITIES = [
  { value: 'TEXT_AND_IMAGE', label: '文本 + 图片', desc: '返回图片和描述文本' },
  { value: 'IMAGE_ONLY', label: '仅图片', desc: '只返回生成的图片' },
];

// === OpenAI 官方尺寸（来自文档） ===
export const OPENAI_SIZES = [
  { value: '1024x1024', label: '1024x1024', desc: '正方形' },
  { value: '1536x1024', label: '1536x1024', desc: '横版' },
  { value: '1024x1536', label: '1024x1536', desc: '竖版' },
  { value: 'auto', label: '自动', desc: '模型自动选择' },
];

// === OpenAI 官方质量选项（来自文档） ===
export const OPENAI_QUALITY_OPTIONS = [
  { value: 'low', label: '低', desc: '快速生成，272 tokens' },
  { value: 'medium', label: '中', desc: '平衡质量，1056 tokens' },
  { value: 'high', label: '高', desc: '最佳质量，4160 tokens' },
  { value: 'auto', label: '自动', desc: '模型自动选择' },
];

// === OpenAI 背景选项 ===
export const OPENAI_BACKGROUND_OPTIONS = [
  { value: 'opaque', label: '不透明', desc: '默认白色背景' },
  { value: 'transparent', label: '透明', desc: '仅 PNG/WebP 格式' },
  { value: 'auto', label: '自动', desc: '模型自动选择' },
];

// === OpenAI 输出格式 ===
export const OPENAI_OUTPUT_FORMATS = [
  { value: 'png', label: 'PNG', desc: '无损，支持透明' },
  { value: 'jpeg', label: 'JPEG', desc: '更快，可压缩' },
  { value: 'webp', label: 'WebP', desc: '高效，支持透明' },
];

// === OpenAI 审核等级 ===
export const OPENAI_MODERATION_OPTIONS = [
  { value: 'auto', label: '标准', desc: '默认过滤级别' },
  { value: 'low', label: '宽松', desc: '较少限制' },
];

// === Gemini 官方模型 ===
export const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash-image', label: 'Nano Banana (Flash)', desc: '快速高效，适合大批量' },
  { value: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro', desc: '专业级，支持 4K 和搜索接地' },
];

// === OpenAI 官方模型 ===
export const OPENAI_MODELS = [
  { value: 'gpt-image-1.5', label: 'GPT Image 1.5', desc: '最新最强' },
  { value: 'gpt-image-1', label: 'GPT Image 1', desc: '稳定版本' },
  { value: 'gpt-image-1-mini', label: 'GPT Image 1 Mini', desc: '经济实惠' },
  { value: 'dall-e-3', label: 'DALL-E 3', desc: '经典模型（已弃用）' },
];

// 旧版兼容
export const ASPECT_RATIOS = GEMINI_ASPECT_RATIOS.map(ar => {
  const [w, h] = ar.value.split(':').map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return {
      ...ar,
      w: 1024,
      h: 1024,
    };
  }
  const maxDim = 1024;
  const ratio = w / h;
  return {
    ...ar,
    w: ratio >= 1 ? maxDim : Math.round(maxDim * ratio),
    h: ratio <= 1 ? maxDim : Math.round(maxDim / ratio),
  };
});

export const QUALITY_OPTIONS = OPENAI_QUALITY_OPTIONS;

// === 模型参数配置 — 由模型决定参数 ===
// 每个 profile 定义该模型支持的参数，ParamsPanel 据此动态渲染

const GEMINI_COMMON_PARAMS: ParamDef[] = [
  {
    key: 'aspectRatio', label: '画面比例', type: 'grid',
    sectionTitle: '画面比例', icon: 'Ratio', sectionBadge: 'Gemini',
    options: GEMINI_ASPECT_RATIOS, cols: 5,
  },
  {
    key: 'responseModalities', label: '响应模态', type: 'grid',
    sectionTitle: '响应模态', icon: 'MessageSquare', sectionBadge: 'Gemini',
    options: GEMINI_RESPONSE_MODALITIES, cols: 2,
  },
];

const GEMINI_PRO_PARAMS: ParamDef[] = [
  ...GEMINI_COMMON_PARAMS.slice(0, 1), // aspectRatio
  {
    key: 'imageSize', label: '图片分辨率', type: 'grid',
    sectionTitle: '图片分辨率', icon: 'Gem', sectionBadge: 'Gemini',
    options: GEMINI_IMAGE_SIZES, cols: 3,
    description: '2K/4K 仅 gemini-3-pro-image-preview 支持',
  },
  ...GEMINI_COMMON_PARAMS.slice(1), // responseModalities
];

const CONCURRENT_GENERATION_PARAM: ParamDef = {
  key: 'concurrentGenerations', label: '并发生成数', type: 'slider',
  sectionTitle: '生成数量', icon: 'Layers', sectionBadge: '通用',
  min: 1, max: 8,
  description: '通过并发请求实现多图生成',
};

const OPENAI_FULL_PARAMS: ParamDef[] = [
  CONCURRENT_GENERATION_PARAM,
  {
    key: 'openaiSize', label: '图片尺寸', type: 'grid',
    sectionTitle: '图片尺寸', icon: 'Maximize2', sectionBadge: 'OpenAI',
    options: OPENAI_SIZES, cols: 2,
  },
  {
    key: 'openaiQuality', label: '质量', type: 'grid',
    sectionTitle: '质量', icon: 'Sparkles', sectionBadge: 'OpenAI',
    options: OPENAI_QUALITY_OPTIONS, cols: 2,
  },
  {
    key: 'openaiN', label: 'n (同时生成)', type: 'slider',
    sectionTitle: '生成数量', icon: 'Layers', sectionBadge: 'OpenAI',
    min: 1, max: 10,
  },
  {
    key: 'openaiBackground', label: '背景', type: 'grid',
    sectionTitle: '背景', icon: 'MonitorSmartphone', sectionBadge: 'OpenAI',
    options: OPENAI_BACKGROUND_OPTIONS, cols: 3,
  },
  {
    key: 'openaiOutputFormat', label: '输出格式', type: 'grid',
    sectionTitle: '输出格式', icon: 'FileType', sectionBadge: 'OpenAI',
    options: OPENAI_OUTPUT_FORMATS, cols: 3,
  },
  {
    key: 'openaiModeration', label: '内容审核', type: 'grid',
    sectionTitle: '内容审核', icon: 'Shield', sectionBadge: 'OpenAI',
    options: OPENAI_MODERATION_OPTIONS, cols: 2,
  },
];

const DALLE3_PARAMS: ParamDef[] = [
  {
    key: 'openaiSize', label: '图片尺寸', type: 'grid',
    sectionTitle: '图片尺寸', icon: 'Maximize2', sectionBadge: 'OpenAI',
    options: [
      { value: '1024x1024', label: '1024x1024', desc: '正方形' },
      { value: '1792x1024', label: '1792x1024', desc: '横版' },
      { value: '1024x1792', label: '1024x1792', desc: '竖版' },
    ], cols: 3,
  },
  {
    key: 'openaiQuality', label: '质量', type: 'grid',
    sectionTitle: '质量', icon: 'Sparkles', sectionBadge: 'OpenAI',
    options: [
      { value: 'standard', label: '标准', desc: '默认' },
      { value: 'hd', label: 'HD', desc: '高质量' },
    ], cols: 2,
  },
];

const SD_COMPAT_PARAMS: ParamDef[] = [
  CONCURRENT_GENERATION_PARAM,
  {
    key: 'width', label: '宽度', type: 'number',
    sectionTitle: '生成参数', icon: 'Wand2', sectionBadge: '通用',
    min: 64, max: 2048,
  },
  {
    key: 'height', label: '高度', type: 'number',
    sectionTitle: '生成参数', icon: 'Wand2', sectionBadge: '通用',
    min: 64, max: 2048,
  },
  {
    key: 'steps', label: '采样步数', type: 'slider',
    sectionTitle: '生成参数', icon: 'Wand2', sectionBadge: '通用',
    min: 1, max: 150,
  },
  {
    key: 'cfgScale', label: 'CFG Scale', type: 'slider',
    sectionTitle: '生成参数', icon: 'Wand2', sectionBadge: '通用',
    min: 1, max: 30, step: 0.5,
  },
  {
    key: 'seed', label: '种子', type: 'number',
    sectionTitle: '生成参数', icon: 'Wand2', sectionBadge: '通用',
    description: '-1 为随机',
  },
  {
    key: 'batchSize', label: '批量数', type: 'number',
    sectionTitle: '生成参数', icon: 'Wand2', sectionBadge: '通用',
    min: 1, max: 8,
  },
];

const SD_ADVANCED_PARAMS: ParamDef[] = [
  {
    key: 'clipSkip', label: 'Clip Skip', type: 'slider',
    sectionTitle: '高级选项', icon: 'Layers',
    min: 1, max: 12,
  },
  {
    key: 'denoisingStrength', label: '去噪强度', type: 'slider',
    sectionTitle: '高级选项', icon: 'Layers',
    min: 0, max: 1, step: 0.05,
  },
  {
    key: 'hiresUpscale', label: '高清放大倍数', type: 'slider',
    sectionTitle: '高级选项', icon: 'Layers',
    min: 1, max: 4, step: 0.1, unit: 'x',
  },
  {
    key: 'hiresSteps', label: '高清放大步数', type: 'slider',
    sectionTitle: '高级选项', icon: 'Layers',
    min: 0, max: 100,
  },
];

// 模型参数配置注册表：模型ID模式 → 参数定义
// 按顺序匹配，首个匹配的生效
const MODEL_PARAM_REGISTRY: { pattern: RegExp; profile: ModelParamProfile }[] = [
  // Gemini 3 Pro - 支持 imageSize (4K)
  { pattern: /gemini-3.*pro|pro.*image/i, profile: { params: [CONCURRENT_GENERATION_PARAM, ...GEMINI_PRO_PARAMS] } },
  // Gemini 通用（Flash 等）
  { pattern: /gemini/i, profile: { params: [CONCURRENT_GENERATION_PARAM, ...GEMINI_COMMON_PARAMS] } },
  // DALL-E 3
  { pattern: /dall-e-3/i, profile: { params: DALLE3_PARAMS } },
  // OpenAI GPT Image 系列
  { pattern: /gpt-image|openai/i, profile: { params: OPENAI_FULL_PARAMS } },
  // Stable Diffusion 兼容
  { pattern: /stable|sd|sdxl|flux|midjourney|comfy/i, profile: { params: [...SD_COMPAT_PARAMS, ...SD_ADVANCED_PARAMS] } },
];

// 各 format 的默认 profile（未匹配已知模型时使用）
const FORMAT_DEFAULT_PROFILES: Record<ApiFormat, ModelParamProfile> = {
  gemini: { params: [CONCURRENT_GENERATION_PARAM, ...GEMINI_COMMON_PARAMS] },
  openai: { params: OPENAI_FULL_PARAMS },
  claude: { params: [...SD_COMPAT_PARAMS, ...SD_ADVANCED_PARAMS] },
  vertex: { params: [CONCURRENT_GENERATION_PARAM, ...GEMINI_COMMON_PARAMS] },
};

/**
 * 根据模型 ID 和 API 格式获取参数定义
 * 优先按模型名称模式匹配，未匹配到时按 format 回退
 */
export function getModelParamProfile(modelId: string, format: ApiFormat): ModelParamProfile {
  for (const { pattern, profile } of MODEL_PARAM_REGISTRY) {
    if (pattern.test(modelId)) {
      return profile;
    }
  }
  return FORMAT_DEFAULT_PROFILES[format];
}

export const GEN_PARAMS_STORAGE_VERSION = 2;

interface GenerationParamsStorageEnvelope {
  version: number;
  data: Partial<GenerationParams>;
}

function normalizeGenerationParams(raw: Partial<GenerationParams> | null | undefined): GenerationParams {
  const saved = raw ?? {};
  return {
    ...DEFAULT_GENERATION_PARAMS,
    ...saved,
    referenceImages: Array.isArray(saved.referenceImages) ? saved.referenceImages : [],
    customParams: saved.customParams ?? DEFAULT_GENERATION_PARAMS.customParams,
  };
}

function migrateGenerationParams(
  raw: Partial<GenerationParams>,
  version: number
): { data: GenerationParams; version: number } {
  let currentVersion = Number.isFinite(version) ? version : 0;
  let next: Partial<GenerationParams> = { ...raw };

  if (currentVersion < 1) {
    next = {
      ...next,
      referenceImages: Array.isArray(next.referenceImages) ? next.referenceImages : [],
    };
    currentVersion = 1;
  }

  if (currentVersion < 2) {
    next = {
      ...next,
      customParams: next.customParams ?? {},
    };
    currentVersion = 2;
  }

  return {
    data: normalizeGenerationParams(next),
    version: Math.max(currentVersion, GEN_PARAMS_STORAGE_VERSION),
  };
}

function isGenerationParamsStorageEnvelope(
  value: GenerationParamsStorageEnvelope | Partial<GenerationParams>
): value is GenerationParamsStorageEnvelope {
  return 'data' in value && typeof value.data === 'object' && value.data !== null;
}

export function loadGenerationParamsFromStorage(key: string): { data: GenerationParams; version: number } {
  const raw = loadFromStorage<GenerationParamsStorageEnvelope | Partial<GenerationParams> | null>(key, null);

  if (!raw) {
    return { data: DEFAULT_GENERATION_PARAMS, version: GEN_PARAMS_STORAGE_VERSION };
  }

  if (isGenerationParamsStorageEnvelope(raw)) {
    const version = typeof raw.version === 'number' ? raw.version : 0;
    return migrateGenerationParams(raw.data, version);
  }

  return migrateGenerationParams(raw, 0);
}

export function saveGenerationParamsToStorage(key: string, params: GenerationParams): void {
  saveToStorage(key, {
    version: GEN_PARAMS_STORAGE_VERSION,
    data: params,
  } satisfies GenerationParamsStorageEnvelope);
}

// localStorage helpers
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
