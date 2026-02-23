/**
 * Store: Kawaii Bubble Pop Design — Nano Banana Studio
 * Central state management using React context + localStorage persistence
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
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  seed: number;
  sampler: string;
  batchSize: number;
  style: string;
  quality: string;
  aspectRatio: string;
  // Advanced
  clipSkip: number;
  denoisingStrength: number;
  hiresUpscale: number;
  hiresSteps: number;
  // Extra custom params
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
}

export const DEFAULT_API_CONFIGS: ApiConfig[] = [
  {
    id: 'default-openai',
    name: 'Nano Banana Pro (OpenAI)',
    format: 'openai',
    baseUrl: 'https://api.example.com/v1',
    apiKey: '',
    model: 'nano-banana-pro',
    isActive: true,
  },
];

export const DEFAULT_GENERATION_PARAMS: GenerationParams = {
  prompt: '',
  negativePrompt: '',
  width: 1024,
  height: 1024,
  steps: 30,
  cfgScale: 7,
  seed: -1,
  sampler: 'Euler a',
  batchSize: 1,
  style: 'none',
  quality: 'standard',
  aspectRatio: '1:1',
  clipSkip: 1,
  denoisingStrength: 0.7,
  hiresUpscale: 1.5,
  hiresSteps: 15,
  customParams: {},
};

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

export const QUALITY_OPTIONS = [
  { value: 'draft', label: '草稿', desc: '快速预览' },
  { value: 'standard', label: '标准', desc: '平衡质量与速度' },
  { value: 'high', label: '高质量', desc: '更多细节' },
  { value: 'ultra', label: '超高质量', desc: '最佳效果' },
];

export const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1', w: 1024, h: 1024 },
  { value: '4:3', label: '4:3', w: 1024, h: 768 },
  { value: '3:4', label: '3:4', w: 768, h: 1024 },
  { value: '16:9', label: '16:9', w: 1024, h: 576 },
  { value: '9:16', label: '9:16', w: 576, h: 1024 },
  { value: '3:2', label: '3:2', w: 1024, h: 683 },
  { value: '2:3', label: '2:3', w: 683, h: 1024 },
  { value: '21:9', label: '21:9', w: 1024, h: 439 },
];

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
