/**
 * API Service: Kawaii Bubble Pop Design — Nano Banana Studio
 * 
 * 严格按照各平台官方文档构建 API 请求：
 * 
 * Gemini API:
 *   端点: POST /models/{model}:generateContent
 *   认证: x-goog-api-key header 或 ?key= query param
 *   文档: https://ai.google.dev/gemini-api/docs/image-generation
 * 
 * OpenAI API:
 *   端点: POST /images/generations
 *   认证: Authorization: Bearer {key}
 *   文档: https://developers.openai.com/api/docs/guides/image-generation
 * 
 * Claude API (兼容格式):
 *   端点: POST /messages
 *   认证: x-api-key header + anthropic-version
 *   文档: https://docs.anthropic.com/en/docs/build-with-claude/vision
 */

import type { ApiConfig, GenerationParams } from './store';

export interface GenerationResult {
  success: boolean;
  images: string[]; // base64 data URLs
  error?: string;
  metadata?: Record<string, unknown>;
  revisedPrompt?: string;
}

// ============================================================
// 构建提示词（将风格预设融入提示词）
// ============================================================
function buildPromptWithStyle(params: GenerationParams): string {
  const styleMap: Record<string, string> = {
    'anime': 'anime style, ',
    'photorealistic': 'photorealistic, highly detailed, ',
    'digital-art': 'digital art style, ',
    'oil-painting': 'oil painting style, ',
    'watercolor': 'watercolor painting style, ',
    'pixel-art': 'pixel art style, ',
    'comic': 'comic book style, ',
    '3d-render': '3D rendered, ',
    'sketch': 'pencil sketch style, ',
    'fantasy': 'fantasy art style, ',
    'cyberpunk': 'cyberpunk style, neon lights, ',
    'minimalist': 'minimalist style, clean composition, ',
    'surreal': 'surrealist art style, ',
    'vintage': 'vintage retro style, ',
    'pop-art': 'pop art style, bold colors, ',
  };
  const prefix = params.style !== 'none' ? (styleMap[params.style] || '') : '';
  return prefix + params.prompt;
}

// ============================================================
// Gemini API - 严格按照官方文档
// ============================================================
function buildGeminiRequest(params: GenerationParams, config: ApiConfig) {
  const prompt = buildPromptWithStyle(params);

  // 基础请求体
  const body: any = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      // 响应模态
      responseModalities: params.responseModalities === 'IMAGE_ONLY'
        ? ['IMAGE']
        : ['TEXT', 'IMAGE'],
    },
  };

  // imageConfig（官方参数）
  const imageConfig: any = {};

  // aspectRatio - 所有 Gemini 图片模型都支持
  if (params.aspectRatio && params.aspectRatio !== '1:1') {
    imageConfig.aspectRatio = params.aspectRatio;
  }

  // imageSize - 仅 gemini-3-pro-image-preview 支持，必须大写 K
  const model = config.model || 'gemini-3-pro-image-preview';
  if (model.includes('gemini-3') || model.includes('pro-image')) {
    if (params.imageSize && params.imageSize !== '1K') {
      imageConfig.imageSize = params.imageSize; // "1K", "2K", "4K"
    }
  }

  if (Object.keys(imageConfig).length > 0) {
    body.generationConfig.imageConfig = imageConfig;
  }

  // 反向提示词通过 systemInstruction 传递
  if (params.negativePrompt) {
    body.systemInstruction = {
      parts: [{ text: `Avoid generating: ${params.negativePrompt}` }],
    };
  }

  // 自定义参数直接合并到请求体
  if (Object.keys(params.customParams).length > 0) {
    // 解析自定义参数，支持嵌套路径如 "generationConfig.temperature"
    for (const [key, val] of Object.entries(params.customParams)) {
      const keys = key.split('.');
      let target = body;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      // 尝试解析为 JSON 值
      try {
        target[keys[keys.length - 1]] = JSON.parse(val);
      } catch {
        target[keys[keys.length - 1]] = val;
      }
    }
  }

  return body;
}

// ============================================================
// OpenAI API - 严格按照官方文档
// ============================================================
function buildOpenAIRequest(params: GenerationParams, config: ApiConfig) {
  const prompt = buildPromptWithStyle(params);

  const body: any = {
    model: config.model || 'gpt-image-1',
    prompt: prompt,
    n: params.openaiN || 1,
    size: params.openaiSize || '1024x1024',
    quality: params.openaiQuality || 'auto',
    response_format: 'b64_json',
  };

  // background 参数
  if (params.openaiBackground && params.openaiBackground !== 'auto') {
    body.background = params.openaiBackground;
  }

  // output_format 参数
  if (params.openaiOutputFormat && params.openaiOutputFormat !== 'png') {
    body.output_format = params.openaiOutputFormat;
  }

  // output_compression（仅 jpeg/webp）
  if ((params.openaiOutputFormat === 'jpeg' || params.openaiOutputFormat === 'webp')
    && params.openaiOutputCompression < 100) {
    body.output_compression = params.openaiOutputCompression;
  }

  // moderation
  if (params.openaiModeration && params.openaiModeration !== 'auto') {
    body.moderation = params.openaiModeration;
  }

  // 自定义参数
  for (const [key, val] of Object.entries(params.customParams)) {
    try {
      body[key] = JSON.parse(val);
    } catch {
      body[key] = val;
    }
  }

  return body;
}

// ============================================================
// Claude API (兼容格式) - 用于第三方兼容服务
// ============================================================
function buildClaudeRequest(params: GenerationParams, config: ApiConfig) {
  const prompt = buildPromptWithStyle(params);

  // Claude 本身不是图片生成模型，但一些第三方服务使用 Claude 格式
  // 将图片生成参数编码到消息中
  let messageText = prompt;
  if (params.negativePrompt) {
    messageText += `\n\n[Negative: ${params.negativePrompt}]`;
  }

  const body: any = {
    model: config.model || 'claude-3-opus-20240229',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: messageText },
        ],
      },
    ],
  };

  // 自定义参数
  for (const [key, val] of Object.entries(params.customParams)) {
    try {
      body[key] = JSON.parse(val);
    } catch {
      body[key] = val;
    }
  }

  return body;
}

// ============================================================
// 请求头
// ============================================================
function getHeaders(config: ApiConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (config.format) {
    case 'openai':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
    case 'gemini':
      // Gemini 同时支持 header 和 query param 认证
      headers['x-goog-api-key'] = config.apiKey;
      break;
    case 'claude':
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      break;
  }

  return headers;
}

// ============================================================
// 端点 URL
// ============================================================
function getEndpoint(config: ApiConfig): string {
  const base = config.baseUrl.replace(/\/$/, '');

  switch (config.format) {
    case 'openai':
      // POST /v1/images/generations
      return `${base}/images/generations`;
    case 'gemini':
      // POST /v1beta/models/{model}:generateContent?key={apiKey}
      // 注意：如果 base 已经包含 /v1beta 则不重复添加
      return `${base}/models/${config.model || 'gemini-3-pro-image-preview'}:generateContent?key=${config.apiKey}`;
    case 'claude':
      // POST /v1/messages
      return `${base}/messages`;
    default:
      return base;
  }
}

// ============================================================
// 从响应中提取图片
// ============================================================
function extractImages(data: any, format: ApiConfig['format']): { images: string[]; revisedPrompt?: string } {
  try {
    switch (format) {
      case 'openai': {
        const images: string[] = [];
        let revisedPrompt: string | undefined;
        if (data.data) {
          for (const item of data.data) {
            if (item.b64_json) {
              images.push(`data:image/png;base64,${item.b64_json}`);
            } else if (item.url) {
              images.push(item.url);
            }
            if (item.revised_prompt && !revisedPrompt) {
              revisedPrompt = item.revised_prompt;
            }
          }
        }
        return { images, revisedPrompt };
      }

      case 'gemini': {
        const images: string[] = [];
        if (data.candidates) {
          for (const candidate of data.candidates) {
            if (candidate.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.inlineData) {
                  images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                }
              }
            }
          }
        }
        return { images };
      }

      case 'claude': {
        const images: string[] = [];
        if (data.content) {
          for (const block of data.content) {
            if (block.type === 'image') {
              images.push(`data:${block.source.media_type};base64,${block.source.data}`);
            }
          }
        }
        return { images };
      }

      default:
        return { images: [] };
    }
  } catch {
    return { images: [] };
  }
}

// ============================================================
// 主生成函数
// ============================================================
export async function generateImage(
  params: GenerationParams,
  config: ApiConfig
): Promise<GenerationResult> {
  try {
    let body: any;

    switch (config.format) {
      case 'openai':
        body = buildOpenAIRequest(params, config);
        break;
      case 'gemini':
        body = buildGeminiRequest(params, config);
        break;
      case 'claude':
        body = buildClaudeRequest(params, config);
        break;
    }

    const endpoint = getEndpoint(config);
    const headers = getHeaders(config);

    console.log(`[Nano Banana Studio] 请求端点: ${endpoint}`);
    console.log(`[Nano Banana Studio] 请求体:`, JSON.stringify(body, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // 不同 API 的错误格式不同
      const errorMsg =
        errorData.error?.message ||  // OpenAI / Gemini
        errorData.error?.status ||   // Gemini
        errorData.message ||         // Claude
        `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, images: [], error: errorMsg };
    }

    const data = await response.json();
    const { images, revisedPrompt } = extractImages(data, config.format);

    if (images.length === 0) {
      return {
        success: false,
        images: [],
        error: '未能从 API 响应中提取到图片。请检查：\n1. API 配置和密钥是否正确\n2. 模型是否支持图片生成\n3. 请求参数是否符合要求',
      };
    }

    return { success: true, images, metadata: data, revisedPrompt };
  } catch (err: any) {
    return {
      success: false,
      images: [],
      error: err.message || '网络请求失败，请检查 API 地址是否正确。',
    };
  }
}

// ============================================================
// 连接测试
// ============================================================
export async function testConnection(config: ApiConfig): Promise<{ success: boolean; message: string }> {
  try {
    const base = config.baseUrl.replace(/\/$/, '');
    let testUrl: string;
    const headers = getHeaders(config);

    switch (config.format) {
      case 'openai':
        testUrl = `${base}/models`;
        break;
      case 'gemini':
        testUrl = `${base}/models?key=${config.apiKey}`;
        break;
      case 'claude':
        testUrl = `${base}/messages`;
        break;
      default:
        testUrl = base;
    }

    const response = await fetch(testUrl, {
      method: config.format === 'claude' ? 'POST' : 'GET',
      headers,
      ...(config.format === 'claude' ? {
        body: JSON.stringify({
          model: config.model || 'claude-3-opus-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      } : {}),
    });

    if (response.ok || response.status === 200) {
      return { success: true, message: '连接成功！API 可用。' };
    } else if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'API Key 无效或无权限，请检查密钥。' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.error?.message || '';
      return { success: false, message: `连接失败：HTTP ${response.status}${detail ? ` - ${detail}` : ''}` };
    }
  } catch (err: any) {
    return { success: false, message: `连接失败：${err.message}` };
  }
}

// ============================================================
// 导出请求预览（用于调试）
// ============================================================
export function previewRequest(params: GenerationParams, config: ApiConfig): {
  endpoint: string;
  headers: Record<string, string>;
  body: any;
} {
  let body: any;
  switch (config.format) {
    case 'openai':
      body = buildOpenAIRequest(params, config);
      break;
    case 'gemini':
      body = buildGeminiRequest(params, config);
      break;
    case 'claude':
      body = buildClaudeRequest(params, config);
      break;
  }

  const headers = getHeaders(config);
  // 隐藏 API key
  const safeHeaders = { ...headers };
  if (safeHeaders['Authorization']) safeHeaders['Authorization'] = 'Bearer sk-***';
  if (safeHeaders['x-goog-api-key']) safeHeaders['x-goog-api-key'] = '***';
  if (safeHeaders['x-api-key']) safeHeaders['x-api-key'] = '***';

  const endpoint = getEndpoint(config).replace(config.apiKey, '***');

  return { endpoint, headers: safeHeaders, body };
}
