import type { GeneratedImage } from "~/lib/types";
import { getImageUrl } from "~/lib/image-url";

interface ImageCardProps {
	image: GeneratedImage;
	onClick: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-muted [box-shadow:0_2px_12px_#1A191808] transition-transform duration-200 active:scale-[0.98]"
		>
			<img
				src={getImageUrl(image)}
				alt={image.filename}
				className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
				loading="lazy"
			/>
		</button>
	);
}
