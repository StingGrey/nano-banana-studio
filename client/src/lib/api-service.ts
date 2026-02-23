/**
 * API Service: Kawaii Bubble Pop Design — Nano Banana Studio
 * Handles image generation API calls for OpenAI, Gemini, and Claude formats
 */

import type { ApiConfig, GenerationParams } from './store';

export interface GenerationResult {
  success: boolean;
  images: string[]; // base64 or URLs
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Build request body based on API format
 */
function buildOpenAIRequest(params: GenerationParams, config: ApiConfig) {
  return {
    model: config.model || 'nano-banana-pro',
    prompt: params.prompt,
    n: params.batchSize,
    size: `${params.width}x${params.height}`,
    quality: params.quality === 'ultra' ? 'hd' : 'standard',
    style: params.style !== 'none' ? params.style : undefined,
    response_format: 'b64_json',
    // Extended params for Nano Banana Pro
    ...(params.negativePrompt && { negative_prompt: params.negativePrompt }),
    ...(params.seed >= 0 && { seed: params.seed }),
    ...(params.steps && { steps: params.steps }),
    ...(params.cfgScale && { cfg_scale: params.cfgScale }),
    ...(params.sampler && { sampler: params.sampler }),
    ...params.customParams,
  };
}

function buildGeminiRequest(params: GenerationParams, config: ApiConfig) {
  return {
    contents: [
      {
        parts: [
          {
            text: params.prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageDimensions: {
        width: params.width,
        height: params.height,
      },
    },
    model: config.model || 'nano-banana-pro',
    // Extended params
    safetySettings: [],
    ...(params.negativePrompt && {
      systemInstruction: {
        parts: [{ text: `Negative prompt: ${params.negativePrompt}` }],
      },
    }),
    // Custom params
    ...params.customParams,
  };
}

function buildClaudeRequest(params: GenerationParams, config: ApiConfig) {
  return {
    model: config.model || 'nano-banana-pro',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Generate an image with the following specifications:\n\nPrompt: ${params.prompt}${params.negativePrompt ? `\nNegative Prompt: ${params.negativePrompt}` : ''}\nSize: ${params.width}x${params.height}\nStyle: ${params.style}\nQuality: ${params.quality}`,
          },
        ],
      },
    ],
    metadata: {
      image_generation: true,
      width: params.width,
      height: params.height,
      steps: params.steps,
      cfg_scale: params.cfgScale,
      seed: params.seed,
      sampler: params.sampler,
      batch_size: params.batchSize,
      ...params.customParams,
    },
  };
}

function getHeaders(config: ApiConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (config.format) {
    case 'openai':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
    case 'gemini':
      // Gemini uses API key as query param, but also supports header
      headers['x-goog-api-key'] = config.apiKey;
      break;
    case 'claude':
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      break;
  }

  return headers;
}

function getEndpoint(config: ApiConfig): string {
  const base = config.baseUrl.replace(/\/$/, '');

  switch (config.format) {
    case 'openai':
      return `${base}/images/generations`;
    case 'gemini':
      return `${base}/models/${config.model || 'nano-banana-pro'}:generateContent?key=${config.apiKey}`;
    case 'claude':
      return `${base}/messages`;
    default:
      return base;
  }
}

/**
 * Extract images from API response based on format
 */
function extractImages(data: any, format: ApiConfig['format']): string[] {
  try {
    switch (format) {
      case 'openai': {
        if (data.data) {
          return data.data.map((item: any) => {
            if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
            if (item.url) return item.url;
            return '';
          }).filter(Boolean);
        }
        return [];
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
        return images;
      }
      case 'claude': {
        const imgs: string[] = [];
        if (data.content) {
          for (const block of data.content) {
            if (block.type === 'image') {
              imgs.push(`data:${block.source.media_type};base64,${block.source.data}`);
            }
          }
        }
        return imgs;
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
}

/**
 * Main generation function
 */
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, images: [], error: errorMsg };
    }

    const data = await response.json();
    const images = extractImages(data, config.format);

    if (images.length === 0) {
      return { success: false, images: [], error: '未能从 API 响应中提取到图片，请检查 API 配置和模型是否支持图片生成。' };
    }

    return { success: true, images, metadata: data };
  } catch (err: any) {
    return {
      success: false,
      images: [],
      error: err.message || '网络请求失败，请检查 API 地址是否正确。',
    };
  }
}

/**
 * Test API connection
 */
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
        // Claude doesn't have a simple health check, try a minimal request
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
          model: config.model || 'nano-banana-pro',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      } : {}),
    });

    if (response.ok || response.status === 200) {
      return { success: true, message: '连接成功！API 可用。' };
    } else if (response.status === 401) {
      return { success: false, message: 'API Key 无效，请检查密钥。' };
    } else {
      return { success: false, message: `连接失败：HTTP ${response.status}` };
    }
  } catch (err: any) {
    return { success: false, message: `连接失败：${err.message}` };
  }
}
