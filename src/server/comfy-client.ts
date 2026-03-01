import { ComfyApi } from "comfyui-node";

const SERVER_URL = process.env.COMFYUI_URL ?? "http://127.0.0.1:8188";

let instance: ComfyApi | null = null;

/**
 * Returns a connected ComfyApi singleton.
 */
export async function getComfyApi(): Promise<ComfyApi> {
	if (instance) {
		return instance;
	}

	const api = new ComfyApi(SERVER_URL, "comfy-manager", {
		autoReconnect: true,
		reconnect: {
			maxAttempts: 10,
			baseDelayMs: 1000,
			maxDelayMs: 15000,
			strategy: "exponential",
		},
	});

	await api.init();
	instance = api;
	return api;
}
