import { ChevronLeft } from "lucide-react";
import { cn } from "~/lib/utils";

interface HeaderBackProps {
	title?: string;
	onBackClick?: () => void;
	className?: string;
}

export function HeaderBack({ title, onBackClick, className }: HeaderBackProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-between w-full px-6 py-4",
				className,
			)}
		>
			<button
				type="button"
				onClick={onBackClick}
				className="flex items-center gap-2 cursor-pointer"
			>
				<ChevronLeft size={22} color="#1A1918" strokeWidth={2} />
				<span className="text-[15px] font-medium text-[#1A1918] font-[Outfit]">
					Back
				</span>
			</button>

			{title && (
				<span className="text-[15px] font-semibold text-[#1A1918] font-[Outfit] absolute left-1/2 -translate-x-1/2">
					{title}
				</span>
			)}

			<div className="w-[60px]" />
		</div>
	);
}

export type { HeaderBackProps };
