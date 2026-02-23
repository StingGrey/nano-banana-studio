/**
 * Store: Kawaii Bubble Pop Design — Nano Banana Studio
 * Central state management using React context + localStorage persistence
 * 
 * API 参数严格遵循各平台官方文档：
 * - Gemini: https://ai.google.dev/gemini-api/docs/image-generation
 * - OpenAI: https://developers.openai.com/api/docs/guides/image-generation
 * - Claude: https://docs.anthropic.com/en/docs/build-with-claude/vision
 */

export type ApiFormat = 'openai' | 'gemini' | 'claude';

export interface ApiConfig {
  id: string;
  name: string;
  format: ApiFormat;
  baseUrl: string;
  apiKey: string;
  model: string;
  isActive: boolean;
}

export interface GenerationParams {
  prompt: string;
  negativePrompt: string;

  // === Gemini 官方参数 ===
  // aspectRatio: "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
  aspectRatio: string;
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

  // Gemini defaults
  aspectRatio: '1:1',
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
  const maxDim = 1024;
  const ratio = w / h;
  return {
    ...ar,
    w: ratio >= 1 ? maxDim : Math.round(maxDim * ratio),
    h: ratio <= 1 ? maxDim : Math.round(maxDim / ratio),
  };
});

export const QUALITY_OPTIONS = OPENAI_QUALITY_OPTIONS;

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
