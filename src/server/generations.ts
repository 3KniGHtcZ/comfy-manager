import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import type {
	EditRecord,
	GeneratedImage,
	Generation,
	GenerationParams,
} from "~/lib/types";

const DATA_PATH = join(process.cwd(), "data", "generations.json");
const EDITS_PATH = join(process.cwd(), "data", "edits.json");

async function readGenerations(): Promise<Generation[]> {
	try {
		const raw = await readFile(DATA_PATH, "utf-8");
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

async function readEditsAsGenerations(): Promise<Generation[]> {
	try {
		const raw = await readFile(EDITS_PATH, "utf-8");
		const edits: EditRecord[] = JSON.parse(raw);
		return edits.map((edit) => ({
			id: edit.id,
			kind: "edit" as const,
			personaId: "",
			params: {
				personaId: "",
				prompt: edit.params.prompt,
				aspectRatio: "1:1",
				resolution: 512,
				steps: edit.params.steps,
				cfg: edit.params.cfg,
				seedMode: edit.params.seedMode,
				seed: edit.params.seed,
				batchCount: edit.params.batchCount,
			},
			status:
				edit.status === "editing"
					? "generating"
					: (edit.status as Generation["status"]),
			images: edit.resultImages,
			createdAt: edit.createdAt,
		}));
	} catch {
		return [];
	}
}

async function writeGenerations(generations: Generation[]): Promise<void> {
	await writeFile(DATA_PATH, JSON.stringify(generations, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

export const getGenerations = createServerFn({ method: "GET" })
	.inputValidator(
		(data: {
			personaId?: string;
			search?: string;
			page?: number;
			limit?: number;
		}) => data,
	)
	.handler(async ({ data }) => {
		const page = data.page ?? 1;
		const limit = data.limit ?? 20;

		const [generations, edits] = await Promise.all([
			readGenerations(),
			readEditsAsGenerations(),
		]);
		let items = [...generations, ...edits];

		// Sort by createdAt descending (newest first)
		items.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		// Filter by personaId
		if (data.personaId) {
			items = items.filter((g) => g.personaId === data.personaId);
		}

		// Filter by search (match against prompt text)
		if (data.search) {
			const query = data.search.toLowerCase();
			items = items.filter((g) =>
				(g.params.prompt ?? "").toLowerCase().includes(query),
			);
		}

		const total = items.length;
		const start = (page - 1) * limit;
		const paged = items.slice(start, start + limit);

		return { items: paged, total };
	});

export const getGeneration = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const generations = await readGenerations();
		return generations.find((g) => g.id === data.id) ?? null;
	});

export const createGeneration = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { personaId: string; params: GenerationParams }) => data,
	)
	.handler(async ({ data }) => {
		const generations = await readGenerations();
		const generation: Generation = {
			id: crypto.randomUUID(),
			personaId: data.personaId,
			params: data.params,
			status: "generating",
			images: [],
			createdAt: new Date().toISOString(),
		};
		generations.push(generation);
		await writeGenerations(generations);
		return generation;
	});

export const updateGeneration = createServerFn({ method: "POST" })
	.inputValidator(
		(data: {
			id: string;
			updates: {
				status?: Generation["status"];
				images?: GeneratedImage[];
			};
		}) => data,
	)
	.handler(async ({ data }) => {
		const generations = await readGenerations();
		const index = generations.findIndex((g) => g.id === data.id);
		if (index === -1) {
			throw new Error(`Generation not found: ${data.id}`);
		}

		const gen = generations[index];

		if (data.updates.status !== undefined) {
			gen.status = data.updates.status;
		}
		if (data.updates.images !== undefined) {
			gen.images = data.updates.images;
		}

		generations[index] = gen;
		await writeGenerations(generations);
		return gen;
	});
