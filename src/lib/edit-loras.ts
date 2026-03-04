/** Raw LoRA info extracted from a workflow file, optionally enriched from lora-config.json. */
export interface WorkflowLoraInfo {
	nodeId: string;
	/** Full path as stored in the workflow (e.g. "QWEN\\model.safetensors") */
	loraName: string;
	/** Basename without extension — fallback display label when no name is configured */
	label: string;
	/** User-friendly name from lora-config.json (falls back to label if absent) */
	name?: string;
	/** strength_model value from the workflow (typically 1.0) */
	defaultStrength: number;
	/** Optional preview image URL or path from lora-config.json */
	image?: string;
}

/** LoRA definition enriched with UI-only preview colors. */
export interface LoraDefinition extends WorkflowLoraInfo {
	previewColors: [string, string];
}

const LORA_PALETTE: [string, string][] = [
	["#1a3a5c", "#4fc3f7"], // blue
	["#4a1a6e", "#f59e0b"], // purple / amber
	["#1a3a2e", "#6fcf97"], // green
	["#3a1a1a", "#f28b82"], // red
	["#2e2a1a", "#f4c430"], // gold
];

/** Attach deterministic gradient colors to raw workflow LoRA info. */
export function enrichWithColors(infos: WorkflowLoraInfo[]): LoraDefinition[] {
	return infos.map((info, i) => ({
		...info,
		previewColors: LORA_PALETTE[i % LORA_PALETTE.length],
	}));
}
