# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server with HMR on http://localhost:3000
npm run build    # Production build (SSR, outputs to .output/)
npm start        # Run production build (node .output/server/index.mjs)
```

No test framework, linter, or formatter is configured.

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

- **Path alias:** `~/*` maps to `src/*`. Always use `~/` imports, not relative paths.
- **Styling:** Tailwind v4 with `@theme` design tokens in `src/styles/app.css`. Use `cn()` from `~/lib/utils` for class merging.
- **Icons:** `lucide-react`
- **UI components:** `src/components/ui/` with barrel export from `index.ts`. The app-level `TabBar` (`~/components/TabBar.tsx`) is separate from the UI library's `tab-bar.tsx`.
- **Radix primitives:** `@radix-ui/react-radio-group` (toggle-switch), `@radix-ui/react-slider` (slider)
- **Font:** Outfit (Google Fonts, loaded in `__root.tsx`)

### Design Tokens

Primary: `#3D8A5A` / Background: `#FAF9F7` / Surface: `#FFFFFF` / Border: `#D1D0CD` / Text: `#1A1918`

## Environment

ComfyUI server URL is configured in `data/settings.json` (defaults to `http://127.0.0.1:8188`). See `.env.example` for `COMFYUI_URL`.
