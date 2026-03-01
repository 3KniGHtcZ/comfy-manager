"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "~/lib/utils";

interface SliderProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	className?: string;
}

export function Slider({
	label,
	value,
	onChange,
	min = 10,
	max = 50,
	step = 1,
	className,
}: SliderProps) {
	return (
		<div className={cn("flex flex-col gap-2.5 w-full", className)}>
			<div className="flex items-center justify-between">
				<span className="text-[14px] font-semibold text-[#1A1918] font-[Outfit]">
					{label}
				</span>
				<span className="text-[14px] font-semibold text-[#3D8A5A] font-[Outfit]">
					{value}
				</span>
			</div>

			<SliderPrimitive.Root
				value={[value]}
				onValueChange={([v]) => onChange(v)}
				min={min}
				max={max}
				step={step}
				className="relative flex items-center w-full"
			>
				<SliderPrimitive.Track className="relative h-1.5 w-full rounded-full bg-[#EDECEA] overflow-visible">
					<SliderPrimitive.Range className="absolute h-full rounded-full bg-[#3D8A5A]" />
				</SliderPrimitive.Track>
				<SliderPrimitive.Thumb
					className={cn(
						"block w-5 h-5 rounded-full bg-white border-2 border-[#3D8A5A]",
						"[box-shadow:0_1px_4px_#1A191810]",
						"cursor-grab focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3D8A5A]",
					)}
				/>
			</SliderPrimitive.Root>

			<div className="flex items-center justify-between">
				<span className="text-[11px] text-[#9C9B99] font-[Outfit]">{min}</span>
				<span className="text-[11px] text-[#9C9B99] font-[Outfit]">{max}</span>
			</div>
		</div>
	);
}

export type { SliderProps };
