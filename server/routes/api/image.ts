import { defineEventHandler, getQuery, createError } from 'h3'

const COMFYUI_URL = process.env.COMFYUI_URL ?? 'http://127.0.0.1:8188'

export default defineEventHandler(async (event) => {
  const { filename, subfolder, type } = getQuery(event) as {
    filename?: string
    subfolder?: string
    type?: string
  }

  if (!filename || !subfolder || !type) {
    throw createError({ statusCode: 400, statusMessage: 'Missing filename, subfolder, or type' })
  }

  const params = new URLSearchParams({ filename, subfolder, type })
  const url = `${COMFYUI_URL}/view?${params.toString()}`

  let upstream: Response
  try {
    upstream = await fetch(url)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to connect to ComfyUI' })
  }

  if (!upstream.ok) {
    throw createError({ statusCode: upstream.status, statusMessage: 'ComfyUI returned an error' })
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/png'

  return new Response(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})
