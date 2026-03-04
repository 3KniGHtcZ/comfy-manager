import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { LoraSelector } from "~/components/LoraSelector";
import { HeaderBack, Slider, Stepper, ToggleSwitch } from "~/components/ui";
import { useEditContext } from "~/contexts/EditContext";
import { enrichWithColors, type LoraDefinition } from "~/lib/edit-loras";
import { getImageUrl } from "~/lib/image-url";
import type { EditParams } from "~/lib/types";
import { getSettings } from "~/server/settings";
import { getEditLoras } from "~/server/workflows";

export const Route = createFileRoute("/edit-setup")({
	validateSearch: (search: Record<string, unknown>) => ({
		image: (search.image as string) || "",
		subfolder: (search.subfolder as string) || "",
		type: (search.type as string) || "input",
	}),
	component: EditSetupPage,
});

function EditSetupPage() {
	const { image, subfolder, type } = Route.useSearch();
	const navigate = useNavigate();
	const { prepare } = useEditContext();

	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const [prompt, setPrompt] = useState("");
	const [steps, setSteps] = useState(10);
	const [cfg, setCfg] = useState(1);
	const [seedMode, setSeedMode] = useState<"random" | "fixed">("random");
	const [seed, setSeed] = useState(42);
	const [batchCount, setBatchCount] = useState(1);
	const [loras, setLoras] = useState<LoraDefinition[]>([]);
	const [activeLoraNodeIds, setActiveLoraNodeIds] = useState<string[]>([]);

	const maxPromptLength = 500;

	const previewUrl = image
		? getImageUrl({ filename: image, subfolder, type })
		: null;

	useEffect(() => {
		async function load() {
			try {
				const settings = await getSettings();

				// Only load seed mode from global settings — steps/cfg use
				// workflow-specific defaults (qwen-edit: steps=10, cfg=1)
				setSeedMode(settings.defaults.seedMode);
			} catch {
				// Use defaults on error
			}

			try {
				const infos = await getEditLoras();
				const defs = enrichWithColors(infos);
				setLoras(defs);
				// Default: all LoRAs that have a positive defaultStrength start active
				setActiveLoraNodeIds(
					defs.filter((l) => l.defaultStrength > 0).map((l) => l.nodeId),
				);
			} catch {
				// LoRA selector hidden if workflow can't be read
			}

			const savedPrompt = localStorage.getItem("lastEditPrompt");
			if (savedPrompt) setPrompt(savedPrompt);
			setLoading(false);
		}
		load();
	}, []);

	const handleEdit = () => {
		if (!image || submitting) return;

		setSubmitting(true);

		const params: EditParams = {
			sourceImage: { filename: image, subfolder, type },
			prompt,
			steps,
			seedMode,
			seed: seedMode === "fixed" ? seed : undefined,
			cfg,
			batchCount,
			activeLoraNodeIds,
		};

		localStorage.setItem("lastEditPrompt", prompt);
		prepare(params);
		navigate({ to: "/editing" });
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-full">
			<HeaderBack
				title="Edit Setup"
				onBackClick={() => navigate({ to: "/edit" })}
				className="sticky top-0 z-10 bg-bg pt-14"
			/>

			<div className="flex flex-col gap-5 px-6 pt-5 pb-[84px]">
				{/* Source image preview */}
				<div className="flex items-center gap-[14px]">
					<div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-muted">
						{previewUrl ? (
							<img
								src={previewUrl}
								alt="Source"
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="h-full w-full bg-surface-muted" />
						)}
					</div>
					<div className="flex min-w-0 flex-1 flex-col gap-0.5">
						<p className="text-[17px] font-semibold text-text truncate">
							{image || "No image selected"}
						</p>
						<p className="text-[13px] text-text-muted">Source image</p>
					</div>
					<button
						type="button"
						onClick={() => navigate({ to: "/edit" })}
						className="flex-shrink-0 rounded-full bg-surface-muted px-[14px] py-2 text-[12px] font-medium text-text-secondary"
					>
						Change
					</button>
				</div>

				{/* Edit Prompt */}
				<div className="flex flex-col gap-[10px]">
					<p className="text-[14px] font-semibold text-text">Edit Prompt</p>
					<textarea
						value={prompt}
						onChange={(e) => {
							if (e.target.value.length <= maxPromptLength) {
								setPrompt(e.target.value);
							}
						}}
						placeholder="Describe the edit you want to make..."
						rows={4}
						className="w-full resize-none rounded-xl border border-[#D1D0CD] bg-white px-[14px] py-[14px] text-[13px] leading-[1.5] text-text-secondary placeholder-text-muted outline-none focus:border-primary"
					/>
					<p className="text-[11px] text-text-muted">
						Describe what changes to apply to the image
					</p>
				</div>

				{/* Steps */}
				<Slider
					label="Steps"
					value={steps}
					onChange={setSteps}
					min={1}
					max={150}
					step={1}
				/>

				{/* CFG Scale */}
				<Slider
					label="CFG Scale"
					value={cfg}
					onChange={setCfg}
					min={1}
					max={20}
					step={0.5}
				/>

				{/* Seed Mode */}
				<div className="flex flex-col gap-[10px]">
					<p className="text-[14px] font-semibold text-text">Seed Mode</p>
					<ToggleSwitch
						options={[
							{ label: "Random", value: "random" },
							{ label: "Fixed", value: "fixed" },
						]}
						value={seedMode}
						onChange={(v) => setSeedMode(v as "random" | "fixed")}
					/>
					{seedMode === "fixed" && (
						<input
							type="number"
							value={seed}
							onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
							placeholder="Seed value"
							className="w-full rounded-xl border border-[#D1D0CD] bg-white px-[14px] py-3 text-[13px] text-text placeholder-text-muted outline-none focus:border-primary"
						/>
					)}
				</div>

				{/* Style LoRA selector */}
				<LoraSelector
					loras={loras}
					activeNodeIds={activeLoraNodeIds}
					onChange={setActiveLoraNodeIds}
				/>

				{/* Batch Count */}
				<div className="flex items-center justify-between">
					<p className="text-[14px] font-semibold text-text">Batch Count</p>
					<Stepper
						value={batchCount}
						onChange={setBatchCount}
						min={1}
						max={8}
					/>
				</div>

				{/* Start Editing Button */}
				<button
					type="button"
					onClick={handleEdit}
					disabled={!image || submitting}
					className="flex h-[52px] w-full items-center justify-center gap-[10px] rounded-full bg-gradient-to-b from-[#4D9B6A] to-[#3D8A5A] text-[17px] font-semibold text-white [box-shadow:0_4px_16px_#3D8A5A30] disabled:opacity-50"
				>
					{submitting ? (
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
					) : (
						<>
							<Pencil size={20} />
							Start Editing
						</>
					)}
				</button>
			</div>
		</div>
	);
}
