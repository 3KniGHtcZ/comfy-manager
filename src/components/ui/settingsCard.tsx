import { type FC, Fragment, type ReactNode } from "react";
import { cn } from "~/lib/utils";

interface SettingsRowProps {
  label: string;
  value?: ReactNode;
  onClick?: () => void;
}

interface SettingsCardProps {
  rows: SettingsRowProps[];
  className?: string;
}

const SettingsRow: FC<SettingsRowProps> = ({ label, value, onClick }) => {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: settings row, keyboard handled by parent
    // biome-ignore lint/a11y/noStaticElementInteractions: settings row with optional click
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between py-3.5",
        onClick && "cursor-pointer active:opacity-70 transition-opacity",
      )}
    >
      <span className="text-[14px] font-medium text-[#1A1918] font-[Outfit]">
        {label}
      </span>
      {value !== undefined && (
        <span className="text-[13px] text-[#9C9B99] font-[Outfit]">
          {value}
        </span>
      )}
    </div>
  );
};

export const SettingsCard: FC<SettingsCardProps> = ({ rows, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl bg-white px-4",
        "[box-shadow:0_2px_12px_#1A191808]",
        className,
      )}
    >
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: settings rows have no stable IDs
        <Fragment key={index}>
          <SettingsRow {...row} />
          {index < rows.length - 1 && (
            <div className="h-px bg-[#E5E4E1] mx-0" />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export type { SettingsCardProps, SettingsRowProps };
