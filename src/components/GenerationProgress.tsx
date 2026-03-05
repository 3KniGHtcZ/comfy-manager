import type { FC } from "react";

interface GenerationProgressProps {
  currentImage: number;
  totalImages: number;
  progress: number;
  previewUrl: string | null;
  completedImages: string[];
  characterName?: string;
  aspectRatio?: string;
  resolution?: number;
  steps?: number;
}

export const GenerationProgress: FC<GenerationProgressProps> = ({
  currentImage,
  totalImages,
  progress,
  previewUrl,
  completedImages,
  characterName,
  aspectRatio,
  resolution,
  steps,
}) => {
  return (
    <div>
      {/* Main preview area */}
      <div className="relative mb-6 h-[420px] w-full overflow-hidden rounded-2xl bg-surface-muted">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`Generating ${currentImage}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Overlay text */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
          <p className="text-center text-sm font-medium text-white">
            Generating image {currentImage} of {totalImages}
          </p>
          {(characterName || aspectRatio || resolution || steps) && (
            <p className="mt-1 text-center text-xs text-white/70">
              {[
                characterName,
                aspectRatio,
                resolution ? `${resolution}px` : null,
                steps ? `${steps} steps` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        {/* Progress bar — inside preview, rounded, semi-transparent */}
        <div className="absolute bottom-2 left-2 right-2 h-1.5 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Batch Progress label */}
      <p className="mb-2 text-xs font-medium text-text-muted">Batch Progress</p>

      {/* Batch thumbnails */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: totalImages }, (_, i) => {
          const imageIndex = i + 1;
          const isCompleted = i < completedImages.length;
          const isCurrent = imageIndex === currentImage && !isCompleted;

          return (
						// biome-ignore format: key must stay inline for noArrayIndexKey suppression to work
						// biome-ignore lint/suspicious/noArrayIndexKey: no stable ID available for batch thumbnails
						<div key={i}
							className={`h-16 w-16 overflow-hidden rounded-xl transition-all ${
								isCompleted
									? "ring-2 ring-primary"
									: isCurrent
										? "ring-2 ring-primary animate-pulse"
										: "bg-surface-muted opacity-50"
							}`}
						>
							{isCompleted && completedImages[i] ? (
								<img
									src={completedImages[i]}
									alt={`Generated ${imageIndex}`}
									className="h-full w-full object-cover"
								/>
							) : isCurrent ? (
								<div className="flex h-full w-full items-center justify-center bg-surface-muted">
									<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
								</div>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-surface-muted">
									<span className="text-xs text-text-muted">{imageIndex}</span>
								</div>
							)}
						</div>
					);
        })}
      </div>
    </div>
  );
};
