import { useState, useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Timer, X } from 'lucide-react'
import { HeaderBack } from '~/components/ui'
import { useEditContext } from '~/contexts/EditContext'
import { getOutputImage } from '~/server/comfyui'

export const Route = createFileRoute('/editing')({
  component: EditingPage,
})

function EditingPage() {
  const navigate = useNavigate()
  const {
    status,
    progress,
    currentImage,
    completedImages,
    error,
    editId,
    currentBatchIndex,
    totalBatch,
    activeParams,
    prepare,
    execute,
    cancel,
  } = useEditContext()

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Execute on mount when preparing
  const executeCalledRef = useRef(false)
  useEffect(() => {
    if (executeCalledRef.current) return

    if (status === 'preparing') {
      executeCalledRef.current = true
      execute()
    } else if (status === 'idle') {
      const stored = sessionStorage.getItem('_pendingEditParams')
      if (stored) {
        try {
          const params = JSON.parse(stored)
          prepare(params)
        } catch {
          sessionStorage.removeItem('_pendingEditParams')
        }
      }
    }
  }, [status, execute, prepare])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Load source image preview
  useEffect(() => {
    if (!activeParams?.sourceImage) return
    let cancelled = false

    async function loadSource() {
      try {
        const result = await getOutputImage({
          data: {
            filename: activeParams!.sourceImage.filename,
            subfolder: activeParams!.sourceImage.subfolder,
            type: activeParams!.sourceImage.type,
          },
        })
        if (!cancelled) setSourceUrl(result.dataUrl)
      } catch {
        // Skip
      }
    }

    loadSource()
    return () => { cancelled = true }
  }, [activeParams?.sourceImage.filename])

  // Load current generated image preview
  useEffect(() => {
    if (!currentImage) return
    let cancelled = false

    async function loadPreview() {
      try {
        const result = await getOutputImage({
          data: {
            filename: currentImage!.filename,
            subfolder: currentImage!.subfolder,
            type: currentImage!.type,
          },
        })
        if (!cancelled) setPreviewUrl(result.dataUrl)
      } catch {
        // Skip
      }
    }

    loadPreview()
    return () => { cancelled = true }
  }, [currentImage])

  // Load batch thumbnails
  useEffect(() => {
    let cancelled = false

    async function loadThumbnails() {
      const urls: string[] = []
      for (const img of completedImages) {
        try {
          const result = await getOutputImage({
            data: {
              filename: img.filename,
              subfolder: img.subfolder,
              type: img.type,
            },
          })
          if (cancelled) return
          urls.push(result.dataUrl)
        } catch {
          urls.push('')
        }
      }
      if (!cancelled) setThumbnailUrls(urls)
    }

    if (completedImages.length > 0) loadThumbnails()
    return () => { cancelled = true }
  }, [completedImages.length])

  // Navigate to result on completion
  useEffect(() => {
    if (status === 'completed' && editId) {
      navigate({ to: '/edit-result/$editId', params: { editId } })
    }
  }, [status, editId, navigate])

  // Navigate home if idle (shouldn't be on this page)
  useEffect(() => {
    if (status === 'idle') {
      const timer = setTimeout(() => {
        navigate({ to: '/' })
      }, 1500)
      return () => { clearTimeout(timer) }
    }
  }, [status, navigate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleBack = () => {
    cancel()
    if (editId && completedImages.length > 0) {
      navigate({ to: '/edit-result/$editId', params: { editId } })
    } else {
      navigate({ to: '/' })
    }
  }

  const handleCancel = async () => {
    await cancel()
    if (editId && completedImages.length > 0) {
      navigate({ to: '/edit-result/$editId', params: { editId } })
    } else {
      navigate({ to: '/' })
    }
  }

  const progressPercent = progress
    ? Math.round((progress.value / progress.max) * 100)
    : 0

  // Show source image as background, or current result preview on top
  const displayUrl = previewUrl || sourceUrl

  return (
    <div className="flex min-h-dvh flex-col">
      <HeaderBack
        title="Editing"
        onBackClick={handleBack}
        className="pt-14"
      />

      {/* Error banner */}
      {error && (
        <div className="mx-6 mb-4 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Preview — edge-to-edge with overlay */}
      <div className="relative h-[420px] w-full overflow-hidden bg-surface-muted">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={`Editing image ${currentBatchIndex}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Dark overlay when showing source */}
        {!previewUrl && sourceUrl && (
          <div className="absolute inset-0 bg-black/60" />
        )}

        {/* Gradient overlay + text */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-6 pb-10 pt-16">
          <p className="text-[16px] font-semibold text-white">
            Editing image {currentBatchIndex} of {totalBatch}
          </p>
          {activeParams && (
            <p className="mt-1.5 text-[13px] text-white/70">
              {activeParams.aspectRatio} · {activeParams.resolution}px · Steps {activeParams.steps}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-5 left-6 right-6 h-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Batch Progress section */}
      {totalBatch > 1 && (
        <div className="flex flex-col gap-4 px-6 pt-5">
          <p className="text-[14px] font-semibold text-text">Edit Progress</p>
          <div className="flex gap-[10px]">
            {Array.from({ length: totalBatch }, (_, i) => {
              const isCompleted = i < completedImages.length
              const isCurrent = i + 1 === currentBatchIndex && !isCompleted

              return (
                <div
                  key={i}
                  className={`relative flex-1 h-[72px] overflow-hidden rounded-xl transition-all ${
                    isCompleted || isCurrent
                      ? 'ring-2 ring-primary'
                      : 'bg-[#EDECEA] border border-[#D1D0CD]'
                  }`}
                >
                  {isCompleted && thumbnailUrls[i] ? (
                    <>
                      <img
                        src={thumbnailUrls[i]}
                        alt={`Image ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </>
                  ) : isCurrent ? (
                    <div className="relative flex h-full items-center justify-center bg-surface-muted">
                      <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-[16px] font-semibold text-[#9C9B99]">{i + 1}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section */}
      <div className="flex flex-col gap-4 px-6 pb-[34px]">
        {/* Timer */}
        <div className="flex items-center justify-center gap-2">
          <Timer size={14} className="text-text-muted" />
          <span className="text-[12px] text-text-muted">
            Elapsed: {formatTime(elapsedSeconds)}
            {currentBatchIndex > 1 && elapsedSeconds > 0 && (
              <> · Est. remaining: {formatTime(Math.round((elapsedSeconds / (currentBatchIndex - 1)) * (totalBatch - currentBatchIndex + 1)))}</>
            )}
          </span>
        </div>

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#D1D0CD] bg-transparent transition-opacity active:opacity-80"
        >
          <X size={16} className="text-[#6D6C6A]" />
          <span className="text-[14px] font-medium text-[#6D6C6A]">Cancel Edit</span>
        </button>
      </div>
    </div>
  )
}
