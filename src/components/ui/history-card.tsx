import * as React from "react"
import { cn } from "~/lib/utils"

interface HistoryCardProps {
  title: string
  subtitle?: string
  thumbnailSrc?: string
  thumbnailAlt?: string
  badges?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function HistoryCard({
  title,
  subtitle,
  thumbnailSrc,
  thumbnailAlt,
  badges,
  onClick,
  className,
}: HistoryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-row items-center gap-3 rounded-2xl bg-white p-3",
        "[box-shadow:0_2px_12px_#1A191808]",
        onClick && "cursor-pointer active:opacity-80 transition-opacity",
        className
      )}
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#EDECEA]">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={thumbnailAlt ?? title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#EDECEA]" />
        )}
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-[14px] font-medium text-[#1A1918] font-[Outfit] leading-tight line-clamp-1">
          {title}
        </span>
        {subtitle && (
          <span className="text-[12px] text-[#9C9B99] font-[Outfit] leading-snug line-clamp-1">
            {subtitle}
          </span>
        )}
        {badges && (
          <div className="flex flex-row gap-1.5 flex-wrap">
            {badges}
          </div>
        )}
      </div>
    </div>
  )
}

export type { HistoryCardProps }
