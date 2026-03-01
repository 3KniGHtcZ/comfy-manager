import { cn } from "~/lib/utils";

interface PromptInputProps {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	hint?: string;
	rows?: number;
	className?: string;
}

export function PromptInput({
	label = "Prompt",
	value,
	onChange,
	placeholder = "Describe the scene, environment and situation...",
	hint = "Describe the scene, environment and situation",
	rows = 4,
	className,
}: PromptInputProps) {
	return (
		<div className={cn("flex flex-col gap-2.5 w-full", className)}>
			{label && (
				<label
					htmlFor="prompt-input"
					className="text-[14px] font-semibold text-[#1A1918] font-[Outfit]"
				>
					{label}
				</label>
			)}
			<div
				className="w-full rounded-xl bg-white border border-[#D1D0CD] p-3.5"
				style={{ borderWidth: "1.5px" }}
			>
				<textarea
					id="prompt-input"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					rows={rows}
					className={cn(
						"w-full resize-none bg-transparent outline-none",
						"text-[13px] leading-relaxed font-[Outfit] text-[#1A1918]",
						"placeholder:text-[#6D6C6A]",
					)}
				/>
			</div>
			{hint && (
				<span className="text-[11px] text-[#9C9B99] font-[Outfit]">{hint}</span>
			)}
		</div>
	);
}

export type { PromptInputProps };
