import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Download, ImagePlus, Share2 } from 'lucide-react'
import type { Generation } from '~/lib/types'
import { getGeneration } from '~/server/generations'
import { getOutputImage } from '~/server/comfyui'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '~/components/ui/carousel'

export const Route = createFileRoute('/image/$generationId/$index')({
  component: ImageDetailPage,
})

function ImageDetailPage() {
  const { generationId, index } = Route.useParams()
  const imageIndex = parseInt(index, 10)

  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([])
  const [showCopiedToast, setShowCopiedToast] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState(imageIndex)

  useEffect(() => {
    async function load() {
      try {
        const result = await getGeneration({ data: { id: generationId } })
        setGeneration(result)
      } catch {
        // Leave as null
      }
      setLoading(false)
    }
    load()
  }, [generationId])

  useEffect(() => {
    if (!generation) return
    setImageUrls(generation.images.map(() => null))
    generation.images.forEach(async (img, i) => {
      try {
        const result = await getOutputImage({
          data: { filename: img.filename, subfolder: img.subfolder, type: img.type },
        })
        setImageUrls((prev) => {
          const next = [...prev]
          next[i] = result.dataUrl
          return next
        })
      } catch {
        // Leave as null placeholder
      }
    })
  }, [generation])

  useEffect(() => {
    if (!carouselApi) return
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap())
    carouselApi.on('select', onSelect)
    return () => { carouselApi.off('select', onSelect) }
  }, [carouselApi])

  const totalImages = generation?.images.length ?? 0
  const prompt = generation?.params.prompt ?? ''
  const title = prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt || 'Untitled'

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(prompt).then(() => {
      setShowCopiedToast(true)
      setTimeout(() => setShowCopiedToast(false), 2000)
    })
  }, [prompt])

  const getRelativeTime = (dateString: string) => {
    const now = Date.now()
    const date = new Date(dateString).getTime()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return 'Generated just now'
    if (diffMin < 60) return `Generated ${diffMin}m ago`
    if (diffHr < 24) return `Generated ${diffHr}h ago`
    if (diffDay < 7) return `Generated ${diffDay}d ago`
    return `Generated ${new Date(dateString).toLocaleDateString()}`
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!generation) {
    return (
      <div className="px-6 pt-6 text-center">
        <p className="text-text-muted">Image not found</p>
        <Link to="/" className="mt-4 inline-block text-primary">Go Home</Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4">
        <Link
          to="/results/$generationId"
          params={{ generationId }}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={20} className="text-text" strokeWidth={2} />
          <span className="text-[15px] font-medium text-text">Back</span>
        </Link>
        <h1 className="text-[15px] font-semibold text-text">
          {totalImages > 1 ? `Image ${currentIndex + 1} of ${totalImages}` : 'Image'}
        </h1>
        <Share2 size={20} className="text-[#6D6C6A]" />
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 px-6 pb-5">
        {/* Carousel */}
        <Carousel
          setApi={setCarouselApi}
          opts={{ startIndex: imageIndex, loop: false }}
          className="h-[340px] w-full rounded-[20px] bg-surface-muted [box-shadow:0_2px_12px_#1A191808]"
        >
          <CarouselContent>
            {generation.images.map((_, i) => (
              <CarouselItem key={i}>
                {imageUrls[i] ? (
                  <img
                    src={imageUrls[i]!}
                    alt={`Image ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-muted">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>

          {totalImages > 1 && <CarouselPrevious />}
          {totalImages > 1 && <CarouselNext />}

          {/* Navigation dots */}
          {totalImages > 1 && (
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
              {Array.from({ length: totalImages }, (_, i) => (
                <button
                  key={i}
                  aria-label={`Image ${i + 1}`}
                  onClick={() => carouselApi?.scrollTo(i)}
                  className="flex items-center justify-center py-2 px-0.5"
                >
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </Carousel>

        {/* Title */}
        <h2 className="text-[22px] font-semibold tracking-[-0.3px] text-text leading-tight">
          {title || 'Untitled'}
        </h2>

        {/* Time */}
        <p className="text-[13px] text-[#9C9B99]">
          {getRelativeTime(generation.createdAt)}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#C8F0D8] px-[10px] py-[5px] text-[11px] font-semibold text-[#3D8A5A]">
            {generation.params.aspectRatio} · {generation.params.resolution}px
          </span>
          <span className="rounded-full bg-[#C8F0D8] px-[10px] py-[5px] text-[11px] font-semibold text-[#3D8A5A]">
            Steps {generation.params.steps}
          </span>
          <span className="rounded-full bg-[#C8F0D8] px-[10px] py-[5px] text-[11px] font-semibold text-[#3D8A5A]">
            {generation.params.seedMode === 'fixed' && generation.params.seed
              ? `Seed ${generation.params.seed}`
              : 'Random Seed'}
          </span>
        </div>

        {/* Prompt card */}
        <button
          onClick={handleCopyPrompt}
          className="flex w-full flex-col gap-[6px] rounded-2xl bg-white p-[14px] text-left transition-opacity active:opacity-80 [box-shadow:0_2px_12px_#1A191808]"
        >
          <span className="text-[11px] font-semibold text-[#9C9B99]">Prompt</span>
          <span className="text-[13px] leading-[1.5] text-text">{prompt || '—'}</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-[10px]">
          <button className="flex flex-1 h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#4D9B6A] to-[#3D8A5A] text-[15px] font-semibold text-white [box-shadow:0_4px_16px_#3D8A5A30] transition-opacity active:opacity-80">
            <Download size={18} />
            Download
          </button>
          <button className="flex flex-1 h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-primary [box-shadow:0_2px_12px_#1A191808] transition-opacity active:opacity-80">
            <ImagePlus size={18} />
            Use as Input
          </button>
        </div>
      </div>

      {/* Copied toast */}
      {showCopiedToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-surface-muted px-6 py-2 text-sm font-medium text-text shadow-lg">
          Copied!
        </div>
      )}
    </div>
  )
}
