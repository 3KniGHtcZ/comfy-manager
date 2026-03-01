import * as React from "react"
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider"
import { ChevronsLeftRight } from "lucide-react"
import { cn } from "~/lib/utils"

interface ComparisonSliderProps {
  beforeSrc: string
  afterSrc: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

function ComparisonHandle() {
  return (
    <div className="flex flex-col items-center h-full">
      <div className="w-[3px] flex-1 bg-[#3DD4E6]" />
      <div className="w-10 h-10 rounded-full bg-white border-[3px] border-[#3DD4E6] flex items-center justify-center shrink-0 [box-shadow:0_2px_12px_#00000030]">
        <ChevronsLeftRight size={18} color="#3DD4E6" strokeWidth={2} />
      </div>
      <div className="w-[3px] flex-1 bg-[#3DD4E6]" />
    </div>
  )
}

export function ComparisonSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: ComparisonSliderProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-[20px] overflow-hidden bg-[#EDECEA]",
        className
      )}
    >
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage src={beforeSrc} alt={beforeLabel} />
        }
        itemTwo={
          <ReactCompareSliderImage src={afterSrc} alt={afterLabel} />
        }
        handle={<ComparisonHandle />}
        position={50}
        style={{ height: "100%" }}
      />

      <div className="absolute bottom-4 left-4 pointer-events-none">
        <span className="px-3 py-1.5 rounded-[6px] bg-black/30 text-[12px] font-semibold text-white font-[Outfit]">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <span className="px-3 py-1.5 rounded-[6px] bg-black/30 text-[12px] font-semibold text-white font-[Outfit]">
          {afterLabel}
        </span>
      </div>
    </div>
  )
}

export type { ComparisonSliderProps }
