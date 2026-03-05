import type { FC, ReactNode } from "react";
import { cn } from "~/lib/utils";

type ChipVariant = "active" | "inactive";

interface ChipProps {
  variant?: ChipVariant;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Chip: FC<ChipProps> = ({
  variant = "inactive",
  children,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-2 text-[13px] font-[Outfit] cursor-pointer transition-colors",
        variant === "active"
          ? "bg-[#3D8A5A] text-white font-medium"
          : "bg-white text-[#6D6C6A] font-medium border border-[#E5E4E1]",
        className,
      )}
    >
      {children}
    </button>
  );
};

export type { ChipVariant, ChipProps };
