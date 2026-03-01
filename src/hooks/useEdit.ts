import { useCallback, useRef, useState } from "react";
import type { EditParams, GeneratedImage } from "~/lib/types";
import { useSSE } from "./useSSE";

export type EditStatus =
	| "idle"
	| "preparing"
	| "editing"
	| "completed"
	| "error"
	| "cancelled";

interface EditState {
	status: EditStatus;
	progress: { value: number; max: number } | null;
	currentImage: GeneratedImage | null;
	completedImages: GeneratedImage[];
	error: string | null;
	editId: string | null;
	currentBatchIndex: number;
	totalBatch: number;
	activeParams: EditParams | null;
}

const initialState: EditState = {
	status: "idle",
	progress: null,
	currentImage: null,
	completedImages: [],
	error: null,
	editId: null,
	currentBatchIndex: 0,
	totalBatch: 0,
	activeParams: null,
};

/**
 * Orchestration hook that manages the full edit lifecycle:
 *   1. Create an edit record
 *   2. Load the edit workflow
 *   3. Queue the prompt for each batch item
 *   4. Open SSE to track progress
 *   5. Update the edit record on completion
 */
export function useEdit() {
	const [state, setState] = useState<EditState>(initialState);
	const [ssePromptId, setSsePromptId] = useState<string | null>(null);

	// Collected images across all batch items
	const collectedImagesRef = useRef<GeneratedImage[]>([]);
	const editIdRef = useRef<string | null>(null);
	const batchQueueRef = useRef<string[]>([]);
	const batchTotalRef = useRef(0);

	const finalizeBatch = useCallback(async () => {
		setSsePromptId(null);
		const id = editIdRef.current;
		if (id) {
			const allImages = collectedImagesRef.current;
			const finalStatus = allImages.length > 0 ? "completed" : "error";
			try {
				await fetch("/api/edit-update", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id,
						updates: { status: finalStatus, resultImages: allImages },
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

	// SSE event handlers
	useSSE(ssePromptId, {
		onProgress(data) {
			console.log("[useEdit] SSE progress", data.value, "/", data.max);
			setState((s) => ({
				...s,
				progress: { value: data.value, max: data.max },
			}));
		},

		onImageComplete(data) {
			console.log(
				"[useEdit] SSE image_complete",
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
			console.log("[useEdit] SSE done — calling processNextBatch");
			processNextBatch();
		},

		onError(data) {
			console.error("[useEdit] SSE error:", data.message);
			setState((s) => ({
				...s,
				error: data.message,
			}));
			processNextBatch();
		},
	});

	const pendingParamsRef = useRef<EditParams | null>(null);

	/**
	 * Phase 1: Synchronously set status to 'preparing' and store params.
	 * Call this before navigating to /editing.
	 */
	const prepare = useCallback((params: EditParams) => {
		console.log("[useEdit] prepare() called");
		sessionStorage.setItem("_pendingEditParams", JSON.stringify(params));
		pendingParamsRef.current = params;
		collectedImagesRef.current = [];
		batchQueueRef.current = [];
		editIdRef.current = null;
		setState({
			...initialState,
			status: "preparing",
			totalBatch: params.batchCount,
			activeParams: params,
		});
	}, []);

	/**
	 * Phase 2: Execute the edit.
	 * Uses direct fetch to /api/edit (Nitro route) to avoid TanStack Start
	 * route invalidation which would kill the SSE connection.
	 */
	const execute = useCallback(async () => {
		let params = pendingParamsRef.current;
		if (!params) {
			const stored = sessionStorage.getItem("_pendingEditParams");
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
		sessionStorage.removeItem("_pendingEditParams");

		try {
			console.log("[useEdit] calling /api/edit");
			const res = await fetch("/api/edit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ params }),
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(`Edit setup failed (${res.status}): ${text}`);
			}
			const { editId, promptIds } = (await res.json()) as {
				editId: string;
				promptIds: string[];
			};
			console.log("[useEdit] done, editId =", editId, "promptIds =", promptIds);

			editIdRef.current = editId;
			batchQueueRef.current = promptIds;
			batchTotalRef.current = params.batchCount;

			setState((s) => ({
				...s,
				editId,
				status: "editing",
				currentBatchIndex: 1,
			}));

			console.log("[useEdit] processNextBatch");
			processNextBatch();
		} catch (err) {
			console.error("[useEdit] ERROR:", err);
			const message =
				err instanceof Error ? err.message : "Failed to start edit";
			setState((s) => ({
				...s,
				status: "error",
				error: message,
			}));

			if (editIdRef.current) {
				try {
					await fetch("/api/edit-update", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							id: editIdRef.current,
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
	 * Cancel the current edit.
	 */
	const cancel = useCallback(async () => {
		try {
			const { interruptGeneration } = await import("~/server/comfyui");
			await interruptGeneration();
		} catch {
			// Best effort
		}

		setSsePromptId(null);
		batchQueueRef.current = [];

		const id = editIdRef.current;
		const images = collectedImagesRef.current;

		if (id) {
			const status = images.length > 0 ? "partial" : "error";
			try {
				await fetch("/api/edit-update", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id,
						updates: { status, resultImages: images },
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
		editId: state.editId,
		currentBatchIndex: state.currentBatchIndex,
		totalBatch: state.totalBatch,
		activeParams: state.activeParams,
	};
}
