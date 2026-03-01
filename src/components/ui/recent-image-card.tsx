import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "~/lib/utils"

interface RecentImageCardProps {
  name: string
  info: string
  thumbnailSrc?: string
  onClick?: () => void
  className?: string
}

export function RecentImageCard({
  name,
  info,
  thumbnailSrc,
  onClick,
  className,
}: RecentImageCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full rounded-[16px] bg-white p-3",
        "[box-shadow:0_2px_12px_#1A191808]",
        onClick && "cursor-pointer active:opacity-80 transition-opacity",
        className
      )}
    >
      <div className="w-14 h-14 rounded-[12px] overflow-hidden shrink-0 bg-[#EDECEA]">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#EDECEA]" />
        )}
      </div>

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[14px] font-semibold text-[#1A1918] font-[Outfit] line-clamp-1">
          {name}
        </span>
        <span className="text-[12px] text-[#9C9B99] font-[Outfit] line-clamp-1">
          {info}
        </span>
      </div>

      <ChevronRight size={18} color="#A8A7A5" strokeWidth={1.75} className="shrink-0" />
    </div>
  )
}

export type { RecentImageCardProps }
