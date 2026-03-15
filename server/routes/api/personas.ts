import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineEventHandler } from "h3";
import type { Persona } from "../../../src/lib/types";

const PERSONAS_PATH = join(process.cwd(), "data", "personas.json");

/**
 * GET /api/personas
 *
 * Returns the list of all personas. Used as a reliable fallback
 * when TanStack Start server functions are unavailable.
 */
export default defineEventHandler(async (): Promise<Persona[]> => {
  try {
    const raw = await readFile(PERSONAS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
});
