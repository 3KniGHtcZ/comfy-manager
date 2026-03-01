import { defineEventHandler, readMultipartFormData } from 'h3'

const SERVER_URL = process.env.COMFYUI_URL ?? 'http://127.0.0.1:8188'

/**
 * POST /api/upload-image
 *
 * Accepts a multipart form upload and forwards it to ComfyUI's /upload/image endpoint.
 * Returns: { name: string, subfolder: string, type: string }
 */
export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw new Error('No file uploaded')
  }

  const filePart = parts.find((p) => p.name === 'image')
  if (!filePart || !filePart.data) {
    throw new Error('No image field in upload')
  }

  // Build FormData to forward to ComfyUI
  const formData = new FormData()
  const blob = new Blob([filePart.data], {
    type: filePart.type || 'image/png',
  })
  formData.append('image', blob, filePart.filename || 'upload.png')

  const response = await fetch(`${SERVER_URL}/upload/image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`ComfyUI upload failed (${response.status}): ${text}`)
  }

  const result = await response.json()
  return {
    name: result.name,
    subfolder: result.subfolder || '',
    type: result.type || 'input',
  }
})
