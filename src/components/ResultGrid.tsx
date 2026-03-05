import type { FC } from "react";
import { ImageCard } from "~/components/ImageCard";
import type { GeneratedImage } from "~/lib/types";

interface ResultGridProps {
  images: GeneratedImage[];
  generationId: string;
  onImageClick: (index: number) => void;
}

export const ResultGrid: FC<ResultGridProps> = ({ images, onImageClick }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map((image, index) => (
        <ImageCard
          key={image.filename || index}
          image={image}
          onClick={() => onImageClick(index)}
        />
      ))}
    </div>
  );
};
