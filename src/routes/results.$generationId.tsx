import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, Download, RefreshCw } from 'lucide-react'
import type { Generation } from '~/lib/types'
import { ResultGrid } from '~/components/ResultGrid'
import { getGeneration } from '~/server/generations'

export const Route = createFileRoute('/results/$generationId')({
  component: ResultsGalleryPage,
})

function ResultsGalleryPage() {
  const { generationId } = Route.useParams()
  const navigate = useNavigate()
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)

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
        <p className="text-text-muted">Generation not found</p>
        <Link to="/" className="mt-4 inline-block text-primary">Go Home</Link>
      </div>
    )
  }

  const statusLabel =
    generation.status === 'completed' ? 'Completed'
    : generation.status === 'partial' ? 'Partial'
    : 'Error'

  const statusColor =
    generation.status === 'completed'
      ? 'bg-[#C8F0D8] text-[#3D8A5A]'
      : generation.status === 'partial'
        ? 'bg-orange-100 text-orange-500'
        : 'bg-red-100 text-red-500'

  const handleImageClick = (index: number) => {
    navigate({
      to: '/image/$generationId/$index',
      params: { generationId, index: String(index) },
    })
  }

  const handleGenerateAgain = () => {
    navigate({ to: '/generate', search: { personaId: generation.personaId } })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4">
        <Link to="/" className="flex items-center gap-2">
          <ChevronLeft size={20} className="text-text" strokeWidth={2} />
          <span className="text-[15px] font-medium text-text">Back</span>
        </Link>
        <h1 className="text-[15px] font-semibold text-text">Results</h1>
        <Download size={20} className="text-primary" />
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 px-6 pt-4 pb-5">
        {/* Info row */}
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-text-secondary">
            {generation.images.length} image{generation.images.length !== 1 ? 's' : ''} generated
          </span>
          <span className={`rounded-full px-[10px] py-1 text-[11px] font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Image grid */}
        <ResultGrid
          images={generation.images}
          generationId={generationId}
          onImageClick={handleImageClick}
        />

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-[6px] text-[12px] font-medium text-[#6D6C6A] [box-shadow:0_1px_6px_#1A191808]">
            {generation.params.aspectRatio} · {generation.params.resolution}px
          </span>
          <span className="rounded-full bg-white px-3 py-[6px] text-[12px] font-medium text-[#6D6C6A] [box-shadow:0_1px_6px_#1A191808]">
            Steps {generation.params.steps}
          </span>
          <span className="rounded-full bg-white px-3 py-[6px] text-[12px] font-medium text-[#6D6C6A] [box-shadow:0_1px_6px_#1A191808]">
            {generation.params.seedMode === 'fixed' && generation.params.seed
              ? `Seed ${generation.params.seed}`
              : 'Random Seed'}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex flex-col gap-[10px]">
          <button className="flex h-12 w-full items-center justify-center gap-[10px] rounded-full bg-gradient-to-b from-[#4D9B6A] to-[#3D8A5A] text-[15px] font-semibold text-white [box-shadow:0_4px_16px_#3D8A5A30] transition-opacity active:opacity-80">
            <Download size={18} />
            Download All
          </button>
          <button
            onClick={handleGenerateAgain}
            className="flex h-12 w-full items-center justify-center gap-[10px] rounded-full bg-white text-[15px] font-semibold text-primary [box-shadow:0_2px_12px_#1A191808] transition-opacity active:opacity-80"
          >
            <RefreshCw size={18} />
            Generate Again
          </button>
        </div>
      </div>
    </div>
  )
}
