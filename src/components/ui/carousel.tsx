import * as React from 'react'
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '~/lib/utils'

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: 'horizontal' | 'vertical'
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error('useCarousel must be used within a <Carousel />')
  return context
}

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    { ...opts, axis: orientation === 'horizontal' ? 'x' : 'y' },
    plugins,
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api])

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)
    return () => { api?.off('select', onSelect) }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{ carouselRef, api, opts, orientation, scrollPrev, scrollNext, canScrollPrev, canScrollNext }}
    >
      <div
        aria-roledescription="carousel"
        className={cn('relative', className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  const { carouselRef, orientation } = useCarousel()
  return (
    <div ref={carouselRef} className="h-full overflow-hidden">
      <div
        className={cn(
          'flex h-full',
          orientation === 'horizontal' ? '' : 'flex-col',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
  const { orientation } = useCarousel()
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn(
        'h-full min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? '' : '',
        className,
      )}
      {...props}
    />
  )
}

function CarouselPrevious({ className, ...props }: React.ComponentProps<'button'>) {
  const { scrollPrev, canScrollPrev } = useCarousel()
  if (!canScrollPrev) return null
  return (
    <button
      onClick={scrollPrev}
      className={cn(
        'absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white transition-opacity active:opacity-70',
        className,
      )}
      aria-label="Previous image"
      {...props}
    >
      <ChevronLeft size={18} strokeWidth={2.5} />
    </button>
  )
}

function CarouselNext({ className, ...props }: React.ComponentProps<'button'>) {
  const { scrollNext, canScrollNext } = useCarousel()
  if (!canScrollNext) return null
  return (
    <button
      onClick={scrollNext}
      className={cn(
        'absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white transition-opacity active:opacity-70',
        className,
      )}
      aria-label="Next image"
      {...props}
    >
      <ChevronRight size={18} strokeWidth={2.5} />
    </button>
  )
}

export { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
