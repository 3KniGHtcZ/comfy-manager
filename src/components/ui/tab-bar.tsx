import * as React from "react"
import { House, Workflow, ChartBar, User } from "lucide-react"
import { cn } from "~/lib/utils"

type TabId = "home" | "flows" | "history" | "profile"

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  className?: string
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "flows", label: "Flows", icon: Workflow },
  { id: "history", label: "History", icon: ChartBar },
  { id: "profile", label: "Profile", icon: User },
]

export function TabBar({ activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div
      className={cn(
        "flex flex-row items-center w-full bg-white pt-3 pb-5",
        "[box-shadow:0_-2px_12px_#1A191808]",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 cursor-pointer transition-colors",
              isActive ? "text-[#3D8A5A]" : "text-[#A8A7A5]"
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
            <span
              className={cn(
                "text-[10px] font-[Outfit]",
                isActive ? "font-semibold" : "font-medium"
              )}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export type { TabId, TabBarProps }
