import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import type { EditRecord, GeneratedImage, Generation } from "~/lib/types";

const EDITS_PATH = join(process.cwd(), "data", "edits.json");
const GENERATIONS_PATH = join(process.cwd(), "data", "generations.json");

async function readEdits(): Promise<EditRecord[]> {
	try {
		const raw = await readFile(EDITS_PATH, "utf-8");
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

/**
 * Get a single edit record by ID.
 */
export const getEdit = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const edits = await readEdits();
		return edits.find((e) => e.id === data.id) ?? null;
	});

/**
 * Get recent output images from completed generations.
 * Returns the last N images across all generations (newest first).
 */
export const getRecentImages = createServerFn({ method: "GET" })
	.inputValidator((data: { limit?: number }) => data)
	.handler(async ({ data }) => {
		const limit = data.limit ?? 20;

		let generations: Generation[];
		try {
			const raw = await readFile(GENERATIONS_PATH, "utf-8");
			generations = JSON.parse(raw);
		} catch {
			return [];
		}

		// Sort newest first
		generations.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		// Collect images from completed generations
		const images: Array<
			GeneratedImage & { generationId: string; createdAt: string }
		> = [];
		for (const gen of generations) {
			if (gen.status !== "completed" && gen.status !== "partial") continue;
			for (const img of gen.images) {
				images.push({
					...img,
					generationId: gen.id,
					createdAt: gen.createdAt,
				});
				if (images.length >= limit) break;
			}
			if (images.length >= limit) break;
		}

		return images;
	});
