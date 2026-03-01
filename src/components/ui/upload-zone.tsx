import { Upload } from "lucide-react";
import { cn } from "~/lib/utils";

interface UploadZoneProps {
	title?: string;
	hint?: string;
	formats?: string;
	onClick?: () => void;
	className?: string;
}

export function UploadZone({
	title = "Upload Image",
	hint = "Tap to select from your device",
	formats = "JPG, PNG, WEBP · Max 10 MB",
	onClick,
	className,
}: UploadZoneProps) {
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: upload zone, keyboard handled by parent
		// biome-ignore lint/a11y/noStaticElementInteractions: upload zone with optional click
		<div
			onClick={onClick}
			className={cn(
				"flex flex-col items-center justify-center gap-3 w-full h-[200px] rounded-[20px]",
				"bg-white border-2 border-dashed border-[#D1D0CD]",
				onClick && "cursor-pointer active:opacity-80 transition-opacity",
				className,
			)}
		>
			<div className="w-14 h-14 rounded-full bg-[#C8F0D8] flex items-center justify-center">
				<Upload size={24} color="#3D8A5A" strokeWidth={1.75} />
			</div>
			<span className="text-[17px] font-semibold text-[#1A1918] font-[Outfit]">
				{title}
			</span>
			<span className="text-[13px] text-[#9C9B99] font-[Outfit]">{hint}</span>
			<span className="text-[11px] text-[#A8A7A5] font-[Outfit]">
				{formats}
			</span>
		</div>
	);
}

export type { UploadZoneProps };
