import { type FC, useState } from "react";
import { cn } from "~/lib/utils";

interface CharacterCardProps {
  name: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  onClick?: () => void;
  className?: string;
}

export const CharacterCard: FC<CharacterCardProps> = ({
  name,
  description,
  imageSrc,
  imageAlt,
  onClick,
  className,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = imageSrc && !imgFailed;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: card component, keyboard handled by parent
    // biome-ignore lint/a11y/noStaticElementInteractions: card component with optional click
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col rounded-2xl bg-white overflow-hidden cursor-pointer",
        "[box-shadow:0_2px_12px_#1A191808]",
        onClick && "active:opacity-80 transition-opacity",
        className,
      )}
    >
      <div className="h-[140px] w-full bg-[#EDECEA] overflow-hidden">
        {showImage ? (
          <img
            src={imageSrc}
            alt={imageAlt ?? name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-full bg-[#D1D0CD] flex items-center justify-center">
              <svg
                aria-hidden="true"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9C9B99"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold tracking-widest text-[#B8B7B5] uppercase">
              {name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 pt-[10px] pr-[14px] pb-3 pl-[14px]">
        <span className="text-[15px] font-semibold text-[#1A1918] font-[Outfit] leading-tight line-clamp-1">
          {name}
        </span>
        {description && (
          <span className="text-[12px] text-[#9C9B99] font-[Outfit] leading-snug line-clamp-2">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

export type { CharacterCardProps };
