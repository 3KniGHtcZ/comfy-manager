"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "~/lib/utils";

interface StepperProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	className?: string;
}

export function Stepper({
	value,
	onChange,
	min = 1,
	max = 99,
	step = 1,
	className,
}: StepperProps) {
	const decrement = () => onChange(Math.max(min, value - step));
	const increment = () => onChange(Math.min(max, value + step));

	return (
		<div
			className={cn(
				"flex items-center h-10 rounded-xl bg-[#EDECEA] overflow-hidden",
				className,
			)}
		>
			<button
				type="button"
				onClick={decrement}
				disabled={value <= min}
				className="w-10 h-full flex items-center justify-center text-[#6D6C6A] cursor-pointer disabled:opacity-40 transition-opacity"
				aria-label="Snížit"
			>
				<Minus size={16} strokeWidth={1.5} />
			</button>

			<div className="w-11 h-full flex items-center justify-center bg-white">
				<span className="text-[15px] font-semibold text-[#1A1918] font-[Outfit]">
					{value}
				</span>
			</div>

			<button
				type="button"
				onClick={increment}
				disabled={value >= max}
				className="w-10 h-full flex items-center justify-center text-[#6D6C6A] cursor-pointer disabled:opacity-40 transition-opacity"
				aria-label="Zvýšit"
			>
				<Plus size={16} strokeWidth={1.5} />
			</button>
		</div>
	);
}

export type { StepperProps };
