import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import type { AppSettings } from "~/lib/types";
import { resetComfyApi } from "~/server/comfy-client";

const DATA_PATH = join(process.cwd(), "data", "settings.json");

const DEFAULT_SETTINGS: AppSettings = {
	serverUrl: process.env.COMFYUI_URL ?? "http://127.0.0.1:8188",
	defaults: {
		cfg: 7.5,
		steps: 30,
		seedMode: "random",
	},
};

async function readSettings(): Promise<AppSettings> {
	try {
		const raw = await readFile(DATA_PATH, "utf-8");
		const settings: AppSettings = JSON.parse(raw);
		if (process.env.COMFYUI_URL) {
			settings.serverUrl = process.env.COMFYUI_URL;
		}
		return settings;
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

async function writeSettings(settings: AppSettings): Promise<void> {
	await writeFile(DATA_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

/**
 * Deep merge source into target. Only merges plain objects; arrays and
 * primitives from source overwrite target.
 */
function deepMerge<T extends Record<string, unknown>>(
	target: T,
	source: Partial<T>,
): T {
	const result = { ...target };
	for (const key of Object.keys(source) as Array<keyof T>) {
		const sourceVal = source[key];
		const targetVal = target[key];
		if (
			sourceVal !== undefined &&
			typeof sourceVal === "object" &&
			sourceVal !== null &&
			!Array.isArray(sourceVal) &&
			typeof targetVal === "object" &&
			targetVal !== null &&
			!Array.isArray(targetVal)
		) {
			(result as Record<string, unknown>)[key as string] = deepMerge(
				targetVal as Record<string, unknown>,
				sourceVal as Record<string, unknown>,
			);
		} else if (sourceVal !== undefined) {
			(result as Record<string, unknown>)[key as string] = sourceVal;
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

export const getSettings = createServerFn({ method: "GET" }).handler(
	async () => {
		return await readSettings();
	},
);

export const updateSettings = createServerFn({ method: "POST" })
	.inputValidator((data: Partial<AppSettings>) => data)
	.handler(async ({ data }) => {
		const current = await readSettings();
		const merged = deepMerge(current, data);
		await writeSettings(merged);
		if (data.serverUrl && data.serverUrl !== current.serverUrl) {
			resetComfyApi();
		}
		return merged;
	});
