import type { GeneratedImage } from '~/lib/types'
import { ImageCard } from '~/components/ImageCard'

interface ResultGridProps {
  images: GeneratedImage[]
  generationId: string
  onImageClick: (index: number) => void
}

export function ResultGrid({
  images,
  onImageClick,
}: ResultGridProps) {
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
  )
}
