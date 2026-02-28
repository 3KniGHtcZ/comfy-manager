"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cn } from "~/lib/utils"

interface ToggleOption {
  label: string
  value: string
}

interface ToggleSwitchProps {
  options: [ToggleOption, ToggleOption]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ToggleSwitch({ options, value, onChange, className }: ToggleSwitchProps) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onChange}
      className={cn(
        "flex w-full h-11 rounded-full bg-[#EDECEA] p-1 gap-0",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            className={cn(
              "flex-1 h-full rounded-full flex items-center justify-center cursor-pointer",
              "text-[14px] font-[Outfit] transition-all",
              isActive
                ? "bg-white text-[#1A1918] font-semibold [box-shadow:0_1px_2px_#00000008]"
                : "text-[#9C9B99] font-medium"
            )}
          >
            {option.label}
          </RadioGroupPrimitive.Item>
        )
      })}
    </RadioGroupPrimitive.Root>
  )
}

export type { ToggleOption, ToggleSwitchProps }
