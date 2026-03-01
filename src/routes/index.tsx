import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, WandSparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HeaderBrand } from "~/components/ui";
import type { GeneratedImage } from "~/lib/types";
import { getOutputImage } from "~/server/comfyui";
import { getGenerations } from "~/server/generations";

export const Route = createFileRoute("/")({
	component: HomePage,
});

interface RecentItem {
	generationId: string;
	kind?: "generation" | "edit";
	index: number;
	image: GeneratedImage;
	thumbnailUrl: string | null;
}

function HomePage() {
	const navigate = useNavigate();
	const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

	const loadThumbnails = useCallback(async (items: RecentItem[]) => {
		for (const item of items) {
			try {
				const result = await getOutputImage({
					data: {
						filename: item.image.filename,
						subfolder: item.image.subfolder,
						type: item.image.type,
					},
				});
				setRecentItems((prev) =>
					prev.map((ri) =>
						ri.generationId === item.generationId && ri.index === item.index
							? { ...ri, thumbnailUrl: result.dataUrl }
							: ri,
					),
				);
			} catch {
				// Skip
			}
		}
	}, []);

	useEffect(() => {
		async function load() {
			try {
				const generationsResult = await getGenerations({ data: { limit: 5 } });
				const items: RecentItem[] = [];
				for (const gen of generationsResult.items) {
					for (let i = 0; i < gen.images.length; i++) {
						items.push({
							generationId: gen.id,
							kind: gen.kind,
							index: i,
							image: gen.images[i],
							thumbnailUrl: null,
						});
					}
				}
				const limited = items.slice(0, 8);
				setRecentItems(limited);
				loadThumbnails(limited);
			} catch {
				// Ignore
			}
		}
		load();
	}, [loadThumbnails]);

	return (
		<div className="flex flex-col min-h-screen">
			{/* Header */}
			<HeaderBrand className="pt-14 px-6 pb-4" />

			{/* Greeting */}
			<div className="flex flex-col gap-1 px-6 pt-5">
				<h1 className="text-[24px] font-semibold tracking-[-0.5px] text-text leading-tight">
					What do you want to create?
				</h1>
				<p className="text-[15px] text-text-secondary">
					Choose a workflow to get started
				</p>
			</div>

			{/* Flow Cards */}
			<div className="flex flex-col gap-[14px] px-6 pt-5">
				{/* Generate Image */}
				<button
					type="button"
					onClick={() =>
						navigate({ to: "/generate", search: { personaId: "" } })
					}
					className="relative h-[180px] w-full overflow-hidden rounded-[20px]"
					style={{
						backgroundImage: `url('https://images.unsplash.com/photo-1657627157258-da9474d4f078?w=600&q=80')`,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				>
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
					<div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5">
						<div className="flex items-center gap-[10px]">
							<div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary flex-shrink-0">
								<Sparkles size={18} color="white" />
							</div>
							<span className="text-[20px] font-bold text-white">
								Generate Image
							</span>
						</div>
						<p className="text-[13px] text-white/80">
							Create new images from a character and prompt using ComfyUI
						</p>
					</div>
				</button>

				{/* Edit Image */}
				<button
					type="button"
					onClick={() => navigate({ to: "/edit" })}
					className="relative h-[180px] w-full overflow-hidden rounded-[20px]"
					style={{
						backgroundImage: `url('https://images.unsplash.com/photo-1763833294742-c781be9803ac?w=600&q=80')`,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				>
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
					<div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5">
						<div className="flex items-center gap-[10px]">
							<div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary flex-shrink-0">
								<WandSparkles size={18} color="white" />
							</div>
							<span className="text-[20px] font-bold text-white">
								Edit Image
							</span>
						</div>
						<p className="text-[13px] text-white/80">
							Upload or pick an image and transform it with AI (qwen-edit)
						</p>
					</div>
				</button>
			</div>

			{/* Recent Creations */}
			{recentItems.length > 0 && (
				<div className="flex flex-col gap-[14px] px-6 pt-6">
					<div className="flex items-center justify-between">
						<h2 className="text-[18px] font-semibold tracking-[-0.2px] text-text">
							Recent Creations
						</h2>
						<Link
							to="/history"
							className="text-[13px] font-medium text-primary"
						>
							See all
						</Link>
					</div>
					<div
						className="flex gap-3 overflow-x-auto"
						style={{ scrollbarWidth: "none" }}
					>
						{recentItems.map((item) => (
							<Link
								key={`${item.generationId}-${item.index}`}
								to={
									item.kind === "edit"
										? "/edit-result/$editId"
										: "/image/$generationId/$index"
								}
								params={
									item.kind === "edit"
										? { editId: item.generationId }
										: {
												generationId: item.generationId,
												index: String(item.index),
											}
								}
								className="h-[120px] w-[120px] flex-shrink-0 overflow-hidden rounded-xl bg-surface-muted transition-transform active:scale-95"
							>
								{item.thumbnailUrl ? (
									<img
										src={item.thumbnailUrl}
										alt=""
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="h-full w-full bg-surface-muted" />
								)}
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
