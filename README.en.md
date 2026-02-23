# 🍌 Nano Banana Studio (English Guide)

Hi friend! Welcome to **Nano Banana Studio** ✨  
This is a cute-looking yet production-oriented AI image generation studio UI.

---

## ✨ What is this project?

`nano-banana-studio` is a **React + Vite + TypeScript** web app for AI image workflows.

It gives you one place to:

- Manage multiple API configs (Gemini / OpenAI / Claude-compatible)
- Fetch available models dynamically
- Tune generation parameters visually
- Generate images and manage a gallery
- Persist settings/history in local storage

In short: it’s an “AI image control panel + mini gallery.”

---

## 🧸 Feature Overview (Detailed)

### 1) Multi-config API management

You can store multiple provider configs and switch between them quickly.
Each config includes:

- Name
- Auth format (OpenAI / Gemini / Claude)
- Base URL
- API key
- Model ID
- Optional custom endpoint path

You can also run a built-in connection test.

### 2) Smart request format resolution

A very practical design choice in this project:

- **Authentication format** follows configured `format`
- **Request body format** is inferred from model ID first (fallback to config format)

This is useful when gateway auth style and underlying model protocol differ.

### 3) Rich parameter panel

The app supports official and compatibility-focused parameter sets:

- Gemini params: `aspectRatio`, `imageSize`, `responseModalities`
- OpenAI params: `size`, `quality`, `background`, `output_format`, `output_compression`, `moderation`
- SD-style compatibility params: `width/height/steps/cfgScale/seed/sampler/...`
- Style presets: anime, photorealistic, watercolor, cyberpunk, etc.
- Custom params passthrough: supports nested key paths (e.g. `generationConfig.temperature`)

### 4) Auto model discovery

When `baseUrl / apiKey / format` changes, the app auto-fetches model lists for smoother setup.

### 5) Gallery & UX

- Generated outputs are added to gallery
- Favorite/unfavorite support
- Remove/clear operations
- Animated kawaii-style UI (bubble background, friendly loading states)

### 6) Error handling and debug support

- Human-readable API error messaging
- Request preview with sensitive data masking
- ErrorBoundary to prevent full-app crashes

---

## 🧩 Tech Stack

- Frontend: React 19 + TypeScript + Vite
- UI: TailwindCSS + Radix UI + Framer Motion
- Routing: Wouter
- State: React Context + localStorage persistence
- Server: Express static hosting for production build

---

## 🗂️ Project Structure (Core)

```txt
client/
  src/
    components/      # UI pieces (sidebar, params panel, canvas, dialogs)
    contexts/        # StudioContext / ThemeContext
    lib/             # api-service, store, utils
    pages/           # Home / NotFound
server/
  index.ts           # production static serving + SPA fallback
shared/
  const.ts           # shared constants
```

---

## 🚀 Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

Default URL: <http://localhost:5173>

### 3) Type check

```bash
npm run check
```

### 4) Build for production

```bash
npm run build
```

### 5) Preview production build

```bash
npm run preview
```

### 6) Start production server (after build)

```bash
npm run start
```

---

## 🔐 Configuration Notes

### API config tips

- `format` controls auth headers
- `model` should be accurate for better request format inference
- `endpoint` is optional and can use placeholders like `{model}` / `{apiKey}`

### Environment variables

- `PORT`: server port (default `3000`)
- `NODE_ENV=production`: enables production static path behavior

---

## 🪄 Typical Workflow

1. Open settings and create an API config  
2. Fill Base URL / API key / model and run connection test  
3. Enter prompt and tune style/params  
4. Generate images and review results in gallery  
5. Favorite good ones, iterate on prompts and settings

---

## ❓ FAQ

### Q1: Why can OpenAI auth work with a Gemini model?
Because auth format and request payload format are intentionally decoupled in this app.

### Q2: Generation failed — what should I verify first?
Check these 3 things:
1) Correct Base URL  
2) Valid API key  
3) Model actually supports image generation

### Q3: Will my settings be lost after refresh?
No, configs/params/gallery are persisted in `localStorage`.

---

## 🤝 Dev Tips

- Add/update param types and defaults in `client/src/lib/store.ts`
- Keep protocol changes aligned in `client/src/lib/api-service.ts`
- Prefer parameter-definition-driven rendering to avoid UI hardcoding

---

## 📜 License

MIT

---

Have fun building your own creative AI image playground! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
