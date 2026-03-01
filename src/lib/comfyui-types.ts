export interface ComfyUISystemStats {
	system: {
		os: string;
		comfyui_version: string;
		python_version: string;
		pytorch_version: string;
		embedded_python: boolean;
		argv: string[];
	};
	devices: Array<{
		name: string;
		type: string;
		index: number;
		vram_total: number;
		vram_free: number;
		torch_vram_total: number;
		torch_vram_free: number;
	}>;
}

export interface ComfyUIPromptResponse {
	prompt_id: string;
	number: number;
	node_errors: Record<string, object>;
}

export interface ComfyUIHistoryEntry {
	prompt: [number, string, Record<string, object>, Record<string, object>];
	outputs: Record<
		string,
		{
			images?: Array<{
				filename: string;
				subfolder: string;
				type: string;
			}>;
		}
	>;
	status: {
		status_str: string;
		completed: boolean;
	};
}
