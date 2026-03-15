import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineEventHandler } from "h3";
import type { Persona } from "../../../src/lib/types";

const PERSONAS_PATH = join(process.cwd(), "data", "personas.json");

export default defineEventHandler(async (): Promise<Persona[]> => {
  try {
    const raw = await readFile(PERSONAS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
});
