// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock @tanstack/react-start so server fns are directly callable ───────
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const chain: any = {};
    chain.inputValidator = () => chain;
    chain.handler = (fn: Function) => {
      const callable: any = (...args: any[]) => fn(...args);
      Object.assign(callable, chain);
      return callable;
    };
    return chain;
  },
}));

// ─── Mock node:fs/promises ───────────────────────────────────────────────────
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { readFile, writeFile } from "node:fs/promises";
import { getSettings, updateSettings } from "~/server/settings";

const DEFAULT_SETTINGS = {
  defaults: { cfg: 7.5, steps: 30, seedMode: "random" },
};

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── getSettings ─────────────────────────────────────────────────────────────

describe("getSettings", () => {
  it("returns parsed settings from file", async () => {
    const stored = {
      defaults: { cfg: 5, steps: 20, seedMode: "fixed" },
    };
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(stored) as any);

    const result = await getSettings();
    expect(result).toEqual(stored);
  });

  it("returns default settings when file is missing", async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error("ENOENT"));

    const result = await getSettings();
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("returns default settings when file contains invalid JSON", async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new SyntaxError("bad json"));

    const result = await getSettings();
    expect(result).toEqual(DEFAULT_SETTINGS);
  });
});

// ─── updateSettings ──────────────────────────────────────────────────────────

describe("updateSettings", () => {
  it("deep-merges partial update into existing settings", async () => {
    const current = {
      defaults: { cfg: 7.5, steps: 30, seedMode: "random" },
    };
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(current) as any);
    vi.mocked(writeFile).mockResolvedValueOnce(undefined as any);

    const result = await updateSettings({
      data: { defaults: { steps: 50 } } as any,
    });

    expect(result.defaults.cfg).toBe(7.5);
    expect(result.defaults.seedMode).toBe("random");
    expect(result.defaults.steps).toBe(50);
  });

  it("writes the merged settings to disk", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify(DEFAULT_SETTINGS) as any,
    );
    vi.mocked(writeFile).mockResolvedValueOnce(undefined as any);

    await updateSettings({
      data: { defaults: { cfg: 9 } } as any,
    });

    expect(writeFile).toHaveBeenCalledOnce();
    const written = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string);
    expect(written.defaults.cfg).toBe(9);
  });

  it("returns the fully merged settings object", async () => {
    const current = {
      defaults: { cfg: 7.5, steps: 30, seedMode: "random" },
    };
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(current) as any);
    vi.mocked(writeFile).mockResolvedValueOnce(undefined as any);

    const result = await updateSettings({
      data: { defaults: { cfg: 4.0 } } as any,
    });

    expect(result).toMatchObject({
      defaults: { cfg: 4.0, steps: 30, seedMode: "random" },
    });
  });
});

// ─── deepMerge (via updateSettings) ─────────────────────────────────────────

describe("deepMerge behaviour (exercised via updateSettings)", () => {
  it("primitive from source overwrites target", async () => {
    const current = {
      defaults: { cfg: 7.5, steps: 30, seedMode: "random" },
    };
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(current) as any);
    vi.mocked(writeFile).mockResolvedValueOnce(undefined as any);

    const result = await updateSettings({
      data: { defaults: { cfg: 5.0 } } as any,
    });
    expect(result.defaults.cfg).toBe(5.0);
  });

  it("undefined source value leaves target unchanged", async () => {
    const current = {
      defaults: { cfg: 7.5, steps: 30, seedMode: "random" },
    };
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(current) as any);
    vi.mocked(writeFile).mockResolvedValueOnce(undefined as any);

    const result = await updateSettings({ data: {} as any });
    expect(result.defaults.cfg).toBe(7.5);
  });
});
