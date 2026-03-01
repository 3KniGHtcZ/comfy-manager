import { useCallback, useRef, useState } from "react";
import type { GeneratedImage, GenerationParams } from "~/lib/types";
import { useSSE } from "./useSSE";

export type GenerationStatus =
	| "idle"
	| "preparing"
	| "generating"
	| "completed"
	| "error"
	| "cancelled";

interface GenerationState {
	status: GenerationStatus;
	progress: { value: number; max: number } | null;
	currentImage: GeneratedImage | null;
	completedImages: GeneratedImage[];
	error: string | null;
	generationId: string | null;
	currentBatchIndex: number;
	totalBatch: number;
	activeParams: GenerationParams | null;
}

const initialState: GenerationState = {
	status: "idle",
	progress: null,
	currentImage: null,
	completedImages: [],
	error: null,
	generationId: null,
	currentBatchIndex: 0,
	totalBatch: 0,
	activeParams: null,
};

/**
 * Orchestration hook that manages the full generation lifecycle:
 *   1. Create a generation record
 *   2. Build the workflow
 *   3. Queue the prompt for each batch item
 *   4. Open SSE to track progress
 *   5. Update the generation record on completion
 */
export function useGeneration() {
	const [state, setState] = useState<GenerationState>(initialState);
	const [ssePromptId, setSsePromptId] = useState<string | null>(null);

	// Collected images across all batch items
	const collectedImagesRef = useRef<GeneratedImage[]>([]);
	const generationIdRef = useRef<string | null>(null);
	const batchQueueRef = useRef<string[]>([]); // prompt IDs for remaining batch items
	const batchTotalRef = useRef(0);

	const finalizeBatch = useCallback(async () => {
		setSsePromptId(null);
		const genId = generationIdRef.current;
		if (genId) {
			const allImages = collectedImagesRef.current;
			const finalStatus = allImages.length > 0 ? "completed" : "error";
			try {
				await fetch("/api/generation-update", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: genId,
						updates: { status: finalStatus, images: allImages },
					}),
				});
			} catch {
				// Best effort
			}
			setState((s) => ({
				...s,
				status: finalStatus === "completed" ? "completed" : "error",
				completedImages: allImages,
				error: allImages.length === 0 ? "No images were generated" : null,
			}));
		}
	}, []);

	/**
	 * Process the next batch item. Opens SSE for the current prompt ID.
	 */
	const processNextBatch = useCallback(() => {
		const nextPromptId = batchQueueRef.current.shift();
		if (!nextPromptId) {
			// All batch items complete
			finalizeBatch();
			return;
		}

		const currentIndex = batchTotalRef.current - batchQueueRef.current.length;
		setState((s) => ({
			...s,
			currentBatchIndex: currentIndex,
			progress: null,
			currentImage: null,
		}));

		setSsePromptId(nextPromptId);
	}, [finalizeBatch]);

	// SSE event handlers - pass promptId directly instead of URL
	useSSE(ssePromptId, {
		onProgress(data) {
			console.log("[useGeneration] SSE progress", data.value, "/", data.max);
			setState((s) => ({
				...s,
				progress: { value: data.value, max: data.max },
			}));
		},

		onImageComplete(data) {
			console.log(
				"[useGeneration] SSE image_complete",
				data.images?.length,
				"images",
			);
			if (data.images && data.images.length > 0) {
				const newImage = data.images[0];
				collectedImagesRef.current.push(...data.images);
				setState((s) => ({
					...s,
					currentImage: newImage,
					completedImages: [...collectedImagesRef.current],
				}));
			}
		},

		onDone() {
			console.log("[useGeneration] SSE done — calling processNextBatch");
			// Move to the next batch item
			processNextBatch();
		},

		onError(data) {
			console.error("[useGeneration] SSE error:", data.message);
			setState((s) => ({
				...s,
				error: data.message,
			}));
			// Still try next batch item
			processNextBatch();
		},
	});

	// Stored params for the prepare/execute two-phase pattern.
	// prepare() is synchronous (safe before navigation), execute() does the POST work.
	const pendingParamsRef = useRef<GenerationParams | null>(null);

	/**
	 * Phase 1: Synchronously set status to 'preparing' and store params.
	 * No POST server functions are called, so TanStack Start won't revalidate routes.
	 * Call this before navigating to /generating.
	 */
	const prepare = useCallback((params: GenerationParams) => {
		console.log("[useGeneration] prepare() called");
		sessionStorage.setItem("_pendingGenParams", JSON.stringify(params));
		pendingParamsRef.current = params;
		collectedImagesRef.current = [];
		batchQueueRef.current = [];
		generationIdRef.current = null;
		setState({
			...initialState,
			status: "preparing",
			totalBatch: params.batchCount,
			activeParams: params,
		});
	}, []);

	/**
	 * Phase 2: Execute the generation.
	 *
	 * Uses a direct fetch to /api/generate (Nitro route) instead of TanStack
	 * Start server functions.  POST server functions automatically trigger
	 * router.invalidate() which remounts the root layout and resets all context
	 * state — killing the SSE connection.  The Nitro route bypasses this.
	 */
	const execute = useCallback(async () => {
		let params = pendingParamsRef.current;
		if (!params) {
			// Fallback for SSR full-page reload: read params from sessionStorage
			const stored = sessionStorage.getItem("_pendingGenParams");
			if (stored) {
				try {
					params = JSON.parse(stored);
				} catch {
					/* invalid */
				}
			}
		}
		if (!params) return;
		pendingParamsRef.current = null;
		sessionStorage.removeItem("_pendingGenParams");

		try {
			// Single API call that creates the generation record, builds workflows,
			// and queues all prompts — no TanStack route invalidation.
			console.log("[execute] calling /api/generate");
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ params }),
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(`Generation setup failed (${res.status}): ${text}`);
			}
			const { generationId, promptIds } = (await res.json()) as {
				generationId: string;
				promptIds: string[];
			};
			console.log(
				"[execute] done, generationId =",
				generationId,
				"promptIds =",
				promptIds,
			);

			generationIdRef.current = generationId;
			batchQueueRef.current = promptIds;
			batchTotalRef.current = params.batchCount;

			setState((s) => ({
				...s,
				generationId,
				status: "generating",
				currentBatchIndex: 1,
			}));

			// Start processing the first batch item (opens SSE)
			console.log("[execute] processNextBatch");
			processNextBatch();
		} catch (err) {
			console.error("[execute] ERROR:", err);
			const message =
				err instanceof Error ? err.message : "Failed to start generation";
			setState((s) => ({
				...s,
				status: "error",
				error: message,
			}));

			// Update generation record as error if we created one
			if (generationIdRef.current) {
				try {
					await fetch("/api/generation-update", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							id: generationIdRef.current,
							updates: { status: "error" },
						}),
					});
				} catch {
					// Best effort
				}
			}
		}
	}, [processNextBatch]);

	/**
	 * Cancel the current generation.
	 */
	const cancel = useCallback(async () => {
		try {
			// Direct fetch to ComfyUI interrupt — interruptGeneration server fn
			// would trigger route invalidation, so we use the Nitro proxy approach.
			// For now, just call the server function since cancel happens at the end.
			const { interruptGeneration } = await import("~/server/comfyui");
			await interruptGeneration();
		} catch {
			// Best effort
		}

		setSsePromptId(null);
		batchQueueRef.current = [];

		const genId = generationIdRef.current;
		const images = collectedImagesRef.current;

		if (genId) {
			const status = images.length > 0 ? "partial" : "error";
			try {
				await fetch("/api/generation-update", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: genId,
						updates: { status, images },
					}),
				});
			} catch {
				// Best effort
			}
		}

		setState((s) => ({
			...s,
			status: "cancelled",
			completedImages: images,
		}));
	}, []);

	return {
		prepare,
		execute,
		cancel,
		status: state.status,
		progress: state.progress,
		currentImage: state.currentImage,
		completedImages: state.completedImages,
		error: state.error,
		generationId: state.generationId,
		currentBatchIndex: state.currentBatchIndex,
		totalBatch: state.totalBatch,
		activeParams: state.activeParams,
	};
}
