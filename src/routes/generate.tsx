import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { Persona, GenerationParams } from '~/lib/types'
import { Sparkles, ChevronLeft } from 'lucide-react'
import { cn } from '~/lib/utils'
import { Slider } from '~/components/ui/slider'
import { ToggleSwitch } from '~/components/ui/toggle-switch'
import { Stepper } from '~/components/ui/stepper'
import { getPersona } from '~/server/personas'
import { getSettings } from '~/server/settings'
import { useGenerationContext } from '~/contexts/GenerationContext'

export const Route = createFileRoute('/generate')({
  validateSearch: (search: Record<string, unknown>) => ({
    personaId: (search.personaId as string) || '',
  }),
  component: GenerateSetupPage,
})

const aspectRatios: GenerationParams['aspectRatio'][] = ['1:1', '16:9', '9:16', '4:3']
const resolutions: GenerationParams['resolution'][] = [512, 768, 1024]

function GenerateSetupPage() {
  const { personaId } = Route.useSearch()
  const navigate = useNavigate()
  const { prepare } = useGenerationContext()

  const [persona, setPersona] = useState<Persona | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [aspectRatio, setAspectRatio] =
    useState<GenerationParams['aspectRatio']>('1:1')
  const [resolution, setResolution] =
    useState<GenerationParams['resolution']>(512)
  const [prompt, setPrompt] = useState('')
  const [steps, setSteps] = useState(30)
  const [cfg, setCfg] = useState(7.5)
  const [seedMode, setSeedMode] = useState<'random' | 'fixed'>('random')
  const [seed, setSeed] = useState(42)
  const [batchCount, setBatchCount] = useState(4)

  const maxPromptLength = 500

  useEffect(() => {
    async function load() {
      try {
        const [personaResult, settings] = await Promise.all([
          personaId ? getPersona({ data: { id: personaId } }) : null,
          getSettings(),
        ])

        if (personaResult) setPersona(personaResult)

        setSteps(settings.defaults.steps)
        setCfg(settings.defaults.cfg)
        setSeedMode(settings.defaults.seedMode)
      } catch {
        // Use defaults on error
      }
      setLoading(false)
    }
    load()
  }, [personaId])

  const handleGenerate = () => {
    if (!persona || submitting) return

    setSubmitting(true)

    const params: GenerationParams = {
      personaId: persona.id,
      prompt,
      aspectRatio,
      resolution,
      steps,
      seedMode,
      seed: seedMode === 'fixed' ? seed : undefined,
      cfg,
      batchCount,
    }

    prepare(params)
    navigate({ to: '/generating' })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4">
        <Link to="/" className="flex items-center gap-2">
          <ChevronLeft size={22} strokeWidth={2} className="text-text" />
          <span className="text-[15px] font-medium text-text">Back</span>
        </Link>
        <h1 className="text-[15px] font-semibold text-text">Generation Setup</h1>
        <div className="w-[60px]" />
      </header>

      {/* Scrollable content */}
      <div className="flex flex-col gap-5 px-6 pt-5 pb-[84px]">

        {/* Character preview */}
        <div className="flex items-center gap-[14px]">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-muted">
            {persona ? (
              <img
                src={persona.avatar}
                alt={persona.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-[17px] font-semibold text-text">
              {persona?.name || 'No character selected'}
            </p>
            <p className="text-[13px] text-text-muted">
              {persona?.description || 'Go back to select one'}
            </p>
          </div>
          <Link
            to="/"
            className="flex-shrink-0 rounded-full bg-surface-muted px-[14px] py-2 text-[12px] font-medium text-text-secondary"
          >
            Change
          </Link>
        </div>

        {/* Aspect Ratio */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[14px] font-semibold text-text">Aspect Ratio</p>
          <div className="flex gap-[10px]">
            {aspectRatios.map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={cn(
                  'flex-1 h-10 rounded-xl text-[13px] transition-colors',
                  aspectRatio === ar
                    ? 'bg-primary font-semibold text-white'
                    : 'bg-surface-muted font-medium text-text-secondary'
                )}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[14px] font-semibold text-text">Resolution</p>
          <div className="flex gap-[10px]">
            {resolutions.map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={cn(
                  'flex-1 h-10 rounded-xl text-[13px] transition-colors',
                  resolution === res
                    ? 'bg-primary font-semibold text-white'
                    : 'bg-surface-muted font-medium text-text-secondary'
                )}
              >
                {res}px
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[14px] font-semibold text-text">Prompt</p>
          <textarea
            value={prompt}
            onChange={(e) => {
              if (e.target.value.length <= maxPromptLength) {
                setPrompt(e.target.value)
              }
            }}
            placeholder="Describe your image..."
            rows={4}
            className="w-full resize-none rounded-xl border border-[#D1D0CD] bg-white px-[14px] py-[14px] text-[13px] leading-[1.5] text-text-secondary placeholder-text-muted outline-none focus:border-primary"
          />
          <p className="text-[11px] text-text-muted">
            Describe the scene, environment and situation
          </p>
        </div>

        {/* Steps */}
        <Slider
          label="Steps"
          value={steps}
          onChange={setSteps}
          min={1}
          max={150}
          step={1}
        />

        {/* Seed Mode */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[14px] font-semibold text-text">Seed Mode</p>
          <ToggleSwitch
            options={[
              { label: 'Random', value: 'random' },
              { label: 'Fixed', value: 'fixed' },
            ]}
            value={seedMode}
            onChange={(v) => setSeedMode(v as 'random' | 'fixed')}
          />
          {seedMode === 'fixed' && (
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
              placeholder="Seed value"
              className="w-full rounded-xl border border-[#D1D0CD] bg-white px-[14px] py-3 text-[13px] text-text placeholder-text-muted outline-none focus:border-primary"
            />
          )}
        </div>

        {/* Batch Count */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-text">Batch Count</p>
          <Stepper value={batchCount} onChange={setBatchCount} min={1} max={20} />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!persona || submitting}
          className="flex h-[52px] w-full items-center justify-center gap-[10px] rounded-full bg-gradient-to-b from-[#4D9B6A] to-[#3D8A5A] text-[17px] font-semibold text-white [box-shadow:0_4px_16px_#3D8A5A30] disabled:opacity-50"
        >
          {submitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Sparkles size={20} />
              Generate
            </>
          )}
        </button>

      </div>
    </div>
  )
}
