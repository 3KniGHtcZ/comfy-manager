import * as React from "react"
import { Bell } from "lucide-react"
import { cn } from "~/lib/utils"

interface HeaderBrandProps {
  onBellClick?: () => void
  className?: string
}

export function HeaderBrand({ onBellClick, className }: HeaderBrandProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full px-6 py-4",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-[10px] bg-[#3D8A5A] shrink-0" />
        <span className="text-[22px] font-semibold tracking-[-0.3px] text-[#1A1918] font-[Outfit]">
          ComfyUI Studio
        </span>
      </div>

      <button
        type="button"
        onClick={onBellClick}
        className="w-9 h-9 flex items-center justify-center cursor-pointer"
      >
        <Bell size={22} color="#9C9B99" strokeWidth={1.75} />
      </button>
    </div>
  )
}

export type { HeaderBrandProps }
