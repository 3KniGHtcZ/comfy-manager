# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server with HMR on http://localhost:3000
npm run build    # Production build (SSR, outputs to .output/)
npm start        # Run production build (node .output/server/index.mjs)
```

No test framework is configured. **Biome** is used for formatting and linting (`biome.json`).

## Architecture

**Stack:** TanStack React Start (Vite + Nitro) + React 19 + TypeScript + Tailwind CSS v4

This is a full-stack app for managing ComfyUI image generation workflows. It runs as an SSR app with Nitro as the backend runtime.

### Routing

File-based routing via TanStack Router. Routes live in `src/routes/` and auto-generate `routeTree.gen.ts`. Each route exports a `Route` object via `createFileRoute()`.

The root layout (`src/routes/__root.tsx`) wraps everything with `GenerationProvider` (context) and renders a global `TabBar` that auto-hides on certain routes.

### Server Functions

Backend logic uses `createServerFn()` from `@tanstack/react-start` in `src/server/`. These are type-safe RPC calls — no manual HTTP endpoints needed. Each function has `.inputValidator()` and `.handler()`.

Key server modules:
- `comfyui.ts` — ComfyUI API integration (status, prompt queueing, image fetching)
- `sse.ts` — WebSocket-to-SSE bridge (connects to ComfyUI's `/ws`, streams events to client)
- `generations.ts` — CRUD for generation records
- `personas.ts` — CRUD for personas
- `settings.ts` — App settings
- `workflows.ts` — Builds ComfyUI API-format workflow objects

### Generation Lifecycle (Two-Phase)

Generation uses a prepare/execute split to avoid TanStack Start revalidation issues:

1. **Prepare** (on `/generate`): Stores params synchronously, sets status to `'preparing'`, navigates to `/generating`. No server calls.
2. **Execute** (on `/generating`): `useEffect` detects preparing status, calls server functions to create records and queue prompts, opens SSE for real-time progress.

Batch items are processed sequentially — each queued as a separate ComfyUI prompt. The `useSSE` hook handles connection, retry (up to 3 attempts), and event parsing.

### Data Persistence

JSON files in `data/` directory (`personas.json`, `generations.json`, `settings.json`). Server functions read/write these directly via `readFile`/`writeFile`.

### State Management

- `GenerationContext` (`src/contexts/`) — global generation state via React context
- `useGeneration` hook — orchestrates the full lifecycle with refs for batch queues and collected images
- `useSSE` hook — SSE streaming with AbortController cleanup

## Conventions

### Formatting

- **Indentation:** 2 spaces (no tabs) — enforced by Biome
- **Quotes:** double quotes — enforced by Biome

### Naming

- **Files:** camelCase — `characterCard.tsx`, `useGeneration.ts`, `toggleSwitch.tsx`
- **Components:** PascalCase — `CharacterCard`, `ToggleSwitch`
- **Hooks:** camelCase with `use` prefix — `useGeneration`, `useSSE`
- **Constants (module-level):** `UPPER_SNAKE_CASE` — `const MAX_RETRIES = 3`

### Components

- Export as `export const ComponentName: FC = () => ...` (not `export function`)
- Props interface named `[ComponentName]Props`, exported via `export type { ComponentNameProps }`
- Variant styles as a `Record` map, not inline ternaries:
  ```ts
  const variantStyles: Record<Variant, string> = { active: "...", inactive: "..." };
  ```

### TypeScript

- Use `interface` for object shapes, `type` for unions and aliases
- Never use `any` — use `unknown` or a proper type (enforced by Biome as error)
- Use `import type` for type-only imports:
  ```ts
  import type { FC, ReactNode } from "react";
  import type { GenerationParams } from "~/lib/types";
  ```

### Imports

- **Order:** 1) external packages → 2) internal `~/` modules → 3) `import type` last
- Always use `~/` alias — never relative paths (`../../components/...`)
- Biome `organizeImports` is enabled and runs automatically

### Styling

- **Path alias:** `~/*` maps to `src/*`. Always use `~/` imports, not relative paths.
- **Tailwind v4** with `@theme` design tokens in `src/styles/app.css`
- Always use `cn()` from `~/lib/utils` for `className` — never string concatenation
- **Icons:** `lucide-react`
- **UI components:** `src/components/ui/` with barrel export from `index.ts`. The app-level `TabBar` (`~/components/TabBar.tsx`) is separate from the UI library's `tabBar.tsx`.
- **Radix primitives:** `@radix-ui/react-radio-group` (toggle-switch), `@radix-ui/react-slider` (slider)
- **Font:** Outfit (Google Fonts, loaded in `__root.tsx`)

### Hooks

- Hook files live in `src/hooks/`
- Wrap event handlers passed as props in `useCallback`

### Design Tokens

Primary: `#3D8A5A` / Background: `#FAF9F7` / Surface: `#FFFFFF` / Border: `#D1D0CD` / Text: `#1A1918`

## Environment

ComfyUI server URL is configured in `data/settings.json` (defaults to `http://127.0.0.1:8188`). See `.env.example` for `COMFYUI_URL`.
