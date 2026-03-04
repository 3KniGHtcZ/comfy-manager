import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
	HeaderBack,
	RecentImageCard,
	TextDivider,
	UploadZone,
} from "~/components/ui";
import { getImageUrl } from "~/lib/image-url";
import type { GeneratedImage } from "~/lib/types";
import { getRecentImages } from "~/server/edits";

export const Route = createFileRoute("/edit")({
	component: EditSelectPage,
});

interface RecentImage extends GeneratedImage {
	generationId: string;
	createdAt: string;
}

function EditSelectPage() {
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [recentImages, setRecentImages] = useState<RecentImage[]>([]);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		async function load() {
			try {
				const images = await getRecentImages({ data: { limit: 10 } });
				setRecentImages(images);
			} catch {
				// Ignore
			}
		}
		load();
	}, []);

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("image", file);

			const res = await fetch("/api/upload-image", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				throw new Error(`Upload failed: ${res.status}`);
			}

			const result = (await res.json()) as {
				name: string;
				subfolder: string;
				type: string;
			};

			navigate({
				to: "/edit-setup",
				search: {
					image: result.name,
					subfolder: result.subfolder,
					type: result.type,
				},
			});
		} catch (err) {
			console.error("Upload error:", err);
		} finally {
			setUploading(false);
		}
	};

	const handleSelectRecent = (img: RecentImage) => {
		navigate({
			to: "/edit-setup",
			search: {
				image: img.filename,
				subfolder: img.subfolder,
				type: img.type,
			},
		});
	};

	const formatDate = (dateStr: string) => {
		const d = new Date(dateStr);
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	};

	return (
		<div className="flex flex-col min-h-full">
			<HeaderBack
				title="Edit Image"
				onBackClick={() => navigate({ to: "/" })}
				className="sticky top-0 z-10 bg-bg pt-14"
			/>

			<div className="flex flex-col gap-5 px-6 pt-3 pb-8">
				{/* Upload zone */}
				<UploadZone
					title={uploading ? "Uploading..." : "Upload Image"}
					hint="Tap to select from your device"
					formats="JPG, PNG, WEBP · Max 10 MB"
					onClick={uploading ? undefined : handleUploadClick}
				/>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					className="hidden"
					onChange={handleFileChange}
				/>

				{/* Divider */}
				{recentImages.length > 0 && (
					<>
						<TextDivider label="or choose recent" />

						{/* Recent images list */}
						<div className="flex flex-col gap-3">
							{recentImages.map((img) => (
								<RecentImageCard
									key={`${img.generationId}-${img.filename}`}
									name={img.filename}
									info={formatDate(img.createdAt)}
									thumbnailSrc={getImageUrl(img)}
									onClick={() => handleSelectRecent(img)}
								/>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
