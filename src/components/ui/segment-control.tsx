import { cn } from "~/lib/utils";

interface SegmentOption {
	value: string;
	label: string;
}

interface SegmentControlProps {
	options: SegmentOption[];
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function SegmentControl({
	options,
	value,
	onChange,
	className,
}: SegmentControlProps) {
	return (
		<div className={cn("flex gap-2.5 w-full", className)}>
			{options.map((option) => {
				const isActive = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onChange(option.value)}
						className={cn(
							"flex-1 h-10 rounded-xl flex items-center justify-center",
							"text-[13px] font-[Outfit] cursor-pointer transition-colors",
							isActive
								? "bg-[#3D8A5A] text-white font-semibold"
								: "bg-[#EDECEA] text-[#6D6C6A] font-medium",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

export type { SegmentOption, SegmentControlProps };
