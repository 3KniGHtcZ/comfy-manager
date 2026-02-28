import { createServerFn } from '@tanstack/react-start'
import { getComfyApi } from '~/server/comfy-client'
import type {
  ComfyUISystemStats,
  ComfyUIPromptResponse,
  ComfyUIHistoryEntry,
} from '~/lib/comfyui-types'

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

/**
 * Check if the ComfyUI server is reachable and return system stats.
 */
export const checkStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const api = await getComfyApi()
      const stats = await api.ext.system.getSystemStats()
      // Map library type to our app's ComfyUISystemStats shape
      const systemStats: ComfyUISystemStats = {
        system: {
          os: stats.system.os,
          comfyui_version: stats.system.comfyui_version,
          python_version: stats.system.python_version,
          pytorch_version: stats.system.pytorch_version,
          embedded_python: stats.system.embedded_python,
          argv: stats.system.argv,
        },
        devices: stats.devices.map((d) => ({
          name: d.name,
          type: d.type,
          index: d.index,
          vram_total: d.vram_total,
          vram_free: d.vram_free,
          torch_vram_total: d.torch_vram_total,
          torch_vram_free: d.torch_vram_free,
        })),
      }
      return { online: true, systemStats }
    } catch {
      return { online: false, systemStats: null }
    }
  },
)

/**
 * Queue a prompt (workflow) on the ComfyUI server.
 */
export const queuePrompt = createServerFn({ method: 'POST' })
  .inputValidator((data: { workflow: Record<string, unknown> }) => data)
  .handler(async ({ data }) => {
    const api = await getComfyApi()
    const result = await api.ext.queue.queuePrompt(null, data.workflow)
    return result as ComfyUIPromptResponse
  })

/**
 * Retrieve the history entry for a given prompt ID.
 */
export const getHistory = createServerFn({ method: 'GET' })
  .inputValidator((data: { promptId: string }) => data)
  .handler(async ({ data }) => {
    const api = await getComfyApi()
    const entry = await api.ext.history.getHistory(data.promptId)
    if (!entry) return null
    // Map library HistoryEntry to our app's ComfyUIHistoryEntry shape
    const mapped: ComfyUIHistoryEntry = {
      prompt: entry.prompt as ComfyUIHistoryEntry['prompt'],
      outputs: entry.outputs as ComfyUIHistoryEntry['outputs'],
      status: {
        status_str: entry.status.status_str,
        completed: entry.status.completed,
      },
    }
    return mapped
  })

/**
 * Proxy an output image from ComfyUI. Returns the raw response so the
 * browser can render it directly.
 */
export const getOutputImage = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { filename: string; subfolder: string; type: string }) => data,
  )
  .handler(async ({ data }) => {
    const api = await getComfyApi()
    const blob = await api.ext.file.getImage({
      filename: data.filename,
      subfolder: data.subfolder,
      type: data.type,
    })
    const buffer = Buffer.from(await blob.arrayBuffer())
    const contentType = blob.type || 'image/png'
    const base64 = buffer.toString('base64')
    return {
      dataUrl: `data:${contentType};base64,${base64}`,
      contentType,
    }
  })

/**
 * Interrupt the currently running generation on ComfyUI.
 */
export const interruptGeneration = createServerFn({ method: 'POST' }).handler(
  async () => {
    const api = await getComfyApi()
    await api.ext.queue.interrupt()
    return { success: true }
  },
)
