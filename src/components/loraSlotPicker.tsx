import type { FC } from "react";
import { useCallback } from "react";
import { Slider } from "~/components/ui/slider";
import type { LoraSlotSelection } from "~/lib/types";
import { cn } from "~/lib/utils";

interface LoraSlotPickerProps {
  availableLoras: string[];
  slots: Record<number, LoraSlotSelection>;
  onChange: (slots: Record<number, LoraSlotSelection>) => void;
}

const CONFIGURABLE_SLOTS = [2, 3, 4, 5];

function displayName(loraPath: string): string {
  if (loraPath === "None") return "None";
  const basename = loraPath.replace(/\\/g, "/").split("/").pop() ?? loraPath;
  return basename.replace(/\.[^.]+$/, "");
}

export const LoraSlotPicker: FC<LoraSlotPickerProps> = ({
  availableLoras,
  slots,
  onChange,
}) => {
  const updateSlot = useCallback(
    (slotNum: number, update: Partial<LoraSlotSelection>) => {
      onChange({
        ...slots,
        [slotNum]: { ...slots[slotNum], ...update },
      });
    },
    [slots, onChange],
  );

  return (
    <div className="flex flex-col gap-[10px]">
      <p className="text-[14px] font-semibold text-text">LoRA Models</p>
      <div className="flex flex-col gap-4">
        {CONFIGURABLE_SLOTS.map((slotNum) => {
          const slot = slots[slotNum];
          if (!slot) return null;
          return (
            <div key={slotNum} className="flex flex-col gap-2">
              <p className="text-[12px] font-medium text-text-secondary">
                Slot {slotNum}
              </p>
              <select
                value={slot.loraName}
                onChange={(e) =>
                  updateSlot(slotNum, { loraName: e.target.value })
                }
                className={cn(
                  "w-full rounded-xl border border-border bg-white px-[14px] py-3",
                  "text-[13px] text-text outline-none focus:border-primary",
                )}
              >
                {availableLoras.map((lora) => (
                  <option key={lora} value={lora}>
                    {displayName(lora)}
                  </option>
                ))}
              </select>
              {slot.loraName !== "None" && (
                <Slider
                  label="Weight"
                  value={slot.weight}
                  onChange={(v) => updateSlot(slotNum, { weight: v })}
                  min={0}
                  max={2}
                  step={0.05}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type { LoraSlotPickerProps };
