import { cn } from "~/lib/utils";

interface TextDividerProps {
	label?: string;
	className?: string;
}

export function TextDivider({ label = "or", className }: TextDividerProps) {
	return (
		<div className={cn("flex items-center gap-3 w-full", className)}>
			<div className="flex-1 h-px bg-[#E5E4E1]" />
			<span className="text-[12px] font-medium text-[#9C9B99] font-[Outfit] shrink-0">
				{label}
			</span>
			<div className="flex-1 h-px bg-[#E5E4E1]" />
		</div>
	);
}

export type { TextDividerProps };
