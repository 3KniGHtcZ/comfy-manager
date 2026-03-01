import { createContext, type ReactNode, useContext } from "react";
import { type GenerationStatus, useGeneration } from "~/hooks/useGeneration";
import type { GeneratedImage, GenerationParams } from "~/lib/types";

interface GenerationContextValue {
	prepare: (params: GenerationParams) => void;
	execute: () => Promise<void>;
	cancel: () => Promise<void>;
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

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: ReactNode }) {
	const generation = useGeneration();
	return (
		<GenerationContext.Provider value={generation}>
			{children}
		</GenerationContext.Provider>
	);
}

export function useGenerationContext(): GenerationContextValue {
	const ctx = useContext(GenerationContext);
	if (!ctx) {
		throw new Error(
			"useGenerationContext must be used within GenerationProvider",
		);
	}
	return ctx;
}
