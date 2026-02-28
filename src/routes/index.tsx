import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { Persona, Generation, GeneratedImage } from '~/lib/types'
import { Workflow, Bell, Plus } from 'lucide-react'
import { CharacterCard, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '~/components/ui'
import { PersonaForm } from '~/components/PersonaForm'
import { getPersonas, createPersona } from '~/server/personas'
import { getGenerations } from '~/server/generations'
import { getOutputImage } from '~/server/comfyui'

export const Route = createFileRoute('/')({
  component: HomePage,
})

interface RecentItem {
  generationId: string
  index: number
  image: GeneratedImage
  thumbnailUrl: string | null
}

function HomePage() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [personaList, generationsResult] = await Promise.all([
          getPersonas(),
          getGenerations({ data: { limit: 5 } }),
        ])

        setPersonas(personaList)

        const items: RecentItem[] = []
        for (const gen of generationsResult.items) {
          for (let i = 0; i < gen.images.length; i++) {
            items.push({
              generationId: gen.id,
              index: i,
              image: gen.images[i],
              thumbnailUrl: null,
            })
          }
        }
        const limited = items.slice(0, 8)
        setRecentItems(limited)
        loadThumbnails(limited)
      } catch {
        // Use empty state on error
      }
      setLoading(false)
    }
    load()
  }, [])

  const loadThumbnails = async (items: RecentItem[]) => {
    for (const item of items) {
      try {
        const result = await getOutputImage({
          data: {
            filename: item.image.filename,
            subfolder: item.image.subfolder,
            type: item.image.type,
          },
        })
        setRecentItems((prev) =>
          prev.map((ri) =>
            ri.generationId === item.generationId && ri.index === item.index
              ? { ...ri, thumbnailUrl: result.dataUrl }
              : ri,
          ),
        )
      } catch {
        // Skip failed thumbnails
      }
    }
  }

  const handlePersonaClick = (persona: Persona) => {
    navigate({ to: '/generate', search: { personaId: persona.id } })
  }

  const handleSavePersona = async (data: Omit<Persona, 'id'>) => {
    try {
      const newPersona = await createPersona({ data })
      setPersonas((prev) => [...prev, newPersona])
    } catch {
      // Best effort
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4">
        <div className="flex items-center gap-[10px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary">
            <Workflow size={20} color="white" strokeWidth={2} />
          </div>
          <span className="text-[22px] font-semibold tracking-[-0.3px] text-text">
            ComfyUI Studio
          </span>
        </div>
        <Bell size={22} className="text-text-muted" />
      </header>

      {/* Greeting */}
      <div className="flex flex-col gap-1 px-6 pt-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.5px] text-text">
          Choose Character
        </h1>
        <p className="text-[15px] text-text-secondary">
          Select a character to generate in various scenes
        </p>
      </div>

      {/* Character grid */}
      <div className="px-6 pt-2">
        <div className="grid grid-cols-2 gap-[14px]">
          {personas.map((persona) => (
            <CharacterCard
              key={persona.id}
              name={persona.name}
              description={persona.description}
              imageSrc={persona.avatar}
              onClick={() => handlePersonaClick(persona)}
            />
          ))}
        </div>

        {/* Add New Character */}
        <button
          onClick={() => setShowForm(true)}
          className="mt-[14px] flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D1D0CD] bg-white transition-colors active:opacity-80"
        >
          <Plus size={18} className="text-[#6D6C6A]" />
          <span className="text-[14px] font-medium text-[#6D6C6A]">
            Add New Character
          </span>
        </button>
      </div>

      {/* Recent Creations */}
      {recentItems.length > 0 && (
        <div className="flex flex-col gap-[14px] px-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.2px] text-text">
              Recent Creations
            </h2>
            <Link
              to="/history"
              className="text-[13px] font-medium text-primary"
            >
              See all
            </Link>
          </div>
          <Carousel opts={{ align: 'start', dragFree: true }}>
            <CarouselContent className="gap-3">
              {recentItems.map((item) => (
                <CarouselItem
                  key={`${item.generationId}-${item.index}`}
                  className="basis-[120px]"
                >
                  <Link
                    to="/image/$generationId/$index"
                    params={{
                      generationId: item.generationId,
                      index: String(item.index),
                    }}
                    className="block h-[120px] w-[120px] overflow-hidden rounded-xl bg-surface-muted transition-transform active:scale-95"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-surface-muted" />
                    )}
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-white text-text-secondary shadow-md backdrop-blur-none border-border" />
            <CarouselNext className="bg-white text-text-secondary shadow-md backdrop-blur-none border-border" />
          </Carousel>
        </div>
      )}

      {/* Persona Form Modal */}
      <PersonaForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSavePersona}
      />
    </div>
  )
}
