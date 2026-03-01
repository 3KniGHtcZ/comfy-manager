import { createContext, type ReactNode, useContext } from "react";
import { type EditStatus, useEdit } from "~/hooks/useEdit";
import type { EditParams, GeneratedImage } from "~/lib/types";

interface EditContextValue {
	prepare: (params: EditParams) => void;
	execute: () => Promise<void>;
	cancel: () => Promise<void>;
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

const EditContext = createContext<EditContextValue | null>(null);

export function EditProvider({ children }: { children: ReactNode }) {
	const edit = useEdit();
	return <EditContext.Provider value={edit}>{children}</EditContext.Provider>;
}

export function useEditContext(): EditContextValue {
	const ctx = useContext(EditContext);
	if (!ctx) {
		throw new Error("useEditContext must be used within EditProvider");
	}
	return ctx;
}
