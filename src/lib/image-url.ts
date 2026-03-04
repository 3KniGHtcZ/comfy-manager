import type { GeneratedImage } from "~/lib/types";

export function getImageUrl(image: GeneratedImage): string {
	const params = new URLSearchParams({
		filename: image.filename,
		subfolder: image.subfolder,
		type: image.type,
	});
	return `/api/image?${params.toString()}`;
}
