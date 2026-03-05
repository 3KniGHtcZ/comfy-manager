// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseSSEChunk } from "~/hooks/useSSE";

describe("parseSSEChunk", () => {
  it("returns empty array for empty input", () => {
    expect(parseSSEChunk("")).toEqual([]);
  });

  it("parses a single complete SSE event", () => {
    const chunk = 'event: progress\ndata: {"value":5,"max":20}\n\n';
    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      event: "progress",
      data: '{"value":5,"max":20}',
    });
  });

  it("parses multiple events in one chunk", () => {
    const chunk =
      "event: connected\ndata: {}\n\n" +
      'event: progress\ndata: {"value":1,"max":10}\n\n';
    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe("connected");
    expect(events[1].event).toBe("progress");
  });

  it("parses all known event types", () => {
    const types = ["connected", "progress", "image_complete", "done", "error"];
    for (const type of types) {
      const chunk = `event: ${type}\ndata: {}\n\n`;
      const events = parseSSEChunk(chunk);
      expect(events[0].event).toBe(type);
    }
  });

  it("does not emit an event when currentEvent is empty (data-only lines)", () => {
    // A line with only data: but no preceding event: should not produce an event
    const chunk = "data: orphan\n\n";
    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(0);
  });

  it("handles event with empty data", () => {
    const chunk = "event: done\ndata: \n\n";
    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "done", data: "" });
  });

  it("handles event with no data line at all", () => {
    // event line then blank line — currentData stays ''
    const chunk = "event: connected\n\n";
    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ event: "connected", data: "" });
  });

  it("extracts correct data payload", () => {
    const payload = JSON.stringify({ value: 7, max: 20, promptId: "abc123" });
    const chunk = `event: progress\ndata: ${payload}\n\n`;
    const events = parseSSEChunk(chunk);
    expect(events[0].data).toBe(payload);
  });

  it("handles chunks without trailing double newline gracefully", () => {
    // No trailing \n\n means the event boundary is never hit — no events
    const chunk = "event: progress\ndata: {}";
    const events = parseSSEChunk(chunk);
    expect(events).toHaveLength(0);
  });

  it("resets state between events", () => {
    const chunk =
      'event: progress\ndata: {"a":1}\n\n' + 'event: done\ndata: {"b":2}\n\n';
    const events = parseSSEChunk(chunk);
    expect(events[0].data).toBe('{"a":1}');
    expect(events[1].data).toBe('{"b":2}');
    // event names should not bleed across
    expect(events[1].event).toBe("done");
  });
});
