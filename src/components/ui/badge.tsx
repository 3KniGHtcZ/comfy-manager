import * as React from "react"
import { cn } from "~/lib/utils"

type BadgeVariant = "green" | "white" | "status"

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-[#C8F0D8] text-[#3D8A5A] px-2 py-[3px] text-[10px] font-medium",
  white: "bg-white text-[#6D6C6A] px-3 py-1.5 text-[12px] font-medium [box-shadow:0_1px_6px_#1A191808]",
  status: "bg-[#C8F0D8] text-[#3D8A5A] px-2.5 py-1 text-[11px] font-semibold",
}

export function Badge({ variant = "green", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-[Outfit]",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export type { BadgeVariant, BadgeProps }
