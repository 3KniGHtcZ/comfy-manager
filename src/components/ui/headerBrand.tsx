import { Bell } from "lucide-react";
import type { FC } from "react";
import { cn } from "~/lib/utils";

interface HeaderBrandProps {
  onBellClick?: () => void;
  className?: string;
}

export const HeaderBrand: FC<HeaderBrandProps> = ({
  onBellClick,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full px-5 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <svg
          aria-hidden="true"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          className="shrink-0"
        >
          <rect
            width="32"
            height="32"
            rx="8"
            fill="#F0F7F2"
            stroke="#D1D0CD"
            strokeWidth="1"
          />
          <circle cx="16" cy="17" r="8" fill="#3D8A5A" />
          <circle cx="21.5" cy="18.5" r="6.5" fill="#5AAE78" />
          <circle cx="17.5" cy="23.5" r="5.5" fill="#C8F0D8" />
          <circle cx="21.5" cy="10.5" r="3.5" fill="#2E6B45" />
        </svg>
        <span className="text-[18px] font-semibold tracking-[-0.2px] text-text font-[Outfit]">
          ComfyUI Studio
        </span>
      </div>

      <button
        type="button"
        onClick={onBellClick}
        className="flex items-center justify-center cursor-pointer"
      >
        <Bell size={20} color="#9C9B99" strokeWidth={1.75} />
      </button>
    </div>
  );
};

export type { HeaderBrandProps };
