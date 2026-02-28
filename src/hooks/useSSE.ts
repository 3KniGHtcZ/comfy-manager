import { useEffect, useRef, useState, useCallback } from 'react'

export interface SSEHandlers {
  onProgress?: (data: { value: number; max: number; promptId: string }) => void
  onImageComplete?: (data: {
    images: Array<{ filename: string; subfolder: string; type: string }>
    promptId: string
    node: string
  }) => void
  onDone?: (data: { promptId: string; reason?: string }) => void
  onError?: (data: { message: string; promptId: string }) => void
}

export interface SSEState {
  connected: boolean
  error: string | null
}

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

/**
 * Parse a text chunk from an SSE stream into individual events.
 * SSE events have the format:
 *   event: <name>\n
 *   data: <json>\n
 *   \n
 */
function parseSSEChunk(chunk: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = []
  const lines = chunk.split('\n')

  let currentEvent = ''
  let currentData = ''

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7)
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6)
    } else if (line === '' && currentEvent) {
      events.push({ event: currentEvent, data: currentData })
      currentEvent = ''
      currentData = ''
    }
  }

  return events
}

/**
 * React hook that opens an SSE connection to the ComfyUI bridge endpoint
 * by calling the sseStream server function and reading the raw Response stream.
 *
 * Pass `null` as the promptId to keep the connection closed.
 */
export function useSSE(
  promptId: string | null,
  handlers: SSEHandlers,
): SSEState {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep handlers in a ref so the effect doesn't re-run on handler changes
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const retriesRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const cleanup = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setConnected(false)
  }, [])

  useEffect(() => {
    if (!promptId) {
      cleanup()
      return
    }

    let cancelled = false

    async function connect() {
      if (cancelled) return

      const abortController = new AbortController()
      abortRef.current = abortController

      console.log('[useSSE] connecting, promptId=', promptId, 'retry=', retriesRef.current)
      try {
        // Use direct fetch to the Nitro API route — bypasses TanStack Start's
        // server function mechanism (which triggers route invalidation/reload).
        const response: Response = await fetch(
          `/api/sse?promptId=${encodeURIComponent(promptId!)}`,
          { signal: abortController.signal },
        )

        if (cancelled || abortController.signal.aborted) return

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        // Read the stream
        while (true) {
          if (cancelled || abortController.signal.aborted) {
            reader.cancel()
            break
          }

          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse complete SSE events from the buffer
          // SSE events are terminated by double newlines
          const parts = buffer.split('\n\n')
          // The last part may be incomplete, keep it in the buffer
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            if (!part.trim()) continue

            const events = parseSSEChunk(part + '\n\n')
            for (const sseEvent of events) {
              try {
                const data = JSON.parse(sseEvent.data)

                switch (sseEvent.event) {
                  case 'connected':
                    if (!cancelled) {
                      console.log('[useSSE] connected to SSE stream')
                      setConnected(true)
                      setError(null)
                      retriesRef.current = 0
                    }
                    break
                  case 'progress':
                    if (!cancelled) handlersRef.current.onProgress?.(data)
                    break
                  case 'image_complete':
                    if (!cancelled) handlersRef.current.onImageComplete?.(data)
                    break
                  case 'done':
                    if (!cancelled) {
                      handlersRef.current.onDone?.(data)
                      setConnected(false)
                    }
                    break
                  case 'error':
                    if (!cancelled) handlersRef.current.onError?.(data)
                    break
                }
              } catch {
                // Ignore parse errors for individual events
              }
            }
          }
        }

        // Stream ended normally
        if (!cancelled) {
          setConnected(false)
        }
      } catch (err) {
        if (cancelled) return
        // aborted but not explicitly cancelled — treat as connection error
        console.warn('[useSSE] connection error/abort, cancelled=', cancelled, err)

        setConnected(false)

        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current++
          console.log('[useSSE] retrying in', RETRY_DELAY_MS, 'ms, attempt', retriesRef.current)
          setTimeout(connect, RETRY_DELAY_MS)
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Connection lost after maximum retries',
          )
        }
      }
    }

    retriesRef.current = 0
    setError(null)
    connect()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [promptId, cleanup])

  return { connected, error }
}
