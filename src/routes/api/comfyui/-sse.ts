// This file exists as a placeholder for the SSE bridge endpoint.
//
// The actual SSE implementation is in src/server/sse.ts which exports
// a createServerFn-based streaming endpoint that returns a raw Response
// with Content-Type: text/event-stream.
//
// The client calls the server function directly via the useSSE hook
// (src/hooks/useSSE.ts), which reads the raw Response stream and parses
// the SSE events.
//
// This file is intentionally excluded from the TanStack route tree
// (it does not export a Route).
export {};
