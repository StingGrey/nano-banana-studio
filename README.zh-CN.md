# 🍌 Nano Banana Studio（中文说明书）

嗨嗨～欢迎来到 **Nano Banana Studio**！(๑•̀ㅂ•́)و✧  
这是一个「外表可爱、功能专业」的 AI 绘图前端工作室，主打多 API 兼容、参数可视化、以及顺滑的创作体验。

---

## ✨ 这是什么项目？

`nano-banana-studio` 是一个基于 **React + Vite + TypeScript** 的 Web 应用，面向 AI 图片生成场景。

它可以让你在同一个界面里：

- 配置多个 API（Gemini / OpenAI / Claude 兼容）
- 动态拉取可用模型
- 调节模型参数（比例、尺寸、质量等）
- 生成并管理图片画廊（收藏、删除、历史回看）
- 本地持久化配置（刷新页面不丢）

简单说：它是一个“AI 绘图控制台 + 小画廊”。🫧

---

## 🧸 功能清单（详细版）

### 1) 多 API 配置与切换

- 支持同时保存多个 API 配置（比如公司代理、自建中转、官方地址）
- 每个配置可定义：
  - 名称
  - 认证格式（OpenAI / Gemini / Claude）
  - Base URL
  - API Key
  - 模型名
  - 自定义 endpoint（可选）
- 可一键激活当前配置，并支持连接测试

### 2) 智能请求格式解析

项目里有一个很实用的小策略：

- **认证格式** 按你配置的 `format` 走
- **请求体格式** 会优先按模型名推断（例如模型名里有 gemini，就用 Gemini 请求体）

这对“代理服务认证方式与底层模型格式不一致”的场景很友好 ✨

### 3) 生成参数面板（偏专业）

参数分层比较细，兼顾官方参数与兼容参数：

- Gemini 相关：`aspectRatio`、`imageSize`、`responseModalities`
- OpenAI 相关：`size`、`quality`、`background`、`output_format`、`output_compression`、`moderation`
- SD 兼容类：`width/height/steps/cfgScale/seed/sampler/...`
- 风格预设：动漫、写实、像素风、赛博朋克等（会拼接到提示词）
- 自定义参数：支持 key/value 透传，还支持嵌套路径（如 `generationConfig.temperature`）

### 4) 自动获取模型列表

当配置项（baseUrl / apiKey / format）变化时，会自动拉取可用模型列表，减少手动录入模型名的成本。

### 5) 图片画廊与交互体验

- 生成结果自动进入 gallery
- 支持收藏/取消收藏
- 支持删除单张与清空
- 带可爱风格动画、气泡背景与加载态

### 6) 容错与调试友好

- 失败时会尽量给出可读的错误信息
- 支持请求预览（脱敏 header / key）
- 存在 ErrorBoundary，避免界面因单点异常直接崩掉

---

## 🧩 技术栈

- 前端：React 19 + TypeScript + Vite
- UI：TailwindCSS + Radix UI + Framer Motion
- 路由：Wouter
- 数据：React Context + localStorage
- 服务：Express（生产模式下托管静态资源）

---

## 🗂️ 目录结构（核心）

```txt
client/
  src/
    components/      # UI 组件（侧栏、参数面板、画布、弹窗等）
    contexts/        # StudioContext / ThemeContext
    lib/             # api-service、store、utils
    pages/           # Home / NotFound
server/
  index.ts           # 生产环境静态资源服务 + SPA fallback
shared/
  const.ts           # 共享常量
```

---

## 🚀 本地开发

### 1) 安装依赖

```bash
npm install
```

### 2) 启动开发环境

```bash
npm run dev
```

默认访问：<http://localhost:5173>

### 3) 类型检查

```bash
npm run check
```

### 4) 构建生产包

```bash
npm run build
```

### 5) 本地预览生产构建

```bash
npm run preview
```

### 6) 生产启动（已构建后）

```bash
npm run start
```

---

## 🔐 配置说明

### API 配置建议

- `format`：决定认证头格式
- `model`：尽量填准确模型名，便于自动推断请求体
- `endpoint`：可选。可使用模板变量（如 `{model}`、`{apiKey}`）

### 环境变量

- `PORT`：服务端口（默认 `3000`）
- `NODE_ENV=production`：生产模式下服务静态文件

---

## 🪄 典型工作流

1. 打开设置面板，新增一个 API 配置  
2. 填写 Base URL / API Key / 模型，点击连接测试  
3. 在主页面输入 Prompt，选择风格和参数  
4. 点击生成，等待结果进入 Gallery  
5. 收藏喜欢的图，继续微调参数迭代

---

## ❓常见小问题

### Q1：为什么填了 OpenAI 认证，但模型是 Gemini 也能跑？
A：因为项目做了“认证格式 vs 请求格式”的解耦，模型名会参与请求体格式推断。

### Q2：生成失败但我看不懂报错？
A：先检查三个点：
1) Base URL 是否正确  
2) API Key 是否有效  
3) 模型是否支持图片生成

### Q3：页面刷新后配置会丢吗？
A：不会，配置和画廊默认保存到 localStorage。

---

## 🤝 开发建议

- 新增模型参数时，优先在 `client/src/lib/store.ts` 中补齐类型和默认值
- 请求协议改动时，同步更新 `client/src/lib/api-service.ts`
- UI 组件多，尽量保持“参数定义驱动渲染”的结构，减少硬编码

---

## 📜 许可证

MIT

---

如果你准备把它改成自己的 AI 创作平台，这个仓库是一个很棒的起点喔～ ٩(ˊᗜˋ*)و  
祝你天天出神图，灵感像气泡一样咕噜咕噜冒出来！🫧🍌
