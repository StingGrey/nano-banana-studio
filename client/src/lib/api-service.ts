/**
 * API Service — Nano Banana Studio
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
 *
 * Vertex AI Gemini API:
 *   端点: POST /projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent
 *   认证: Authorization: Bearer {ACCESS_TOKEN}
 *   文档: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference
 */

import type { ApiConfig, GenerationParams, ModelInfo } from './store';
import { resolveRequestFormat } from './store';

export interface GenerationResult {
  success: boolean;
  images: string[]; // base64 data URLs
  error?: string;
  metadata?: Record<string, unknown>;
  revisedPrompt?: string;
}


type VertexServiceAccountCredential = {
  type?: string;
  client_email?: string;
  private_key?: string;
  token_uri?: string;
  scope?: string;
  scopes?: string | string[];
  access_token?: string;
};

const vertexTokenCache = new Map<string, { token: string; expiresAt: number }>();

function base64UrlEncode(input: string): string {
  return btoa(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function looksLikeJsonCredential(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.startsWith('{') && trimmed.endsWith('}');
}

function parseVertexCredential(raw: string): VertexServiceAccountCredential | null {
  if (!looksLikeJsonCredential(raw)) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as VertexServiceAccountCredential;
  } catch {
    return null;
  }
}

async function signVertexJwt(payload: Record<string, unknown>, privateKeyPem: string): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(dataToSign)
  );

  const sigBytes = new Uint8Array(signature);
  let sigBinary = '';
  sigBytes.forEach((b) => { sigBinary += String.fromCharCode(b); });
  const encodedSig = base64UrlEncode(sigBinary);
  return `${dataToSign}.${encodedSig}`;
}

async function getVertexAccessToken(apiKeyField: string): Promise<string> {
  const trimmed = apiKeyField.trim();
  const cached = vertexTokenCache.get(trimmed);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 15_000) {
    return cached.token;
  }

  const cred = parseVertexCredential(trimmed);
  if (!cred) {
    // 普通 Bearer token
    return trimmed;
  }

  if (cred.access_token) {
    return cred.access_token;
  }

  if (!cred.client_email || !cred.private_key) {
    throw new Error('Vertex JSON 凭证缺少 client_email 或 private_key');
  }

  const tokenUri = cred.token_uri || 'https://oauth2.googleapis.com/token';
  const scope = Array.isArray(cred.scopes)
    ? cred.scopes.join(' ')
    : (cred.scopes || cred.scope || 'https://www.googleapis.com/auth/cloud-platform');

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const assertion = await signVertexJwt({
    iss: cred.client_email,
    scope,
    aud: tokenUri,
    iat: issuedAt,
    exp: expiresAt,
  }, cred.private_key);

  const form = new URLSearchParams();
  form.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  form.set('assertion', assertion);

  const resp = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.access_token) {
    const msg = data.error_description || data.error || `HTTP ${resp.status}`;
    throw new Error(`Vertex JSON 凭证换取 Access Token 失败: ${msg}`);
  }

  const expiresInSec = typeof data.expires_in === 'number' ? data.expires_in : 3600;
  vertexTokenCache.set(trimmed, {
    token: data.access_token,
    expiresAt: Date.now() + expiresInSec * 1000,
  });

  return data.access_token;
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

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

// ============================================================
// Gemini API - 严格按照官方文档
// ============================================================
function buildGeminiRequest(params: GenerationParams, config: ApiConfig) {
  const prompt = buildPromptWithStyle(params);
  const imageParts = params.referenceImages
    .map((img) => parseDataUrl(img.dataUrl))
    .filter((img): img is { mimeType: string; base64: string } => Boolean(img))
    .map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    }));

  // 基础请求体
  const body: any = {
    contents: [
      {
        parts: [{ text: prompt }, ...imageParts],
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
  if (params.aspectRatio && params.aspectRatio !== '1:1' && params.aspectRatio !== 'auto') {
    if (params.aspectRatio === 'custom') {
      const w = Math.max(1, Math.floor(params.customAspectRatioWidth || 1));
      const h = Math.max(1, Math.floor(params.customAspectRatioHeight || 1));
      imageConfig.aspectRatio = `${w}:${h}`;
    } else {
      imageConfig.aspectRatio = params.aspectRatio;
    }
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
  const imageBlocks = params.referenceImages
    .map((img) => parseDataUrl(img.dataUrl))
    .filter((img): img is { mimeType: string; base64: string } => Boolean(img))
    .map((img) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mimeType,
        data: img.base64,
      },
    }));

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
          ...imageBlocks,
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
async function getHeaders(config: ApiConfig): Promise<Record<string, string>> {
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
    case 'vertex': {
      const token = await getVertexAccessToken(config.apiKey);
      headers['Authorization'] = `Bearer ${token}`;
      break;
    }
  }

  return headers;
}

function getPreviewHeaders(config: ApiConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (config.format) {
    case 'openai':
      headers['Authorization'] = 'Bearer ***';
      break;
    case 'gemini':
      headers['x-goog-api-key'] = '***';
      break;
    case 'claude':
      headers['x-api-key'] = '***';
      headers['anthropic-version'] = '2023-06-01';
      break;
    case 'vertex':
      headers['Authorization'] = 'Bearer ***';
    case 'vertex':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
  }

  return headers;
}

// ============================================================
// 端点 URL — 支持自定义，否则根据请求格式自动推断
// ============================================================
function getEndpoint(config: ApiConfig, requestFormat: ApiConfig['format']): string {
  const base = config.baseUrl.replace(/\/$/, '');

  // 用户设置了自定义端点路径
  if (config.endpoint) {
    const ep = config.endpoint.trim();
    // 替换模板变量
    const resolved = ep
      .replace(/\{model\}/gi, config.model || '')
      .replace(/\{apiKey\}/gi, config.apiKey || '');
    // 判断是完整 URL 还是相对路径
    if (/^https?:\/\//i.test(resolved)) return resolved;
    return `${base}${resolved.startsWith('/') ? '' : '/'}${resolved}`;
  }

  // 根据请求格式自动推断端点
  switch (requestFormat) {
    case 'openai':
      return `${base}/images/generations`;
    case 'gemini':
      if (config.format === 'vertex') {
        return `${base}/${config.model || 'gemini-2.5-flash-image'}:generateContent`;
      }
      return `${base}/models/${config.model || 'gemini-3-pro-image-preview'}:generateContent?key=${config.apiKey}`;
    case 'vertex':
      return `${base}/${config.model || 'gemini-2.5-flash-image'}:generateContent`;
    case 'claude':
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

      case 'gemini':
      case 'vertex': {
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
    // 请求体格式由模型决定，认证格式由 config.format 决定
    const requestFormat = resolveRequestFormat(config);
    let body: any;

    switch (requestFormat) {
      case 'openai':
        body = buildOpenAIRequest(params, config);
        break;
      case 'gemini':
      case 'vertex':
        body = buildGeminiRequest(params, config);
        break;
      case 'claude':
        body = buildClaudeRequest(params, config);
        break;
    }

    const endpoint = getEndpoint(config, requestFormat);
    const headers = await getHeaders(config); // 认证始终按 config.format

    console.log(`[Nano Banana Studio] 认证格式: ${config.format}, 请求格式: ${requestFormat}`);
    console.log(`[Nano Banana Studio] 请求端点: ${endpoint}`);
    console.log(`[Nano Banana Studio] 请求体:`, JSON.stringify(body, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData.error?.message ||
        errorData.error?.status ||
        errorData.message ||
        `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, images: [], error: errorMsg };
    }

    const data = await response.json();
    // 响应解析也使用请求格式（与请求体格式一致）
    const { images, revisedPrompt } = extractImages(data, requestFormat);

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
    const headers = await getHeaders(config);

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
      case 'vertex':
        testUrl = `${base}`;
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
// 自动获取可用模型列表
// ============================================================
export async function fetchModels(config: ApiConfig): Promise<{ success: boolean; models: ModelInfo[]; error?: string }> {
  try {
    const base = config.baseUrl.replace(/\/$/, '');
    const headers = await getHeaders(config);

    switch (config.format) {
      case 'openai': {
        // GET /models
        const response = await fetch(`${base}/models`, { headers });
        if (!response.ok) {
          return { success: false, models: [], error: `HTTP ${response.status}` };
        }
        const data = await response.json();
        const models: ModelInfo[] = (data.data || []).map((m: any) => ({
          id: m.id,
          name: m.id,
          desc: m.owned_by ? `by ${m.owned_by}` : undefined,
          source: 'api' as const,
        }));
        return { success: true, models };
      }

      case 'gemini': {
        // GET /models?key={apiKey}
        const response = await fetch(`${base}/models?key=${config.apiKey}`, { headers });
        if (!response.ok) {
          return { success: false, models: [], error: `HTTP ${response.status}` };
        }
        const data = await response.json();
        const models: ModelInfo[] = (data.models || []).map((m: any) => ({
          id: (m.name || '').replace('models/', ''),
          name: m.displayName || (m.name || '').replace('models/', ''),
          desc: m.description?.slice(0, 60) || undefined,
          source: 'api' as const,
        }));
        return { success: true, models };
      }

      case 'claude': {
        // GET /models
        const response = await fetch(`${base}/models`, { headers });
        if (!response.ok) {
          return { success: false, models: [], error: `HTTP ${response.status}` };
        }
        const data = await response.json();
        const list = data.data || data.models || [];
        const models: ModelInfo[] = list.map((m: any) => ({
          id: m.id || m.name,
          name: m.display_name || m.id || m.name,
          desc: m.description?.slice(0, 60) || undefined,
          source: 'api' as const,
        }));
        return { success: true, models };
      }


      case 'vertex': {
        // Vertex: GET /publishers/google/models
        const response = await fetch(`${base}`, { headers });
        if (!response.ok) {
          return { success: false, models: [], error: `HTTP ${response.status}` };
        }
        const data = await response.json();
        const models: ModelInfo[] = (data.publisherModels || data.models || []).map((m: any) => ({
          id: (m.name || '').split('/').pop() || m.versionId || 'unknown-model',
          name: m.displayName || (m.name || '').split('/').pop() || 'Unknown',
          desc: m.description?.slice(0, 60) || undefined,
          source: 'api' as const,
        }));
        return { success: true, models };
      }

      default:
        return { success: false, models: [], error: '不支持的 API 格式' };
    }
  } catch (err: any) {
    return { success: false, models: [], error: err.message || '网络请求失败' };
  }
}

// ============================================================
// 导出请求预览（用于调试）
// ============================================================
export function previewRequest(params: GenerationParams, config: ApiConfig): {
  endpoint: string;
  headers: Record<string, string>;
  body: any;
  requestFormat: string;
} {
  const requestFormat = resolveRequestFormat(config);
  let body: any;
  switch (requestFormat) {
    case 'openai':
      body = buildOpenAIRequest(params, config);
      break;
    case 'gemini':
    case 'vertex':
      body = buildGeminiRequest(params, config);
      break;
    case 'claude':
      body = buildClaudeRequest(params, config);
      break;
  }

  const safeHeaders = getPreviewHeaders(config);

  const endpoint = getEndpoint(config, requestFormat).replace(config.apiKey, '***');

  return { endpoint, headers: safeHeaders, body, requestFormat };
}
