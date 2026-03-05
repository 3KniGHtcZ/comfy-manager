import type {
  TExecuted,
  TExecuting,
  TExecutionError,
  TProgress,
} from "comfyui-node";
import { defineEventHandler, getQuery, setResponseHeaders } from "h3";
import { getComfyApi } from "../../../src/server/comfyClient";

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export default defineEventHandler(async (event) => {
  const { promptId = "" } = getQuery(event) as { promptId?: string };

  setResponseHeaders(event, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const api = await getComfyApi();

  // Track cleanup functions for all event listeners
  const removeListeners: Array<() => void> = [];
  let keepaliveInterval: ReturnType<typeof setInterval> | null = null;
  let streamClosed = false;

  function closeAll() {
    streamClosed = true;
    for (const remove of removeListeners) {
      remove();
    }
    removeListeners.length = 0;
    if (keepaliveInterval !== null) {
      clearInterval(keepaliveInterval);
      keepaliveInterval = null;
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function push(eventName: string, payload: unknown) {
        if (streamClosed) return;
        try {
          controller.enqueue(encoder.encode(sseEvent(eventName, payload)));
        } catch {
          // Stream may have been closed
        }
      }

      // Keepalive comment lines prevent Vite / proxies from timing out
      keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // Stream already closed
        }
      }, 15_000);

      // Send initial connected event
      push("connected", { status: "ok", promptId });

      // Progress events
      removeListeners.push(
        api.on("progress", (ev: CustomEvent<TProgress>) => {
          const pd = ev.detail;
          if (!promptId || pd.prompt_id === promptId) {
            push("progress", {
              value: pd.value,
              max: pd.max,
              promptId: pd.prompt_id,
            });
          }
        }),
      );

      // Executed events (node completed with output images)
      // Filter to type === 'output' only: SaveImage writes to the output folder
      // (type='output'), while PreviewImage writes to temp (type='temp').
      // Without this filter, ela.json's 4 PreviewImage nodes produce 4 extra
      // image_complete events per prompt, resulting in N×5 images instead of N×1.
      removeListeners.push(
        api.on("executed", (ev: CustomEvent<TExecuted>) => {
          const ed = ev.detail;
          if (!promptId || ed.prompt_id === promptId) {
            const output = ed.output as {
              images?: Array<{
                filename: string;
                subfolder: string;
                type: string;
              }>;
            };
            const savedImages =
              output?.images?.filter((img) => img.type === "output") ?? [];
            if (savedImages.length > 0) {
              push("image_complete", {
                images: savedImages,
                promptId: ed.prompt_id,
                node: ed.node,
              });
            }
          }
        }),
      );

      // Execution error events
      removeListeners.push(
        api.on("execution_error", (ev: CustomEvent<TExecutionError>) => {
          const errData = ev.detail;
          if (!promptId || errData.prompt_id === promptId) {
            push("error", {
              message: errData.exception_message ?? "Execution error",
              promptId: errData.prompt_id,
            });
          }
        }),
      );

      // Executing events — node === null means generation complete
      removeListeners.push(
        api.on("executing", (ev: CustomEvent<TExecuting>) => {
          const execData = ev.detail;
          if (
            execData.node === null &&
            (!promptId || execData.prompt_id === promptId)
          ) {
            push("done", {
              promptId: execData.prompt_id ?? promptId,
            });
            // Generation complete — close the stream
            closeAll();
            try {
              controller.close();
            } catch {
              /* already closed */
            }
          }
        }),
      );

      // Handle library disconnection
      removeListeners.push(
        api.on("disconnected", () => {
          push("done", { promptId, reason: "ws_closed" });
          closeAll();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }),
      );

      // Race-condition guard: if the prompt was already processed by ComfyUI
      // before this SSE handler registered its listeners, replay from history.
      if (promptId) {
        try {
          const historyEntry = await api.ext.history.getHistory(promptId);
          if (historyEntry?.status?.completed && !streamClosed) {
            for (const [node, nodeOutput] of Object.entries(
              historyEntry.outputs,
            )) {
              const images = (
                nodeOutput as {
                  images?: Array<{
                    filename: string;
                    subfolder: string;
                    type: string;
                  }>;
                }
              ).images;
              // Same filter as the real-time path: only emit saved output images
              const savedImages =
                images?.filter((img) => img.type === "output") ?? [];
              if (savedImages.length > 0) {
                push("image_complete", { images: savedImages, promptId, node });
              }
            }
            push("done", { promptId });
            closeAll();
            try {
              controller.close();
            } catch {
              /* already closed */
            }
          }
        } catch {
          // History unavailable — rely on real-time events
        }
      }
    },

    // Called when the SSE client disconnects — clean up event listeners
    cancel() {
      closeAll();
    },
  });

  return new Response(stream);
});
