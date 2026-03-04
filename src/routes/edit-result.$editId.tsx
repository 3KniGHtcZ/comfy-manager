import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, ComparisonSlider, HeaderBack } from "~/components/ui";
import { getImageUrl } from "~/lib/image-url";
import type { EditRecord } from "~/lib/types";
import { getEdit } from "~/server/edits";

export const Route = createFileRoute("/edit-result/$editId")({
	component: EditResultPage,
});

function EditResultPage() {
	const { editId } = Route.useParams();
	const navigate = useNavigate();

	const [edit, setEdit] = useState<EditRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		async function load() {
			try {
				const record = await getEdit({ data: { id: editId } });
				if (record) {
					setEdit(record);
				}
			} catch {
				// Ignore
			}
			setLoading(false);
		}
		load();
	}, [editId]);

	const sourceUrl = edit?.sourceImage
		? getImageUrl(edit.sourceImage)
		: null;
	const resultImg = edit?.resultImages?.[selectedIndex];
	const resultUrl = resultImg ? getImageUrl(resultImg) : null;

	const handleDownload = async () => {
		if (!resultUrl || !resultImg) return;
		const res = await fetch(resultUrl);
		const blob = await res.blob();
		const blobUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = blobUrl;
		link.download = resultImg.filename || "edited-image.png";
		link.click();
		URL.revokeObjectURL(blobUrl);
	};

	const handleEditAgain = () => {
		if (!edit?.sourceImage) return;
		navigate({
			to: "/edit-setup",
			search: {
				image: edit.sourceImage.filename,
				subfolder: edit.sourceImage.subfolder,
				type: edit.sourceImage.type,
			},
		});
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!edit) {
		return (
			<div className="flex flex-col min-h-screen">
				<HeaderBack
					title="Result"
					onBackClick={() => navigate({ to: "/" })}
					className="pt-14"
				/>
				<div className="flex flex-1 items-center justify-center px-6">
					<p className="text-text-muted text-[15px]">Edit record not found.</p>
				</div>
			</div>
		);
	}

	const statusBadge = {
		completed: { label: "Edit completed", variant: "green" as const },
		partial: { label: "Partially completed", variant: "white" as const },
		error: { label: "Error", variant: "white" as const },
		editing: { label: "In progress", variant: "white" as const },
	}[edit.status] ?? { label: edit.status, variant: "white" as const };

	return (
		<div className="flex flex-col min-h-screen">
			{/* Header with download button */}
			<div className="relative flex items-center justify-between w-full px-6 py-4 pt-14">
				<button
					type="button"
					onClick={() => navigate({ to: "/" })}
					className="flex items-center gap-2 cursor-pointer"
				>
					<svg
						aria-hidden="true"
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#1A1918"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="15 18 9 12 15 6" />
					</svg>
					<span className="text-[15px] font-medium text-[#1A1918] font-[Outfit]">
						Back
					</span>
				</button>

				<span className="text-[15px] font-semibold text-[#1A1918] font-[Outfit] absolute left-1/2 -translate-x-1/2">
					Result
				</span>

				<button
					type="button"
					onClick={handleDownload}
					disabled={!resultUrl}
					className="flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
				>
					<Download size={20} color="#3D8A5A" strokeWidth={2} />
				</button>
			</div>

			<div className="flex flex-col gap-5 px-6 pt-3 pb-8">
				{/* Status row */}
				<div className="flex items-center gap-2">
					<Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
					{edit.params && (
						<span className="text-[12px] text-text-muted">
							{edit.params.steps} steps
						</span>
					)}
				</div>

				{/* Comparison Slider */}
				{sourceUrl && resultUrl ? (
					<ComparisonSlider
						beforeSrc={sourceUrl}
						afterSrc={resultUrl}
						beforeLabel="Before"
						afterLabel="After"
						className="h-[380px]"
					/>
				) : (
					<div className="flex h-[380px] items-center justify-center rounded-[20px] bg-surface-muted">
						{sourceUrl || resultUrl ? (
							<div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
						) : (
							<p className="text-text-muted text-[14px]">No images available</p>
						)}
					</div>
				)}

				{/* Result thumbnails if multiple batch items */}
				{edit.resultImages.length > 1 && (
					<div className="flex gap-[10px]">
						{edit.resultImages.map((img, i) => (
							<button
								type="button"
								key={img.filename}
								onClick={() => setSelectedIndex(i)}
								className={`relative flex-1 h-[72px] overflow-hidden rounded-xl transition-all ${
									i === selectedIndex
										? "ring-2 ring-primary"
										: "border border-[#D1D0CD]"
								}`}
							>
								<span className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold text-text-muted bg-surface-muted">
									{i + 1}
								</span>
							</button>
						))}
					</div>
				)}

				{/* Action buttons */}
				<div className="flex flex-col gap-3 pt-2">
					<Button
						variant="primary"
						icon={<Download size={20} />}
						onClick={handleDownload}
					>
						Save Edited Image
					</Button>
					<Button
						variant="secondary"
						icon={<Pencil size={18} />}
						onClick={handleEditAgain}
					>
						Edit Again
					</Button>
				</div>
			</div>
		</div>
	);
}
