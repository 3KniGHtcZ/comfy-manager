# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package manager

**Always use `yarn`** — never `npm` or `npx`. Use `yarn` for installing packages, running scripts, and all CLI invocations.

## Commands

```bash
yarn dev      # Dev server with HMR on http://localhost:3000
yarn build    # Production build (SSR, outputs to .output/)
yarn start    # Run production build (node .output/server/index.mjs)
yarn lint     # Biome lint check (src/ only)
yarn test     # Run tests (vitest)
yarn ci       # Full pipeline check: lint + tsc + test + build — run before every push
```

> **Before every `git push`** run `yarn ci` to catch lint, type, test and build errors locally before they fail in CI.

**Biome** is used for formatting and linting (`biome.json`). **Vitest** is used for testing.

## Architecture

**Stack:** TanStack React Start (Vite + Nitro) + React 19 + TypeScript + Tailwind CSS v4

This is a full-stack app for managing ComfyUI image generation workflows. It runs as an SSR app with Nitro as the backend runtime.

### Routing

File-based routing via TanStack Router. Routes live in `src/routes/` and auto-generate `routeTree.gen.ts`. Each route exports a `Route` object via `createFileRoute()`.

The root layout (`src/routes/__root.tsx`) wraps everything with `GenerationProvider` and `EditProvider` (contexts) and renders a global `TabBar` and `InstallBanner` that auto-hide on certain routes.

### Server Functions

Backend logic uses `createServerFn()` from `@tanstack/react-start` in `src/server/`. These are type-safe RPC calls — no manual HTTP endpoints needed. Each function has `.inputValidator()` and `.handler()`.

Key server modules (`src/server/`):
- `comfyClient.ts` — Low-level ComfyUI WebSocket client singleton (`getComfyApi`)
- `comfyui.ts` — High-level ComfyUI server functions (status, prompt queueing, image fetching)
- `workflows.ts` — Builds ComfyUI API-format workflow objects from params
- `generations.ts` — CRUD for generation records
- `edits.ts` — CRUD for edit records
- `personas.ts` — CRUD for personas
- `settings.ts` — App settings

Nitro API routes (`server/routes/api/`) use relative imports to `src/` — these are **not** TanStack server functions:
- `sse.ts` — WebSocket-to-SSE bridge (proxies ComfyUI's `/ws` to client as SSE)
- `generate.ts`, `edit.ts` — Queue ComfyUI prompts
- `generation-update.ts`, `edit-update.ts` — Update record status
- `image.ts` — Proxy ComfyUI image requests
- `upload-image.ts` — Upload images to ComfyUI

### Generation Lifecycle (Two-Phase)

Both image generation and image editing use a prepare/execute split to avoid TanStack Start revalidation issues:

1. **Prepare** (on `/generate` or `/edit`): Stores params synchronously in context, sets status to `'preparing'`, navigates to `/generating` or `/editing`. No server calls.
2. **Execute** (on `/generating` or `/editing`): `useEffect` detects preparing status, calls server functions to create records and queue prompts, opens SSE for real-time progress.

Batch items are processed sequentially — each queued as a separate ComfyUI prompt. The `useSSE` hook handles connection, retry (up to 3 attempts), and event parsing.

### Data Persistence

JSON files in `data/` directory (`personas.json`, `generations.json`, `edits.json`, `settings.json`). Server functions read/write these directly via `readFile`/`writeFile`.

### State Management

- `GenerationContext` (`src/contexts/GenerationContext.tsx`) — global generation state
- `EditContext` (`src/contexts/EditContext.tsx`) — global edit state
- `useGeneration` hook — orchestrates the generation lifecycle with refs for batch queues and collected images
- `useEdit` hook — orchestrates the edit lifecycle
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
- Exception: `server/routes/api/` files must use relative paths to `src/` (no `~/` alias)
- Biome `organizeImports` is enabled and runs automatically

### Styling

- **Tailwind v4** with `@theme` design tokens in `src/styles/app.css`
- Always use `cn()` from `~/lib/utils` for `className` — never string concatenation
- **Icons:** `lucide-react`
- **UI components:** `src/components/ui/` with barrel export from `index.ts`
  - App-level components (`TabBar`, `InstallBanner`, etc.) live in `src/components/` — separate from the UI library
- **Radix primitives:** `@radix-ui/react-radio-group` (toggle-switch), `@radix-ui/react-slider` (slider)
- **Font:** Outfit (Google Fonts, loaded in `__root.tsx`)

### Hooks

- Hook files live in `src/hooks/`
- Wrap event handlers passed as props in `useCallback`

### Design Tokens

Defined in `src/styles/app.css` under `@theme`:

| Token | Value |
|---|---|
| `--color-primary` | `#3D8A5A` |
| `--color-primary-light` | `#C8F0D8` |
| `--color-primary-dark` | `#2E6B45` |
| `--color-bg` | `#F5F4F1` |
| `--color-surface` | `#FFFFFF` |
| `--color-surface-muted` | `#EDECEA` |
| `--color-border` | `#D1D0CD` |
| `--color-border-light` | `#E5E4E1` |
| `--color-text` | `#1A1918` |
| `--color-text-secondary` | `#6D6C6A` |
| `--color-text-muted` | `#9C9B99` |
| `--color-text-inactive` | `#A8A7A5` |

## Environment

ComfyUI server URL is configured in `data/settings.json` (defaults to `http://127.0.0.1:8188`). See `.env.example` for `COMFYUI_URL`.
