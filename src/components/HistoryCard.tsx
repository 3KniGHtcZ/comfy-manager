import { Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { HistoryCard as UIHistoryCard } from "~/components/ui/history-card";
import type { Generation } from "~/lib/types";
import { getOutputImage } from "~/server/comfyui";

interface HistoryCardProps {
	generation: Generation;
	personaName: string;
	onClick: () => void;
}

function getRelativeTime(dateString: string): string {
	const now = Date.now();
	const date = new Date(dateString).getTime();
	const diffMs = now - date;
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHr = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHr / 24);

	if (diffSec < 60) return "Just now";
	if (diffMin < 60) return `${diffMin}m ago`;
	if (diffHr < 24) return `${diffHr}h ago`;
	if (diffDay < 7) return `${diffDay}d ago`;
	return new Date(dateString).toLocaleDateString();
}

export function HistoryCard({
	generation,
	personaName,
	onClick,
}: HistoryCardProps) {
	const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

	const prompt = generation.params?.prompt ?? "";
	const images = generation.images ?? [];
	const title =
		prompt.length > 40 ? `${prompt.slice(0, 40)}...` : prompt || "Untitled";

	useEffect(() => {
		if (images.length === 0) return;
		let cancelled = false;
		const img = images[0];

		async function loadThumb() {
			try {
				const result = await getOutputImage({
					data: {
						filename: img.filename,
						subfolder: img.subfolder,
						type: img.type,
					},
				});
				if (!cancelled) {
					setThumbnailUrl(result.dataUrl);
				}
			} catch {
				// Leave as placeholder
			}
		}

		loadThumb();
		return () => {
			cancelled = true;
		};
	}, [images]);

	const subtitle = `${personaName || (generation.kind === "edit" ? "Edit" : "")} · ${images.length} image${images.length !== 1 ? "s" : ""} · ${getRelativeTime(generation.createdAt)}`;

	const isEdit = generation.kind === "edit";

	const thumbnailOverlay = (
		<span className="flex items-center gap-1 text-[9px] font-medium text-white font-[Outfit]">
			{isEdit ? <WandSparkles size={9} /> : <Sparkles size={9} />}
			{isEdit ? "Edit" : "Generate"}
		</span>
	);

	const badges = (
		<>
			<Badge variant="green">
				{generation.params.aspectRatio} · {generation.params.resolution}px
			</Badge>
			<Badge variant="green">Steps {generation.params.steps}</Badge>
		</>
	);

	return (
		<UIHistoryCard
			title={title}
			subtitle={subtitle}
			thumbnailSrc={thumbnailUrl ?? undefined}
			thumbnailAlt={title}
			thumbnailOverlay={thumbnailOverlay}
			badges={badges}
			onClick={onClick}
		/>
	);
}
