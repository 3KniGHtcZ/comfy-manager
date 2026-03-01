import { Bell } from "lucide-react";
import { cn } from "~/lib/utils";

interface HeaderBrandProps {
	onBellClick?: () => void;
	className?: string;
}

export function HeaderBrand({ onBellClick, className }: HeaderBrandProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-between w-full px-6 py-4",
				className,
			)}
		>
			<div className="flex items-center gap-2.5">
				<svg
					aria-hidden="true"
					width="36"
					height="36"
					viewBox="0 0 36 36"
					fill="none"
					className="shrink-0"
				>
					<rect
						width="36"
						height="36"
						rx="10"
						fill="#F0F7F2"
						stroke="#D1D0CD"
						strokeWidth="1"
					/>
					<circle cx="16" cy="17" r="8" fill="#3D8A5A" />
					<circle cx="21.5" cy="18.5" r="6.5" fill="#5AAE78" />
					<circle cx="17.5" cy="23.5" r="5.5" fill="#C8F0D8" />
					<circle cx="21.5" cy="10.5" r="3.5" fill="#2E6B45" />
				</svg>
				<span className="text-[22px] font-semibold tracking-[-0.3px] text-[#1A1918] font-[Outfit]">
					ComfyUI Studio
				</span>
			</div>

			<button
				type="button"
				onClick={onBellClick}
				className="w-9 h-9 flex items-center justify-center cursor-pointer"
			>
				<Bell size={22} color="#9C9B99" strokeWidth={1.75} />
			</button>
		</div>
	);
}

export type { HeaderBrandProps };
