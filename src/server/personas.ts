import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import type { Persona } from "~/lib/types";

const DATA_PATH = join(process.cwd(), "data", "personas.json");

async function readPersonas(): Promise<Persona[]> {
	try {
		const raw = await readFile(DATA_PATH, "utf-8");
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

async function writePersonas(personas: Persona[]): Promise<void> {
	await writeFile(DATA_PATH, JSON.stringify(personas, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

export const getPersonas = createServerFn({ method: "GET" }).handler(
	async () => {
		return await readPersonas();
	},
);

export const getPersona = createServerFn({ method: "GET" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const personas = await readPersonas();
		return personas.find((p) => p.id === data.id) ?? null;
	});

export const createPersona = createServerFn({ method: "POST" })
	.inputValidator((data: Omit<Persona, "id">) => data)
	.handler(async ({ data }) => {
		const personas = await readPersonas();
		const persona: Persona = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description,
			avatar: data.avatar,
			loraName: data.loraName,
			loraStrength: data.loraStrength ?? 1.0,
		};
		personas.push(persona);
		await writePersonas(personas);
		return persona;
	});

export const updatePersona = createServerFn({ method: "POST" })
	.inputValidator(
		(data: { id: string; updates: Partial<Omit<Persona, "id">> }) => data,
	)
	.handler(async ({ data }) => {
		const personas = await readPersonas();
		const index = personas.findIndex((p) => p.id === data.id);
		if (index === -1) {
			throw new Error(`Persona not found: ${data.id}`);
		}
		personas[index] = { ...personas[index], ...data.updates };
		await writePersonas(personas);
		return personas[index];
	});

export const deletePersona = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		const personas = await readPersonas();
		const filtered = personas.filter((p) => p.id !== data.id);
		if (filtered.length === personas.length) {
			throw new Error(`Persona not found: ${data.id}`);
		}
		await writePersonas(filtered);
		return { success: true };
	});
