import { ComfyApi } from 'comfyui-node'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AppSettings } from '~/lib/types'

const SETTINGS_PATH = join(process.cwd(), 'data', 'settings.json')

let instance: ComfyApi | null = null
let currentUrl: string | null = null

async function getServerUrl(): Promise<string> {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf-8')
    const settings: AppSettings = JSON.parse(raw)
    return settings.serverUrl
  } catch {
    return 'http://127.0.0.1:8188'
  }
}

/**
 * Returns a connected ComfyApi singleton. Recreates the instance if the
 * configured server URL has changed since the last call.
 */
export async function getComfyApi(): Promise<ComfyApi> {
  const url = await getServerUrl()

  if (instance && currentUrl === url) {
    return instance
  }

  // URL changed or first call — tear down old instance
  if (instance) {
    instance.destroy()
    instance = null
    currentUrl = null
  }

  const api = new ComfyApi(url, 'comfy-manager', {
    autoReconnect: true,
    reconnect: {
      maxAttempts: 10,
      baseDelayMs: 1000,
      maxDelayMs: 15000,
      strategy: 'exponential',
    },
  })

  await api.init()
  instance = api
  currentUrl = url
  return api
}

/**
 * Tear down the current instance so the next `getComfyApi()` call creates a
 * fresh connection. Call this when the server URL changes in settings.
 */
export function resetComfyApi(): void {
  if (instance) {
    instance.destroy()
    instance = null
    currentUrl = null
  }
}
