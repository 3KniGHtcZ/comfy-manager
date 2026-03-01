export interface Persona {
	id: string;
	name: string;
	description: string;
	avatar: string;
	loraName: string;
	loraStrength?: number;
	/** Optional custom workflow file (relative to `workflows/`). Defaults to `image-generation.json`. */
	workflowFile?: string;
}

export interface GenerationParams {
	personaId: string;
	prompt: string;
	aspectRatio: "1:1" | "16:9" | "9:16" | "4:3";
	resolution: 512 | 768 | 1024;
	steps: number;
	seedMode: "random" | "fixed";
	seed?: number;
	cfg: number;
	batchCount: number;
}

export interface Generation {
	id: string;
	kind?: "generation" | "edit";
	personaId: string;
	params: GenerationParams;
	status: "generating" | "completed" | "partial" | "error";
	images: GeneratedImage[];
	createdAt: string;
}

export interface GeneratedImage {
	filename: string;
	subfolder: string;
	type: string;
}

export interface EditParams {
	sourceImage: { filename: string; subfolder: string; type: string };
	prompt: string;
	steps: number;
	cfg: number;
	seedMode: "random" | "fixed";
	seed?: number;
	batchCount: number;
}

export interface EditRecord {
	id: string;
	sourceImage: { filename: string; subfolder: string; type: string };
	params: EditParams;
	status: "editing" | "completed" | "partial" | "error";
	resultImages: GeneratedImage[];
	createdAt: string;
}

export interface AppSettings {
	serverUrl: string;
	apiKey?: string;
	defaults: {
		cfg: number;
		steps: number;
		seedMode: "random" | "fixed";
	};
}
