import type { LucideIcon } from "lucide-react";
import type { FC } from "react";
import { cn } from "~/lib/utils";

interface FlowCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  imageSrc?: string;
  onClick?: () => void;
  className?: string;
}

export const FlowCard: FC<FlowCardProps> = ({
  title,
  description,
  icon: Icon,
  imageSrc,
  onClick,
  className,
}) => {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: card component, keyboard handled by parent
    // biome-ignore lint/a11y/noStaticElementInteractions: card component with optional click
    <div
      onClick={onClick}
      className={cn(
        "relative h-[180px] w-full rounded-[20px] overflow-hidden bg-[#1A1918]",
        onClick && "cursor-pointer active:opacity-90 transition-opacity",
        className,
      )}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 flex flex-col justify-end gap-1 p-5 bg-gradient-to-t from-[#1A1918CC] to-[#1A191830]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-[#3D8A5A] flex items-center justify-center shrink-0">
            <Icon size={20} color="#FFFFFF" strokeWidth={1.75} />
          </div>
          <span className="text-[20px] font-bold text-white font-[Outfit]">
            {title}
          </span>
        </div>
        <span className="text-[13px] text-white/80 font-[Outfit]">
          {description}
        </span>
      </div>
    </div>
  );
};

export type { FlowCardProps };
