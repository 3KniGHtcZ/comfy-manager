import { useEffect, useState } from "react";
import type { GeneratedImage } from "~/lib/types";
import { getOutputImage } from "~/server/comfyui";

interface ImageCardProps {
	image: GeneratedImage;
	onClick: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				const result = await getOutputImage({
					data: {
						filename: image.filename,
						subfolder: image.subfolder,
						type: image.type,
					},
				});
				if (!cancelled) {
					setImageUrl(result.dataUrl);
				}
			} catch {
				// Leave as placeholder
			}
		}

		if (image.filename) {
			load();
		}

		return () => {
			cancelled = true;
		};
	}, [image.filename, image.subfolder, image.type]);

	return (
		<button
			type="button"
			onClick={onClick}
			className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-muted [box-shadow:0_2px_12px_#1A191808] transition-transform duration-200 active:scale-[0.98]"
		>
			{imageUrl ? (
				<img
					src={imageUrl}
					alt={image.filename}
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					loading="lazy"
				/>
			) : (
				<div className="flex h-full items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			)}
		</button>
	);
}
