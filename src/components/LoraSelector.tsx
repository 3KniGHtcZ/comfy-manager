import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import type { LoraDefinition } from "~/lib/edit-loras";

interface LoraSelectorProps {
	loras: LoraDefinition[];
	activeNodeIds: string[];
	onChange: (nodeIds: string[]) => void;
}

export function LoraSelector({
	loras,
	activeNodeIds,
	onChange,
}: LoraSelectorProps) {
	const activeCount = activeNodeIds.length;

	function toggle(nodeId: string) {
		if (activeNodeIds.includes(nodeId)) {
			onChange(activeNodeIds.filter((id) => id !== nodeId));
		} else {
			onChange([...activeNodeIds, nodeId]);
		}
	}

	if (loras.length === 0) return null;

	return (
		<div className="flex flex-col gap-[10px]">
			<div className="flex items-center justify-between">
				<p className="text-[14px] font-semibold text-text">Style</p>
				{activeCount > 0 ? (
					<span className="rounded-full bg-[#C8F0D8] px-[10px] py-[3px] text-[12px] font-semibold text-primary">
						{activeCount} active
					</span>
				) : (
					<span className="rounded-full bg-surface-muted px-[10px] py-[3px] text-[12px] font-medium text-text-muted">
						none
					</span>
				)}
			</div>

			<div className="flex flex-wrap gap-[10px]">
				{loras.map((lora) => {
					const selected = activeNodeIds.includes(lora.nodeId);
					return (
						<button
							key={lora.nodeId}
							type="button"
							title={lora.loraName}
							onClick={() => toggle(lora.nodeId)}
							className="flex flex-col items-center gap-1.5 w-20"
						>
							<div
								className={cn(
									"relative w-20 h-20 rounded-xl overflow-hidden transition-all",
									selected
										? "ring-[2.5px] ring-primary"
										: "ring-1 ring-border",
								)}
							>
								{lora.image ? (
									<img
										src={lora.image}
										alt={lora.name ?? lora.label}
										className="w-full h-full object-cover"
									/>
								) : (
									<div
										className="w-full h-full"
										style={{
											background: `linear-gradient(135deg, ${lora.previewColors[0]}, ${lora.previewColors[1]})`,
										}}
									/>
								)}
								{selected && (
									<div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
										<Check
											size={12}
											className="text-white"
											strokeWidth={3}
										/>
									</div>
								)}
							</div>
							<span
								className={cn(
									"text-[11px] font-medium leading-tight text-center line-clamp-2 break-all w-full",
									selected ? "text-text" : "text-text-muted",
								)}
							>
								{lora.name ?? lora.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
