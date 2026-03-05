import { ChevronLeft } from "lucide-react";
import type { FC } from "react";
import { cn } from "~/lib/utils";

interface HeaderBackProps {
  title?: string;
  onBackClick?: () => void;
  className?: string;
}

export const HeaderBack: FC<HeaderBackProps> = ({
  title,
  onBackClick,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full px-5 py-3",
        className,
      )}
    >
      <button
        type="button"
        onClick={onBackClick}
        className="flex items-center gap-2 cursor-pointer"
      >
        <ChevronLeft size={20} color="#1A1918" strokeWidth={2} />
        <span className="text-[14px] font-medium text-text font-[Outfit]">
          Back
        </span>
      </button>

      {title && (
        <span className="text-[14px] font-semibold text-text font-[Outfit]">
          {title}
        </span>
      )}

      <div className="w-[54px] h-[22px]" />
    </div>
  );
};

export type { HeaderBackProps };
