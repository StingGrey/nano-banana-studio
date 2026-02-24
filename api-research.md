# API 参数研究笔记 - 综合版

## 1. Gemini API（官方文档）

### 模型名称
- `gemini-2.5-flash-image` (Nano Banana) - 速度和效率
- `gemini-3-pro-image-preview` (Nano Banana Pro) - 专业资源，支持4K

### REST API 端点
- `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- 认证: `?key=API_KEY` 或 header `x-goog-api-key: API_KEY`

### 请求体格式
```json
{
  "contents": [{"parts": [{"text": "prompt"}]}],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "imageConfig": {
      "aspectRatio": "16:9",
      "imageSize": "2K"
    }
  }
}
```

### 关键参数
- `responseModalities`: ['TEXT', 'IMAGE'] 或 ['IMAGE']
- `imageConfig.aspectRatio`: "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
- `imageConfig.imageSize`: "1K", "2K", "4K" (仅 gemini-3-pro-image-preview，必须大写K)
- `tools`: [{"google_search": {}}] 可选，用于搜索接地

### 响应格式
```json
{
  "candidates": [{
    "content": {
      "parts": [
        {"text": "描述文本"},
        {"inlineData": {"mimeType": "image/png", "data": "base64..."}}
      ]
    }
  }]
}
```

### 宽高比
"1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"

### 不支持的参数（Gemini 不使用）
- steps, cfg_scale, seed, sampler, negative_prompt, batch_size
- clip_skip, denoising_strength, hires_upscale
- Gemini 的参数非常简洁：只有 prompt + aspectRatio + imageSize + responseModalities

---

## 2. OpenAI API（官方文档）

### 模型名称
- `gpt-image-1.5` (最新最强)
- `gpt-image-1`
- `gpt-image-1-mini`
- `dall-e-3` (已弃用)
- `dall-e-2` (已弃用)

### REST API 端点
- `POST https://api.openai.com/v1/images/generations`
- 认证: `Authorization: Bearer API_KEY`

### 请求体格式
```json
{
  "model": "gpt-image-1",
  "prompt": "A cute baby sea otter",
  "n": 1,
  "size": "1024x1024",
  "quality": "high",
  "background": "opaque",
  "output_format": "png",
  "output_compression": 100,
  "moderation": "auto"
}
```

### 关键参数
- `prompt`: 文本提示词
- `n`: 生成图片数量（默认1）
- `size`: "1024x1024", "1536x1024", "1024x1536", "auto"
- `quality`: "low", "medium", "high", "auto"
- `background`: "transparent", "opaque", "auto"
- `output_format`: "png", "jpeg", "webp"
- `output_compression`: 0-100（仅 jpeg/webp）
- `moderation`: "auto", "low"

### 响应格式
```json
{
  "created": 1234567890,
  "data": [
    {
      "b64_json": "base64_encoded_image_data",
      "revised_prompt": "优化后的提示词"
    }
  ]
}
```

### 不支持的参数
- steps, cfg_scale, seed, sampler, negative_prompt
- clip_skip, denoising_strength, hires_upscale, aspect_ratio
- OpenAI 用 size 而非 aspect_ratio

---

## 3. Claude API（Anthropic）

### 注意
Claude 本身不是图片生成模型。它没有原生的图片生成 API。
但用户可能使用兼容 Claude 格式的第三方服务来生成图片。

### Claude Messages API 格式
- `POST https://api.anthropic.com/v1/messages`
- 认证: `x-api-key: API_KEY` + `anthropic-version: 2023-06-01`

### 请求体格式（用于兼容的图片生成服务）
```json
{
  "model": "claude-3-opus-20240229",
  "max_tokens": 4096,
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "Generate an image of..."}
      ]
    }
  ]
}
```

### 响应格式
```json
{
  "content": [
    {"type": "text", "text": "..."},
    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "..."}}
  ]
}
```

---

## 总结：各 API 的核心差异

| 特性 | Gemini | OpenAI | Claude 兼容 |
|------|--------|--------|------------|
| 端点 | /models/{model}:generateContent | /v1/images/generations | /v1/messages |
| 认证 | x-goog-api-key 或 ?key= | Bearer token | x-api-key |
| 尺寸控制 | aspectRatio + imageSize | size (固定尺寸) | 取决于服务 |
| 质量控制 | imageSize (1K/2K/4K) | quality (low/medium/high) | 取决于服务 |
| 批量生成 | 不直接支持 | n 参数 | 不直接支持 |
| 透明背景 | 不支持 | background: transparent | 取决于服务 |
| 输出格式 | 固定 PNG base64 | png/jpeg/webp | 取决于服务 |


---

## 4. Vertex AI Gemini API（Google Cloud）

### REST API 端点
- `POST https://aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:generateContent`
- 认证: `Authorization: Bearer ACCESS_TOKEN`（OAuth2 / Service Account 颁发的短期 token）

### 请求体
- 与 Gemini `generateContent` 基本一致：`contents` + `generationConfig`
- 图片相关参数同样使用 `generationConfig.imageConfig.aspectRatio / imageSize`

### 模型列举
- `GET https://aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models`

### 认证说明（前端可配）
- 可直接粘贴短期 Access Token 到 `apiKey` 字段（作为 Bearer token）
- 若需长期稳定调用，建议由后端代理签发 token，再由前端透传
