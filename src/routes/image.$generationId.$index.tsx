import { useState, useRef, useCallback, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Download, ImagePlus, Share2 } from 'lucide-react'
import type { Generation } from '~/lib/types'
import { getGeneration } from '~/server/generations'
import { getOutputImage } from '~/server/comfyui'

export const Route = createFileRoute('/image/$generationId/$index')({
  component: ImageDetailPage,
})

function ImageDetailPage() {
  const { generationId, index } = Route.useParams()
  const navigate = useNavigate()
  const imageIndex = parseInt(index, 10)

  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Touch/zoom state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const lastTapRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const initialDistanceRef = useRef<number | null>(null)
  const initialScaleRef = useRef(1)

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
    const currentImage = generation.images[imageIndex]
    if (!currentImage) return

    let cancelled = false
    async function loadImage() {
      try {
        const result = await getOutputImage({
          data: {
            filename: currentImage.filename,
            subfolder: currentImage.subfolder,
            type: currentImage.type,
          },
        })
        if (!cancelled) setImageUrl(result.dataUrl)
      } catch {
        // Leave as placeholder
      }
    }

    setImageUrl(null)
    loadImage()
    return () => { cancelled = true }
  }, [generation, imageIndex])

  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [imageIndex])

  const totalImages = generation?.images.length ?? 0
  const prompt = generation?.params.prompt ?? ''
  const title = prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt || 'Untitled'

  const handleDoubleTap = useCallback(() => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
  }, [scale])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        initialDistanceRef.current = Math.hypot(dx, dy)
        initialScaleRef.current = scale
      } else if (e.touches.length === 1) {
        const now = Date.now()
        if (now - lastTapRef.current < 300) {
          handleDoubleTap()
          lastTapRef.current = 0
          return
        }
        lastTapRef.current = now
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    },
    [scale, handleDoubleTap],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialDistanceRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const distance = Math.hypot(dx, dy)
        const newScale = Math.min(5, Math.max(1, initialScaleRef.current * (distance / initialDistanceRef.current)))
        setScale(newScale)
        if (newScale === 1) setPosition({ x: 0, y: 0 })
      } else if (e.touches.length === 1 && scale > 1) {
        if (touchStartRef.current) {
          const dx = e.touches[0].clientX - touchStartRef.current.x
          const dy = e.touches[0].clientY - touchStartRef.current.y
          setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
          touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }
      }
    },
    [scale],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 0 && touchStartRef.current && scale === 1) {
        const endX = e.changedTouches[0].clientX
        const dx = endX - touchStartRef.current.x
        if (Math.abs(dx) > 80) {
          if (dx < 0 && imageIndex < totalImages - 1) {
            navigate({ to: '/image/$generationId/$index', params: { generationId, index: String(imageIndex + 1) } })
          } else if (dx > 0 && imageIndex > 0) {
            navigate({ to: '/image/$generationId/$index', params: { generationId, index: String(imageIndex - 1) } })
          }
        }
      }
      initialDistanceRef.current = null
      touchStartRef.current = null
    },
    [scale, imageIndex, totalImages, navigate, generationId],
  )

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setShowCopiedToast(true)
      setTimeout(() => setShowCopiedToast(false), 2000)
    })
  }

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
          Image {imageIndex + 1} of {totalImages}
        </h1>
        <Share2 size={20} className="text-[#6D6C6A]" />
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 px-6 pb-5">
        {/* Image preview */}
        <div
          className="relative h-[340px] w-full overflow-hidden rounded-[20px] bg-surface-muted [box-shadow:0_2px_12px_#1A191808]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="h-full w-full transition-transform duration-100"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Image ${imageIndex + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-muted">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>

          {/* Navigation dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {Array.from({ length: totalImages }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === imageIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

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
